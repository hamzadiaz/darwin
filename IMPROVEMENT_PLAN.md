# 🧬 DARWIN — Improvement Plan v2
> From "genetic algorithm demo" → "AI-powered evolutionary trading agents on Solana"

## Current Problems
1. **Too few trades** — Agents make 1-2 trades (should be 10-30)
2. **Fake volume data** — CoinGecko gives no volume, we synthesize it
3. **Only 4 indicators** — EMA, RSI, ATR, Donchian. Need 8-10+
4. **Not really "AI"** — It's evolutionary computation, not agentic
5. **No wallet connect** — Hackathon judges want Solana integration
6. **Landing page is basic** — Needs animated feature showcase
7. **No short positions** — Long-only limits strategy space
8. **Signal engine too conservative** — Thresholds too high

---

## Phase A: Data & Engine Overhaul (HIGHEST PRIORITY)

### A1. Binance API for Real OHLCV Data
- **Endpoint:** `https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=4h&limit=500`
- Real volume, real OHLCV, no API key needed
- 500 candles = ~83 days of 4h data (plenty for backtesting)
- Same source as Donchian project
- **File:** `src/lib/engine/market.ts`

### A2. Expanded Indicator Suite (8-10 indicators)
Current: EMA, RSI, ATR, Donchian (4)
**Add:**
| Indicator | Genome Genes | Signal Type |
|-----------|-------------|-------------|
| MACD | `macd_fast`, `macd_slow`, `macd_signal` | Momentum crossover |
| Bollinger Bands | `bb_period`, `bb_std_dev` | Mean reversion / breakout |
| Stochastic | `stoch_k`, `stoch_d` | Overbought/oversold |
| OBV (On-Balance Volume) | `obv_ema_period` | Volume confirmation |
| VWAP | (derived from price+vol) | Fair value |
| ADX | `adx_period` | Trend strength filter |
| Ichimoku Cloud | `ichimoku_tenkan`, `ichimoku_kijun` | Multi-timeframe trend |

**File:** `src/lib/engine/strategy.ts`

### A3. Expanded Genome (20+ genes)
```typescript
interface ExpandedGenome {
  // Trend (existing)
  donchian_period: number;      // 10-50
  ema_fast: number;             // 5-20
  ema_slow: number;             // 20-100
  
  // Momentum (existing)
  rsi_period: number;           // 7-21
  rsi_oversold: number;         // 20-40
  rsi_overbought: number;       // 60-80
  
  // MACD (new)
  macd_fast: number;            // 8-16
  macd_slow: number;            // 20-30
  macd_signal: number;          // 7-12
  
  // Bollinger Bands (new)
  bb_period: number;            // 10-30
  bb_std_dev: number;           // 1.5-3.0
  
  // Stochastic (new)
  stoch_k: number;              // 5-21
  stoch_d: number;              // 3-7
  
  // Volume (new)
  obv_ema_period: number;       // 10-30
  
  // Trend Strength (new)
  adx_period: number;           // 10-30
  adx_threshold: number;        // 15-35 (min ADX to trade)
  
  // Risk Management (existing, enhanced)
  stop_loss_pct: number;        // 1-10%
  take_profit_pct: number;      // 2-30%
  position_size_pct: number;    // 5-25%
  
  // Trading Behavior (enhanced)
  trade_cooldown: number;       // 1-24 hours
  aggressiveness: number;       // 0-1 (signal threshold)
  momentum_weight: number;      // 0-1 (momentum vs mean reversion)
  allow_shorts: boolean;        // gene > 500 = true
  
  // Meta
  volatility_filter: number;    // 0-1 (skip low-vol periods)
}
```
**~24 genes** = massive strategy space for evolution to explore.

**Files:** `src/types/index.ts`, `src/lib/engine/genetics.ts`

### A4. Signal Engine Rewrite
- Each indicator produces a score from -1 (strong sell) to +1 (strong buy)
- Scores are weighted by `momentum_weight` and `aggressiveness`
- Combined score vs `aggressiveness` threshold = trade decision
- **Support both LONG and SHORT positions**
- Target: **15-40 trades per 500-candle window**
- **File:** `src/lib/engine/strategy.ts`

### A5. Fitness Function Upgrade
Current: raw PnL only
**New multi-objective fitness:**
```
fitness = (PnL * 0.4) + (Sharpe * 0.3) + (WinRate * 0.2) + (TradeCount_penalty * 0.1)
```
- Penalize agents with < 5 trades (cowards)
- Reward consistency (Sharpe ratio) not just raw returns
- **File:** `src/lib/engine/arena.ts`

---

## Phase B: AI Agent Layer

### B1. Strategy Analyst (Gemini Flash)
- After each generation, AI analyzes the top genome
- Explains what strategy emerged in plain English
- Compares to known strategies (Turtle Trading, Bollinger Squeeze, etc.)
- Suggests potential improvements
- **Files:** `src/lib/engine/analyst.ts`, `src/app/api/analyze/route.ts`

### B2. AI Mutation Advisor
- Before breeding, AI looks at market conditions
- Suggests which genes to bias mutations toward
- "Market is trending → increase momentum_weight mutations"
- Makes the evolution "intelligent" not random

### B3. Market Commentary
- AI generates a brief market analysis from the candle data
- "SOL has been in a descending channel with support at $180..."
- Shown in a "Market Intel" panel

### B4. Agent Personality
- Each agent gets an AI-generated name and personality based on its genome
- Aggressive high-frequency genome → "The Shark"
- Conservative trend-following → "The Turtle"
- Shown on agent cards

---

## Phase C: Solana Integration

### C1. Wallet Connect
- `@solana/wallet-adapter-react` + Phantom/Solflare
- Connect button in header
- Show connected address
- **File:** `src/components/WalletProvider.tsx`, `src/components/Header.tsx`

### C2. On-Chain Agent Registry (Devnet)
- Deploy Anchor program to devnet
- "Mint Agent" button: writes best agent's genome as a PDA
- Show Solscan links for minted agents
- Generation history recorded on-chain

### C3. Agent NFT (Stretch)
- Mint top agents as NFTs with genome metadata
- Visual: radar chart as NFT image
- Tradeable on marketplaces

---

## Phase D: Landing Page & Polish

### D1. Animated Landing Page
- Hero: "🧬 Trading Agents That Evolve" with DNA animation
- How It Works: 4-step animated flow
  1. Spawn → 20 agents with random DNA
  2. Compete → Real market backtesting
  3. Evolve → Winners breed, losers die
  4. Emerge → Strategies nobody programmed
- Feature cards (animated on scroll):
  - "20+ Trading Indicators" with indicator icons
  - "Genetic Algorithm Evolution" with DNA helix
  - "Real SOL/USDC Market Data" with candle chart
  - "AI Strategy Analysis" with brain icon
  - "On-Chain Genome Registry" with Solana logo
  - "Live Family Tree" with tree visualization
- Live demo preview: embedded evolution running
- Tech stack badges
- Hackathon badge

### D2. Dashboard Polish
- Animated tab transitions (already done)
- Loading skeletons for data
- Tooltips explaining each metric
- Agent comparison mode (side-by-side radar charts)
- Export results as JSON

### D3. Mobile Optimization
- Responsive grid layouts
- Touch-friendly controls
- Simplified views on small screens

---

## Phase E: Demo & Submission

### E1. Run 50+ Generations
- Let evolution run on real Binance data
- Record results showing strategy improvement
- Best agent should show clear edge over random

### E2. Demo Video (≤3 min)
- Screen recording of full evolution run
- Highlight: "Watch random noise evolve into a profitable strategy"
- Show family tree growing
- Show AI analysis explaining the evolved strategy
- Show wallet connect + on-chain minting

### E3. Hackathon Submission
- Update project description on Colosseum
- Include: demo video link, live app URL, GitHub repo
- Forum post with results
- Submit for judging

---

## Priority Order (by impact on hackathon score)

| Priority | Phase | Impact | Effort |
|----------|-------|--------|--------|
| 🔴 P0 | A1-A4: Engine overhaul | Core product must work | High |
| 🔴 P0 | D1: Landing page | First impression | Medium |
| 🟡 P1 | B1: AI Analyst | "Agentic" differentiator | Medium |
| 🟡 P1 | C1: Wallet Connect | Solana requirement | Low |
| 🟢 P2 | A5: Fitness upgrade | Better evolution | Low |
| 🟢 P2 | B4: Agent personality | Fun factor | Low |
| 🔵 P3 | C2: On-chain registry | Bonus points | Medium |
| 🔵 P3 | E2: Demo video | Submission quality | Medium |
| ⚪ P4 | B2-B3: AI extras | Nice to have | Medium |
| ⚪ P4 | C3: Agent NFT | Stretch goal | High |

---

## Timeline (Feb 8-12)

**Feb 8 (Today):** Phase A (engine overhaul) — already in progress
**Feb 9:** Phase B1 (AI analyst) + Phase C1 (wallet connect) + Phase D1 (landing page)
**Feb 10:** Testing, bug fixes, run 50+ generations
**Feb 11:** Phase E (demo video, submission prep)
**Feb 12:** Final submit before deadline

---

*All code written autonomously by AI agents. Let's evolve. 🧬*
