# =============================================================================
# DOCKERFILE DE PRODUÇÃO - MULTISTAGE BUILD
# =============================================================================
#
# Este Dockerfile constrói uma imagem otimizada para execução em GPU
# com todas as camadas do ecossistema Tensorwerk.
#
# Build: docker build -f docker/production.Dockerfile -t tensorwerk:prod .
# Run:   docker run --gpus all -p 8080:8080 tensorwerk:prod
#

# -----------------------------------------------------------------------------
# STAGE 1: BUILD BASE (C++ + CUDA + RUST)
# -----------------------------------------------------------------------------
FROM nvidia/cuda:12.0-devel-ubuntu22.04 AS base

# Instalar dependências de sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    wget \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar Rust
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y --profile minimal

# Instalar Python 3.11
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-dev \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Instalar SBCL (Steel Bank Common Lisp) para LISP
RUN apt-get update && apt-get install -y \
    sbcl \
    cl-asdf \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------------------------------
# STAGE 2: BUILD PHYSICS ENGINE (C++)
# -----------------------------------------------------------------------------
FROM base AS cpp-build

WORKDIR /build/physics-engine

# Copiar fonte C++
COPY src/physics-engine/ .

# Configurar e compilar com CUDA e AVX-512
RUN cmake -B build \
    -DCMAKE_BUILD_TYPE=Release \
    -DUSE_CUDA=ON \
    -DUSE_AVX512=ON \
    -DCMAKE_CUDA_ARCHITECTURES=80 \
    && cmake --build build --parallel $(nproc)

# Instalar em /usr/local
RUN cmake --install build --prefix /usr/local

# -----------------------------------------------------------------------------
# STAGE 3: BUILD NERVOUS SYSTEM (RUST)
# -----------------------------------------------------------------------------
FROM base AS rust-build

WORKDIR /build/nervous-system

# Copiar manifesto e fonte Rust
COPY src/nervous-system/Cargo.toml src/nervous-system/Cargo.lock ./
COPY src/nervous-system/src/ ./src/

# Compilar em release mode
RUN cargo build --release

# Extrair binário estático
RUN cp target/release/libtensorwerk_nervous.a /usr/local/lib/
RUN cp target/release/tensorwerk-ingestor /usr/local/bin/

# -----------------------------------------------------------------------------
# STAGE 4: BUILD COGNITIVE LAB (PYTHON)
# -----------------------------------------------------------------------------
FROM base AS python-build

WORKDIR /build/cognitive-lab

# Copiar requirements e fonte Python
COPY src/cognitive-lab/requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY src/cognitive-lab/ .
RUN pip3 install --no-cache-dir -e .

# -----------------------------------------------------------------------------
# STAGE 5: BUILD SYMBOLIC LOGIC (LISP)
# -----------------------------------------------------------------------------
FROM base AS lisp-build

WORKDIR /build/symbolic-logic

COPY src/symbolic-logic/ .

# Compilar sistema LISP
RUN sbcl --load logic.asd \
    --eval '(asdf:make :tensorwerk-symbolic-logic)'

# -----------------------------------------------------------------------------
# STAGE 6: BUILD INTERFACE (NEXT.JS)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS web-build

WORKDIR /build/interface

COPY src/interface/package*.json ./
RUN npm ci

COPY src/interface/ .
RUN npm run build

# -----------------------------------------------------------------------------
# STAGE 7: RUNTIME FINAL
# -----------------------------------------------------------------------------
FROM nvidia/cuda:12.0-runtime-ubuntu22.04

LABEL maintainer="Thiago Di Faria"
LABEL version="1.0.0"
LABEL description="Tensorwerk - Simulação de Espaço-Tempo Financeiro"

# Instalar apenas runtime dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    sbcl \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar artefatos dos builds anteriores
COPY --from=cpp-build /usr/local /usr/local
COPY --from=rust-build /usr/local/lib/libtensorwerk_nervous.a /usr/local/lib/
COPY --from=python-build /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=lisp-build /build/symbolic-logic /app/symbolic-logic

# Copiar interface web
COPY --from=web-build /build/interface/.next /app/.next
COPY --from=web-build /build/interface/node_modules /app/node_modules
COPY --from=web-build /build/interface/package.json /app/

# Copiar dados e schemas
COPY data/ /app/data

WORKDIR /app

# Expor portas
EXPOSE 8080 8443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Comando de execução
CMD ["python3.11", "-m", "tensorwerk.server"]
