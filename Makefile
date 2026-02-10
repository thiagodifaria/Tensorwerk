# =============================================================================
# MAKEFILE TENSORWERK - ORQUESTRADOR DE BUILD UNIVERSAL
# =============================================================================
#
# Este Makefile orquestra a compilação e execução de todo o ecossistema.
#
# Uso:
#   make              # Build completo
#   make dev          # Modo desenvolvimento
#   make test         # Executar todos os testes
#   make clean        # Limpar artefatos de build
#   make docker       # Build Docker image
#   make run          # Executar tudo
#

# -----------------------------------------------------------------------------
# CONFIGURAÇÃO
# -----------------------------------------------------------------------------

.PHONY: all dev prod test clean docker run help

SHELL := /bin/bash

# Detectar número de CPUs
NPROC := $(shell nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

# Modo de compilação
BUILD_MODE ?= debug

# Diretórios
BUILD_DIR = build
DIST_DIR = dist

# Cores para output
COLOR_INFO = \033[0;32m
COLOR_WARN = \033[1;33m
COLOR_ERROR = \033[0;31m
COLOR_RESET = \033[0m

# -----------------------------------------------------------------------------
# REGRAS PRINCIPAIS
# -----------------------------------------------------------------------------

all: help

##@ Goals (Metas Principais)

dev: ## Build em modo desenvolvimento
	@echo "$(COLOR_INFO)[BUILD] Modo Desenvolvimento$(COLOR_RESET)"
	@$(MAKE) -C src/physics-engine build
	@$(MAKE) -C src/nervous-system build
	@cd src/interface && npm install
	@cd src/cognitive-lab && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt

prod: ## Build em modo produção
	@echo "$(COLOR_INFO)[BUILD] Modo Produção$(COLOR_RESET)"
	@$(MAKE) -C src/physics-engine BUILD_TYPE=Release build
	@$(MAKE) -C src/nervous-system --release build
	@cd src/interface && npm ci && npm run build
	@cd src/cognitive-lab && pip install -r requirements.txt

test: ## Executar testes de todas as camadas
	@echo "$(COLOR_INFO)[TEST] Executando suíte de testes$(COLOR_RESET)"
	@$(MAKE) -C src/physics-engine test
	@$(MAKE) -C src/nervous-system test
	@cd src/cognitive-lab && source venv/bin/activate && python3 -m pytest

clean: ## Limpar artefatos de build
	@echo "$(COLOR_INFO)[CLEAN] Limpando artefatos$(COLOR_RESET)"
	@$(MAKE) -C src/physics-engine clean
	@$(MAKE) -C src/nervous-system clean
	@rm -rf src/interface/.next src/interface/node_modules
	@rm -rf src/cognitive-lab/venv src/cognitive-lab/__pycache__
	@rm -rf $(BUILD_DIR) $(DIST_DIR)

docker: ## Build Docker image
	@echo "$(COLOR_INFO)[DOCKER] Build image de produção$(COLOR_RESET)"
	docker build -f docker/production.Dockerfile -t tensorwerk:prod .

run: ## Executar todos os serviços
	@echo "$(COLOR_INFO)[RUN] Iniciando ecossistema TENSORWERK$(COLOR_RESET)"
	@echo "Iniciando motor C++..."
	@cd src/physics-engine && ./build/tensorwerk_engine &
	@echo "Iniciando ingestor Rust..."
	@cd src/nervous-system && ./target/$(BUILD_MODE)/tensorwerk-ingestor &
	@echo "Iniciando servidor Python..."
	@echo "  [SKIP] tensorwerk.server module not yet implemented"
	@# cd src/cognitive-lab && source venv/bin/activate && python3 -m tensorwerk.server &
	@echo "Iniciando interface web..."
	@cd src/interface && npm run dev

##@ Camadas Individuais

lisp: ## Compilar apenas camada LISP
	@echo "$(COLOR_INFO)[LISP] Compilando sistema simbólico$(COLOR_RESET)"
	@cd src/symbolic-logic && sbcl --load logic.asd --eval '(asdf:make :tensorwerk-symbolic-logic)'

cpp: ## Compilar apenas motor C++
	@echo "$(COLOR_INFO)[C++] Compilando motor de física$(COLOR_RESET)"
	@$(MAKE) -C src/physics-engine build

rust: ## Compilar apenas sistema nervoso
	@echo "$(COLOR_INFO)[RUST] Compilando sistema nervoso$(COLOR_RESET)"
	@$(MAKE) -C src/nervous-system build

python3: ## Instalar apenas dependências Python
	@echo "$(COLOR_INFO)[PYTHON] Instalando dependências$(COLOR_RESET)"
	@cd src/cognitive-lab && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt

web: ## Compilar apenas interface web
	@echo "$(COLOR_INFO)[WEB] Compilando interface$(COLOR_RESET)"
	@cd src/interface && npm install && npm run build

##@ Testes e Benchmarks

test-cpp: ## Testar apenas motor C++
	@$(MAKE) -C src/physics-engine test

test-rust: ## Testar apenas sistema nervoso
	@$(MAKE) -C src/nervous-system test

test-python3: ## Testar apenas laboratório cognitivo
	@cd src/cognitive-lab && source venv/bin/activate && python3 -m pytest -v

benchmark: ## Executar benchmarks de performance
	@echo "$(COLOR_INFO)[BENCH] Executando benchmarks$(COLOR_RESET)"
	@cd src/physics-engine && ./build/benchmarks/curvature_benchmark
	@$(MAKE) -C src/nervous-system benchmark

##@ Ferramentas

lint: ## Executar linters
	@echo "$(COLOR_INFO)[LINT] Verificando código$(COLOR_RESET)"
	@$(MAKE) -C src/nervous-system clippy
	@cd src/interface && npm run lint
	@cd src/cognitive-lab && pylint *.py

format: ## Formatar código
	@echo "$(COLOR_INFO)[FORMAT] Formatando código$(COLOR_RESET)"
	@$(MAKE) -C src/nervous-system format
	@cd src/interface && npm run format
	@cd src/cognitive-lab && black *.py

docs: ## Gerar documentação
	@echo "$(COLOR_INFO)[DOCS] Gerando documentação$(COLOR_RESET)"
	@$(MAKE) -C src/physics-engine docs
	@$(MAKE) -C src/nervous-system docs
	@cd docs && python3 -m http.server 8000

##@ Deployment

deploy: docker ## Deploy em produção (requer Docker)
	@echo "$(COLOR_INFO)[DEPLOY] Deploy em produção$(COLOR_RESET)"
	docker tag tensorwerk:prod tensorwerk:latest
	docker push tensorwerk:latest

ci: ## Pipeline de CI completo
	@echo "$(COLOR_INFO)[CI] Executando pipeline completo$(COLOR_RESET)"
	@$(MAKE) clean
	@$(MAKE) prod
	@$(MAKE) test
	@$(MAKE) lint

help: ## Mostrar esta ajuda
	@echo "$(COLOR_INFO)TENSORWERK - Makefile$(COLOR_RESET)"
	@echo ""
	@echo "Uso: make [target]"
	@echo ""
	@echo "Targets disponíveis:"
	@grep -E '^.*:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(COLOR_INFO)%-20s$(COLOR_RESET) %s\n", $$1, $$2}'

# -----------------------------------------------------------------------------
# REGRAS INTERNAS
# -----------------------------------------------------------------------------

# Criar diretórios de build
$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

$(DIST_DIR):
	@mkdir -p $(DIST_DIR)

# Monitoramento de arquivo para desenvolvimento
watch:
	@echo "Monitorando alterações..."
	@fswatch -o . | xargs -n1 -I{} make dev

# Análise de cobertura de código
coverage:
	@$(MAKE) -C src/nervous-system coverage
	@cd src/cognitive-lab && source venv/bin/activate && pytest --cov=. tests/

# Snapshot de benchmark
benchmark-snapshot:
	@echo "$(COLOR_INFO)[SNAPSHOT] Salvando snapshot de performance$(COLOR_RESET)"
	@$(MAKE) benchmark > benchmarks/snapshot-$$(date +%Y%m%d-%H%M%S).log
