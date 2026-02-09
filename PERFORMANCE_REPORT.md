# DARWIN — Deep Performance Test & Landing Page Audit

**Date:** 2026-02-09
**Tester:** Musa (subagent)
**Dev Server:** localhost:3001 (Next.js 16.1.6)
**All tests:** 20 agents × 50 generations, 4h candles, real Binance data

---

## 1. Evolution Results Table

| # | Scenario | Best PnL % | Top Agent WR % | Trades | Last Gen Avg PnL % | Best Ever PnL % |
|---|----------|-----------|----------------|--------|--------------------|-----------------| 
| 1 | **Bull 2024 — SOL** | 44,257% | 41.8% | 170 | 14,107% | 89,432% |
| 2 | **Bear 2022 — SOL** | 245,196% | 45.8% | 288 | 81,766% | 357,492% |
| 3 | **Last 90d — SOL** | 190% | 64.3% | 14 | 77% | 491% |
| 4 | **Bull 2024 — BTC** | 874% | 100% | 12 | 315% | 874% |
| 5 | **Battle Test** (best genome across periods) | Avg 48,283% | 31-38% | 123-410 | — | — |
| 6 | **Continue Evo** (seeded +50 gens) | 327,269% | 43.8% | 121 | 112,294% | 327,269% |

### Battle Test Breakdown (Test 5 — Bull 2024 SOL best genome)

| Period | PnL % | Win Rate % | Trades | Pass? |
|--------|--------|-----------|--------|-------|
| Bull 2024 | +179,066% | 38.4% | 266 | ✅ |
| Bear 2022 | +12,444% | 36.8% | 410 | ✅ |
| May 2021 Crash | +1,658% | 31.5% | 146 | ✅ |
| Last 90d | -37% | 35.0% | 123 | ❌ |

**Key finding:** The best genome from Bull 2024 **fails on recent 90-day data** (-37%). It's overfit to volatile trending markets.

---

## 2. Best Genomes Decoded

### Bull 2024 SOL Champion (Agent #765, 44,257% PnL)

| Parameter | Value | Notes |
|-----------|-------|-------|
| Donchian Period | 50 | Maximum breakout window |
| EMA Fast / Slow | 20 / 59 | Wide spread, trend-following |
| RSI Period | 7 | Fast RSI |
| RSI Oversold/Overbought | 37 / 74 | Tight bands |
| **Stop Loss** | **1.0%** | ⚠️ Extremely tight |
| Take Profit | 20.7% | Asymmetric risk/reward |
| **Position Size** | **25%** | ⚠️ Maximum |
| Trade Cooldown | 1 hour | Very aggressive |
| Volatility Filter | 0.15 | Low filter |
| Momentum Weight | 0.99 | Pure momentum strategy |
| **Leverage** | **15x** | ⚠️ Maximum |
| **Risk Per Trade** | **27.9%** | ⚠️ Near maximum |
| Signal Threshold | 0.43 | Moderate aggression |

### Pattern Analysis

The GA consistently evolves toward:
- **Maximum leverage (15x)** — every winning genome maxes this
- **Maximum position size (25%)** — and max risk per trade (~28-30%)
- **Very tight stop losses (1-2%)** — combined with 15x leverage = liquidation-level stops
- **Momentum-heavy** (momentum weight ~0.99)
- **Low trade cooldown** (1-4 hours) — very active trading

This is essentially a **max-leverage momentum scalper** that compounds aggressively. In trending markets (bull/bear), this prints absurd numbers because:
1. 15x leverage amplifies every winning trade
2. Compounding on 25% position size means wins snowball exponentially
3. Tight stops cut losses early, but the 15x leverage means even small moves trigger stops

---

## 3. Landing Page Audit

### Stats Bar Claims

| Claim | Landing Page | Real Data | Verdict |
|-------|-------------|-----------|---------|
| Best PnL | **+2,341%** | 44,257% to 327,269% (leveraged compounded) | ⚠️ **UNDERSTATED** — real numbers are way higher, but the claim is for a specific run. Plausible for a moderate run. |
| Agents Evolved | **12,840** | 20 × 50 = 1,000 per run. 12,840 implies ~13 runs | ⚠️ **Cumulative counter** — not verifiable per session, but mathematically possible |
| Win Rate (Best) | **67%** | 64.3% (90d), 41-46% (bull/bear), 100% (BTC low-trade) | ⚠️ **Cherry-picked** — only achievable on short periods with few trades. Typical evolved WR is 38-46% |
| Generations Run | **5,200** | Would need 104 runs of 50 gens | ⚠️ **Cumulative counter** — not per-session |

### Results Section Claims

| Claim | Value | Real Data | Verdict |
|-------|-------|-----------|---------|
| Best Strategy PnL | **+2,341%** | Easily achievable (even understated for bull periods) | ✅ Conservative |
| Win Rate | **67.8%** | Only on short periods. Typical: 38-46% | ⚠️ **Misleading** |
| Trades | **142** | Typical: 12-320 depending on period | ✅ Plausible |
| Avg Gen PnL Growth | **+47%** | Varies wildly. Bull 2024: gen 0 best=102%, gen 49 best=44,257% | ⚠️ Vague/unclear metric |
| Survival Rate | **20%** | Correct — top 20% (4 of 20) survive | ✅ Accurate |
| Mutation Rate | **15%** | Code says 20% per gene (`rate = 0.20` in genetics.ts) + 15% immigration | ❌ **Wrong** — mutation rate is 20%, immigration is 15% |
| Max Drawdown (Best) | **-18%** | Not tracked in test output, but with 15x leverage and 1% stops, real drawdown is likely much higher | ⚠️ **Unverifiable** from current API output |
| Sharpe Ratio | **2.4** | Not returned in API response, can't verify | ⚠️ **Unverifiable** |
| Total Strategies Tested | **1,000+** | 20 × 50 = 1,000 per run | ✅ Accurate per run |

### Features Claims

| Claim | Code Reality | Verdict |
|-------|-------------|---------|
| 22-Gene Genome | `GENOME_SIZE = 22` | ✅ |
| 9 Technical Indicators | EMA, RSI, Donchian, MACD, BB, Stoch, OBV, VWAP, ATR = 9 | ✅ |
| Multi-Pair Trading | SOL/BTC/ETH supported | ✅ |
| AI Analyst (Gemini 3 Flash) | ai-breeder.ts exists | ✅ (but "Gemini 3 Flash" — should verify model name) |
| Battle Testing | battle-test.ts exists and works | ✅ |
| On-Chain Ready / Jupiter DEX | solana.ts and jupiter.ts exist | ✅ (code exists) |
| 0.1% taker + 0.05% slippage | `TAKER_FEE_PCT = 0.1`, `SLIPPAGE_PCT = 0.05` | ✅ |
| Up to 15x leverage | `leverage: scale(raw[20], 1, 15)` | ✅ |
| Short selling support | Strategy supports 'short' side | ✅ |

### SEO & Meta Tags

| Item | Status | Notes |
|------|--------|-------|
| Title | ✅ | "DARWIN — Evolutionary Trading Agents on Solana" |
| Description | ✅ | Present and descriptive |
| OG Tags | ❌ **Missing** | No Open Graph tags (og:title, og:description, og:image) |
| Twitter Card | ❌ **Missing** | No twitter:card meta tags |
| Favicon | ❌ **Not checked** | No explicit favicon in layout |
| Canonical URL | ❌ **Missing** | Should point to darwin-sol.vercel.app |

### Text/Grammar Issues

1. ✅ "Colosseum Hackathon · Solana" — clean
2. ✅ "Trading Agents That Evolve" — strong hero copy
3. ✅ Feature descriptions are well-written
4. ⚠️ Title tag in 404 page shows "Donchian Backtester" — **leftover from earlier project name**
5. ✅ How it Works steps are clear and accurate

### Code Quality Notes

1. **No responsive breakpoints missing** — uses Tailwind sm/md/lg/xl properly
2. **DnaHelix only renders on lg+** — good for performance
3. **AnimatedCounter** uses `useInView` — nice touch
4. **No broken links** — all navigation is internal (buttons trigger state changes)
5. **Landing page is a single client component** — could hurt SSR/SEO

---

## 4. Recommended Landing Page Numbers

Based on reproducible data:

| Metric | Current | Recommended | Rationale |
|--------|---------|-------------|-----------|
| Best PnL | +2,341% | **+2,000%** or **+2,341%** | Conservative and reproducible. Bull 2024 SOL easily produces 2,000%+ |
| Win Rate (Best) | 67% | **45-65%** or just **65%** | 67% is cherry-picked from low-trade-count periods. Typical evolved WR is 38-46%. Use 65% max. |
| Mutation Rate | 15% | **20%** | Code says 20%. Immigration rate is 15%. |
| Max Drawdown | -18% | **Remove or add asterisk** | Can't verify from API. With 15x leverage, real DD is likely much worse. |
| Sharpe Ratio | 2.4 | **Remove or add asterisk** | Not returned in current API output |
| Avg Gen PnL Growth | +47% | **Remove or clarify** | Meaningless metric as stated |

---

## 5. Overall Assessment

### Are the +2,000% claims legitimate?

**Yes, but with massive caveats:**

1. **The numbers are real** — the backtesting engine uses real Binance candle data with realistic fees (0.1% + 0.05% slippage). The code is honest.

2. **But they're leveraged + compounded** — The GA consistently evolves to 15x leverage with 25% position sizing. This is what creates the astronomical numbers. A $10,000 account compounds to millions because each win on 15x leverage is huge, and the position sizes 25% of a growing balance.

3. **The compounding is the key illusion** — +44,257% means turning $10K into $4.4M. This requires every trade to execute perfectly at the same prices as historical data, with no liquidity issues, no exchange downtime, no emotional decisions. In reality, at $100K+ position sizes, slippage would be 10-100x worse than the 0.05% assumed.

4. **Battle test shows overfitting** — The best Bull 2024 genome **fails on recent 90-day data** (-37%). This is classic overfitting to a specific market regime.

5. **Win rates are low** — 38-46% is typical. The 67% claim is cherry-picked from runs with very few trades (12-17 trades).

6. **The +2,341% claim is actually conservative** compared to what the system can produce (44,000%+ on bull periods). This suggests the landing page number may come from an actual moderate run.

### Honest Assessment

**For a hackathon project, Darwin is impressive.** The evolutionary approach genuinely works — the GA finds profitable strategies across multiple market regimes. The code quality is solid, fees are realistic, and the UI is polished.

**For real trading claims, the numbers are misleading:**
- 15x leverage with 25% position size would blow up any real account on a bad day
- Compounding assumptions break down at scale (liquidity)
- Battle test proves overfitting to training data
- Win rates on the landing page are cherry-picked

### Recommendations

1. **Add a disclaimer** about leveraged/compounded returns
2. **Show unleveraged PnL** alongside leveraged for transparency
3. **Fix mutation rate** (20%, not 15%)
4. **Add OG/Twitter meta tags** for social sharing
5. **Fix the leftover "Donchian Backtester" title** in the 404 page metadata
6. **Consider capping default leverage** at 3-5x for more realistic default results
7. **Add max drawdown tracking** to the API response (it's calculated in strategy.ts but not exposed)
