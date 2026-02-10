#pragma once

#include <vector>
#include <cstddef>

namespace tensorwerk {
namespace tensor {

using Tensor = std::vector<double>;

Tensor tensor_product(const Tensor& A, const Tensor& B);

// C^μ_ν = Σ_λ A^μ_λ B^λ_ν
Tensor contract_indices(
    const Tensor& A,
    const Tensor& B,
    size_t rank,
    size_t contraction_dim
);

double trace(const Tensor& A, size_t dim);

// v^μ = g^μν v_ν
Tensor raise_index(const Tensor& tensor_lower, const Tensor& g_inverse, size_t dim);

// v_μ = g_μν v^ν
Tensor lower_index(const Tensor& tensor_upper, const Tensor& g_metric, size_t dim);

Tensor invert_matrix_4x4(const Tensor& m);

double determinant_4x4(const Tensor& m);

double compute_minor_3x3(const Tensor& m, size_t row_skip, size_t col_skip);

} // namespace tensor
} // namespace tensorwerk
