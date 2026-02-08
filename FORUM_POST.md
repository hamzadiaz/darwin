# Darwin — Evolutionary Trading Agents on Solana 🧬

## What is Darwin?

Darwin is a genetic algorithm protocol where trading agents breed, mutate, and evolve through natural selection. Each agent has a 12-gene genome that controls its entire trading strategy — from technical indicators to risk management. Agents compete against real market data, the best survive and reproduce, and the worst get eliminated.

## How It Works

1. **Spawn** — 20 random agents with unique genomes
2. **Compete** — Each agent backtests its strategy against real SOL/USDT candles
3. **Select** — Top 25% survive as elite
4. **Breed** — Parents crossover genes to produce offspring
5. **Mutate** — Random tweaks prevent local minima
6. **Kill** — Bottom 75% eliminated. Repeat.

After 15 generations, the population converges on profitable strategies that nobody designed — they evolved.

## What Makes It Unique

- **Not another DeFi fork** — this is evolutionary computation on-chain
- **Beautiful real-time UI** — watch evolution happen with live charts, DNA helixes, family trees, and a graveyard for dead agents
- **Real data** — agents trade against actual market price action, not synthetic data
- **On-chain provenance** — winning genomes recorded on Solana devnet via Anchor program

## Tech Stack

Next.js 16 + React 19 + Tailwind 4 + Framer Motion for the frontend. Anchor (Rust) for the Solana program. TradingView Lightweight Charts for candle rendering. Everything dark mode with glass-morphism design.

## Current Status

✅ Full evolution engine (arena, genetics, strategy, market data)
✅ Interactive dashboard with 4 tabs (Arena, Lab, Family Tree, Graveyard)
✅ Anchor program written and tested
✅ Solana integration for recording winners on-chain
✅ Deployed to Vercel

Check it out and let me know what you think! 🧬
