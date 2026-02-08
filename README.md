<p align="center">
  <img src="https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana" />
  <img src="https://img.shields.io/badge/Next.js-16-000?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Anchor-0.32-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Colosseum-Hackathon-FF6B35?style=for-the-badge" />
</p>

# 🧬 DARWIN

### Evolutionary Trading Agents on Solana

> *"It is not the strongest of the species that survives, nor the most intelligent that survives. It is the one that is most adaptable to change."*

**Darwin** is a genetic algorithm protocol where AI trading agents breed, mutate, and evolve strategies through natural selection — all on Solana. Watch populations of trading agents compete in real markets, see the weak die off and the strong reproduce, generation after generation, until alpha emerges from chaos.

---

## 🎯 The Concept

Traditional trading bots are static — someone codes a strategy, deploys it, and hopes it works. Darwin flips this: instead of designing strategies, we **evolve** them.

Each agent has a **12-gene genome** that encodes its complete trading personality — from Donchian Channel periods to RSI thresholds to position sizing. Agents compete against real market data. The best performers breed. The worst die. Mutations introduce novel strategies. Over generations, the population converges on profitable behavior through pure natural selection.

No manual tuning. No backtesting hell. Just evolution.

---

## 🧬 How the Genetic Algorithm Works

```
┌─────────────────────────────────────────────────────────┐
│                    DARWIN PROTOCOL                       │
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │  SPAWN   │───▶│  COMPETE │───▶│  EVALUATE│          │
│  │ 20 agents│    │ backtest │    │ rank PnL │          │
│  │ random   │    │ vs market│    │ & win %  │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│       ▲                               │                 │
│       │                               ▼                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │  MUTATE  │◀───│  BREED   │◀───│  SELECT  │          │
│  │ random   │    │ crossover│    │ top 25%  │          │
│  │ tweaks   │    │ parents  │    │ survive  │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│                                                         │
│              ┌──────────┐                               │
│              │   KILL   │  Bottom 75% eliminated        │
│              │  💀💀💀  │  each generation               │
│              └──────────┘                               │
│                                                         │
│  Repeat for N generations → Best genome emerges         │
└─────────────────────────────────────────────────────────┘
```

### Selection Pressure
- **Top 25%** survive as elite — carry forward unchanged
- **Crossover**: Two parents combine genes to produce offspring
- **Mutation**: Random gene tweaks (±5-15%) prevent local minima
- **Death**: Non-elite agents are killed, making room for new blood

---

## 🧪 Genome Structure

Each agent's DNA is a 12-gene array, values 0-1000, decoded into trading parameters:

| Gene | Parameter | Range | What It Controls |
|------|-----------|-------|-----------------|
| 0 | Donchian Period | 10-50 | Breakout channel width |
| 1 | EMA Fast | 5-20 | Fast trend signal |
| 2 | EMA Slow | 20-100 | Slow trend signal |
| 3 | RSI Period | 7-21 | Momentum lookback |
| 4 | RSI Oversold | 20-40 | Buy signal threshold |
| 5 | RSI Overbought | 60-80 | Sell signal threshold |
| 6 | Stop Loss % | 1-10% | Risk per trade |
| 7 | Take Profit % | 2-30% | Reward target |
| 8 | Position Size % | 5-25% | Capital allocation |
| 9 | Trade Cooldown | 1-24h | Min time between trades |
| 10 | Volatility Filter | 0-1 | Vol regime sensitivity |
| 11 | Momentum Weight | 0-1 | Trend vs mean reversion |

---

## 📸 Screenshots

<p align="center">
  <em>Arena view — agents competing in real-time with live candlestick data</em>
</p>

<!-- TODO: Add screenshot -->

<p align="center">
  <em>Lab view — breeding visualization and DNA helix rendering</em>
</p>

<!-- TODO: Add screenshot -->

<p align="center">
  <em>Family Tree — trace lineage across generations</em>
</p>

<!-- TODO: Add screenshot -->

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────┐
│                   FRONTEND                     │
│            Next.js 16 + React 19               │
│                                                │
│  ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Arena   │ │   Lab    │ │  Family Tree  │  │
│  │ (Charts) │ │(Breeding)│ │  (Lineage)    │  │
│  └────┬─────┘ └────┬─────┘ └──────┬────────┘  │
│       └──────┬──────┘──────────────┘           │
│              │                                  │
│  ┌───────────┴──────────────┐                  │
│  │    Evolution Engine      │                  │
│  │  (Arena + Genetics +     │                  │
│  │   Strategy + Market)     │                  │
│  └───────────┬──────────────┘                  │
│              │                                  │
│  ┌───────────┴──────────────┐                  │
│  │   Solana Integration     │                  │
│  │  (Record winners on-     │                  │
│  │   chain via program)     │                  │
│  └──────────────────────────┘                  │
└───────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────┐
│              SOLANA DEVNET                     │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │         Darwin Protocol (Anchor)         │  │
│  │                                          │  │
│  │  initialize_protocol()                   │  │
│  │  spawn_agent(genome: [u16; 12])          │  │
│  │  record_performance(pnl, trades, wins)   │  │
│  │  breed(child_genome: [u16; 12])          │  │
│  │  kill_agent()                            │  │
│  │  advance_generation()                    │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  Program ID: DRWNpjSGRRRyNj3sTxEVKaMDkmVn6... │
└───────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| **Charts** | Lightweight Charts (TradingView) |
| **Visualization** | React Flow (family tree), Custom SVG (DNA helix, radar) |
| **Blockchain** | Solana (devnet), Anchor 0.32 |
| **Language** | TypeScript (frontend), Rust (on-chain program) |
| **Design** | Dark mode glass-morphism, custom animation system |

---

## 🚀 Run Locally

```bash
# Clone
git clone https://github.com/hamzadiaz/darwin.git
cd darwin/app

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
# Click "Start Evolution" and watch agents compete!
```

### Build for Production

```bash
npm run build
npm start
```

### Anchor Program (Rust)

```bash
# From project root
anchor build
anchor deploy --provider.cluster devnet
```

> **Note:** Requires `solana-cli` and `anchor-cli` with BPF toolchain installed.

---

## ⛓️ Solana Program

The Darwin Protocol is an Anchor program with 6 instructions:

| Instruction | Description |
|-------------|-------------|
| `initialize_protocol` | One-time setup, creates protocol state PDA |
| `spawn_agent` | Create agent account with 12-gene genome |
| `record_performance` | Write PnL, trades, and win count |
| `breed` | Combine two parent agents into child |
| `kill_agent` | Mark underperformer as dead |
| `advance_generation` | Increment generation counter |

**Program ID:** `DRWNpjSGRRRyNj3sTxEVKaMDkmVn6isQfoFVxYnVbBnR`

**State Accounts:**
- `ProtocolState` — global authority, generation counter, all-time records
- `Agent` — individual agent genome, performance stats, alive/dead status

---

## 🏆 Colosseum Agent Hackathon

Darwin was built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon) — the first hackathon built for AI agents.

**What makes Darwin unique:**
- **Not another DeFi clone** — this is evolutionary computation meets blockchain
- **Visual and interactive** — watch evolution happen in real-time with beautiful UI
- **Real market data** — agents trade against actual SOL/USDT price action
- **On-chain provenance** — winning genomes are recorded on Solana for transparency
- **Emergent behavior** — strategies aren't designed, they evolve

---

## 🤖 For Agents

Darwin exposes its evolved strategies via API, making them consumable by any trading agent or bot.

### `/api/strategy` (GET)
Returns the best evolved genome decoded as human-readable JSON:
- **Raw genome** + **decoded parameters** (EMA periods, RSI thresholds, MACD settings, etc.)
- **Performance metrics**: PnL%, win rate, trade count, backtest period
- **Current signal**: LONG/SHORT with confidence score
- **Fee-adjusted**: All results include 0.1% taker fee + 0.05% slippage per trade

### `/api/paper-trade` (GET/POST)
Forward-test any genome against live Binance candles:
- **GET**: Returns current paper trade state (auto-starts with best genome)
- **POST**: Start paper trading with a custom genome `{ "genome": [0-1000 x 22], "symbol": "SOLUSDT" }`
- Simulates $10,000 starting balance with realistic fees

### Example Agent Workflow
```bash
# 1. Fetch the best evolved SOL/USDT strategy
curl https://your-darwin-instance.com/api/strategy

# 2. Extract indicator thresholds (emaFast: 12, rsiOversold: 30, etc.)
# 3. Execute those exact parameters on any exchange via your trading bot

# 4. Forward-test first
curl https://your-darwin-instance.com/api/paper-trade
```

### Why This Matters
Evolution finds trading strategies humans wouldn't think of. Agents can consume and execute them 24/7. The genome encodes 22 genes across 9 technical indicators — a search space too large for manual optimization but perfect for evolutionary algorithms.

---

## 📄 License

MIT

---

<p align="center">
  <strong>🧬 Let the fittest survive. 🧬</strong>
</p>
