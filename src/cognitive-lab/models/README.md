# Modelos Treinados do Tensorwerk

Este diretório contém pesos e artefatos de modelos Neural SDE treinados.

## Estrutura

```
models/
├── neural_sde/
│   ├── crypto_model.msgpack        # Pesos para criptomoedas
│   ├── stocks_model.msgpack        # Pesos para ações
│   └── forex_model.msgpack         # Pesos para forex
│
├── tda/
│   ├── vr_persistence.pkl          # Persistência de VR complex
│   └── barcode_embeddings.npy      # Embeddings de barcodes
│
└── checkpoints/
    ├── checkpoint_5000             # Checkpoint PyTorch/Flax
    └── best_model.msgpack          # Melhor modelo validado
```

## Formato

Os modelos são salvos em **MessagePack** (.msgpack) para máxima compatibilidade:
- Python (via `msgpack`)
- Rust (via `rmp-serde`)
- C++ (via `msgpack-cpp`)

## Como Treinar

```python
from cognitive_lab.differential_nets.neural_sde import NeuralSDE
from cognitive_lab.topology.persistent_homology import detect_market_crash_via_topology
import jax.numpy as jnp

# Criar modelo
config = SDEConfig(
    state_dim=4,
    hidden_dim=128,
    num_layers=3
)
model = NeuralSDE(config)

# Carregar dados
# ... (carregar de data/raw/)

# Treinar
# ... (ver notebooks/sde_experiments.ipynb)

# Salvar
import msgpack
with open('models/neural_sde/crypto_model.msgpack', 'wb') as f:
    msgpack.dump({'params': params, 'config': config}, f)
```

## Modelos de Exemplo

Até agora, este diretório contém apenas modelos **sintéticos** para demonstração. Modelos reais treinados em dados históricos serão adicionados após:
- Coleta de dados (mínimo 6 meses)
- Treinamento (aprox. 4 horas em A100)
- Validação (backtesting de 1 mês)

## Metadata

Cada arquivo `.msgpack` possui metadados:
- `training_date`: Data do treino
- `validation_accuracy`: Acurácia na validação
- `data_period`: Período dos dados usados
- `hyperparameters`: Configuração do modelo

---

**Nota**: Atualmente, use `data/synthetic/` para testes iniciais.
