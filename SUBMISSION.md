# Darwin — Submission

## Project Description

Darwin is a genetic algorithm protocol where AI trading agents evolve strategies through natural selection on Solana. Instead of manually designing trading strategies, Darwin spawns populations of agents — each with a unique 22-gene genome encoding 9 technical indicators (EMA, RSI, MACD, Bollinger Bands, Stochastic, Donchian, OBV, VWAP), stop-loss/take-profit levels, leverage, and position sizing. These agents compete against real SOL/USDT market data, and after each generation, the top performers breed while the bottom 75% are eliminated. Mutations introduce novelty. Over multiple generations, profitable strategies emerge organically from chaos.

The frontend is a real-time evolution dashboard built with Next.js 16 and React 19, featuring live candlestick charts (TradingView Lightweight Charts), agent leaderboards, DNA helix visualizations, family trees showing agent lineage, and a graveyard for fallen agents — all in a dark glass-morphism UI. Users click "Start Evolution" and watch 20 agents compete across 15 generations in seconds. The on-chain Anchor program (Rust) provides permanent records of winning genomes on Solana devnet, creating transparent provenance for evolved strategies.

Darwin demonstrates that evolutionary computation is a natural fit for blockchain: genomes are compact on-chain data, selection pressure mirrors DeFi competition, and immutable records preserve the lineage of successful strategies. It's not another DeFi protocol — it's a living laboratory where alpha evolves itself.

## Links

- **GitHub:** https://github.com/hamzadiaz/darwin
- **Program ID:** 3Ka7DjJ3i6r1zoCrv7jBSBMzyUgWCDB9rqgwkr3hZS5A
