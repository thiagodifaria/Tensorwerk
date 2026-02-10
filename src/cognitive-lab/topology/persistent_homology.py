"""
Topological Data Analysis — persistent homology for market crash detection.

Identifies topological features (connected components, loops, cavities)
that persist across multiple filtration scales. Many persistent H1 features
(loops) indicate a "tangled" manifold prone to collapse.
"""

from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional, Set
from enum import IntEnum
import numpy as np
from scipy.sparse import csr_matrix, eye
from scipy.sparse.linalg import inv
from collections import defaultdict
import warnings


@dataclass
class TDAConfig:
    max_dim: int = 2
    max_radius: float = 1.0
    num_filtrations: int = 100
    use_sparse: bool = True
    approx: bool = False


class SimplexType(IntEnum):
    VERTEX = 0
    EDGE = 1
    TRIANGLE = 2
    TETRAHEDRON = 3


@dataclass
class Simplex:
    """k-simplex: convex hull of (k+1) affinely independent points."""
    vertices: Tuple[int, ...]
    dimension: int
    radius: float = 0.0

    def __post_init__(self):
        self.vertices = tuple(sorted(self.vertices))
        self.dimension = len(self.vertices) - 1

    def __hash__(self):
        return hash(self.vertices)

    def __eq__(self, other):
        return self.vertices == other.vertices

    def __repr__(self):
        return f"{self.dimension}-simplex({self.vertices})"


@dataclass
class PersistenceInterval:
    """Birth-death interval of a topological feature across filtration scales."""
    dimension: int
    birth: float
    death: float
    lifetime: float = 0.0

    def __post_init__(self):
        self.lifetime = self.death - self.birth

    def is_alive(self, current_radius: float) -> bool:
        return self.birth <= current_radius < self.death

    def persistence(self) -> float:
        return self.death - self.birth

    def __repr__(self):
        if self.death == float('inf'):
            return f"H{self.dimension}: [{self.birth:.4f}, ∞)"
        return f"H{self.dimension}: [{self.birth:.4f}, {self.death:.4f}] (τ={self.lifetime:.4f})"


class VietorisRipsComplex:
    """Incremental Vietoris-Rips complex construction."""

    def __init__(self, config: TDAConfig):
        self.config = config
        self.simplices: Dict[int, Set[Simplex]] = defaultdict(set)
        self.filtration: List[Simplex] = []

    def build(self, points: np.ndarray, distance_matrix: Optional[np.ndarray] = None) -> None:
        N = points.shape[0]

        if distance_matrix is None:
            distance_matrix = self._compute_distance_matrix(points)

        # 0-simplices (vertices)
        for i in range(N):
            self.simplices[0].add(Simplex(vertices=(i,), dimension=0, radius=0.0))

        # 1-simplices (edges)
        edges = []
        for i in range(N):
            for j in range(i + 1, N):
                radius = distance_matrix[i, j]
                if radius <= self.config.max_radius:
                    edge = Simplex(vertices=(i, j), dimension=1, radius=radius)
                    edges.append(edge)
                    self.simplices[1].add(edge)

        # 2-simplices (triangles)
        triangles = []
        if self.config.max_dim >= 2:
            for i in range(N):
                for j in range(i + 1, N):
                    for k in range(j + 1, N):
                        max_edge = max(
                            distance_matrix[i, j],
                            distance_matrix[i, k],
                            distance_matrix[j, k]
                        )
                        if max_edge <= self.config.max_radius:
                            tri = Simplex(vertices=(i, j, k), dimension=2, radius=max_edge)
                            triangles.append(tri)
                            self.simplices[2].add(tri)

        all_simplices = list(self.simplices[0]) + edges + triangles
        self.filtration = sorted(all_simplices, key=lambda s: s.radius)

    def _compute_distance_matrix(self, points: np.ndarray) -> np.ndarray:
        N = points.shape[0]
        dist_matrix = np.zeros((N, N))

        for i in range(N):
            for j in range(i + 1, N):
                dist = np.linalg.norm(points[i] - points[j])
                dist_matrix[i, j] = dist
                dist_matrix[j, i] = dist

        return dist_matrix


class PersistentHomology:
    """Boundary-matrix reduction for persistent homology computation."""

    def __init__(self, config: TDAConfig):
        self.config = config

    def compute(self, vr_complex: VietorisRipsComplex) -> Dict[int, List[PersistenceInterval]]:
        intervals: Dict[int, List[PersistenceInterval]] = defaultdict(list)

        for dim in range(self.config.max_dim + 1):
            intervals[dim] = self._compute_dim_persistence(vr_complex, dim)

        return intervals

    def _compute_dim_persistence(
        self, vr_complex: VietorisRipsComplex, dim: int
    ) -> List[PersistenceInterval]:
        simplices_dim = sorted(list(vr_complex.simplices[dim]), key=lambda s: s.radius)
        simplices_next = sorted(list(vr_complex.simplices[dim + 1]), key=lambda s: s.radius)

        simplex_to_idx = {s: i for i, s in enumerate(simplices_dim)}

        num_dim = len(simplices_dim)
        num_next = len(simplices_next)

        if num_next == 0:
            return [
                PersistenceInterval(dimension=dim, birth=s.radius, death=float('inf'))
                for s in simplices_dim
            ]

        # Boundary operator ∂: C_{dim+1} → C_dim
        rows, cols, data = [], [], []
        for j, simplex in enumerate(simplices_next):
            for k in range(dim + 2):
                face_verts = list(simplex.vertices)
                face_verts.pop(k)
                face = Simplex(vertices=tuple(face_verts))

                if face in simplex_to_idx:
                    rows.append(simplex_to_idx[face])
                    cols.append(j)
                    data.append((-1) ** k)

        if data:
            boundary_matrix = csr_matrix((data, (rows, cols)), shape=(num_dim, num_next))
        else:
            boundary_matrix = csr_matrix((num_dim, num_next))

        # Simplified persistence: feature dies when a (dim+1)-simplex "fills" it
        intervals = []
        for i, simplex in enumerate(simplices_dim):
            birth = simplex.radius
            death = float('inf')

            for next_simplex in simplices_next:
                if next_simplex.radius > birth:
                    if set(simplex.vertices).issubset(set(next_simplex.vertices)):
                        death = next_simplex.radius
                        break

            if death < float('inf'):
                intervals.append(PersistenceInterval(dimension=dim, birth=birth, death=death))

        return intervals


def analyze_barcodes(
    intervals: Dict[int, List[PersistenceInterval]],
    min_lifetime: float = 0.1
) -> Dict[str, any]:
    """Extract statistics from persistence barcodes."""
    stats = {}

    for dim, dim_intervals in intervals.items():
        significant = [iv for iv in dim_intervals if iv.lifetime >= min_lifetime]

        if not significant:
            stats[f'H{dim}_count'] = 0
            stats[f'H{dim}_mean_lifetime'] = 0.0
            stats[f'H{dim}_max_lifetime'] = 0.0
            continue

        lifetimes = [iv.lifetime for iv in significant]
        stats[f'H{dim}_count'] = len(significant)
        stats[f'H{dim}_mean_lifetime'] = float(np.mean(lifetimes))
        stats[f'H{dim}_max_lifetime'] = float(np.max(lifetimes))
        stats[f'H{dim}_std_lifetime'] = float(np.std(lifetimes))
        stats[f'H{dim}_most_persistent'] = max(significant, key=lambda iv: iv.lifetime)

    return stats


def detect_market_crash_via_topology(
    points: np.ndarray,
    config: Optional[TDAConfig] = None
) -> Dict[str, any]:
    """Many persistent H1 loops → tangled manifold → crash risk."""
    if config is None:
        config = TDAConfig()

    vr = VietorisRipsComplex(config)
    vr.build(points)

    ph = PersistentHomology(config)
    intervals = ph.compute(vr)

    stats = analyze_barcodes(intervals, min_lifetime=0.05)

    h1_count = stats.get('H1_count', 0)
    h1_mean_lifetime = stats.get('H1_mean_lifetime', 0.0)
    risk_score = h1_count * h1_mean_lifetime

    if risk_score > 1.0:
        risk_level = "CRITICAL"
    elif risk_score > 0.5:
        risk_level = "HIGH"
    elif risk_score > 0.2:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    return {
        'risk_level': risk_level,
        'risk_score': risk_score,
        'topology_stats': stats,
        'intervals': intervals
    }


if __name__ == "__main__":
    np.random.seed(42)

    print("Case 1: Stable market")
    points_stable = np.random.randn(100, 4) * 0.1 + np.array([100, 100, 100, 100])
    result_stable = detect_market_crash_via_topology(points_stable)
    print(f"Risk: {result_stable['risk_level']} (score={result_stable['risk_score']:.3f})\n")

    print("Case 2: Unstable market")
    t = np.linspace(0, 4*np.pi, 100)
    points_unstable = np.column_stack([
        np.cos(t) * 10, np.sin(t) * 10,
        np.cos(2*t) * 5, np.sin(2*t) * 5
    ])
    result_unstable = detect_market_crash_via_topology(points_unstable)
    print(f"Risk: {result_unstable['risk_level']} (score={result_unstable['risk_score']:.3f})")
