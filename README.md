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
  <img src="https://img.shields.io/github/v/release/thiagodifaria/Tensorwerk?style=flat" />
</p>

---

## 🌍 **Documentation / Documentação**

**📖 [🇺🇸 Read in English](README_EN.md)** — Comprehensive technical deep dive (Architecture, Math, APIs).  
**📖 [🇧🇷 Leia em Português](README_PT.md)** — Documentação técnica completa + analogias científicas.

---

## ⚡ What is Tensorwerk?

**Tensorwerk** is a **Financial Physics Engine** that models market dynamics as a 4-dimensional Riemannian manifold. By treating money as energy and price movements as curvature in spacetime, it detects structural instabilities (crashes) as geometric singularities *before* they manifest as price drops.

### 🏆 Key Highlights

- **Physics-Based Prediction**: Uses General Relativity field equations instead of statistical regression.
- **Ultra-Low Latency**: **Rust** ingestor processes market data in **< 10μs** with zero-copy architecture.
- **Massive Parallelism**: **C++20/CUDA** engine solves differential geometry on **AVX-512** & GPU Tensor Cores.
- **Real-Time Visualization**: **WebGL/React** interface renders the "Neural Circuitry" of the market, identifying connections and singularities in 4D.
- **Meta-Programming**: **LISP** kernel generates optimized C++ code for new financial instruments at runtime.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    subgraph "Nervous System (Rust)"
        A[Market Data API] -->|UDP/WS| B(Zero-Copy Ingestor)
        B -->|Shared Memory| C{Ring Buffer Arena}
    end

    subgraph "Physics Engine (C++20/CUDA)"
        C -->|Pointer Passing| D[Manifold Solver]
        D -->|Ricci Tensor| E[Curvature Compute]
        E -->|Geodesic Deviation| F[Singularity Detector]
    end

    subgraph "Interface (TypeScript/WebGL)"
        F -->|WebSocket| G[RiemannManifoldViewer]
        G -->|GLSL Shaders| H(4D Rendering)
    end
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
docker build -f docker/production.Dockerfile -t tensorwerk:latest .
docker run --gpus all -p 3000:3000 tensorwerk:latest
```

### Option 2: From Source
```bash
# Clean, Build, and Run all services (C++, Rust, Web)
make clean && make dev && make run
```

---

## 📞 Contact

**Thiago Di Faria** — [thiagodifaria@gmail.com](mailto:thiagodifaria@gmail.com)

[![GitHub](https://img.shields.io/badge/GitHub-@thiagodifaria-black?style=flat&logo=github)](https://github.com/thiagodifaria)

---

### 🌟 **Star this project if you're interested in Geometric Finance!**

**Made with ❤️ by [Thiago Di Faria](https://github.com/thiagodifaria)**
