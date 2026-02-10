#!/bin/bash
# =============================================================================
# SCRIPT DE ORQUESTRAÇÃO DE AMBIENTE tensorwerk
# =============================================================================
#
# Este script configura automaticamente todo o ecossistema tensorwerk,
# instalando dependências e compilando cada camada.
#
# Uso: ./scripts/setup.sh [dev|prod]
#

set -e  # Parar em qualquer erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color

# Função de log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detectar sistema operacional
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            DISTRO=$ID
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        log_error "Sistema operacional não suportado: $OSTYPE"
        exit 1
    fi

    log_info "Sistema detectado: $OS"
}

# Instalar dependências do sistema
install_system_deps() {
    log_info "Instalando dependências do sistema..."

    case $OS in
        linux)
            case $DISTRO in
                ubuntu|debian)
                    sudo apt-get update
                    sudo apt-get install -y \
                        build-essential \
                        cmake \
                        git \
                        curl \
                        wget \
                        pkg-config \
                        libssl-dev \
                        python3 \
                        python3-dev \
                        python3-pip \
                        python3-venv \
                        sbcl \
                        clang \
                        nvidia-cuda-toolkit \
                        || log_warn "Alguns pacotes falharam (pode ser normal)"
                    ;;
                fedora|rhel)
                    sudo dnf install -y \
                        gcc-c++ \
                        cmake \
                        git \
                        curl \
                        wget \
                        pkgconfig \
                        openssl-devel \
                        python3 \
                        python3-devel \
                        python3-pip \
                        sbcl \
                        clang \
                        cuda
                    ;;
                *)
                    log_warn "Distro $DISTRO não testada, instalando pacotes mínimos..."
                    sudo apt-get update && sudo apt-get install -y build-essential cmake git curl
                    ;;
            esac
            ;;
        macos)
            if ! command -v brew &> /dev/null; then
                log_error "Homebrew não encontrado. Instale em https://brew.sh"
                exit 1
            fi
            brew install cmake git curl python@3.11 sbcl llvm
            ;;
        windows)
            log_warn "Windows: Assumindo que MSYS2/WSL está instalado"
            ;;
    esac
}

# Instalar Rust
install_rust() {
    if command -v cargo &> /dev/null; then
        log_info "Rust já instalado: $(cargo --version)"
    else
        log_info "Instalando Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source $HOME/.cargo/env
        log_info "Rust instalado: $(cargo --version)"
    fi
}

# Instalar Node.js e npm
install_nodejs() {
    if command -v node &> /dev/null; then
        log_info "Node.js já instalado: $(node --version)"
    else
        log_info "Instalando Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        log_info "Node.js instalado: $(node --version)"
    fi
}

# Configurar ambiente Python
setup_python_env() {
    log_info "Configurando ambiente Python..."

    cd src/cognitive-lab

    # Criar venv
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi

    # Ativar venv
    source venv/bin/activate

    # Instalar dependências
    if [ -f "requirements.txt" ]; then
        pip install --upgrade pip
        pip install -r requirements.txt
    fi

    cd ../..
}

# Compilar motor de física C++
build_cpp_engine() {
    log_info "Compilando motor de física (C++20)..."

    cd src/physics-engine

    # Criar diretório de build
    mkdir -p build
    cd build

    # Configurar CMake
    cmake .. \
        -DCMAKE_BUILD_TYPE=Release \
        -DUSE_CUDA=ON \
        -DUSE_AVX512=ON

    # Compilar
    make -j$(nproc)

    cd ../..
}

# Compilar sistema nervoso Rust
build_rust_bridge() {
    log_info "Compilando sistema nervoso (Rust)..."

    cd src/nervous-system

    # Compilar em release
    cargo build --release

    # Gerar headers C para FFI
    if command -v cbindgen &> /dev/null; then
        cbindgen --lang C --output tensorwerk_rust.h src/bridge/ffi.rs
        log_info "Headers C gerados: tensorwerk_rust.h"
    fi

    cd ../..
}

# Compilar LISP
build_lisp_system() {
    log_info "Compilando sistema simbólico (LISP)..."

    cd src/symbolic-logic

    # Carregar e compilar sistema ASDF
    sbcl --non-interactive \
        --load logic.asd \
        --eval '(asdf:load-system :tensorwerk-symbolic-logic)'

    cd ../..
}

# Compilar interface web
build_web_interface() {
    log_info "Compilando interface web (Next.js)..."

    cd src/interface

    # Instalar dependências
    npm ci

    # Build
    npm run build

    cd ../..
}

# Criar diretórios de dados
setup_data_dirs() {
    log_info "Criando diretórios de dados..."

    mkdir -p data/raw
    mkdir -p data/persistent
    mkdir -p data/schemas

    # Criar dados de exemplo
    cat > data/schemas/market_data.json <<EOF
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MarketData",
  "type": "object",
  "properties": {
    "timestamp": {"type": "integer"},
    "symbol": {"type": "string"},
    "price": {"type": "number"},
    "volume": {"type": "number"},
    "curvature": {"type": "number"}
  },
  "required": ["timestamp", "symbol", "price"]
}
EOF
}

# Executar testes
run_tests() {
    log_info "Executando testes..."

    # Python
    if [ -d "src/cognitive-lab" ]; then
        cd src/cognitive-lab
        source venv/bin/activate
        python -m pytest tests/ || log_warn "Alguns testes Python falharam"
        cd ../..
    fi

    # Rust
    if [ -d "src/nervous-system" ]; then
        cd src/nervous-system
        cargo test || log_warn "Alguns testes Rust falharam"
        cd ../..
    fi
}

# Main
main() {
    local MODE=${1:-dev}

    log_info "=========================================="
    log_info "tensorwerk - Setup do Ambiente"
    log_info "Mode: $MODE"
    log_info "=========================================="

    detect_os
    install_system_deps
    install_rust
    install_nodejs
    setup_python_env

    if [ "$MODE" == "prod" ]; then
        build_cpp_engine
        build_rust_bridge
        build_lisp_system
        build_web_interface
    fi

    setup_data_dirs
    run_tests

    log_info "=========================================="
    log_info "Setup concluído com sucesso!"
    log_info "=========================================="
    log_info ""
    log_info "Próximos passos:"
    log_info "  1. cd src/cognitive-lab && source venv/bin/activate"
    log_info "  2. python -m tensorwerk.server  # Iniciar servidor"
    log_info "  3. cd src/interface && npm run dev  # Iniciar UI"
    log_info ""
}

# Executar
main "$@"
