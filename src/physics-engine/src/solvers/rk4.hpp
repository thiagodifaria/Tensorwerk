#pragma once

#include "../../include/riemann_manifold.hpp"
#include <functional>
#include <vector>
#include <stdexcept>

namespace tensorwerk {

namespace geometry {
    using RiemannManifold = tensorwerk::RiemannManifold;
    using GeodesicPoint = tensorwerk::GeodesicPoint;
    using Vector4D = tensorwerk::Vector4D;
    using StateVector = std::vector<double>;
}

namespace solvers {

using StateVector = std::vector<double>;
using GeodesicPath = std::vector<std::pair<double, StateVector>>;

StateVector operator+(const StateVector& a, const StateVector& b);
StateVector operator-(const StateVector& a, const StateVector& b);
StateVector operator*(double scalar, const StateVector& v);

class RK4Solver {
public:
    explicit RK4Solver(double dt);

    GeodesicPath solve(
        const std::function<StateVector(double, const StateVector&)>& rhs,
        const StateVector& initial_state,
        double t0,
        double t_max
    ) const;

private:
    double dt_;
};

class AdaptiveRK4Solver {
public:
    AdaptiveRK4Solver(
        double dt_initial,
        double tolerance,
        double min_dt = 1e-8,
        double max_dt = 1.0
    );

    GeodesicPath solve(
        const std::function<StateVector(double, const StateVector&)>& rhs,
        const StateVector& initial_state,
        double t0,
        double t_max
    ) const;

private:
    using StepResult = std::pair<StateVector, StateVector>;

    StepResult step(
        const std::function<StateVector(double, const StateVector&)>& rhs,
        double t,
        const StateVector& y,
        double h
    ) const;

    StateVector rk4_step(
        const std::function<StateVector(double, const StateVector&)>& rhs,
        double t,
        const StateVector& y,
        double h
    ) const;

    double compute_norm(const StateVector& v) const;

    double dt_;
    double tolerance_;
    double min_dt_;
    double max_dt_;
};

class GeodesicSolver {
public:
    GeodesicSolver(const geometry::RiemannManifold& manifold, double dt);

    std::vector<geometry::GeodesicPoint> solve_geodesic(
        const geometry::GeodesicPoint& start,
        const geometry::Vector4D& initial_velocity,
        double parameter_range
    ) const;

private:
    const geometry::RiemannManifold& manifold_;
    RK4Solver rk4_;
};

} // namespace solvers
} // namespace tensorwerk
