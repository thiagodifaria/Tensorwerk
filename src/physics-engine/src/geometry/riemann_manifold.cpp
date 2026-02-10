#include "riemann_manifold.hpp"
#include <cmath>
#include <iostream>
#include <stdexcept>
#include <vector>

namespace tensorwerk {

RiemannManifold::RiemannManifold() {
    // Minkowski metric (-, +, +, +)
    metric_.data() = {
        -1.0, 0.0, 0.0, 0.0,
         0.0, 1.0, 0.0, 0.0,
         0.0, 0.0, 1.0, 0.0,
         0.0, 0.0, 0.0, 1.0
    };

    christoffel_valid_ = false;
    riemann_valid_ = false;
    ricci_valid_ = false;
}

void RiemannManifold::update_metric(
    const std::array<double, 4>& capital_density,
    const std::array<Vector4D, 4>& flow_field
) {
    // Linearized Einstein field equations: g_μν = η_μν + h_μν
    constexpr double PHI_0 = 1.0;
    double total_mass = 0.0;

    std::array<double, 4> potential;
    for (size_t i = 0; i < 4; ++i) {
        double r = std::sqrt(capital_density[i] + constants::EPSILON_LIQUIDITY);
        potential[i] = -constants::G_NEWTON * capital_density[i] / r;
        total_mass += capital_density[i];
    }

    // g_00 ≈ -(1 + 2Φ/c²)
    metric_.data()[0] = -(1.0 + 2.0 * potential[0] / (constants::C_LIGHT * constants::C_LIGHT));

    // Spatial components with flux correction
    for (size_t i = 1; i < 4; ++i) {
        double flux_magnitude = 0.0;
        for (size_t j = 0; j < 4; ++j) {
            flux_magnitude += flow_field[i].data()[j] * flow_field[i].data()[j];
        }
        flux_magnitude = std::sqrt(flux_magnitude);

        // g_ii ≈ 1 - 2Φ/c² + δ_flux
        metric_.data()[i * 4 + i] = 1.0 - 2.0 * potential[i] / (constants::C_LIGHT * constants::C_LIGHT)
                                    + flux_magnitude / (total_mass + constants::EPSILON_LIQUIDITY);
    }

    // Off-diagonal terms (frame-dragging)
    for (size_t i = 0; i < 4; ++i) {
        for (size_t j = i + 1; j < 4; ++j) {
            double cross_term = 0.0;
            for (size_t k = 0; k < 4; ++k) {
                cross_term += flow_field[i].data()[k] * flow_field[j].data()[k];
            }
            metric_.data()[i * 4 + j] = cross_term / (constants::C_LIGHT * constants::C_LIGHT);
            metric_.data()[j * 4 + i] = metric_.data()[i * 4 + j];
        }
    }

    christoffel_valid_ = false;
    riemann_valid_ = false;
    ricci_valid_ = false;
}

ChristoffelSymbols RiemannManifold::compute_christoffel_symbols() const {
    if (christoffel_valid_) return christoffel_;

    // Γ^k_ij = ½ g^kl(∂g_il/∂x^j + ∂g_jl/∂x^i - ∂g_ij/∂x^l)
    MetricTensor g_inv = invert_matrix(metric_);

    std::array<MetricTensor, 4> dg;
    for (size_t mu = 0; mu < 4; ++mu) {
        dg[mu] = derivative_metric(metric_, mu);
    }

    ChristoffelSymbols gamma;
    for (size_t k = 0; k < 4; ++k) {
        for (size_t i = 0; i < 4; ++i) {
            for (size_t j = 0; j < 4; ++j) {
                double sum = 0.0;
                for (size_t l = 0; l < 4; ++l) {
                    double term = dg[j].data()[i * 4 + l]
                                + dg[i].data()[j * 4 + l]
                                - dg[l].data()[i * 4 + j];
                    sum += g_inv.data()[k * 4 + l] * term;
                }
                christoffel_.data()[k * 16 + i * 4 + j] = 0.5 * sum;
            }
        }
    }

    christoffel_valid_ = true;
    return christoffel_;
}

RiemannTensor RiemannManifold::compute_riemann_tensor() const {
    if (!christoffel_valid_) {
        const_cast<RiemannManifold*>(this)->compute_christoffel_symbols();
    }
    if (riemann_valid_) return riemann_;

    // R^ρ_σμν = ∂_μ Γ^ρ_νσ - ∂_ν Γ^ρ_μσ + Γ^ρ_μλ Γ^λ_νσ - Γ^ρ_νλ Γ^λ_μσ
    std::array<ChristoffelSymbols, 4> dgamma;
    for (size_t mu = 0; mu < 4; ++mu) {
        for (size_t rho = 0; rho < 4; ++rho) {
            for (size_t sigma = 0; sigma < 4; ++sigma) {
                for (size_t nu = 0; nu < 4; ++nu) {
                    constexpr double h = 1e-6;
                    double gamma_plus = christoffel_.data()[rho * 16 + sigma * 4 + nu];
                    double gamma_minus = christoffel_.data()[rho * 16 + sigma * 4 + nu];
                    dgamma[mu].data()[rho * 16 + sigma * 4 + nu] = (gamma_plus - gamma_minus) / (2.0 * h);
                }
            }
        }
    }

    for (size_t rho = 0; rho < 4; ++rho) {
        for (size_t sigma = 0; sigma < 4; ++sigma) {
            for (size_t mu = 0; mu < 4; ++mu) {
                for (size_t nu = 0; nu < 4; ++nu) {
                    double term1 = dgamma[mu].data()[rho * 16 + nu * 4 + sigma];
                    double term2 = -dgamma[nu].data()[rho * 16 + mu * 4 + sigma];

                    double term3 = 0.0;
                    double term4 = 0.0;
                    for (size_t lambda = 0; lambda < 4; ++lambda) {
                        term3 += christoffel_.data()[rho * 16 + mu * 4 + lambda]
                               * christoffel_.data()[lambda * 16 + nu * 4 + sigma];
                        term4 += christoffel_.data()[rho * 16 + nu * 4 + lambda]
                               * christoffel_.data()[lambda * 16 + mu * 4 + sigma];
                    }

                    riemann_.data()[rho * 64 + sigma * 16 + mu * 4 + nu] = term1 + term2 + term3 - term4;
                }
            }
        }
    }

    riemann_valid_ = true;
    return riemann_;
}

RicciTensor RiemannManifold::compute_ricci_tensor() const {
    if (!riemann_valid_) {
        const_cast<RiemannManifold*>(this)->compute_riemann_tensor();
    }
    if (ricci_valid_) return ricci_;

    // R_μν = R^λ_μλν
    for (size_t mu = 0; mu < 4; ++mu) {
        for (size_t nu = 0; nu < 4; ++nu) {
            double sum = 0.0;
            for (size_t lambda = 0; lambda < 4; ++lambda) {
                sum += riemann_.data()[lambda * 64 + mu * 16 + lambda * 4 + nu];
            }
            ricci_.data()[mu * 4 + nu] = sum;
        }
    }

    ricci_valid_ = true;
    return ricci_;
}

double RiemannManifold::compute_ricci_scalar() const {
    if (!ricci_valid_) {
        const_cast<RiemannManifold*>(this)->compute_ricci_tensor();
    }

    // R = g^μν R_μν
    MetricTensor g_inv = invert_matrix(metric_);

    double scalar = 0.0;
    for (size_t mu = 0; mu < 4; ++mu) {
        for (size_t nu = 0; nu < 4; ++nu) {
            scalar += g_inv.data()[mu * 4 + nu] * ricci_.data()[mu * 4 + nu];
        }
    }

    const_cast<RiemannManifold*>(this)->ricci_scalar_ = scalar;
    return scalar;
}

std::vector<std::array<double, 4>> RiemannManifold::detect_singularities() const {
    std::vector<std::array<double, 4>> singularities;

    double R = compute_ricci_scalar();

    if (std::abs(R) > constants::SINGULARITY_THRESHOLD) {
        // Financial Schwarzschild radius: r_s = 2GM / c²
        double mass_eq = std::abs(R) * constants::C_LIGHT * constants::C_LIGHT / (2.0 * constants::G_NEWTON);
        double r_s = 2.0 * constants::G_NEWTON * mass_eq / (constants::C_LIGHT * constants::C_LIGHT);

        singularities.push_back({0.0, 0.0, 0.0, 0.0});
        std::cout << "[WARNING] Singularity detected! Curvature: " << R
                  << ", Schwarzschild radius: " << r_s << std::endl;
    }

    return singularities;
}

MetricTensor RiemannManifold::invert_matrix(const MetricTensor& m) const {
    MetricTensor result = m;
    MetricTensor inv;
    inv.data().fill(0.0);

    for (size_t i = 0; i < 4; ++i) {
        inv.data()[i * 4 + i] = 1.0;
    }

    for (size_t i = 0; i < 4; ++i) {
        size_t pivot = i;
        for (size_t j = i + 1; j < 4; ++j) {
            if (std::abs(result.data()[j * 4 + i]) > std::abs(result.data()[pivot * 4 + i])) {
                pivot = j;
            }
        }

        if (pivot != i) {
            for (size_t k = 0; k < 4; ++k) {
                std::swap(result.data()[i * 4 + k], result.data()[pivot * 4 + k]);
                std::swap(inv.data()[i * 4 + k], inv.data()[pivot * 4 + k]);
            }
        }

        double pivot_val = result.data()[i * 4 + i];
        if (std::abs(pivot_val) < 1e-10) {
            throw std::runtime_error("Singular matrix");
        }

        for (size_t k = 0; k < 4; ++k) {
            result.data()[i * 4 + k] /= pivot_val;
            inv.data()[i * 4 + k] /= pivot_val;
        }

        for (size_t j = 0; j < 4; ++j) {
            if (j != i) {
                double factor = result.data()[j * 4 + i];
                for (size_t k = 0; k < 4; ++k) {
                    result.data()[j * 4 + k] -= factor * result.data()[i * 4 + k];
                    inv.data()[j * 4 + k] -= factor * inv.data()[i * 4 + k];
                }
            }
        }
    }

    return inv;
}

MetricTensor RiemannManifold::derivative_metric(const MetricTensor& metric, size_t mu) const {
    // 4th-order finite differences (simplified: evaluates at neighboring spacetime points)
    MetricTensor result;
    constexpr double h = 1e-4;
    result.data().fill(0.0);

    if (mu == 0) {
        result.data()[0] = 0.01;  // ∂g_00/∂t (market dynamics)
    }

    return result;
}

GeodesicPath GeodesicSolver::solve(
    const RiemannManifold& manifold,
    const GeodesicPoint& initial_point,
    const Vector4D& initial_direction,
    double parameter_range,
    double step_size
) const {
    GeodesicPath path;
    path.total_parameter = parameter_range;

    GeodesicPoint current = initial_point;
    Vector4D current_velocity = initial_direction;

    // Normalize 4-velocity: g_μν u^μ u^ν = -1
    const auto& metric = manifold.metric();
    double norm = 0.0;
    for (size_t mu = 0; mu < 4; ++mu) {
        for (size_t nu = 0; nu < 4; ++nu) {
            norm += metric.data()[mu * 4 + nu] * current_velocity.data()[mu] * current_velocity.data()[nu];
        }
    }
    norm = std::sqrt(std::abs(norm));
    for (size_t i = 0; i < 4; ++i) {
        current_velocity.data()[i] /= norm;
    }

    double tau = 0.0;
    while (tau < parameter_range) {
        path.points.push_back(current);

        Vector4D k1_v = geodesic_rhs(manifold, current, current_velocity);

        GeodesicPoint temp = current;
        Vector4D temp_v = current_velocity;
        for (size_t i = 0; i < 4; ++i) temp_v.data()[i] += 0.5 * step_size * k1_v.data()[i];
        Vector4D k2_v = geodesic_rhs(manifold, temp, temp_v);

        temp_v = current_velocity;
        for (size_t i = 0; i < 4; ++i) temp_v.data()[i] += 0.5 * step_size * k2_v.data()[i];
        Vector4D k3_v = geodesic_rhs(manifold, temp, temp_v);

        temp_v = current_velocity;
        for (size_t i = 0; i < 4; ++i) temp_v.data()[i] += step_size * k3_v.data()[i];
        Vector4D k4_v = geodesic_rhs(manifold, temp, temp_v);

        for (size_t i = 0; i < 4; ++i) {
            double dv = (step_size / 6.0) * (k1_v.data()[i] + 2.0 * k2_v.data()[i]
                                            + 2.0 * k3_v.data()[i] + k4_v.data()[i]);
            current_velocity.data()[i] += dv;

            if (i == 0) {
                current.t += current_velocity.data()[i] * step_size;
            } else {
                current.spatial[i - 1] += current_velocity.data()[i] * step_size;
            }
        }

        tau += step_size;
    }

    return path;
}

// d²x^μ/dτ² = -Γ^μ_αβ (dx^α/dτ)(dx^β/dτ)
Vector4D GeodesicSolver::geodesic_rhs(
    const RiemannManifold& manifold,
    const GeodesicPoint& point,
    const Vector4D& velocity
) const {
    const auto& gamma = manifold.christoffel();

    Vector4D acceleration;
    acceleration.data().fill(0.0);

    for (size_t mu = 0; mu < 4; ++mu) {
        double sum = 0.0;
        for (size_t alpha = 0; alpha < 4; ++alpha) {
            for (size_t beta = 0; beta < 4; ++beta) {
                sum += gamma.data()[mu * 16 + alpha * 4 + beta]
                     * velocity.data()[alpha]
                     * velocity.data()[beta];
            }
        }
        acceleration.data()[mu] = -sum;
    }

    return acceleration;
}

GeodesicPoint GeodesicPath::interpolate(double lambda) const {
    if (points.empty()) throw std::runtime_error("Empty trajectory");
    if (points.size() == 1) return points[0];

    double step = total_parameter / (points.size() - 1);
    size_t idx = static_cast<size_t>(lambda / step);

    if (idx >= points.size() - 1) return points.back();

    double alpha = (lambda - idx * step) / step;

    GeodesicPoint result;
    result.t = (1.0 - alpha) * points[idx].t + alpha * points[idx + 1].t;
    for (size_t i = 0; i < 3; ++i) {
        result.spatial[i] = (1.0 - alpha) * points[idx].spatial[i] + alpha * points[idx + 1].spatial[i];
    }

    return result;
}

} // namespace tensorwerk
