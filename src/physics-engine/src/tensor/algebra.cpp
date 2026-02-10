#include "algebra.hpp"
#include <algorithm>
#include <cassert>
#include <cmath>
#include <stdexcept>

namespace tensorwerk {
namespace tensor {

Tensor tensor_product(const Tensor& A, const Tensor& B) {
    Tensor result;
    result.reserve(A.size() * B.size());

    for (const auto& a : A) {
        for (const auto& b : B) {
            result.push_back(a * b);
        }
    }

    return result;
}

// C^μ_ν = Σ_λ A^μ_λ B^λ_ν
Tensor contract_indices(
    const Tensor& A,
    const Tensor& B,
    size_t rank,
    size_t contraction_dim
) {
    assert(A.size() == B.size());

    Tensor C(A.size(), 0.0);

    for (size_t i = 0; i < rank; ++i) {
        for (size_t j = 0; j < rank; ++j) {
            double sum = 0.0;
            for (size_t k = 0; k < contraction_dim; ++k) {
                sum += A[i * contraction_dim + k] * B[k * rank + j];
            }
            C[i * rank + j] = sum;
        }
    }

    return C;
}

double trace(const Tensor& A, size_t dim) {
    double sum = 0.0;
    for (size_t i = 0; i < dim; ++i) {
        sum += A[i * dim + i];
    }
    return sum;
}

// v^μ = g^μν v_ν
Tensor raise_index(const Tensor& tensor_lower, const Tensor& g_inverse, size_t dim) {
    Tensor result(tensor_lower.size(), 0.0);

    for (size_t mu = 0; mu < dim; ++mu) {
        for (size_t nu = 0; nu < dim; ++nu) {
            double sum = 0.0;
            for (size_t lambda = 0; lambda < dim; ++lambda) {
                sum += g_inverse[mu * dim + lambda] * tensor_lower[lambda * dim + nu];
            }
            result[mu * dim + nu] = sum;
        }
    }

    return result;
}

// v_μ = g_μν v^ν
Tensor lower_index(const Tensor& tensor_upper, const Tensor& g_metric, size_t dim) {
    Tensor result(tensor_upper.size(), 0.0);

    for (size_t mu = 0; mu < dim; ++mu) {
        for (size_t nu = 0; nu < dim; ++nu) {
            double sum = 0.0;
            for (size_t lambda = 0; lambda < dim; ++lambda) {
                sum += g_metric[mu * dim + lambda] * tensor_upper[lambda * dim + nu];
            }
            result[mu * dim + nu] = sum;
        }
    }

    return result;
}

Tensor invert_matrix_4x4(const Tensor& m) {
    assert(m.size() == 16);

    Tensor result = m;
    Tensor inverse(16, 0.0);

    for (size_t i = 0; i < 4; ++i) {
        inverse[i * 4 + i] = 1.0;
    }

    for (size_t i = 0; i < 4; ++i) {
        size_t pivot = i;
        for (size_t j = i + 1; j < 4; ++j) {
            if (std::abs(result[j * 4 + i]) > std::abs(result[pivot * 4 + i])) {
                pivot = j;
            }
        }

        if (pivot != i) {
            for (size_t k = 0; k < 4; ++k) {
                std::swap(result[i * 4 + k], result[pivot * 4 + k]);
                std::swap(inverse[i * 4 + k], inverse[pivot * 4 + k]);
            }
        }

        double pivot_val = result[i * 4 + i];
        if (std::abs(pivot_val) < 1e-10) {
            throw std::runtime_error("Singular matrix");
        }

        for (size_t k = 0; k < 4; ++k) {
            result[i * 4 + k] /= pivot_val;
            inverse[i * 4 + k] /= pivot_val;
        }

        for (size_t j = 0; j < 4; ++j) {
            if (j != i) {
                double factor = result[j * 4 + i];
                for (size_t k = 0; k < 4; ++k) {
                    result[j * 4 + k] -= factor * result[i * 4 + k];
                    inverse[j * 4 + k] -= factor * inverse[i * 4 + k];
                }
            }
        }
    }

    return inverse;
}

double determinant_4x4(const Tensor& m) {
    assert(m.size() == 16);

    double det = 0.0;
    for (size_t j = 0; j < 4; ++j) {
        double minor = compute_minor_3x3(m, 0, j);
        double sign = (j % 2 == 0) ? 1.0 : -1.0;
        det += sign * m[j] * minor;
    }

    return det;
}

double compute_minor_3x3(const Tensor& m, size_t row_skip, size_t col_skip) {
    std::vector<double> sub;
    sub.reserve(9);

    for (size_t i = 0; i < 4; ++i) {
        if (i == row_skip) continue;
        for (size_t j = 0; j < 4; ++j) {
            if (j == col_skip) continue;
            sub.push_back(m[i * 4 + j]);
        }
    }

    return sub[0] * (sub[4] * sub[8] - sub[5] * sub[7])
         - sub[1] * (sub[3] * sub[8] - sub[5] * sub[6])
         + sub[2] * (sub[3] * sub[7] - sub[4] * sub[6]);
}

} // namespace tensor
} // namespace tensorwerk
