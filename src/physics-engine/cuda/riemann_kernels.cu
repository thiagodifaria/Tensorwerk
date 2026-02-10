#include <cuda_runtime.h>
#include <cuda_fp16.h>
#include <mma.h>

namespace tensorwerk {
namespace cuda {

constexpr int WARP_SIZE = 32;
constexpr int THREADS_PER_BLOCK = 256;
constexpr int SHARED_MEM_SIZE = 48 * 1024;
constexpr int MEMORY_ALIGNMENT = 128;

#define CUDA_CHECK(call) \
    do { \
        cudaError_t err = call; \
        if (err != cudaSuccess) { \
            throw std::runtime_error(std::string("CUDA error: ") + \
                                    cudaGetErrorString(err)); \
        } \
    } while(0)

// Γ^k_ij = ½ g^kl(∂g_il/∂x^j + ∂g_jl/∂x^i - ∂g_ij/∂x^l)
__global__ void kernel_christoffel_symbols(
    const double* __restrict__ g_inv,
    const double* __restrict__ dg,
    double* __restrict__ gamma
) {
    const int k = blockIdx.x;
    const int i = blockIdx.y;
    const int j = threadIdx.x;

    if (j >= 4) return;

    __shared__ double s_g_inv[16];
    int tid = threadIdx.x;
    if (tid < 16) {
        s_g_inv[tid] = g_inv[tid];
    }
    __syncthreads();

    double sum = 0.0;

    #pragma unroll
    for (int l = 0; l < 4; ++l) {
        double dg_il_j = dg[j * 16 + i * 4 + l];
        double dg_jl_i = dg[i * 16 + j * 4 + l];
        double dg_ij_l = dg[l * 16 + i * 4 + j];

        sum += s_g_inv[k * 4 + l] * (dg_il_j + dg_jl_i - dg_ij_l);
    }

    gamma[k * 16 + i * 4 + j] = 0.5 * sum;
}

// R^ρ_σμν = ∂_μ Γ^ρ_νσ - ∂_ν Γ^ρ_μσ + Γ^ρ_μλ Γ^λ_νσ - Γ^ρ_νλ Γ^λ_μσ
__global__ void kernel_riemann_tensor(
    const double* __restrict__ gamma,
    const double* __restrict__ dgamma,
    double* __restrict__ riemann
) {
    const int rho = blockIdx.z;
    const int sigma = blockIdx.y;
    const int mu = blockIdx.x;
    const int nu = threadIdx.x;

    if (nu >= 4) return;

    __shared__ double s_gamma_rho_mu[4];
    __shared__ double s_gamma_rho_nu[4];

    if (threadIdx.x < 4) {
        s_gamma_rho_mu[threadIdx.x] = gamma[rho * 16 + mu * 4 + threadIdx.x];
        s_gamma_rho_nu[threadIdx.x] = gamma[rho * 16 + nu * 4 + threadIdx.x];
    }
    __syncthreads();

    double term1 = dgamma[mu * 64 + rho * 16 + nu * 4 + sigma];
    double term2 = -dgamma[nu * 64 + rho * 16 + mu * 4 + sigma];

    double term3 = 0.0;
    double term4 = 0.0;
    #pragma unroll
    for (int lambda = 0; lambda < 4; ++lambda) {
        double g_nu_sigma = gamma[lambda * 16 + nu * 4 + sigma];
        double g_mu_sigma = gamma[lambda * 16 + mu * 4 + sigma];

        term3 += s_gamma_rho_mu[lambda] * g_nu_sigma;
        term4 += s_gamma_rho_nu[lambda] * g_mu_sigma;
    }

    riemann[rho * 64 + sigma * 16 + mu * 4 + nu] = term1 + term2 + term3 - term4;
}

__global__ void kernel_detect_singularities(
    const double* __restrict__ ricci_scalar,
    double threshold,
    int* __restrict__ singularities,
    double* __restrict__ schwarzschild
) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    int n = blockIdx.y;

    if (idx >= n) return;

    double R = ricci_scalar[idx];

    if (abs(R) > threshold) {
        singularities[idx] = 1;

        constexpr double C = 299792458.0;
        constexpr double G = 6.67430e-11;

        double mass_eq = abs(R) * C * C / (2.0 * G);
        schwarzschild[idx] = 2.0 * G * mass_eq / (C * C);
    } else {
        singularities[idx] = 0;
        schwarzschild[idx] = 0.0;
    }
}

__global__ void kernel_integrate_geodesics(
    const double* __restrict__ metric,
    const double* __restrict__ gamma,
    const double* __restrict__ init_points,
    const double* __restrict__ init_vel,
    double* __restrict__ paths,
    int steps,
    double dt
) {
    int geodesic_idx = blockIdx.x;
    int step_idx = threadIdx.x;
    if (step_idx >= steps) return;

    double x[4], v[4];

    #pragma unroll
    for (int i = 0; i < 4; ++i) {
        x[i] = init_points[geodesic_idx * 4 + i];
        v[i] = init_vel[geodesic_idx * 4 + i];
    }

    double half_dt = 0.5 * dt;
    double sixth_dt = dt / 6.0;

    for (int s = 0; s < step_idx; ++s) {
        double k1_v[4], k2_v[4], k3_v[4], k4_v[4];
        double v_temp[4];

        // Geodesic acceleration: a^μ = -Γ^μ_αβ v^α v^β
        auto compute_acceleration = [&](const double* vel, double* out) {
            #pragma unroll
            for (int mu = 0; mu < 4; ++mu) {
                out[mu] = 0.0;
                for (int alpha = 0; alpha < 4; ++alpha) {
                    for (int beta = 0; beta < 4; ++beta) {
                        out[mu] -= gamma[geodesic_idx * 64 + mu * 16 + alpha * 4 + beta]
                                 * vel[alpha] * vel[beta];
                    }
                }
            }
        };

        compute_acceleration(v, k1_v);

        #pragma unroll
        for (int i = 0; i < 4; ++i) v_temp[i] = v[i] + half_dt * k1_v[i];
        compute_acceleration(v_temp, k2_v);

        #pragma unroll
        for (int i = 0; i < 4; ++i) v_temp[i] = v[i] + half_dt * k2_v[i];
        compute_acceleration(v_temp, k3_v);

        #pragma unroll
        for (int i = 0; i < 4; ++i) v_temp[i] = v[i] + dt * k3_v[i];
        compute_acceleration(v_temp, k4_v);

        #pragma unroll
        for (int i = 0; i < 4; ++i) {
            v[i] += sixth_dt * (k1_v[i] + 2.0 * k2_v[i] + 2.0 * k3_v[i] + k4_v[i]);
            x[i] += v[i] * dt;
        }
    }

    #pragma unroll
    for (int i = 0; i < 4; ++i) {
        paths[geodesic_idx * steps * 4 + step_idx * 4 + i] = x[i];
    }
}

class CudaRiemannEngine {
public:
    CudaRiemannEngine() {
        CUDA_CHECK(cudaMalloc(&d_metric_, 16 * sizeof(double)));
        CUDA_CHECK(cudaMalloc(&d_gamma_, 64 * sizeof(double)));
        CUDA_CHECK(cudaMalloc(&d_riemann_, 256 * sizeof(double)));
    }

    ~CudaRiemannEngine() {
        cudaFree(d_metric_);
        cudaFree(d_gamma_);
        cudaFree(d_riemann_);
    }

    void compute_christoffel_symbols(const double* h_metric, double* h_gamma) {
        CUDA_CHECK(cudaMemcpy(d_metric_, h_metric, 16 * sizeof(double), cudaMemcpyHostToDevice));

        double h_dgamma[4 * 64] = {0};  // TODO: compute metric derivatives

        dim3 grid(4, 4);
        dim3 block(4);
        kernel_christoffel_symbols<<<grid, block>>>(d_metric_, nullptr, d_gamma_);

        CUDA_CHECK(cudaGetLastError());
        CUDA_CHECK(cudaDeviceSynchronize());
        CUDA_CHECK(cudaMemcpy(h_gamma, d_gamma_, 64 * sizeof(double), cudaMemcpyDeviceToHost));
    }

    void compute_riemann_tensor(const double* h_gamma, double* h_riemann) {
        CUDA_CHECK(cudaMemcpy(d_gamma_, h_gamma, 64 * sizeof(double), cudaMemcpyHostToDevice));

        dim3 grid(4, 4, 4);
        dim3 block(4);
        kernel_riemann_tensor<<<grid, block>>>(d_gamma_, nullptr, d_riemann_);

        CUDA_CHECK(cudaGetLastError());
        CUDA_CHECK(cudaDeviceSynchronize());
        CUDA_CHECK(cudaMemcpy(h_riemann, d_riemann_, 256 * sizeof(double), cudaMemcpyDeviceToHost));
    }

private:
    double* d_metric_;
    double* d_gamma_;
    double* d_riemann_;
};

} // namespace cuda
} // namespace tensorwerk
