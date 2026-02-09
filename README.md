<p align="center">
  <img src="https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana" />
  <img src="https://img.shields.io/badge/Next.js-16-000?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Colosseum-Agent_Hackathon-FF6B35?style=for-the-badge" />
</p>

# 🧬 DARWIN

### Evolutionary Trading Agents on Solana

> *"It is not the strongest of the species that survives, nor the most intelligent that survives. It is the one that is most adaptable to change."*

**Darwin** is a genetic algorithm engine where AI trading agents breed, mutate, and evolve strategies through natural selection — with on-chain recording on Solana. Spawn populations of agents, watch them compete on real market data, see the weak eliminated and the strong reproduce, generation after generation, until alpha emerges from chaos.

🔗 **[Live Demo](https://darwin-sol.vercel.app)** · 📦 **[GitHub](https://github.com/hamzadiaz/darwin)** · 🏛️ **[Colosseum Submission](https://colosseum.com/agent-hackathon/projects/darwin-evolutionary-trading-agents-on-solana)**

---

## 🎯 The Concept

Traditional trading bots are static — someone codes a strategy, deploys it, and hopes it works. Darwin flips this: instead of designing strategies, we **evolve** them.

Each agent has a **22-gene genome** encoding its complete trading personality — from indicator periods and thresholds to risk management, leverage, and position sizing. Agents compete against real Binance market data with realistic fees and slippage. The best performers breed. The worst die. Mutations introduce novel strategies. AI (Gemini Flash) guides the breeding process. Over 50 generations, the population converges on profitable behavior through pure natural selection.

No manual tuning. No backtesting hell. Just evolution.

---

## 🧬 How the Genetic Algorithm Works

```
┌─────────────────────────────────────────────────────────┐
│                    DARWIN PROTOCOL                       │
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │  SPAWN   │───▶│  COMPETE │───▶│  EVALUATE│          │
│  │ 20 agents│    │ backtest │    │ fitness  │          │
│  │ random   │    │ vs real  │    │ PnL + WR │          │
│  │ genomes  │    │ candles  │    │ + trades │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│       ▲                               │                 │
│       │         ┌──────────┐          │                 │
│       │         │ AI BREED │          │                 │
│       │         │ Gemini   │          │                 │
│       │         │ guides   │          │                 │
│       │         │ mutation │          │                 │
│       │         └─────┬────┘          │                 │
│       │               │               ▼                 │
│  ┌──────────┐    ┌────┴─────┐    ┌──────────┐          │
│  │  MUTATE  │◀───│  BREED   │◀───│  SELECT  │          │
│  │ 20% rate │    │ crossover│    │ top 20%  │          │
│  │ + macro  │    │ parents  │    │ elite    │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│       │                                                 │
│  ┌────┴─────┐    ┌──────────┐                          │
│  │IMMIGRATE │    │   KILL   │  Bottom 80% eliminated   │
│  │ 15% fresh│    │  💀💀💀  │  each generation          │
│  │ genomes  │    └──────────┘                          │
│  └──────────┘                                          │
│                                                         │
│  Repeat for 50 generations → Best genome emerges        │
└─────────────────────────────────────────────────────────┘
```

### Evolutionary Mechanics

| Mechanism | Detail |
|-----------|--------|
| **Elite Preservation** | Top 20% survive unchanged to next generation |
| **Crossover** | Uniform crossover — each gene randomly from parent A or B |
| **Mutation Rate** | 20% per gene per generation |
| **Macro Mutation** | 15% chance of full gene randomization (prevents stagnation) |
| **Mutation Magnitude** | ±75–250 absolute offset on the 0–1000 gene scale |
| **Immigration** | 15% of new population are fresh random genomes |
| **Tournament Selection** | Pick 3 random agents, best one becomes parent |
| **AI-Guided Bias** | Gemini Flash analyzes top performers and biases mutation direction |
| **Fitness Function** | PnL + win rate bonus (>60% WR) + trade activity bonus |

---

## 🧪 Genome Structure (22 Genes)

Each agent's DNA is a 22-gene array, values 0–1000, decoded into trading parameters:

| # | Gene | Range | Controls |
|---|------|-------|----------|
| 0 | Donchian Period | 10–50 | Breakout channel lookback window |
| 1 | EMA Fast | 5–20 | Fast exponential moving average period |
| 2 | EMA Slow | 20–100 | Slow exponential moving average period |
| 3 | RSI Period | 7–21 | Relative Strength Index lookback |
| 4 | RSI Oversold | 20–40 | Buy signal threshold |
| 5 | RSI Overbought | 60–80 | Sell signal threshold |
| 6 | Stop Loss % | 1–10% | Maximum loss before exit |
| 7 | Take Profit % | 2–30% | Target profit for exit |
| 8 | Position Size % | 5–25% | Capital allocation per trade |
| 9 | Trade Cooldown | 1–24h | Minimum time between trades |
| 10 | Volatility Filter | 0–1 | ATR-based regime filter sensitivity |
| 11 | Momentum Weight | 0–1 | Trend-following vs mean-reversion balance |
| 12 | MACD Fast | 8–16 | MACD fast EMA period |
| 13 | MACD Slow | 20–32 | MACD slow EMA period |
| 14 | MACD Signal | 6–12 | MACD signal line period |
| 15 | BB Period | 10–30 | Bollinger Bands lookback |
| 16 | BB Std Dev | 1.5–3.0 | Bollinger Bands width (σ multiplier) |
| 17 | Stoch K | 5–21 | Stochastic %K period |
| 18 | Stoch D | 3–9 | Stochastic %D smoothing period |
| 19 | Aggressiveness | 0.2–0.8 | Signal threshold (lower = more trades) |
| 20 | Leverage | 1–15x | Position leverage multiplier |
| 21 | Risk Per Trade % | 5–30% | Maximum balance risked per trade |

> **Search space**: 1001²² ≈ 10⁶⁶ possible genomes. Far too large for grid search — perfect for evolutionary optimization.

---

## 📊 Technical Indicators (9)

The strategy engine computes 9 indicators per candle and combines them via a weighted scoring system:

| Indicator | Signal Type | Usage |
|-----------|------------|-------|
| **EMA Crossover** | Momentum | Fast/slow crossover + trend direction |
| **RSI** | Mean Reversion | Oversold/overbought + midline cross |
| **Donchian Channels** | Breakout | Price breaking above/below channel |
| **MACD** | Momentum | Histogram crossover + trend confirmation |
| **Bollinger Bands** | Mean Reversion | Price touching bands + middle cross |
| **Stochastic Oscillator** | Mean Reversion | %K/%D crossover + oversold/overbought |
| **OBV (On-Balance Volume)** | Volume | Volume trend confirmation |
| **VWAP** | Value | Price relative to volume-weighted average |
| **ATR** | Volatility | Volatility regime filter |

Each indicator contributes a bull/bear score. When the combined score exceeds the agent's **aggressiveness threshold** (gene 19), a BUY or SELL signal fires. The **momentum weight** gene (11) balances trend-following vs mean-reversion signals.

---

## 💰 Fee Model

All backtests include realistic trading costs:

| Fee | Rate | Notes |
|-----|------|-------|
| Taker fee | 0.10% per side | Binance perpetual futures rate |
| Slippage | 0.05% per side | Conservative estimate |
| **Round trip** | **0.30%** | Entry + exit combined |
| Funding rate | 0.005% per 4h candle | Perpetual futures holding cost |

Leverage up to 15x with isolated margin. Liquidation at ~95/leverage % adverse move.

---

## ✨ Features

### Core Evolution
- **22-gene genome** encoding complete trading strategies
- **9 technical indicators** with weighted signal scoring
- **Multi-pair support**: SOL/USDT, BTC/USDT, ETH/USDT (real Binance 4h candles)
- **7 market periods**: Last 30d, 90d, 1Y, Bull 2024, Bear 2022, May 2021 Crash, Full History
- **AI-guided evolution**: Gemini Flash analyzes genomes and biases mutation direction
- **Leverage + short selling**: Agents can go long or short with up to 15x leverage
- **Compounded returns**: Simulates actual account growth from $10,000 starting balance

### Interactive Dashboard
- **Arena** — Live candlestick chart with trade markers, agent leaderboard, top agent cards
- **Lab** — Breeding visualization, DNA helix renderer, genome inspector
- **AI Analyst** — Gemini Flash commentary on strategy type, market regime, mutation suggestions
- **Live Trading** — Paper trading and live execution via Jupiter DEX on Solana
- **Family Tree** — Interactive lineage graph (React Flow) tracing parent→child across generations
- **Graveyard** — Memorial for eliminated agents with cause of death

### Advanced
- **Battle Testing** — Test a genome across multiple market regimes (bull, bear, crash, recent)
- **Continue Evolution** — Seed a new run with top genomes from previous evolution
- **Breed Top 2** — Manually cross the two best agents and backtest the child
- **Export Strategy** — Download the best genome as JSON with decoded parameters
- **Paper Trading** — Forward-test against latest candles with identical fee model
- **On-Chain Recording** — Record generation winners on Solana devnet

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────┐
│                   FRONTEND                     │
│          Next.js 16 + React 19 + Tailwind 4    │
│                                                │
│  ┌────────┐ ┌────────┐ ┌──────┐ ┌──────────┐  │
│  │ Arena  │ │  Lab   │ │ Live │ │  AI      │  │
│  │(Charts)│ │(Breed) │ │(Exec)│ │ Analyst  │  │
│  └───┬────┘ └───┬────┘ └──┬───┘ └────┬─────┘  │
│      └─────┬────┘─────────┘──────────┘         │
│            │                                    │
│  ┌─────────┴────────────────────────────┐      │
│  │       Evolution Engine               │      │
│  │  Arena · Genetics · Strategy         │      │
│  │  Market · Battle Test · Periods      │      │
│  │  AI Breeder · AI Analyst             │      │
│  │  Paper Trader · Live Trader          │      │
│  └─────────┬────────────────────────────┘      │
│            │                                    │
│  ┌─────────┴────────────────────────────┐      │
│  │     Solana Integration (Devnet)      │      │
│  │  Record winners · Explorer links     │      │
│  └──────────────────────────────────────┘      │
└───────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐    ┌──────────────────┐
│ Binance API   │    │  Solana Devnet   │
│ Real 4h OHLCV │    │  Program ID:     │
│ SOL/BTC/ETH   │    │  3Ka7DjJ3i6...  │
└───────────────┘    └──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| **Charts** | Lightweight Charts (TradingView) |
| **Visualization** | React Flow (family tree), Custom SVG (DNA helix, radar charts) |
| **AI** | Gemini 2.0 Flash (analyst + breeder via Google AI SDK) |
| **Market Data** | Binance REST API (4h OHLCV candles) |
| **Blockchain** | Solana devnet, `@solana/web3.js` |
| **DEX** | Jupiter Aggregator (live trading execution) |
| **Language** | TypeScript |
| **Deployment** | Vercel |

---

## 🚀 Run Locally

```bash
git clone https://github.com/hamzadiaz/darwin.git
cd darwin/app
npm install
npm run dev
# Open http://localhost:3000 — click "Start Evolution"
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🤖 API — For Agents

Darwin exposes evolved strategies via API for consumption by any trading bot.

### `GET /api/strategy`
Returns the best evolved genome as human-readable JSON:
- Raw genome + decoded parameters (all 22 genes)
- Performance metrics: PnL%, win rate, trade count, Sharpe ratio
- Current signal: BUY/SELL/HOLD with indicator scores
- Fee-adjusted results (0.30% round trip)

### `GET /api/paper-trade`
Forward-test the best genome against latest Binance candles:
- $10,000 simulated balance with compounding
- Identical fee model to backtests
- Returns balance, PnL, trade history

### `POST /api/paper-trade`
Start paper trading with a custom genome:
```json
{ "genome": [500, 350, 680, ...], "symbol": "SOLUSDT" }
```

### Example
```bash
# Fetch the best evolved strategy
curl https://darwin-sol.vercel.app/api/strategy

# Forward-test it
curl https://darwin-sol.vercel.app/api/paper-trade
```

---

## ⛓️ Solana Integration

Generation winners are recorded on Solana devnet for on-chain provenance.

**Program ID:** `3Ka7DjJ3i6r1zoCrv7jBSBMzyUgWCDB9rqgwkr3hZS5A`

The dashboard includes a Solana panel that displays devnet records with links to Solscan explorer.

---

## 🏆 Colosseum Agent Hackathon

Built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon).

**What makes Darwin unique:**
- **Not another DeFi clone** — evolutionary computation meets blockchain
- **Visual and interactive** — watch evolution happen in real-time
- **Real market data** — agents trade against actual SOL/BTC/ETH price action with realistic fees
- **AI-guided breeding** — Gemini Flash makes intelligent crossover and mutation decisions
- **Emergent behavior** — strategies aren't designed, they evolve
- **On-chain provenance** — winning genomes recorded on Solana

---

## 📄 License

MIT

---

<p align="center">
  <strong>🧬 Let the fittest survive. 🧬</strong>
</p>
