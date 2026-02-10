#include "rk4.hpp"
#include <algorithm>
#include <cmath>
#include <vector>
#include <stdexcept>

namespace tensorwerk {
namespace solvers {

StateVector operator+(const StateVector& a, const StateVector& b) {
    StateVector result(a.size());
    for (size_t i = 0; i < a.size(); ++i) result[i] = a[i] + b[i];
    return result;
}

StateVector operator-(const StateVector& a, const StateVector& b) {
    StateVector result(a.size());
    for (size_t i = 0; i < a.size(); ++i) result[i] = a[i] - b[i];
    return result;
}

StateVector operator*(double scalar, const StateVector& v) {
    StateVector result(v.size());
    for (size_t i = 0; i < v.size(); ++i) result[i] = scalar * v[i];
    return result;
}

RK4Solver::RK4Solver(double dt) : dt_(dt) {
    if (dt <= 0.0) {
        throw std::invalid_argument("Step size dt must be positive");
    }
}

GeodesicPath RK4Solver::solve(
    const std::function<StateVector(double, const StateVector&)>& rhs,
    const StateVector& initial_state,
    double t0,
    double t_max
) const {
    GeodesicPath path;
    path.reserve(static_cast<size_t>((t_max - t0) / dt_) + 1);
    path.push_back({t0, initial_state});

    StateVector y = initial_state;
    double t = t0;

    while (t < t_max) {
        double h = std::min(dt_, t_max - t);

        StateVector k1 = rhs(t, y);
        StateVector k2 = rhs(t + h * 0.5, y + (h * 0.5) * k1);
        StateVector k3 = rhs(t + h * 0.5, y + (h * 0.5) * k2);
        StateVector k4 = rhs(t + h, y + h * k3);

        y = y + (h / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
        t += h;
        path.push_back({t, y});
    }

    return path;
}

AdaptiveRK4Solver::AdaptiveRK4Solver(
    double dt_initial,
    double tolerance,
    double min_dt,
    double max_dt
) : dt_(dt_initial),
    tolerance_(tolerance),
    min_dt_(min_dt),
    max_dt_(max_dt) {
    if (dt_initial <= 0.0 || tolerance <= 0.0) {
        throw std::invalid_argument("dt and tolerance must be positive");
    }
}

GeodesicPath AdaptiveRK4Solver::solve(
    const std::function<StateVector(double, const StateVector&)>& rhs,
    const StateVector& initial_state,
    double t0,
    double t_max
) const {
    GeodesicPath path;
    path.reserve(1024);

    StateVector y = initial_state;
    double t = t0;
    double h = dt_;

    path.push_back({t, y});

    while (t < t_max) {
        auto [y_half, y_full] = step(rhs, t, y, h);
        double error_norm = compute_norm(y_full - y_half);

        if (error_norm < tolerance_) {
            y = y_full;
            t += h;
            path.push_back({t, y});
            h = std::min(h * 1.5, max_dt_);
        } else {
            h = std::max(h * 0.5, min_dt_);
        }
    }

    return path;
}

AdaptiveRK4Solver::StepResult AdaptiveRK4Solver::step(
    const std::function<StateVector(double, const StateVector&)>& rhs,
    double t,
    const StateVector& y,
    double h
) const {
    StateVector y_full = rk4_step(rhs, t, y, h);
    StateVector y_mid = rk4_step(rhs, t, y, h * 0.5);
    StateVector y_half = rk4_step(rhs, t + h * 0.5, y_mid, h * 0.5);

    return {y_half, y_full};
}

StateVector AdaptiveRK4Solver::rk4_step(
    const std::function<StateVector(double, const StateVector&)>& rhs,
    double t,
    const StateVector& y,
    double h
) const {
    StateVector k1 = rhs(t, y);
    StateVector k2 = rhs(t + h * 0.5, y + (h * 0.5) * k1);
    StateVector k3 = rhs(t + h * 0.5, y + (h * 0.5) * k2);
    StateVector k4 = rhs(t + h, y + h * k3);

    return y + (h / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
}

double AdaptiveRK4Solver::compute_norm(const StateVector& v) const {
    double sum = 0.0;
    for (size_t i = 0; i < v.size(); ++i) {
        sum += v[i] * v[i];
    }
    return std::sqrt(sum);
}

GeodesicSolver::GeodesicSolver(
    const geometry::RiemannManifold& manifold,
    double dt
) : manifold_(manifold), rk4_(dt) {}

std::vector<geometry::GeodesicPoint> GeodesicSolver::solve_geodesic(
    const geometry::GeodesicPoint& start,
    const geometry::Vector4D& initial_velocity,
    double parameter_range
) const {
    // dy/dτ = (v, -Γ·v·v)
    auto rhs = [this](double tau, const geometry::StateVector& y) -> geometry::StateVector {
        geometry::GeodesicPoint point;
        point.t = y[0];
        point.spatial = {y[1], y[2], y[3]};

        geometry::Vector4D velocity;
        velocity.data() = {y[4], y[5], y[6], y[7]};

        // d²x^μ/dτ² = -Γ^μ_αβ (dx^α/dτ)(dx^β/dτ)
        const auto& gamma = manifold_.christoffel();
        geometry::Vector4D acceleration;
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

        geometry::StateVector dy_dt(8);
        for (int i = 0; i < 4; ++i) {
            dy_dt[i] = velocity.data()[i];
            dy_dt[i + 4] = acceleration.data()[i];
        }
        return dy_dt;
    };

    geometry::StateVector initial_state(8);
    initial_state[0] = start.t;
    for (int i = 0; i < 3; ++i) initial_state[i + 1] = start.spatial[i];
    for (int i = 0; i < 4; ++i) initial_state[i + 4] = initial_velocity.data()[i];

    auto raw_path = rk4_.solve(rhs, initial_state, 0.0, parameter_range);

    std::vector<geometry::GeodesicPoint> result;
    for (const auto& [t, y] : raw_path) {
        geometry::GeodesicPoint point;
        point.t = y[0];
        point.spatial = {y[1], y[2], y[3]};
        result.push_back(point);
    }

    return result;
}

} // namespace solvers
} // namespace tensorwerk
