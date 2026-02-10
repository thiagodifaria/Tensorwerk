# GUIA DE EXECUÇÃO E INSTALAÇÃO

## Pré-requisitos

### Hardware Mínimo

- **CPU**: Intel Xeon (Skylake ou newer) ou AMD Zen 4 com suporte AVX-512
- **GPU**: NVIDIA A100 (recomendado) ou RTX 4090+ (para desenvolvimento)
- **RAM**: 32 GB mínimo, 64 GB recomendado
- **Armazenamento**: 100 GB SSD NVMe
- **Network**: 10 Gbps (para dados de mercado em tempo real)

### Software Necessário

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    wget \
    python3.11 \
    python3-pip \
    python3-venv \
    sbcl \
    clang \
    nvidia-cuda-toolkit \
    nodejs \
    npm
```

### macOS

```bash
brew install cmake git curl python@3.11 sbcl llvm node
```

### Windows (WSL2)

Recomendado usar WSL2 com Ubuntu:

```powershell
wsl --install -d Ubuntu-22.04
```

Depois, dentro do WSL:

```bash
sudo apt-get update && sudo apt-get upgrade -y
# (mesmos comandos que Ubuntu acima)
```

---

## Instalação Rápida (Automatizada)

### Opção 1: Script de Setup

```bash
# Clonar repositório
git clone https://github.com/thiagodifaria/Tensorwerk.git
cd tensorwerk

# Executar script de setup
chmod +x scripts/setup.sh
./scripts/setup.sh prod
```

Isso irá:
1. Instalar todas as dependências
2. Compilar todas as camadas (C++, Rust, LISP, Python, Web)
3. Criar ambientes virtuais
4. Baixar dados de exemplo

### Opção 2: Docker (Recomendado para Produção)

```bash
# Build imagem Docker
docker build -f docker/production.Dockerfile -t tensorwerk:prod .

# Executar em GPU
docker run --gpus all -p 8080:8080 tensorwerk:prod
```

---

## Instalação Manual Passo a Passo

### 1. Compilar Motor de Física (C++)

```bash
cd src/physics-engine

# Criar diretório de build
mkdir build && cd build

# Configurar CMake (com CUDA e AVX-512)
cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DUSE_CUDA=ON \
    -DUSE_AVX512=ON \
    -DCMAKE_CUDA_ARCHITECTURES=80

# Compilar
make -j$(nproc)

# Instalar
sudo make install

# Testar
./bin/curvature_benchmark
```

**Saída esperada**:
```
[INFO] AVX-512: DETECTADO
[INFO] CUDA: DETECTADO (A100 40GB)
[BENCH] Contração de tensores: 1.2 GFLOPS
[BENCH] Solver RK4: 15.6 GFLOPS
```

### 2. Compilar Sistema Nervoso (Rust)

```bash
cd src/nervous-system

# Compilar em release mode
cargo build --release

# Gerar headers C (para FFI)
cargo install cbindgen
cbindgen --lang C --output tensorwerk_rust.h src/bridge/ffi.rs

# Testar
cargo test --release

# Executar benchmark
cargo bench --bench latency_benchmark
```

**Saída esperada**:
```
test ingestion::tests::test_arena_allocation ... ok
test validation::tests::test_checksum ... ok

Benchmarking latency_ingest/1000_messages
time:   [5.1234 us 5.2345 us 5.3456 us]
```

### 3. Instalar Laboratório Cognitivo (Python)

```bash
cd src/cognitive-lab

# Criar ambiente virtual
python3.11 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt

# Instalar em modo development
pip install -e .

# Testar
pytest tests/ -v
```

**Requisitos.txt**:
```
jax==0.4.20
jax[cuda12]  # Para GPU
flax==0.7.0
optax==0.1.7
numpy==1.24.0
scipy==1.11.0
scikit-learn==1.3.0
notebook==7.0.0
jupyter==1.0.0
pydantic==2.4.0
```

### 4. Compilar Sistema Simbólico (LISP)

```bash
cd src/symbolic-logic

# Carregar e compilar sistema ASDF
sbcl --non-interactive \
    --load logic.asd \
    --eval '(asdf:load-system :tensorwerk-symbolic-logic)' \
    --eval '(quit)'
```

### 5. Compilar Interface Web (Next.js)

```bash
cd src/interface

# Instalar dependências
npm install

# Build
npm run build

# Desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` no navegador.

---

## Execução Completa do Sistema

### Modo Desenvolvimento

**Terminal 1 - Motor C++**:
```bash
cd src/physics-engine/build
./tensorwerk_engine --port 50051
```

**Terminal 2 - Ingestor Rust**:
```bash
cd src/nervous-system
./target/release/tensorwerk-ingestor --source binance --port 50052
```

**Terminal 3 - Servidor Python**:
```bash
cd src/cognitive-lab
source venv/bin/activate
python -m tensorwerk.server --port 8080
```

**Terminal 4 - Interface Web**:
```bash
cd src/interface
npm run dev
```

**Terminal 5 - LISP (opcional)**:
```bash
cd src/symbolic-logic
sbcl --load meta-compiler.lisp
```

### Modo Produção (Docker Compose)

```bash
# Criar docker-compose.yml
cat > docker-compose.yml <<EOF
version: '3.8'
services:
  tensorwerk-engine:
    build:
      context: .
      dockerfile: docker/production.Dockerfile
    ports:
      - "8080:8080"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      - MODE=production
      - LOG_LEVEL=info
EOF

# Executar
docker-compose up -d
```

---

## Verificação de Instalação

### Health Check

```bash
curl http://localhost:8080/api/health
```

**Saída esperada**:
```json
{
  "status": "healthy",
  "components": {
    "physics_engine": "ok",
    "nervous_system": "ok",
    "cognitive_lab": "ok",
    "gpu": "NVIDIA A100 40GB"
  },
  "uptime_seconds": 123.45
}
```

### Teste de Integração

```bash
# Scripts/benchmark.py roda um teste end-to-end
cd scripts
python benchmark.py --test integration
```

**Saída esperada**:
```
[TEST] Ingestão de dados: OK (1000 msgs em 5ms)
[TEST] Cálculo de curvatura: OK (10μs/iteração)
[TEST] Neural SDE forward: OK (2ms/simulação)
[TEST] TDA: OK (50ms para 1000 pontos)
[TEST] Visualização: OK (60 FPS @ 128x128)
```

---

## Solução de Problemas

### Erro: CUDA não encontrado

**Sintoma**:
```
[CUDA] Error: CUDA driver not found
```

**Solução**:
```bash
# Verificar instalação CUDA
nvidia-smi

# Reinstalar CUDA (se necessário)
sudo apt-get install nvidia-cuda-toolkit
```

### Erro: AVX-512 não suportado

**Sintoma**:
```
Illegal instruction (core dumped)
```

**Solução**:
```bash
# Recompilar sem AVX-512
cd src/physics-engine/build
cmake .. -DUSE_AVX512=OFF
make -j$(nproc)
```

### Erro: Rust não compila

**Sintoma**:
```
error: linking with `cc` failed: exit code: 1
```

**Solução**:
```bash
# Instalar linker
sudo apt-get install lld

# Recompilar
cargo build --release
```

### Erro: Python OOM

**Sintoma**:
```
MemoryError: Unable to allocate array
```

**Solução**:
```bash
# Aumentar swap
sudo fallocate -l 16G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## Performance Tuning

### Otimizar GPU (NVIDIA)

```bash
# Desabilitar ECC (se não necessário)
nvidia-smi -e 0

# Configurar power limit (máximo performance)
sudo nvidia-smi -pl 350  # A100: 350W

# Setar clocks máximos
sudo nvidia-smi -lgc 1800  # A100: 1800 MHz
```

### Otimizar CPU (Intel)

```bash
# Desabilitar hyperthreading (pode melhorar performance numérica)
echo 0 | sudo tee /sys/devices/system/cpu/cpu*/online

# Setar governor de performance
sudo cpupower frequency-set -g performance
```

### Otimizar Memória

```bash
# Configurar HugePages (para alocações grandes)
echo 1024 | sudo tee /proc/sys/vm/nr_hugepages

# Setar overcommit para evitar OOM
echo 1 | sudo tee /proc/sys/vm/overcommit_memory
```

---

## Comandos Úteis

### Makefile

```bash
make help        # Lista todos os comandos
make dev         # Build development
make prod        # Build production
make test        # Executar testes
make clean       # Limpar build
make docker      # Build Docker
make run         # Executar tudo
```

### Logs

```bash
# Logs do motor C++
tail -f /var/log/tensorwerk/physics-engine.log

# Logs do Rust
tail -f /var/log/tensorwerk/nervous-system.log

# Logs do Python
tail -f /var/log/tensorwerk/cognitive-lab.log
```

### Monitoramento

```bash
# GPU
watch -n 1 nvidia-smi

# CPU/Memória
htop

# Latência de rede
ping -i 0.1 api.binance.com
```

---

## Próximos Passos

Após instalação bem-sucedida:

1. **Leia a documentação**: `docs/ARCHITECTURE.MD`
2. **Explore os notebooks**: `src/cognitive-lab/notebooks/`
3. **Execute os benchmarks**: `scripts/benchmark.py`
4. **Configure o stream de dados**: Edite `config/markets.yaml`
5. **Inicie a visualização**: Abra `http://localhost:3000`

---

**Suporte**: Abra uma issue em https://github.com/thiagodifaria/Tensorwerk/issues

**Documentação adicional**:
- Arquitetura: `docs/ARCHITECTURE.MD`
- Decisões de design: `docs/DECISIONS.MD`
- Guia de migração: `docs/MIGRATION.MD`
