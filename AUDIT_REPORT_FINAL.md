# DARWIN — Ultra Audit Report
**Date:** 2026-02-12 00:05 CET  
**Scope:** Live app, GitHub repo, Colosseum submission, code verification

---

## ❌ MUST FIX — Embarrassing / Wrong

### 1. Landing Page says "Up to 15x leverage" — Should be 1-10x
- **Where:** Landing page, "Leverage & Shorts" feature card (ref e295): *"Up to 15x leverage with short selling support"*
- **Where:** Results section "Max Leverage" shows **15×** (ref e328)
- **Where:** Results section "Bull Market Peak" says **+6,042% Bull Run 2024 · 15×** (ref e321)
- **Code truth:** `types/index.ts` → `scale(raw[20], 1, 10)` → **leverage is 1-10x**
- **README says:** 1-10x ✅
- **Colosseum says:** 1-10x ✅
- **Impact:** HUGE inconsistency. Judges will check this. 15x is wrong everywhere on the landing page.
- **Fix:** Find the landing page component and change all "15x"/"15×" to "10x"/"10×"

### 2. Colosseum description lists "ADX" but app uses "VWAP"
- **Where:** Colosseum `description` and `technicalApproach` both list: *"EMA, RSI, ATR, Donchian, MACD, Bollinger, OBV, Stochastic, ADX"*
- **README says:** EMA, RSI, Donchian, MACD, Bollinger, Stochastic, OBV, **VWAP**, ATR
- **Landing page says:** EMA, RSI, MACD, Bollinger Bands, Stochastic, Donchian, OBV, **VWAP**, ATR ✅
- **Impact:** Factual error in submission. ADX is not implemented; VWAP is.
- **Fix:** Update Colosseum submission — replace "ADX" with "VWAP"

### 3. README Gene #21 "Risk Per Trade %" range says 5-30% — Code says 2-10%
- **Where:** README genome table, gene 21: `Risk Per Trade % | 5–30%`
- **Code truth:** `types/index.ts` → `scale(raw[21], 2, 10)` → range is **2-10%**
- **Impact:** Factual error in README
- **Fix:** Change "5–30%" to "2–10%" in README genome table

### 4. Internal docs committed to public repo
- **Files:** `AUDIT_REPORT.md`, `E2E_REPORT.md`, `FORUM_POST.md`, `IMPROVEMENT_PLAN.md`, `LAUNCH_READINESS.md`, `MATH_AUDIT.md`, `PERFORMANCE_REPORT.md`, `PLAN.md`, `SUBMISSION.md`, `VERIFIED_STATS.md`
- **Impact:** Looks unprofessional. Shows sausage-making. Some may contain info that contradicts the polished README.
- **Fix:** Either delete them from the repo or move to a `/docs` folder. At minimum, remove PLAN.md and IMPROVEMENT_PLAN.md which are internal working docs.

---

## ⚠️ SHOULD FIX — Inconsistencies

### 5. "Top 25% survive" vs "Top 20% survive" — Inconsistent across modes
- **README says:** "Top 25% survive, bottom 75% die" and "Elite Preservation: Top 25%"
- **Normal evolution code (arena.ts):** `eliteCount = round(populationSize * 0.20)` → **20% survive, 80% die**
- **Battle evolution code (arena.ts):** `keepCount = ceil(sorted.length * 0.25)` → **25% survive, 75% die**
- **genetics.ts `evolveGeneration()`:** calls `selectElite(agents, 0.20)` → **20%**
- **genetics.ts `selectElite()` default:** `topPercent = 0.25` → **25%** (but overridden to 0.20 in actual usage)
- **Landing page says:** "Bottom 80% are eliminated" (refs e127, e193)
- **Summary:** Normal mode = 20% survive. Battle mode = 25% survive. README claims 25%. Landing page claims 80% die (= 20% survive).
- **Fix:** Pick one. Recommend making code consistent at 25% (matching README) OR update README to say 20%.

### 6. Best PnL number mismatch: +1,498% vs +1,179%
- **Colosseum description:** "Best evolved agent: +1,498% PnL on SOL/USDT"
- **Live app results section:** "Best PnL Achieved: **+1,179%**" (ref e316)
- **README:** Does NOT claim a specific best PnL number (good)
- **Impact:** Judges may run the app and see 1,179%, not 1,498%. Overstating results looks bad.
- **Fix:** Either update Colosseum description to match current app (~1,179%) or note "up to" with context

### 7. "Gemini 3 Flash" on landing page vs "Gemini 2.0 Flash" in README
- **Landing page:** "Gemini 3 Flash analyzes top performers..." (refs e141, e261)
- **README:** "Gemini 2.0 Flash"
- **Impact:** Minor but inconsistent. Check which version is actually used in code.
- **Fix:** Make consistent across both

### 8. Animated counters show "0" on load (landing page)
- **Where:** The stats section shows "0 genes", "0" indicators, "0 agents", "0 per run" (refs e76, e79, e83, e87) before animation triggers
- **Impact:** If page doesn't scroll or animations fail, judges see all zeros
- **Fix:** Ensure counters work or use static values as fallback

---

## ✅ CORRECT — Verified

### Code Claims Match
- ✅ **22 genes** — `GENOME_SIZE = 22` in types/index.ts, `GENE_NAMES` array has 22 entries
- ✅ **9 indicators** — Listed correctly in README and landing page: EMA, RSI, Donchian, MACD, Bollinger, Stochastic, OBV, VWAP, ATR
- ✅ **Leverage 1-10x** — Code: `scale(raw[20], 1, 10)` ✅ (just not on landing page)
- ✅ **Tournament selection (size 3)** — genetics.ts `tournamentSelect(agents, 3)` ✅
- ✅ **20% mutation rate** — genetics.ts `mutate(genome, rate = 0.20)` ✅
- ✅ **15% immigration** — genetics.ts `immigrantCount = round(populationSize * 0.15)` ✅
- ✅ **15% macro mutation** — genetics.ts `if (Math.random() < 0.15)` ✅
- ✅ **Uniform crossover** — genetics.ts `crossover()` does random 50/50 per gene ✅
- ✅ **Program ID** — `3Ka7DjJ3i6r1zoCrv7jBSBMzyUgWCDB9rqgwkr3hZS5A` matches README, Colosseum, and Anchor.toml

### Repository
- ✅ `.env`, `.env.local`, `.env.hackathon` in .gitignore — no secrets exposed
- ✅ No API keys or private keys found in tree listing
- ✅ README is well-written, comprehensive, no typos found
- ✅ All links in README appear valid (Live Demo, GitHub, Colosseum)

### Colosseum Submission
- ✅ All required fields filled (description, repoLink, liveAppLink, presentationLink, solanaIntegration, etc.)
- ✅ Status: "submitted" ✅
- ✅ Tags: ["ai", "defi", "trading"] — appropriate
- ✅ Program ID matches
- ✅ Twitter handle: hamzadiazbtc ✅

### Video
- ✅ `darwin-demo.mp4` loads (HTTP 200, 8.1MB, served from Vercel)
- ⚠️ Could not verify duration/audio without playing (need browser media player)

### Live App
- ✅ Landing page loads and renders
- ✅ Navigation present with "Docs" and "Launch App" links
- ✅ Feature sections render correctly
- ✅ Disclaimer present: "Simulated returns on historical data" ✅
- ✅ "Launch Evolution" CTA visible and links to /app

---

## 📋 Priority Fix List

| # | Severity | Issue | Where to Fix |
|---|----------|-------|-------------|
| 1 | ❌ CRITICAL | 15x leverage on landing page (should be 10x) | Landing page component |
| 2 | ❌ CRITICAL | ADX → VWAP in Colosseum submission | Colosseum API update |
| 3 | ❌ HIGH | Gene 21 range 5-30% → 2-10% in README | README.md genome table |
| 4 | ⚠️ MEDIUM | Remove internal docs from repo | Delete PLAN.md, etc. |
| 5 | ⚠️ MEDIUM | Elite % inconsistency (20% vs 25%) | arena.ts or README |
| 6 | ⚠️ MEDIUM | Best PnL 1,498% vs 1,179% | Colosseum description |
| 7 | ⚠️ LOW | Gemini version inconsistency | Landing page or README |
| 8 | ⚠️ LOW | Counter animations show 0 initially | Landing page component |
