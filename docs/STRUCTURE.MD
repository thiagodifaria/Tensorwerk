# ESTRUTURA DE PROJETO

## Mapa Completo de Diretórios

```
tensorwerk/
├── .github/
│   └── workflows/
│       ├── ci-cd.yml              # Pipeline GitHub Actions
│       ├── release.yml            # Release automation
│       └── security.yml           # Security scanning
│
├── docker/
│   ├── production.Dockerfile      # Imagem otimizada para GPU
│   └── dev.Dockerfile             # Ambiente de desenvolvimento
│
├── src/                           # Código fonte
│   ├── symbolic-logic/            # LISP - Meta-compilador
│   ├── axioms/
│   │   ├── invariantes.lisp       # Invariantes financeiros
│   │   ├── metric-tensor.lisp     # Definições de métrica
│   │   └── riemann-curvature.lisp # Curvatura de Riemann
│   │
│   ├── derivation/
│   │   ├── field-equations.lisp   # Equações de campo
│   │   ├── tensor-deriv.lisp      # Derivação tensorial
│   │   └── ode-generator.lisp     # Gerador de ODEs
│   │
│   └── compiler/
│       ├── emitters/
│       │   ├── cpp-emitter.lisp   # Emissor de código C++
│       │   └── cuda-kernel.lisp   # Emissor de kernels CUDA
│       │
│       └── optimizers/
│           ├── symbolic-reducer.lisp  # Simplificação algébrica
│           └── pattern-matcher.lisp    # Detecção de padrões
│
├── physics-engine/                # C++20 - Motor de física
│   ├── include/
│   │   └── riemann_manifold.hpp   # Headers públicos
│   │
│   ├── src/
│   │   ├── geometry/
│   │   │   └── riemann_manifold.cpp  # Variedades Riemannianas
│   │   │
│   │   ├── solvers/
│   │   │   ├── rk4.cpp            # Runge-Kutta 4ª ordem
│   │   │   └── geodesic.cpp        # Solver de geodésicas
│   │   │
│   │   └── tensor/
│   │       └── algebra.cpp         # Álgebra tensorial
│   │
│   ├── asm/
│   │   ├── avx512_kernels.asm      # Kernels AVX-512
│   │   └── memory_align.asm        # Alinhamento de cache
│   │
│   ├── cuda/
│   │   └── riemann_kernels.cu      # Kernels CUDA
│   │
│   ├── tests/                     # Testes C++
│   ├── benchmarks/                # Benchmarks
│   └── CMakeLists.txt             # Build CMake
│
├── nervous-system/                # Rust - Sistema nervoso
│   ├── src/
│   │   ├── ingestion/
│   │   │   ├── zero_copy.rs       # Protocolo zero-copy
│   │   │   └── main.rs            # Ingestor CLI
│   │   │
│   │   ├── validation/
│   │   │   └── integrity.rs       # Validação de integridade
│   │   │
│   │   └── bridge/
│   │       └── ffi.rs             # FFI para C++/Python
│   │
│   ├── tests/                     # Testes Rust
│   ├── benches/                   # Benchmarks
│   ├── Cargo.toml                 # Manifesto Rust
│   └── build.rs                   # Build script
│
├── cognitive-lab/                 # Python - Lab cognitivo
│   ├── differential_nets/
│   │   └── neural_sde.py          # Neural SDEs
│   │
│   ├── topology/
│   │   └── persistent_homology.py # TDA algorithms
│   │
│   ├── notebooks/
│   │   ├── exploration.ipynb      # Pesquisa exploratória
│   │   ├── sde_experiments.ipynb  # Experimentos Neural SDE
│   │   └── tda_demo.ipynb         # Demo de TDA
│   │
│   ├── models/                    # Pesos de modelos treinados
│   │
│   ├── tests/                     # Testes Python
│   ├── requirements.txt           # Dependências Python
│   └── setup.py                   # Setup Python package
│   │
│   └── interface/                 # Next.js - Visualização
│       ├── src/
│       │   ├── shaders/
│       │   │   └── curvature.glsl     # Shaders GLSL
│       │   │
│       │   ├── hooks/
│       │   │   ├── useWebSocket.ts    # WebSocket hook
│       │   │   └── useManifold.ts     # Manifold state hook
│       │   │
│       │   ├── components/
│       │   │   ├── RiemannManifoldViewer.tsx  # Visualizador 4D
│       │   │   └── ControlPanel.tsx   # Painel de controles
│       │   │
│       │   ├── pages/
│       │   │   ├── index.tsx          # Homepage
│       │   │   └── dashboard.tsx      # Dashboard principal
│       │   │
│       │   └── lib/
│       │       └── tensorwerk-api.ts     # Cliente API
│       │
│       ├── public/
│       │   └── assets/                # Imagens, texturas, etc
│       │
│       ├── package.json               # Dependências Node.js
│       ├── tsconfig.json              # Config TypeScript
│       └── next.config.js             # Config Next.js
│
├── data/                          # Dados e schemas
│   ├── raw/                       # Dados brutos de mercado
│   │   ├── binance_trades.csv
│   │   └── coinbase_quotes.csv
│   │
│   ├── persistent/                # SQLite ou banco vetorial
│   │   └── market_history.db
│   │
│   └── schemas/                   # Schemas de validação
│       ├── market_data.json       # JSON Schema
│       └── pydantic_models.py     # Modelos Pydantic
│
├── scripts/                       # Automação
│   ├── setup.sh                   # Setup do ambiente
│   ├── benchmark.py               # Benchmarks end-to-end
│   ├── generate_data.py           # Geração de dados sintéticos
│   └── deploy.sh                  # Deploy automation
│
├── docs/                          # Documentação
│   ├── README.MD                  # Este documento
│   ├── ARCHITECTURE.MD            # Arquitetura do sistema
│   ├── DECISIONS.MD               # Decisões de design
│   ├── RUN.MD                     # Guia de execução
│   └── MIGRATION.MD               # Guia de migração
│
├── config/                        # Configurações
│   ├── markets.yaml               # Config de mercados
│   ├── neural_sde.yaml            # Config de Neural SDE
│   └── logging.yaml               # Config de logging
│
├── .github/                       # GitHub configs
│   └── workflows/
│       ├── ci.yml                 # CI pipeline
│       └── release.yml            # Release workflow
│
├── tests/                         # Testes de integração
│   ├── test_integration.py        # Testes e2e
│   └── fixtures/                  # Fixtures para testes
│
├── Makefile                       # Orquestrador de build
├── README.MD                      # README principal
├── LICENSE                        # Licença MIT
└── .gitignore                     # Git ignore
```

## Convenções de Nomenclatura

### Arquivos

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| C++ headers | `.hpp` | `riemann_manifold.hpp` |
| C++ source | `.cpp` | `riemann_manifold.cpp` |
| Rust modules | `.rs` | `zero_copy.rs` |
| Python modules | `.py` | `neural_sde.py` |
| LISP source | `.lisp` | `field-equations.lisp` |
| TypeScript | `.ts` / `.tsx` | `RiemannManifoldViewer.tsx` |
| GLSL shaders | `.glsl` | `curvature.glsl` |
| Configs | `.yaml` / `.json` | `markets.yaml` |
| Documentação | `.MD` (maiúsculo) | `ARCHITECTURE.MD` |

### Diretórios

- **snake_case**: Todos os diretórios usam `snake_case`
- **Plural**: Diretórios com múltiplos itens são plurais (`tests/`, `scripts/`)
- **Singular**: Diretórios conceituais são singulares (`docs/`, `config/`)

### Código

#### C++
```cpp
// Classes: PascalCase
class RiemannManifold { };

// Funções: snake_case
double compute_ricci_scalar();

// Constantes: UPPER_SNAKE_CASE
constexpr double SINGULARITY_THRESHOLD = 0.95;
```

#### Rust
```rust
// Structs: PascalCase
pub struct ZeroCopyArena { }

// Funções: snake_case
pub fn allocate(&self, size: usize) -> Result<NonNull<u8>>

// Constantes: UPPER_SNAKE_CASE
pub const RECV_BUFFER_SIZE: usize = 16 * 1024 * 1024;
```

#### Python
```python
# Classes: PascalCase
class NeuralSDE(nn.Module):

# Funções: snake_case
def compute_christoffel_symbols(self) -> ChristoffelSymbols:

# Constantes: UPPER_SNAKE_CASE
STATE_DIM = 4
```

#### TypeScript
```typescript
// Interfaces/Types: PascalCase
interface MarketDataPoint { }

// Funções: camelCase
function computeGeodesic(): GeodesicPath { }

// Constantes: UPPER_SNAKE_CASE
const MAX_PENDING_MESSAGES = 10000;
```

## Tamanhos de Arquivo Típicos

| Componente | Linhas | Tamanho |
|-----------|--------|--------|
| C++ header | 200-500 | 8-20 KB |
| C++ source | 500-1500 | 20-60 KB |
| Rust module | 300-800 | 12-32 KB |
| Python module | 400-1000 | 16-40 KB |
| LISP source | 200-600 | 8-24 KB |
| TypeScript component | 150-400 | 6-16 KB |
| GLSL shader | 100-300 | 4-12 KB |

## Dependências Entre Módulos

```
symbolic-logic (LISP)
      ↓ gera código
physics-engine (C++)
      ↓ FFI (ponteiros)
nervous-system (Rust)
      ↓ FFI + memória compartilhada
cognitive-lab (Python)
      ↓ WebSocket + REST
interface (TypeScript)
```

## Arquivos de Configuração

### `config/markets.yaml`
```yaml
markets:
  - symbol: BTCUSD
    source: binance
    enabled: true
    min_tick_size: 0.01
  - symbol: ETHUSD
    source: coinbase
    enabled: true
```

### `config/neural_sde.yaml`
```yaml
model:
  state_dim: 4
  hidden_dim: 128
  num_layers: 3
  activation: tanh
  dt: 0.01

training:
  learning_rate: 0.001
  batch_size: 256
  num_epochs: 100
```

### `config/logging.yaml`
```yaml
version: 1
formatters:
  standard:
    format: '%(asctime)s [%(levelname)s] %(name)s: %(message)s'

handlers:
  console:
    class: logging.StreamHandler
    formatter: standard
    level: INFO

loggers:
  tensorwerk:
    level: DEBUG
    handlers: [console]
```

## Git Workflow

### Branches

- `main`: Produção estável
- `develop`: Desenvolvimento ativo
- `feature/*`: Features experimentais
- `bugfix/*`: Correções de bugs
- `release/*`: Preparação de release

### Commit Message Format

```
<tipo>(<escopo>): <descrição>

[opcional: corpo]

[opcional: footer]
```

**Tipos**:
- `feat`: Nova feature
- `fix`: Bug fix
- `docs`: Mudança de documentação
- `style`: Formatação (sem mudança lógica)
- `refactor`: Refatoração
- `perf`: Melhoria de performance
- `test`: Adicionar testes
- `chore`: Build process, tooling

**Exemplo**:
```
feat(physics): adicionar kernel AVX-512 para contração tensorial

Implementa função `tensorwerk_avx512_contract_22` que processa
contração de tensores rank-2 com AVX-512 FMA.

Performance: 1.2 GFLOPS vs 0.6 GFLOPS (versão escalar)

Closes #123
```

## Linters e Formatters

| Linguagem | Linter | Formatter | Config |
|-----------|--------|-----------|--------|
| C++ | clang-tidy | clang-format | `.clang-format` |
| Rust | clippy | rustfmt | `rustfmt.toml` |
| Python | pylint | black | `pyproject.toml` |
| TypeScript | ESLint | Prettier | `.eslintrc.js` |

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test-cpp:
    runs-on: [ubuntu-latest, gpu]
    steps:
      - uses: actions/checkout@v3
      - name: Build C++
        run: make -C src/physics-engine test

  test-rust:
    runs-on: ubuntu-latest
    steps:
      - name: Rust tests
        run: cd src/nervous-system && cargo test

  test-python:
    runs-on: ubuntu-latest
    steps:
      - name: Python tests
        run: cd src/cognitive-lab && pytest
```

---

**Documentação relacionada**:
- Arquitetura: `docs/ARCHITECTURE.MD`
- Como executar: `docs/RUN.MD`
- Decisões de design: `docs/DECISIONS.MD`
