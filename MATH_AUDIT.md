# Darwin Math Audit Report
**Date:** 2026-02-09  
**Auditor:** Musa (subagent)  
**Status:** Complete — 2 bugs fixed, 1 cost added, numbers explained

---

## Executive Summary

The core PnL math (leverage applied once, fees correct, compounding correct) was **not double-counting leverage**. However, two real bugs and one missing cost were found and fixed:

1. **BUG: Missing liquidation check in trade loop** — trades survived past liquidation price and could recover, producing phantom profits
2. **BUG: No intra-candle liquidation detection** — only close prices were checked, missing wick-through-liquidation scenarios  
3. **MISSING COST: Perpetual futures funding rate** — 0.005% per 4h candle on notional, previously not modeled

**After fixes, evolved strategies still produce 5,000-50,000%+ returns on Bull 2024 SOL.** This is NOT a bug — it's the mathematical reality of compounding 15x leveraged positions in a 9x ($21→$194) bull market. See "Why Numbers Are Still High" below.

---

## Bugs Found & Fixed

### Bug 1: Missing Liquidation in Trade Loop
**File:** `src/lib/engine/strategy.ts` (trade loop, ~line 255)  
**Severity:** HIGH — inflated profits  

**What was wrong:**  
The trade loop only checked `stopLossPct` (gene range 1-10%) to exit positions. At 15x leverage, liquidation occurs at ~6.67% adverse move. If `stopLossPct > 6.67%`, the trade would:
- Pass through the liquidation price
- NOT be closed
- Potentially recover and close at a PROFIT

In reality, the trader would be liquidated and lose their entire margin.

The compounding loop had `cappedPnl = Math.max(tradePnl, -posSize)` which capped maximum loss, but it couldn't prevent "zombie trades" that survived past liquidation and turned profitable.

**Example:**  
- Long SOL at $100, 15x leverage → liquidation at ~$93.33
- Candle close at $92 → should be liquidated, BUT stopLoss=8% → no stop at 7%
- Next candle: $115 → trade exits at take profit with +15% profit
- **Reality:** trader was liquidated at $93.33, lost everything
- **Old sim:** trader made +15% profit ← WRONG

**Fix applied:**  
```typescript
// Added before stop loss check:
const liquidationPct = 95 / g.leverage; // ~6.33% at 15x
const worstPrice = position === 'long' ? candles[i].low : candles[i].high;
const worstPnl = /* calc based on worstPrice */;
if (g.leverage > 1 && worstPnl <= -liquidationPct) {
  // Liquidated — lose entire margin
  trades.push({ pnlPct: -liquidationPct, exitReason: 'sl' });
}
```

### Bug 2: No Intra-Candle Price Check
**File:** `src/lib/engine/strategy.ts` (same location)  
**Severity:** MEDIUM  

**What was wrong:**  
Only `closes[i]` was checked for stop loss and liquidation. A 4h candle could wick -10% intrabar (hitting liquidation) but close at -2% (surviving). The sim saw only the close.

**Fix:** Added `worstPnl` calculation using `candles[i].low` (for longs) and `candles[i].high` (for shorts) for liquidation checks.

### Missing Cost: Funding Rate
**File:** `src/lib/engine/strategy.ts` (trade exits)  
**Severity:** LOW-MEDIUM  

**What was missing:**  
Perpetual futures charge funding rates (~0.01% per 8h on notional). Over a 10-candle hold at 15x leverage, this adds ~0.75% cost on margin. Previously not modeled.

**Fix:**  
```typescript
const FUNDING_RATE_PER_CANDLE = 0.005; // 0.005% raw per 4h candle
const fundingCostPct = FUNDING_RATE_PER_CANDLE * holdingCandles;
// Added to all trade exit pnlPct calculations
```

---

## Why Numbers Are Still High (NOT Bugs)

After all fixes, evolution on Bull 2024 SOL still produces 5,000-56,000% returns. Here's why this is mathematically correct:

### The Power of Compounding Leveraged Positions

**Setup:** 15x leverage, 25% position size, 30% take profit, 58% win rate

**Per winning trade:**
- Raw pnlPct ≈ 30% - 0.3% fees - 0.03% funding ≈ 29.67%  
- Leveraged PnL = 25% × 15 × 29.67% = **111% of balance**
- Balance multiplier: **2.11x per win**

**Per losing trade (liquidation):**
- Loss = margin = 25% of balance  
- Balance multiplier: **0.75x per loss**

**50 trades, 58% WR = 29 wins, 21 losses:**
- Combined multiplier ≈ 2.11^29 × 0.75^21 ≈ 2.7B × 0.003 ≈ 8M
- Actual result lower due to ordering effects and drawdowns

**Comparison:** SOL itself went 9.2x ($21→$194). A simple 100% long at 15x = 13,700% (if it didn't get liquidated on the way). An active strategy doing better by avoiding drawdowns is plausible.

### Why This Is Unrealistic in Practice
1. **In-sample overfitting** — strategy is evolved FOR this exact period
2. **No slippage scaling** — real slippage increases with position size
3. **Exchange limits** — can't maintain 15x on growing positions
4. **Market impact** — large trades move price against you
5. **Funding variability** — funding rates spike in bull markets (0.1%+ per 8h)
6. **Emotional factors** — no human holds through 65% drawdowns

---

## Files Audited

| File | Issues Found |
|------|-------------|
| `strategy.ts` | 2 bugs + 1 missing cost (FIXED) |
| `arena.ts` | Clean — PnL stored as bps, converted correctly |
| `genetics.ts` | Clean — tournament selection, crossover, mutation all correct |
| `battle-test.ts` | Clean — averages across periods correctly |
| `paper-trader.ts` | Updated to match strategy.ts changes |
| `periods.ts` | Clean — date ranges correct |
| `market.ts` | Clean — Binance data fetched/deduped correctly |
| `types/index.ts` | Clean — genome decoding ranges reasonable |

## Math Verification (Manual Trace)

**Trade: Long SOL $100 → $110, 15x leverage, 25% position, $10,000 balance**

| Step | Value |
|------|-------|
| Position size (margin) | $2,500 (25% of $10k) |
| Notional (leveraged) | $37,500 (15 × $2,500) |
| Price change | +10% |
| Raw pnlPct | +10% - 0.3% fees - 0.005% funding = 9.695% |
| Leveraged PnL | $2,500 × 15 × 9.695% = $3,635 |
| New balance | $13,635 (+36.35%) |
| Sanity check | $37,500 notional × 10% = $3,750 gross; minus $112.50 fees, minus $1.88 funding = $3,636 ✓ |

---

## Recommendations

1. **Add "Overfitting Warning" in UI** — any single-period result over 1000% should show a caveat
2. **Battle Test is the real metric** — cross-period performance is what matters
3. **Consider capping leverage at 10x** — 15x produces extreme results that mislead users
4. **Consider capping position size at 15%** — 25% at high leverage is unrealistic
5. **Add variable funding rates** — higher in bull markets, negative in bear (would make results more realistic)

---

## Before/After Summary

| Metric | Before Fixes | After Fixes |
|--------|-------------|-------------|
| Liquidation check | Only in compounding (cap) | In trade loop + intra-candle |
| Zombie trades | Possible (survive past liquidation) | Impossible |
| Funding costs | None | 0.005% per candle per side |
| Typical best PnL (50 gen Bull 2024) | 44,000-245,000% | 5,000-56,000% |
| Math correctness | Leverage NOT double-applied | Same + liquidation + funding |
