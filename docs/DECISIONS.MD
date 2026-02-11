# REGISTRO DE DECISÕES DE DESIGN (ADR)

## Introdução

Este documento registra todas as decisões arquiteturais significativas tomadas durante o desenvolvimento do sistema Tensorwerk, incluindo o contexto, a decisão e as consequências.

Formato baseado em [Architecture Decision Records (ADR)](https://adr.github.io/).

---

## ADR-001: Modelar Mercado como Variedade Riemanniana

### Contexto

Modelos financeiros tradicionais (Black-Scholes, GBM, etc) tratam o mercado como um processo estocástico unidimensional com ruído gaussiano. Esses modelos falham catastroficamente em crises porque:

1. **Hipótese i.i.d. é falsa**: Retornos não são independentes (há correlação de longo alcance)
2. **Distribuição não é normal**: Fat tails são muito mais comuns (Levy stable, não Gaussiano)
3. **Mercado não é linear**: Feedback loops criam bolhas e crashes
4. **Efeitos de rede**: Um ativo pode contaminar outros (contágio sistêmico)

### Decisão

Modelar o mercado financeiro como uma **Variedade Riemanniana de 4 dimensões** (3 espaciais + 1 temporal) onde:

- A métrica `g_μν` define a geometria local
- Densidade de liquidez age como massa, curvando o espaço (equação de Einstein modificada)
- Preços seguem geodésicas no espaço curvo
- Crashes são singularidades geométricas (curvatura → ∞)

### Consequências

**Positivas**:
- Singularidades são **detectáveis** antes de ocorrerem (curvatura cresce antes de explodir)
- Geodésicas são **previsíveis** (seguem leis da física)
- **Explicabilidade**: Podemos dizer "o mercado caiu porque a geometria rasgou", não "o modelo falhou"
- **Unificação**: Todos os ativos vivem no mesmo manifold, permitindo análise de contágio

**Negativas**:
- **Complexidade extrema**: Requer matemática avançada (geometria diferencial)
- **Custo computacional**: Calcular tensores de Riemann é caro (O(n³) para n=4 é ok, mas escala mal)
- **Dificuldade de validação**: Não há benchmarks (ninguém fez isso antes)

---

## ADR-002: Arquitetura Híbrida Multilinguagem

**Status**: Aceito
**Data**: 2025-01-16

### Contexto

Nenhum linguagem única é ótima para todos os aspectos:
- Python é lento para cálculo numérico pesado
- C++ não tem meta-programação dinâmica
- Rust não tem ecossistema científico
- LISP não é usado em produção financeira
- JavaScript não roda no backend

### Decisão

Adotar **5 linguagens**, cada uma no seu ápice de eficiência:

| Camada | Linguagem | Responsabilidade |
|--------|-----------|------------------|
| Meta-compilador | LISP | Geração dinâmica de código |
| Motor de física | C++20 + CUDA | Performance extrema |
| Sistema nervoso | Rust | Segurança de memória + zero-copy |
| Lab cognitivo | Python | Ecossistema científico |
| Visualização | TypeScript | Interface interativa |

### Consequências

**Positivas**:
- Cada linguagem opera no seu **sweet spot**
- **Zero trade-offs**: Temos meta-programação (LISP) E performance (C++) E segurança (Rust)
- **Interop via FFI**: Rust garante que C++ e Python leiam a mesma memória

**Negativas**:
- **Complexidade de toolchain**: Requer 5 compiladores diferentes
- **Diff debugging**: Stack traces cruzam linguagens
- **Onboarding time**: Novos devs precisam aprender 5 linguagens

### Mitigações

- **Makefile unificado**: `make` orquestra tudo
- **Headers gerados automaticamente**: cbindgen gera headers C a partir de Rust
- **FFI bem documentado**: Exemplos claros de como cada camada se comunica

---

## ADR-003: Ingestão Zero-Copy com Arenas Rust

**Status**: Aceito
**Data**: 2025-01-17

### Contexto

Sistemas de HFT (High-Frequency Trading) processam milhões de mensagens/segundo. Cada cópia de memória adiciona latência:

```
Socket → Buffer 1 → Buffer 2 → Buffer 3 → Engine
  5μs     +2μs        +2μs        +2μs      = 11μs
```

3 cópias = 6μs desperdiçados = 55% do tempo total.

### Decisão

Implementar **ingestão zero-copy** usando arenas de memória em Rust:

```
Socket → Arena Rust (ponteiros)
                  ↓
        C++ empresta (const borrow)
        Python view (memoryview)
        GPU copia (DMA)
```

A arena é pré-alocada (16 MB) e subdividida em chunks que nunca são movidos na memória.

### Consequências

**Positivas**:
- **Latência < 10μs**: Apenas 1 cópia (socket → arena)
- **Determinística**: Sem garbage collection pauses
- **Segura**: Borrow checker do Rust garante que não há data races

**Negativas**:
- **Complexidade de gerenciamento**: Precisamos trackear quando chunks podem ser reutilizados
- **Fragmentação**: Se não tivermos cuidado, a arena fragmenta

### Mitigações

- **Arena circular**: Reutilizar chunks FIFO
- **Ref counting**: Arc<RustArena> mantém memória viva enquanto C++/Python a usam

---

## ADR-004: Neural SDEs ao invés de Transformers

**Status**: Aceito
**Data**: 2025-01-18

### Contexto

Transformers (GPT, BERT) dominam NLP, mas para séries temporais financeiras eles têm problemas:

1. **Discretização**: Transformers precisam de steps fixos (ex: candles de 1 min)
2. **Memória limitada**: Context window de 2048 tokens = apenas 34 horas @ 1 min/res
3. **Perda de continuidade**: Entre candles, há saltos discretos

### Decisão

Usar **Neural Stochastic Differential Equations** (Neural SDEs):

```
dX_t = f_θ(X_t, t)dt + g_θ(X_t, t)dW_t
```

- O estado `X_t` evolui **continuamente** no tempo
- `dW_t` é Brownian motion (ruído contínuo)
- `f_θ` e `g_θ` são redes neurais que aprendem o drift e a difusão

### Consequências

**Positivas**:
- **Tempo contínuo**: Podemos consultar o modelo em *qualquer* instante t
- **Memory infinita**: ODE solvers têm "memória" infinita (não há janela fixa)
- **Física consistente**: SDEs são a linguagem natural da física estocástica

**Negativas**:
- **Treinamento complexo**: Backprop através de ODE solvers é caro
- **Instabilidade**: ODE solvers podem explodir se f_θ for muito forte

### Mitigações

- **Solver adaptativo**: RK45 com step size variável
- **Regularização de suavidade**: Penalizar derivadas grandes de f_θ

---

## ADR-005: Visualização WebGL ao invés de D3.js

**Status**: Aceito
**Data**: 2025-01-19

### Contexto

Dashboards financeiros tradicionais usam D3.js para gráficos 2D (linhas, barras, candles). Porém, nosso sistema é **4D** (x, y, z, tempo).

Visualizar 4D em 2D é impossível sem perder informações.

### Decisão

Usar **WebGL (via Three.js)** para renderização 4D interativa:

- **Geometria deformada**: Altura (z) = curvatura escalar
- **Cores térmicas**: Vermelho = alta liquidez, Azul = baixa
- **Animação**: 4ª dimensão (tempo) é a animação em 60 FPS
- **Interatividade**: Usuário pode rotacionar, zoom, pan

### Consequências

**Positivas**:
- **Visualização intuitiva**: "Buracos negros" no mercado são óbvios
- **Performance**: GPU renderiza milhões de triângulos @ 60 FPS
- **Interatividade**: Usuário pode explorar o manifold

**Negativas**:
- **Requer GPU**: Mobile devices podem ter problemas
- **Curva de aprendizado**: 3D navigation é não-óbvia

### Mitigações

- **LOD (Level of Detail)**: Reduzir resolução em mobile
- **Controles simplificados**: Botões preset ("Top view", "Side view", etc.)

---

## ADR-006: AVX-512 ao invés de AVX2

**Status**: Aceito
**Data**: 2025-01-20

### Contexto

AVX2 (256 bits) é universalmente disponível. AVX-512 (512 bits) só está em:
- Intel Xeon Scalable (Skylake, Cascade Lake, Ice Lake)
- AMD Zen 4 (Ryzen 7000)
- Apple M-series (M1/M2/M3)

Porém, AVX-512 permite processar **8 doubles** por ciclo vs 4 em AVX2.

### Decisão

Usar AVX-512 com fallback para AVX2 em runtime:

```cpp
if (__builtin_cpu_supports("avx512f")) {
    kernel_avx512();
} else if (__builtin_cpu_supports("avx2")) {
    kernel_avx2();
} else {
    kernel_scalar();
}
```

### Consequências

**Positivas**:
- **2x throughput**: 8 doubles/ciclo vs 4
- **FMA (Fused Multiply-Add)**: `a + b*c` em 1 instrução (sem erro de arredondamento)
- **Máxima performance**: Atinge limite teórico da CPU

**Negativas**:
- **Limitado a CPUs modernos**: Usuários com CPUs antigas usam fallback lento
- **Downclocking**: Algumas CPUs reduzem clock quando AVX-512 está ativo

### Mitigações

- **Detecção em runtime**: Usar a melhor instrução disponível
- **Benchmarks reais**: Documentar ganho de 1.8x (não 2x teórico) devido a downclocking

---

## ADR-007: Kafka não usado (optamos por canais lock-free Rust)

**Status**: Aceito
**Data**: 2025-01-21

### Contexto

Sistemas de streaming tradicionais usam Kafka para filas de mensagens. Porém, Kafka:

1. **Adiciona latência**: Disco flush + network roundtrip
2. **É overkill**: Não precisamos de replay, durability multi-node
3. **Complexo**: Requer Zookeeper, clusters, etc.

### Decisão

Usar **crossbeam-channel** (Rust) que implementa lock-free MPSC (Multi-Producer Single-Consumer) queues:

```rust
let (tx, rx) = crossbeam_channel::bounded(10_000);
tx.try_send(buffer)?;  // Non-blocking
```

### Consequências

**Positivas**:
- **Latência < 100ns**: Muito mais rápido que Kafka (~ms)
- **Simples**: Single binary, sem infraestrutura externa
- **Zero-copy**: Ponteiros são passados, não dados

**Negativas**:
- **Sem persistência**: Se o processo crasha, dados são perdidos
- **Sem replay**: Não podemos "voltar no tempo"

### Mitigações

- **WAL customizado**: Se necessário, implementar Write-Ahead Log simples
- **Não precisamos de replay**: Em HFT, dados antigos não têm valor

---

## ADR-008: CUDA ao invés de OpenCL

**Status**: Aceito
**Data**: 2025-01-22

### Contexto

OpenCL é portátil (NVIDIA, AMD, Intel). CUDA é NVIDIA-only. Porém:

- **Market share de Data Center**: NVIDIA tem ~90% (A100, H100)
- **Ecossistema CUDA**: CuDNN, CuBLAS, TensorRT são maduros
- **Performance**: CUDA é geralmente 10-20% mais rápido que OpenCL em NVIDIA

### Decisão

Usar **CUDA 12.0** com kernels customizados para:

1. Contração de tensores (Tensor Cores)
2. Integração de geodésicas em paralelo
3. Detecção de singularidades

### Consequências

**Positivas**:
- **Máxima performance**: 19.5 TFLOPS FP64 em A100
- **Tensor Cores**: Aceleração de matrizes via WMMA (Warp Matrix Multiply-Accumulate)
- **Suporte nativo**: Thrust, CuBLAS, CuDNN

**Negativas**:
- **Vendor lock-in**: Não roda em AMD/Intel GPUs
- **Custo**: GPUs NVIDIA data center são caras ($10k+)

### Mitigações

- **ABI híbrida**: Interfaces são genéricas, podemos adicionar backend OpenCL/HIP no futuro
- **CPU fallback**: Se não houver GPU, usar C++ AVX-512

---

## ADR-009: Monorepo ao invés de Multi-repo

**Status**: Aceito
**Data**: 2025-01-23

### Contexto

Cada camada *poderia* ser um repo separado. Porém:

1. **Integração contínua**: Mudanças em uma camada quebram outra frequentemente
2. **Versioning sincronizado**: Sempre que liberamos, todas as camadas devem estar em sync
3. **CI/CD mais simples**: Um pipeline vs 5 pipelines

### Decisão

Usar **monorepo** com:

- `/symbolic-logic`: LISP
- `/physics-engine`: C++
- `/nervous-system`: Rust
- `/cognitive-lab`: Python
- `/interface`: TypeScript

### Consequências

**Positivas**:
- **CI integrado**: Um PR testa todas as camadas
- **Simples de desenvolver**: `git clone` e tem tudo
- **Refactoring seguro**: Posso mudar uma API e todas as camadas reagem

**Negativas**:
- **Repos grandes**: `git clone` demora mais
- **Permissões**: Todos os devs têm acesso a tudo

### Mitigações

- **Shallow clones**: `git clone --depth 1`
- **CODEOWNERS**: Arquivo `.github/CODEOWNERS` define quem aprova o quê

---

## ADR-010: Sistema de Tipos Forte (Rust + TypeScript + C++)

**Status**: Aceito
**Data**: 2025-01-24

### Contexto

Sistemas financeiros tradicionais usam Python com tipos dinâmicos. Isso é conveniente mas perigoso:

```python
price = "100"  # Oops, string instead of float
```

### Decisão

Usar **sistema de tipos forte** em toda parte:

- **Rust**: Tipos estáticos com ownership
- **TypeScript**: `strict: true` no tsconfig.json
- **C++**: `-Wall -Wextra -Werror`

Python usa **Pydantic** para validação de tipos em runtime.

### Consequências

**Positivas**:
- **Erros em compile-time**: Não em produção
- **Refactoring seguro**: IDE pode renomear com confiança
- **Documentação viva**: Tipos são documentação

**Negativas**:
- **Verbosidade**: Mais código para declarar tipos
- **Curva de aprendizado**: Novos devs precisam aprender TypeScript

### Mitigações

- **Type inference**: `let` em Rust, `auto` em C++ reduzem verbosidade
- **Codesnippets**: VS Code snippets para tipos comuns

---

**Fim dos ADRs**

**Autor**: Thiago Di Faria — [thiagodifaria@gmail.com](mailto:thiagodifaria@gmail.com)
