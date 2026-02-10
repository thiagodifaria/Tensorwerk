<p align="center">
  <h1 align="center">Tensorwerk</h1>
  <p align="center"><b>Riemannian Geometry Engine for Financial Spacetime Simulation</b></p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/LISP-Meta--Compiler-9B4DCA?style=for-the-badge&logo=lisp" />
  <img src="https://img.shields.io/badge/C%2B%2B20-Physics%20Engine-00599C?style=for-the-badge&logo=cplusplus" />
  <img src="https://img.shields.io/badge/CUDA-GPU%20Kernels-76B900?style=for-the-badge&logo=nvidia" />
  <img src="https://img.shields.io/badge/Rust-Nervous%20System-DEA584?style=for-the-badge&logo=rust" />
  <img src="https://img.shields.io/badge/Python-Cognitive%20Lab-3776AB?style=for-the-badge&logo=python" />
  <img src="https://img.shields.io/badge/TypeScript-Interface-3178C6?style=for-the-badge&logo=typescript" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/x86--64-AVX--512-FF6F00?style=flat" />
  <img src="https://img.shields.io/badge/GLSL-Shaders-5586A4?style=flat" />
  <img src="https://img.shields.io/badge/WebGL-4D%20Viz-990000?style=flat" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat" />
</p>

---

> *"The market is not a statistical sequence — it is a dynamic Riemannian manifold where liquidity curves space and creates singularities."*

---

## 📖 Documentation

**[🇺🇸 Read in English](README_EN.md)** · **[🇧🇷 Leia em Português](README_PT.md)**

---

## What is Tensorwerk?

Tensorwerk models financial markets as **physical spacetime** governed by Riemannian geometry. Six programming languages — each chosen for its domain-specific strengths — form a layered engine that ingests market data, computes geometric curvature in real-time, and predicts structural collapses (crashes) as detectable singularities.

```
         LISP                 C++20 / CUDA / ASM           Rust
   ┌──────────────┐       ┌─────────────────────┐    ┌──────────────┐
   │ Meta-compiler │──JIT─▶│   Physics Engine     │◀───│ Zero-copy    │
   │ Field eqs     │       │ Riemann tensors      │    │ Ingestion    │
   │ Symbolic opt  │       │ AVX-512 · Tensor Core│    │ < 10μs       │
   └──────────────┘       └──────────┬──────────┘    └──────┬───────┘
                                     │ FFI                   │
                            ┌────────▼───────────────────────▼──────┐
                            │         Python · JAX / Flax           │
                            │  Neural SDEs · Topological Data Anal. │
                            └─────────────────┬────────────────────┘
                                              │ WebSocket
                            ┌─────────────────▼────────────────────┐
                            │      TypeScript · Three.js / WebGL    │
                            │   Interactive 4D manifold rendering   │
                            └──────────────────────────────────────┘
```

| Layer | Language | What it does | Key metric |
|-------|----------|-------------|------------|
| **Symbolic Logic** | Common LISP | Derives field equations, emits optimized C++/CUDA at runtime | Real-time JIT |
| **Physics Engine** | C++20 + CUDA + x86 ASM | Riemann tensor, Christoffel symbols, RK4 geodesic solver | 15 TFLOPS (A100) |
| **Nervous System** | Rust | Lock-free zero-copy data ingestion with arena allocators | < 10 μs latency |
| **Cognitive Lab** | Python (JAX) | Neural SDEs for stochastic flow, persistent homology (TDA) | 2 ms/sim |
| **Interface** | TypeScript + GLSL | Deformable 4D manifold with curvature-mapped shaders | 60 FPS @ 128² |

---

## Quick Start

```bash
# Docker (GPU)
docker build -f docker/production.Dockerfile -t tensorwerk:latest .
docker run --gpus all -p 8080:8080 tensorwerk:latest

# From source
git clone https://github.com/thiagodifaria/Tensorwerk.git
cd Tensorwerk && ./scripts/setup.sh prod && make run
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.MD) | Full system design, data flow, and performance targets |
| [Design Decisions](docs/DECISIONS.MD) | 10 ADRs explaining every major engineering choice |
| [Project Structure](docs/STRUCTURE.MD) | Directory map, naming conventions, CI/CD pipeline |
| [Execution Guide](docs/RUN.MD) | Hardware requirements, install steps, troubleshooting |
| [Migration Guide](docs/MIGRATION.MD) | Evolution from base system to current architecture |

---

## Contact

**Thiago Di Faria** — [thiagodifaria@gmail.com](mailto:thiagodifaria@gmail.com)

[![GitHub](https://img.shields.io/badge/GitHub-@thiagodifaria-black?style=flat&logo=github)](https://github.com/thiagodifaria)

---

<p align="center"><i>"Money is energy flowing through financial spacetime."</i></p>
<p align="center"><b>⭐ Star this project if you're interested in geometric finance!</b></p>

**Made with ❤️ by [Thiago Di Faria](https://github.com/thiagodifaria)**
