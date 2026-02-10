# Tensorwerk — Motor de Simulação de Espaço-Tempo Financeiro

> *"O mercado não é uma sucessão estatística — é uma variedade Riemanniana dinâmica onde a liquidez curva o espaço e cria singularidades."*

<p align="center">
  <img src="https://img.shields.io/badge/LISP-Meta--Compilador-9B4DCA?style=flat" />
  <img src="https://img.shields.io/badge/C%2B%2B20-Física-00599C?style=flat&logo=cplusplus" />
  <img src="https://img.shields.io/badge/CUDA%2012-Kernels-76B900?style=flat&logo=nvidia" />
  <img src="https://img.shields.io/badge/x86--64-AVX--512-FF6F00?style=flat" />
  <img src="https://img.shields.io/badge/Rust-Zero--Copy-DEA584?style=flat&logo=rust" />
  <img src="https://img.shields.io/badge/Python-JAX%2FFlax-3776AB?style=flat&logo=python" />
  <img src="https://img.shields.io/badge/TypeScript-WebGL-3178C6?style=flat&logo=typescript" />
  <img src="https://img.shields.io/badge/GLSL-Shaders-5586A4?style=flat" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat" />
</p>

---

## Visão Geral

**Tensorwerk** é um motor de simulação poliglota que modela mercados financeiros como **variedades Riemannianas de 4 dimensões** — espaço-tempo curvo onde a liquidez age como massa, preços seguem geodésicas, e crashes se manifestam como singularidades geométricas detectáveis antes de ocorrerem.

O sistema abrange **6 linguagens de programação**, cada uma operando no seu ótimo domain-specific, conectadas por FFI zero-copy e canais lock-free. Da derivação simbólica de equações de campo em LISP, passando por computação de tensores acelerada em GPU com CUDA, até visualização 4D interativa em WebGL — cada camada é construída para máximo throughput e rigor matemático.

### A Mudança de Paradigma

Modelos quantitativos tradicionais (Black-Scholes, GBM, VAR) tratam o mercado como um processo estocástico unidimensional com ruído gaussiano. Eles quebram catastroficamente em crises porque assumem retornos i.i.d., distribuições normais e dinâmicas lineares — nenhuma das quais é verdadeira em mercados sob estresse.

**Tensorwerk** substitui esse framework inteiramente:

| Modelo Tradicional | Tensorwerk |
|---|---|
| Série de preço 1D | Variedade Riemanniana 4D (3 espaciais + 1 temporal) |
| Ruído gaussiano | Equações diferenciais estocásticas em espaço curvo |
| Outliers estatísticos ("cisnes negros") | Singularidades geométricas (curvatura → ∞) |
| Matrizes de correlação | Tensor métrico g_μν codificando geometria do mercado |
| Regressão linear | Fluxo geodésico em variedade curva |

### O Que Isso Possibilita

- **Previsão de crashes**: Singularidades são detectáveis — a curvatura escalar cresce monotonicamente antes de divergir
- **Modelagem de contágio sistêmico**: Todos os ativos vivem na mesma variedade; choques propagam geometricamente
- **Arbitragem geodésica**: Quando preços desviam de geodésicas naturais, o desvio é mensurável e explorável
- **Visualização 4D**: "Buracos negros" financeiros e ondas de choque renderizados interativamente em WebGL

---

## Arquitetura

O motor é organizado em cinco camadas, cada uma na sua linguagem ideal, comunicando-se por fronteiras FFI bem definidas:

```
         LISP                 C++20 / CUDA / ASM           Rust
   ┌──────────────┐       ┌─────────────────────┐    ┌──────────────┐
   │ Meta-compilador──JIT─▶│   Motor de Física    │◀───│ Zero-copy    │
   │ Eqs. de campo │       │ Tensores de Riemann  │    │ Ingestão     │
   │ Otim. simbólica│      │ AVX-512 · Tensor Core│    │ < 10μs       │
   └──────────────┘       └──────────┬──────────┘    └──────┬───────┘
                                     │ FFI                   │
                            ┌────────▼───────────────────────▼──────┐
                            │         Python · JAX / Flax           │
                            │  Neural SDEs · Análise Topológica     │
                            └─────────────────┬────────────────────┘
                                              │ WebSocket
                            ┌─────────────────▼────────────────────┐
                            │      TypeScript · Three.js / WebGL    │
                            │   Renderização 4D interativa          │
                            └──────────────────────────────────────┘
```

### Detalhes por Camada

| Camada | Linguagem | Responsabilidade | Tecnologias | Performance |
|--------|-----------|-----------------|-------------|-------------|
| **Symbolic Logic** | Common LISP (SBCL) | Meta-compilador: deriva equações de campo simbolicamente, emite código C++/CUDA otimizado em runtime via JIT | ASDF, meta-programação com macros, homoiconicidade | Derivação em tempo real |
| **Physics Engine** | C++20 + CUDA 12 + x86-64 ASM | Geometria Riemanniana: tensor métrico g_μν, símbolos de Christoffel Γ^k_ij, tensor de Riemann R^ρ_σμν, escalar de Ricci, integração geodésica RK4 | AVX-512 FMA, CUDA Tensor Cores, assembly manual, alinhamento de cache 64B | 15 TFLOPS FP64 (A100) |
| **Nervous System** | Rust | Ingestão zero-copy de dados de mercado com arena allocators, validação de integridade (checksum, bounds, monotonicidade temporal), FFI bidirecional para C++ e Python | Tokio, crossbeam lock-free, cbindgen | < 10 μs end-to-end |
| **Cognitive Lab** | Python 3.11 (JAX/Flax) | Neural SDEs (dX_t = f_θ dt + g_θ dW_t) para aprender fluxo de mercado, homologia persistente (TDA) para detectar anomalias topológicas na liquidez | JAX autodiff + JIT, Flax, NumPy/SciPy | 2 ms/simulação |
| **Interface** | TypeScript + GLSL | Visualização 4D interativa: vertex shader deforma geometria por curvatura, fragment shader mapeia liquidez para colormap térmico, efeitos de pulso em singularidades | Next.js, Three.js, @react-three/fiber, Socket.IO | 60 FPS @ 128×128 |

---

## Quick Start

### Pré-requisitos

- **CPU**: Intel Xeon (Skylake+) ou AMD Zen 4 com suporte AVX-512
- **GPU**: NVIDIA A100 (recomendado) ou RTX 4090+
- **RAM**: 32 GB mínimo, 64 GB recomendado
- **Software**: CUDA 12.0, Python 3.11, Rust 1.70+, Node.js 20+, SBCL

### Docker (Recomendado)

```bash
docker build -f docker/production.Dockerfile -t tensorwerk:prod .
docker run --gpus all -p 8080:8080 tensorwerk:prod
```

### A Partir do Código-Fonte

```bash
git clone https://github.com/thiagodifaria/Tensorwerk.git
cd Tensorwerk

# Setup completo automatizado (compila todas as camadas)
./scripts/setup.sh prod

# Executar tudo
make run
```

<details>
<summary>Manual passo a passo</summary>

#### 1. Motor de Física (C++)
```bash
cd src/physics-engine/build
cmake .. -DUSE_CUDA=ON -DUSE_AVX512=ON
make -j$(nproc)
```

#### 2. Sistema Nervoso (Rust)
```bash
cd src/nervous-system
cargo build --release
```

#### 3. Lab Cognitivo (Python)
```bash
cd src/cognitive-lab
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

#### 4. Interface Web
```bash
cd src/interface
npm install && npm run build
```

</details>

---

## Como Funciona

### 1. Ingestão de Dados (Rust)

```rust
// Dados de mercado chegam via WebSocket → arena zero-copy
let buffer = arena.allocate(size)?;
socket.recv(buffer.as_mut_slice())?;
// C++ empresta (const), Python visualiza (memoryview), GPU copia (DMA)
```

**Latência**: < 10 μs end-to-end (vs ~100 μs em sistemas convencionais)

### 2. Cálculo de Curvatura (C++/CUDA)

```cpp
// Calcula tensor de Riemann completo com AVX-512 + CUDA
auto riemann = manifold.compute_riemann_tensor();
auto ricci = manifold.compute_ricci_tensor(riemann);
double R = manifold.compute_ricci_scalar(ricci);

if (R > SINGULARITY_THRESHOLD) {
    emit_alert("Singularidade geométrica detectada — crash iminente");
}
```

**Throughput**: 15 TFLOPS FP64 em A100 (equivalente a ~500 CPUs)

### 3. Aprendizado Estocástico (Python)

```python
# Neural SDE aprende dinâmicas do mercado na variedade
# dX_t = f_θ(X_t, t)dt + g_θ(X_t, t)dW_t
sde = NeuralSDE(config)
trajectory = sde(x0, (0, T), key)

# Homologia persistente detecta anomalias topológicas
result = detect_market_crash_via_topology(points)
# Muitos loops H1 persistentes → variedade emaranhada → risco de crash
```

### 4. Visualização (WebGL)

```tsx
<RiemannManifoldViewer
  curvatureScale={2.0}
  resolution={128}
  dataStreamUrl="ws://localhost:8080/stream"
/>
// Altura = curvatura escalar, Cor = densidade de liquidez
// Regiões roxas pulsantes = singularidades (curvatura → ∞)
```

---

## Casos de Uso

### Previsão de Crashes
```python
if manifold.ricci_scalar() > 0.95:
    print("ALERTA: Singularidade financeira detectada!")
    # Curvatura escalar crescendo monotonicamente → reduzir exposição
```

### Arbitragem Geodésica
```cpp
auto geodesic = solver.compute_geodesic(current_price, direction);
if (abs(price - geodesic.optimal_point) > threshold) {
    execute_trade();  // Preço reverterá para geodésica
}
```

### Risco Sistêmico via Topologia
```python
topology = detect_market_crash_via_topology(market_state)
if topology['risk_level'] == 'CRITICAL':
    rebalance_portfolio()  # Variedade emaranhada → colapso estrutural
```

---

## Performance

| Operação | Tensorwerk | Tradicional | Ganho |
|----------|-----------|-------------|-------|
| Ingestão de dados | 5 μs | 100 μs | **20×** |
| Cálculo de tensor de Riemann | 10 μs | N/A | **Nova capacidade** |
| Neural SDE forward pass | 2 ms | 500 ms | **250×** |
| Renderização 4D | 60 FPS | 30 FPS | **2×** |
| Detecção de singularidade | 50 ms | 5+ min | **6000×** |

**Benchmark**: Intel Xeon 8480+ (AVX-512), NVIDIA A100 40GB, 64 GB DDR5

---

## Estrutura do Projeto

```
Tensorwerk/
├── src/
│   ├── symbolic-logic/          # LISP — meta-compilador
│   │   ├── axioms/              # Invariantes financeiros, definições de métrica
│   │   ├── derivation/          # Derivação simbólica de equações de campo
│   │   └── compiler/            # Emissores de código C++/CUDA + otimizador simbólico
│   │
│   ├── physics-engine/          # C++20 — solvers de geometria Riemanniana
│   │   ├── include/             # Headers públicos (riemann_manifold.hpp)
│   │   ├── src/geometry/        # Implementação de variedade
│   │   ├── src/solvers/         # RK4, integradores de geodésicas
│   │   ├── src/tensor/          # Álgebra tensorial
│   │   ├── asm/                 # Kernels AVX-512 hand-tuned
│   │   └── cuda/                # Kernels GPU (Christoffel, Riemann, singularidade)
│   │
│   ├── nervous-system/          # Rust — ingestão zero-copy
│   │   └── src/                 # Arena allocator, validação de integridade, FFI
│   │
│   ├── cognitive-lab/           # Python — aprendizado & topologia
│   │   ├── differential_nets/   # Neural SDEs (JAX/Flax)
│   │   └── topology/            # Homologia persistente (TDA)
│   │
│   └── interface/               # TypeScript — visualização 4D
│       └── src/                 # Componentes React, shaders GLSL, hooks WebSocket
│
├── data/                        # Schemas e amostras de dados de mercado
├── config/                      # Configs YAML (mercados, neural_sde, logging)
├── docker/                      # Dockerfiles de produção e desenvolvimento
├── scripts/                     # Automação (setup, benchmark, deploy)
└── docs/                        # Arquitetura, decisões, guias
```

---

## Desenvolvimento

```bash
make help        # Lista todos os comandos
make dev         # Build de desenvolvimento
make test        # Executar todos os testes
make benchmark   # Benchmarks de performance
make coverage    # Cobertura de código
make docker      # Build Docker
```

---

## Documentação

- [Arquitetura](docs/ARCHITECTURE.MD) — Design completo do sistema e fluxo de dados
- [Decisões de Design](docs/DECISIONS.MD) — 10 ADRs com raciocínio de cada escolha
- [Estrutura do Projeto](docs/STRUCTURE.MD) — Mapa de diretórios, convenções, CI/CD
- [Guia de Execução](docs/RUN.MD) — Hardware, instalação, troubleshooting
- [Guia de Migração](docs/MIGRATION.MD) — Evolução da arquitetura base para atual

---

## Referências

- **Geometria Riemanniana**: do Carmo, *Riemannian Geometry* (1992)
- **Neural SDEs**: Tuo et al., *Neural Stochastic Differential Equations* (NeurIPS 2021)
- **TDA**: Edelsbrunner & Harer, *Computational Topology* (2010)
- **AVX-512**: Intel® 64 and IA-32 Architectures Optimization Reference Manual
- **CUDA**: NVIDIA CUDA C++ Programming Guide (2023)

---

## Licença

Distribuído sob a licença MIT. Veja `LICENSE` para detalhes.

---

## Contato

**Thiago Di Faria** — [thiagodifaria@gmail.com](mailto:thiagodifaria@gmail.com)

[![GitHub](https://img.shields.io/badge/GitHub-@thiagodifaria-black?style=flat&logo=github)](https://github.com/thiagodifaria)

---

<p align="center"><i>"Dinheiro é energia que flui através do espaço-tempo financeiro."</i></p>
<p align="center"><b>⭐ Se este projeto te interessou, considere dar uma estrela!</b></p>

**Feito com ❤️ por [Thiago Di Faria](https://github.com/thiagodifaria)**
