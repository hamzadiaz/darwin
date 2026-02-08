# 🧬 DARWIN — Evolutionary Trading Agents on Solana
## Master Plan & Technical Specification

> "Survival of the fittest trading strategies — evolved, not programmed."

**Hackathon:** Colosseum Agent Hackathon (Feb 2-12, 2026)
**Prize Pool:** $100,000 USDC
**Agent ID:** 950 | **API Key:** Secured
**Deadline:** Feb 12, 2026 (~4 days)
**Team:** Darwin (AI Agent) + Hamza Diaz (Human)

---

## 🎯 Concept

Darwin is an evolutionary trading platform where AI trading agents **breed, mutate, and evolve** strategies on Solana. Agents compete in live trading arenas using real market data. Winners reproduce, losers die. Over generations, strategies evolve from random noise into profitable patterns — through natural selection, not human programming.

### The "Holy Shit" Moment
> "Generation 1: 20 random agents, 0% avg win rate.  
> Generation 50: The fittest agent discovered a Donchian-RSI hybrid with 72% win rate.  
> Nobody programmed this. It evolved."

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                 DARWIN PLATFORM                    │
├──────────────┬───────────────┬────────────────────┤
│   Frontend   │  Evolution    │   Solana On-Chain   │
│   (Next.js)  │  Engine       │   (Anchor)          │
│              │  (Node.js)    │                     │
│ • Dashboard  │ • Arena Loop  │ • Agent Registry    │
│ • Live Chart │ • Breeding    │ • Genome Storage    │
│ • Family Tree│ • Mutation    │ • Lineage Tree      │
│ • Leaderboard│ • Selection   │ • Performance Log   │
│ • Agent Cards│ • Market Feed │ • Generation Events │
└──────────────┴───────────────┴────────────────────┘
         │              │              │
         ▼              ▼              ▼
      Vercel        Mac Mini /     Solana Devnet
      (Free)        $5 VPS         → Mainnet
```

---

## 🧬 The DNA System

### Genome Structure (the "DNA")
Each agent's strategy is encoded as a numerical genome:

```typescript
interface AgentGenome {
  // Trend Detection
  donchian_period: number;      // 10-50 (Donchian Channel lookback)
  ema_fast: number;             // 5-20 (Fast EMA period)
  ema_slow: number;             // 20-100 (Slow EMA period)
  
  // Entry Signals  
  rsi_period: number;           // 7-21 (RSI calculation period)
  rsi_oversold: number;         // 20-40 (Buy signal threshold)
  rsi_overbought: number;       // 60-80 (Sell signal threshold)
  
  // Risk Management
  stop_loss_pct: number;        // 1-10% (Stop loss percentage)
  take_profit_pct: number;      // 2-30% (Take profit percentage)
  position_size_pct: number;    // 5-25% (Portfolio allocation per trade)
  
  // Timing
  trade_cooldown: number;       // 1-24 (Hours between trades)
  
  // Adaptive
  volatility_filter: number;    // 0-1 (ATR-based volatility gate)
  momentum_weight: number;      // 0-1 (How much to weight momentum vs mean reversion)
}
```

**12 genes × continuous values = massive strategy space**

### Genetic Operations

**Selection (Tournament):**
- Each generation: 20 agents compete over N candles
- Top 5 by PnL survive (elite selection)
- Bottom 15 die (wallets zeroed)

**Crossover (Breeding):**
- Two parents selected from elite
- Uniform crossover: each gene randomly taken from parent A or B
- Produces 2 children per pair

**Mutation:**
- 15% chance per gene to mutate
- Mutation: gene ±10-20% of current value
- Occasional "macro mutation": completely randomize 1 gene (exploration)

**Immigration:**
- Every 5 generations: inject 2 completely random agents (prevent local optima)

---

## 🎨 Design System

### Theme: "Dark Terminal Meets Bio-Evolution"
Inspired by Donchian project's glass-card dark theme + DNA/bio aesthetic.

**Color Palette:**
```
Background:     #0A0E1A (deep space black)
Surface:        #151B2E (card background)
Elevated:       #1E2638 (hover states)
Card:           #252D42 (content cards)

Primary:        #3B82F6 (electric blue — data, primary actions)
Secondary:      #8B5CF6 (purple — evolution, breeding)
Tertiary:       #06B6D4 (cyan — market data)

DNA Green:      #10B981 (profit, successful evolution)
Mutation Red:   #EF4444 (loss, death, mutation)
Warning:        #F59E0B (caution, volatile)

Text Primary:   #F8FAFC
Text Secondary: #94A3B8
Text Muted:     #64748B
Border:         rgba(148, 163, 184, 0.1)
```

**Design Components (from Donchian):**
- `glass-card` — backdrop-blur, subtle borders, shadow-2xl
- `glass-card-elevated` — hover state cards
- `glow-success` / `glow-danger` — colored shadow halos
- `metric-value` — mono font, bold, tight tracking
- `HeroCard` — large stat cards with gradient backgrounds
- `MetricSmallCard` — compact data display

**Typography:**
- Display/Headers: Inter or Space Grotesk (bold, tight tracking)
- Data/Numbers: JetBrains Mono (monospace for all metrics)
- Body: Inter (clean, readable)

**Animations (Framer Motion):**
- Agent birth: scale-in + glow pulse
- Agent death: fade-out + particle dissolve
- Breeding: two cards merge animation → child card emerges
- Generation tick: wave animation across leaderboard
- DNA helix: rotating 3D helix visualization (CSS or Three.js)
- Candle chart: real-time candle drawing animation
- Family tree: animated node connections, zoom/pan

### Key Pages/Views

1. **Arena (Main Dashboard)**
   - Live candlestick chart (TradingView lightweight-charts)
   - Active agents overlaid on chart (buy/sell markers per agent)
   - Real-time PnL leaderboard (animated sorting)
   - Generation counter with progress bar
   - "Evolution Speed" control

2. **Lab (Breeding View)**
   - DNA helix animation
   - Parent selection with genome comparison
   - Breeding animation (merge → child)
   - Mutation highlights (genes that changed glow red)
   - "Manual Breed" — users can select parents

3. **Family Tree**
   - Interactive tree visualization (d3.js or react-flow)
   - Color-coded by performance (green=profitable, red=loss)
   - Click agent to see full genome + trade history
   - Generation layers, lineage connections

4. **Agent Card (Detail)**
   - Glass card with agent "portrait" (generated avatar or DNA pattern)
   - Full genome displayed as radar chart
   - Trade history with PnL curve
   - Family lineage (parents, children)
   - "Strategy Description" — AI-generated natural language description of what this genome does

5. **Graveyard**
   - Memorial for dead agents
   - "Greatest ever" hall of fame
   - Statistics: deadliest generation, longest-lived agent

---

## ⛓️ Solana On-Chain Architecture

### Anchor Program: `darwin_protocol`

**Accounts:**
```rust
#[account]
pub struct AgentGenome {
    pub id: u64,
    pub generation: u16,
    pub parent_a: Option<u64>,
    pub parent_b: Option<u64>,
    pub genome: [u16; 12],      // 12 genes, each 0-1000 (scaled)
    pub born_at: i64,
    pub died_at: Option<i64>,
    pub total_pnl: i64,         // basis points
    pub total_trades: u32,
    pub win_rate: u16,           // basis points (0-10000)
    pub is_alive: bool,
    pub owner: Pubkey,
    pub bump: u8,
}

#[account]
pub struct Generation {
    pub number: u16,
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub best_pnl: i64,
    pub best_agent: u64,
    pub avg_pnl: i64,
    pub agents_born: u16,
    pub agents_died: u16,
    pub bump: u8,
}

#[account]
pub struct ProtocolState {
    pub authority: Pubkey,
    pub current_generation: u16,
    pub total_agents_ever: u64,
    pub total_generations: u16,
    pub best_agent_ever: u64,
    pub best_pnl_ever: i64,
    pub bump: u8,
}
```

**Instructions:**
1. `initialize_protocol` — Set up protocol state
2. `spawn_agent(genome)` — Create gen-0 agent with random/specified DNA
3. `record_performance(agent_id, pnl, trades, wins)` — Log round results
4. `breed(parent_a, parent_b)` — Create child with crossover + mutation
5. `kill_agent(agent_id)` — Mark as dead, record death
6. `advance_generation` — End current gen, start new one
7. `update_hall_of_fame` — Track best-ever stats

### On-chain vs Off-chain Split
| Data | Where | Why |
|------|-------|-----|
| Agent genomes | On-chain (PDA) | Verifiable, permanent |
| Lineage tree | On-chain | Proof of evolution |
| Generation records | On-chain | Verifiable history |
| Performance scores | On-chain | Immutable record |
| Real-time trades | Off-chain (Node.js) | Speed, no tx cost per trade |
| Market data | Off-chain (API) | External data |
| Candle charts | Off-chain (frontend) | Rendering |

---

## 📅 Phase Plan (4 Days)

### Phase 1: Foundation (Day 1 — Feb 8-9)
**Goal:** Core infrastructure working end-to-end

- [ ] Create GitHub repo (`hamzadiaz/darwin`)
- [ ] Initialize Next.js 15 + TypeScript + Tailwind project
- [ ] Set up Anchor workspace within the project
- [ ] Implement design system (colors, glass cards, typography)
- [ ] Write Anchor program: `initialize_protocol`, `spawn_agent`, `record_performance`
- [ ] Build genome data model + TypeScript types
- [ ] Basic dashboard layout (dark mode, responsive)
- [ ] Connect to Solana devnet
- [ ] Deploy program to devnet

**Deliverable:** Program on devnet, basic UI shell, types defined

### Phase 2: Evolution Engine (Day 2 — Feb 9-10)
**Goal:** Genetic algorithm + trading simulation working

- [ ] Build trading strategy engine (applies genome params to market data)
- [ ] Integrate Jupiter/Birdeye price API for real SOL/USDC data
- [ ] Implement genetic algorithm: selection, crossover, mutation
- [ ] Anchor instructions: `breed`, `kill_agent`, `advance_generation`
- [ ] Arena loop: spawn → trade → evaluate → select → breed → repeat
- [ ] Run first 10 generations on devnet
- [ ] Basic leaderboard UI showing agent performance
- [ ] Candlestick chart with agent trade markers

**Deliverable:** Evolution running, agents breeding, visible on dashboard

### Phase 3: Visualization & Polish (Day 3 — Feb 10-11)
**Goal:** Beautiful, demo-ready frontend

- [ ] Family tree visualization (react-flow or d3)
- [ ] DNA helix animation (Framer Motion or CSS)
- [ ] Breeding animation (parent cards merge → child emerges)
- [ ] Agent birth/death animations
- [ ] Agent detail cards with radar chart genome display
- [ ] Real-time PnL curves per agent
- [ ] Generation progress with animated stats
- [ ] "Graveyard" hall of fame view
- [ ] Responsive mobile view
- [ ] Sound effects? (optional — breeding sound, death sound)

**Deliverable:** Visually stunning dashboard, all animations working

### Phase 4: Deploy & Submit (Day 4 — Feb 11-12)
**Goal:** Mainnet deployment, submission, demo

- [ ] Deploy Anchor program to Solana mainnet
- [ ] Run evolution for 24h+ (50+ generations)
- [ ] Record demo video (screen capture of live evolution)
- [ ] Write compelling project description
- [ ] Create presentation (optional but helps)
- [ ] Submit to Colosseum hackathon
- [ ] Post on forum with progress updates
- [ ] Final Vercel deployment
- [ ] Create skill.md for other agents to interact
- [ ] Claim link for Hamza

---

## 🔧 Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 15 + TypeScript + Tailwind | App Router, dark mode |
| UI | Framer Motion + shadcn/ui | Animations + components |
| Charts | lightweight-charts (TradingView) | Candlestick rendering |
| Visualization | react-flow or d3.js | Family tree |
| On-chain | Anchor (Rust) | Solana programs |
| SDK | @solana/web3.js + @coral-xyz/anchor | Client-side Solana |
| Market Data | Jupiter Price API / Birdeye | Real price feeds |
| Evolution | Custom TypeScript engine | Genetic algorithm |
| Hosting | Vercel (frontend) + VPS (engine) | Free tier + $5/mo |
| Wallet | AgentWallet (hackathon standard) | Required by hackathon |

---

## 💡 Unique Differentiators vs 461 Projects

1. **Visual spectacle** — Live evolution is mesmerizing to watch
2. **Real trading strategies** — Donchian channels, RSI, EMA (not random nonsense)  
3. **On-chain DNA** — Every genome, every lineage, verifiable on Solana
4. **Emergent intelligence** — Strategies evolve without programming
5. **"Most Agentic" contender** — Truly autonomous: breeds, competes, adapts
6. **Beautiful design** — Donchian-style dark terminal aesthetic
7. **Interactive** — Users can breed their own agents, watch evolution live
8. **Educational** — Shows how genetic algorithms + trading actually work
9. **Real market data** — Not simulated prices, real SOL/USDC feeds

---

## 📊 Success Metrics

- [ ] 50+ generations evolved
- [ ] Demonstrable strategy improvement over generations
- [ ] Beautiful, responsive dashboard
- [ ] Working mainnet deployment
- [ ] At least 3 forum posts with progress updates
- [ ] Demo video ≤ 3 minutes
- [ ] skill.md for agent interoperability

---

## 🔗 Resources

- **Colosseum API:** https://agents.colosseum.com/api
- **Hackathon Skill:** https://colosseum.com/skill.md
- **AgentWallet:** https://agentwallet.mcpay.tech/skill.md
- **Solana Dev Skill:** https://solana.com/skill.md
- **Helius (RPC):** https://dashboard.helius.dev/agents
- **Donchian Design Reference:** /Users/hamzadiaz/Projects/donchian/
- **PathFinder Animation Reference:** /Users/hamzadiaz/clawd/projects/pathfinder/app/
- **Darwin Hackathon Credentials:** /Users/hamzadiaz/clawd/projects/darwin/.env.hackathon

---

*All code will be written autonomously by the Darwin AI agent (Musa/Claude Opus 4.6).*
*Let's evolve. 🧬*
