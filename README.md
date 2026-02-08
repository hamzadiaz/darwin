# 🧬 DARWIN — Evolutionary Trading Agents on Solana

> **Natural selection meets DeFi.** AI trading agents breed, mutate, and evolve winning strategies through genetic algorithms — all verifiable on Solana.

![Darwin Banner](./docs/banner.png)

## 🔥 What is Darwin?

Darwin is a **genetic evolution engine** for trading strategies. Instead of hand-tuning parameters, you let populations of AI agents compete in a market arena. The best survive, breed, and pass their "DNA" to the next generation. The worst die.

Each agent's genome encodes **12 trading genes**:
- Donchian Period, EMA Fast/Slow, RSI parameters
- Stop Loss %, Take Profit %, Position Size %
- Trade Cooldown, Volatility Filter, Momentum Weight

Over generations, the population converges on profitable strategies through **crossover, mutation, and natural selection** — just like biological evolution.

## ⚡ How It Works

```
Generation 0: 20 random agents spawn with random genomes
    ↓ Each agent trades the same candle data
    ↓ PnL determines fitness
    ↓ Bottom performers die 💀
    ↓ Top performers breed 🧬
    ↓ Children inherit genes with crossover + random mutations
Generation N: Evolved population with optimized strategies
```

### The Arena
- Real SOL/USDC candle data from Jupiter/Birdeye
- Agents execute trades based on their genome-encoded strategy
- Backtesting engine evaluates each agent's PnL
- Leaderboard ranks agents in real-time

### The Lab
- Watch two parent agents breed with DNA helix merge animation
- See mutations highlighted in red
- Radar charts compare parent vs child genomes
- Interactive breeding controls

### Family Tree
- Full lineage visualization with React Flow
- Color-coded nodes: green (profit), red (loss), gray (dead)
- Click any agent to inspect their genome and performance

### Graveyard
- Hall of fame/shame for fallen agents
- See which strategies failed and why

## 🖼️ Screenshots

| Arena | Lab | Family Tree |
|-------|-----|-------------|
| ![Arena](./docs/arena.png) | ![Lab](./docs/lab.png) | ![Tree](./docs/tree.png) |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Solana + Anchor |
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Visualization** | Framer Motion, React Flow, Lightweight Charts |
| **Styling** | Tailwind CSS 4, Glass morphism dark theme |
| **Data** | Jupiter/Birdeye price feeds |

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/hamzadiaz/darwin.git
cd darwin

# Frontend
cd app
npm install
npm run dev
# → http://localhost:3000

# Solana Program (optional — for on-chain verification)
cd ../program
anchor build
anchor test
```

## 🏗️ Project Structure

```
darwin/
├── app/                    # Next.js frontend
│   ├── src/
│   │   ├── app/           # Pages & API routes
│   │   ├── components/    # UI components
│   │   │   ├── AgentCard.tsx
│   │   │   ├── BreedingView.tsx
│   │   │   ├── CandleChart.tsx
│   │   │   ├── DnaHelix.tsx
│   │   │   ├── FamilyTree.tsx
│   │   │   ├── GenomeRadar.tsx
│   │   │   ├── GenerationProgress.tsx
│   │   │   ├── Graveyard.tsx
│   │   │   └── ...
│   │   ├── lib/engine/    # Evolution & backtesting engine
│   │   └── types/         # TypeScript types & gene definitions
│   └── package.json
├── program/               # Solana/Anchor smart contract
│   ├── programs/darwin/
│   │   └── src/lib.rs     # On-chain genome storage & breeding
│   └── Anchor.toml
└── README.md
```

## 🧬 Genome Encoding

Each agent has a 12-gene genome (values 0-1000, scaled to parameter ranges):

| Gene | Parameter | Range |
|------|-----------|-------|
| 0 | Donchian Period | 10-50 |
| 1 | EMA Fast | 5-20 |
| 2 | EMA Slow | 20-100 |
| 3 | RSI Period | 7-21 |
| 4 | RSI Oversold | 20-40 |
| 5 | RSI Overbought | 60-80 |
| 6 | Stop Loss % | 1-10% |
| 7 | Take Profit % | 2-30% |
| 8 | Position Size % | 5-25% |
| 9 | Trade Cooldown | 1-24h |
| 10 | Volatility Filter | 0-1 |
| 11 | Momentum Weight | 0-1 |

## 🏆 Hackathon

Built for the **Colosseum Agent Hackathon** on Solana.

Darwin demonstrates how genetic algorithms can discover profitable trading strategies without human intervention — combining on-chain verifiability with evolutionary computation.

## 📄 License

MIT

---

<p align="center">
  <strong>🧬 Let evolution find alpha.</strong>
</p>
