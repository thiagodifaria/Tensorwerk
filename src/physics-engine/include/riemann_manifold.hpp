#pragma once

#include <array>
#include <complex>
#include <immintrin.h>
#ifdef __CUDACC__
#include <cuda_runtime.h>
#endif
#include <memory>
#include <algorithm>
#include <numeric>
#include <vector>

namespace tensorwerk {

namespace constants {
    constexpr double C_LIGHT = 299792458.0;
    constexpr double G_NEWTON = 6.67430e-11;
    constexpr double H_BAR = 1.054571817e-34;
    constexpr double EPSILON_LIQUIDITY = 1e-6;           // Quantum mínimo de liquidez
    constexpr double SINGULARITY_THRESHOLD = 0.95;
    constexpr double MARKET_PLANK_TIME = 1e-3;
    constexpr double AVOGADRO_FINANCE = 6.022e23;
}

template<typename T, size_t... Dims>
class Tensor {
public:
    static constexpr size_t NDIMS = sizeof...(Dims);
    static constexpr size_t TOTAL_ELEMENTS = (Dims * ...);
    static constexpr size_t ALIGNMENT = 64;

    using DataType = std::array<T, TOTAL_ELEMENTS>;
    using ValueType = T;

    Tensor() : data_{} {
        data_.fill(T{0});
    }

    explicit Tensor(const DataType& values) : data_(values) {}

    __m512d load_vector(size_t offset) const requires std::same_as<T, double> {
        return _mm512_load_pd(&data_[offset]);
    }

    void store_vector(size_t offset, __m512d vec) requires std::same_as<T, double> {
        _mm512_store_pd(&data_[offset], vec);
    }

    template<size_t Dim>
    T& get(size_t index) { return data_[index]; }

    template<size_t Dim>
    const T& get(size_t index) const { return data_[index]; }

    Tensor& operator+=(const Tensor& other) {
        if constexpr (std::same_as<T, double>) {
            constexpr size_t VEC_SIZE = 8;
            for (size_t i = 0; i < TOTAL_ELEMENTS; i += VEC_SIZE) {
                auto a = this->load_vector(i);
                auto b = other.load_vector(i);
                this->store_vector(i, _mm512_add_pd(a, b));
            }
        } else {
            std::transform(data_.begin(), data_.end(), other.data_.begin(), data_.begin(),
                          [](T a, T b) { return a + b; });
        }
        return *this;
    }

    Tensor& operator*=(T scalar) {
        if constexpr (std::same_as<T, double>) {
            constexpr size_t VEC_SIZE = 8;
            auto broad = _mm512_set1_pd(scalar);
            for (size_t i = 0; i < TOTAL_ELEMENTS; i += VEC_SIZE) {
                auto vec = this->load_vector(i);
                this->store_vector(i, _mm512_mul_pd(vec, broad));
            }
        } else {
            std::for_each(data_.begin(), data_.end(), [scalar](T& val) { val *= scalar; });
        }
        return *this;
    }

    DataType& data() { return data_; }
    const DataType& data() const { return data_; }

private:
    alignas(ALIGNMENT) DataType data_;
};

using MetricTensor = Tensor<double, 4, 4>;
using ChristoffelSymbols = Tensor<double, 4, 4, 4>;
using RiemannTensor = Tensor<double, 4, 4, 4, 4>;
using RicciTensor = Tensor<double, 4, 4>;
using Vector4D = Tensor<double, 4>;

/// Variedade Riemanniana representando o espaço-tempos financeiro.
/// Implementa 4D (3 espaciais + 1 temporal) com métrica Lorentziana.
class RiemannManifold {
public:
    RiemannManifold();

    void update_metric(
        const std::array<double, 4>& capital_density,
        const std::array<Vector4D, 4>& flow_field
    );

    ChristoffelSymbols compute_christoffel_symbols() const;
    RiemannTensor compute_riemann_tensor() const;
    RicciTensor compute_ricci_tensor() const;
    double compute_ricci_scalar() const;
    std::vector<std::array<double, 4>> detect_singularities() const;

    const MetricTensor& metric() const { return metric_; }
    const ChristoffelSymbols& christoffel() const { return christoffel_; }
    const RiemannTensor& riemann() const { return riemann_; }

private:
    MetricTensor metric_;
    mutable ChristoffelSymbols christoffel_;
    mutable RiemannTensor riemann_;
    mutable RicciTensor ricci_;
    mutable double ricci_scalar_;

    mutable bool christoffel_valid_{false};
    mutable bool riemann_valid_{false};
    mutable bool ricci_valid_{false};

    MetricTensor invert_matrix(const MetricTensor& m) const;

    /// 4th-order finite differences: f'(x) ≈ (-f(x+2h) + 8f(x+h) - 8f(x-h) + f(x-2h)) / (12h)
    MetricTensor derivative_metric(const MetricTensor& metric, size_t mu) const;
};

struct GeodesicPoint {
    double t;
    std::array<double, 3> spatial;

    Vector4D to_vector() const {
        Vector4D vec;
        vec.data()[0] = t;
        vec.data()[1] = spatial[0];
        vec.data()[2] = spatial[1];
        vec.data()[3] = spatial[2];
        return vec;
    }
};

struct GeodesicPath {
    std::vector<GeodesicPoint> points;
    double total_parameter;
    double proper_time;

    GeodesicPoint interpolate(double lambda) const;
};

/// RK4 solver for geodesic equation: d²x^μ/dτ² + Γ^μ_αβ (dx^α/dτ)(dx^β/dτ) = 0
class GeodesicSolver {
public:
    GeodesicPath solve(
        const RiemannManifold& manifold,
        const GeodesicPoint& initial_point,
        const Vector4D& initial_direction,
        double parameter_range,
        double step_size = 0.01
    ) const;

private:
    Vector4D geodesic_rhs(
        const RiemannManifold& manifold,
        const GeodesicPoint& point,
        const Vector4D& velocity
    ) const;
};

namespace avx512 {

inline double reduce_add_pd(__m512d vec) {
    __m256d low = _mm512_castpd512_pd256(vec);
    __m256d high = _mm512_extractf64x4_pd(vec, 1);
    __m256d sum = _mm256_add_pd(low, high);

    __m128d low128 = _mm256_castpd256_pd128(sum);
    __m128d high128 = _mm256_extractf128_pd(sum, 1);
    __m128d sum128 = _mm_add_pd(low128, high128);

    return _mm_cvtsd_f64(sum128);
}

inline __m512d fmadd_pd(__m512d a, __m512d b, __m512d c) {
    return _mm512_fmadd_pd(b, c, a);
}

/// C^μ_ν = Σ_λ A^μ_λ B^λ_ν
inline Tensor<double, 4, 4> contract_indices_22(
    const Tensor<double, 4, 4>& A,
    const Tensor<double, 4, 4>& B
) {
    Tensor<double, 4, 4> result;

    for (size_t mu = 0; mu < 4; ++mu) {
        for (size_t nu = 0; nu < 4; ++nu) {
            __m512d acc = _mm512_setzero_pd();

            constexpr size_t VEC_SIZE = 8;
            for (size_t lambda = 0; lambda < 4; lambda += VEC_SIZE) {
                __m512d a_vec = A.load_vector(mu * 4 + lambda);
                __m512d b_vec = B.load_vector(lambda * 4 + nu);
                acc = fmadd_pd(acc, a_vec, b_vec);
            }

            result.data()[mu * 4 + nu] = reduce_add_pd(acc);
        }
    }

    return result;
}

} // namespace avx512
} // namespace tensorwerk
