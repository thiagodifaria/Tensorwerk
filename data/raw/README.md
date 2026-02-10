# Dados Brutos de Mercado

Este diretório contém feeds de mercado brutos não processados.

## Formato

Todos os arquivos são **CSV** com cabeçalho:

```csv
timestamp,symbol,price,volume,bid_price,ask_price,bid_volume,ask_volume,side
1704067200000,BTCUSD,43250.50,1.25,43250.00,43251.00,5.0,3.2,BUY
1704067200150,BTCUSD,43251.00,0.80,43250.50,43251.50,4.5,2.8,SELL
...
```

## Campos

- `timestamp`: Unix timestamp em **milissegundos** desde epoch
- `symbol`: Símbolo do ativo (ex: BTCUSD, ETHUSD)
- `price`: Preço de execução (escala de 8 casas decimais para cripto)
- `volume`: Quantidade executada
- `bid_price`: Melhor preço de compra
- `ask_price`: Melhor preço de venda
- `bid_volume`: Volume na melhor compra
- `ask_volume`: Volume na melhor venda
- `side`: Direção da ordem (BUY/SELL)

## Fontes de Dados

### 1. Binance (Criptomoedas)

```bash
# Download via API (requer `pip install ccxt`)
python scripts/download_binance.py --symbol BTCUSD --days 30
```

Saída: `binance_trades_BTCUSD_2024_01.csv`

### 2. Coinbase (Criptomoedas)

```bash
python scripts/download_coinbase.py --symbol ETH-USD --days 30
```

Saída: `coinbase_trades_ETH-USD_2024_01.csv`

### 3. Yahoo Finance (Ações)

```bash
python scripts/download_yahoo.py --symbol AAPL --interval 1m
```

Saída: `yahoo_1m_AAPL_2024_01.csv`

## Dados de Exemplo

Para testes rápidos sem downloads:

```bash
# Gerar dados sintéticos
python scripts/generate_data.py --samples 10000 --output data/raw/synthetic.csv
```

Isso cria um arquivo com:
- Preços seguindo movimento Browniano geométrico
- Volume correlacionado com volatilidade
- Spreads realistas

## Privacidade e Licença

Todos os dados aqui são **públicos** (provenientes de exchanges abertas).
Nenhum dado privado ou identificado pessoalmente está incluído.

## Armazenamento

- **Compressão**: Use gzip (`*.csv.gz`) para arquivos grandes
- **Particionamento**: Arquivos mensais (`_YYYY_MM.csv`) facilitam consultas
- **Retenção**: Manter últimos 6 meses para desenvolvimento; arquivar resto

---

**Nota**: Atualmente use `data/raw/synthetic.csv` para desenvolvimento inicial.
