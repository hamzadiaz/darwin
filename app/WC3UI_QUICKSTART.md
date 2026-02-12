# ⚔️ WC3UI Quick Reference

## 🎨 Core Design Rules

1. **EVERYTHING gets text-shadow** — `text-shadow: 1px 1px 0 rgba(0,0,0,.92)`
2. **Gold for important text** — `color: #fcd312`
3. **Dark backgrounds** — `#08080f` (body), `#111118` (cards)
4. **Palatino font** — Already applied globally
5. **Hover = glow** — Gold glow effects on buttons/cards

## 🧩 Component Cheat Sheet

```tsx
// Import all WC3 components
import { 
  WC3Card,              // Dark card with borders
  WC3Button,            // Gold button (use primary prop for CTA)
  WC3Bar,               // Health/Mana/Energy bars
  WC3HeroCard,          // Full hero profile
  WC3ChatLog,           // Battle commentary
  WC3CommandButton,     // 64x64 action button
  WC3LoadingBar,        // Progress bar
  WC3ResourceCounter    // XP/Wins/Stats display
} from '@/components/wc3';

// Card with content
<WC3Card>
  <h2>Stats</h2>
  <p>Your champion stats here</p>
</WC3Card>

// Elevated card (darker, more prominent)
<WC3Card elevated>Content</WC3Card>

// Dialog/modal style
<WC3Card dialog>Modal content</WC3Card>

// Primary button (gold background)
<WC3Button primary onClick={handleClick}>
  <Icon className="w-5 h-5" />
  Forge Champion
</WC3Button>

// Secondary button (gold text)
<WC3Button onClick={handleClick}>
  Return
</WC3Button>

// Health bar
<WC3Bar 
  current={hp} 
  max={100} 
  type="health"    // health | mana | energy
  large            // Optional: taller bar
  showText={true}  // Show "50 / 100"
/>

// Command button (battle actions)
<WC3CommandButton
  icon={<Swords className="w-5 h-5" />}
  hotkey="Q"
  onClick={attack}
  cooldown={0.5}   // 0-1, percentage
/>

// Chat log (battle commentary)
<WC3ChatLog 
  messages={[
    { id: '1', text: 'Dracarys attacks!', type: 'ally' },
    { id: '2', text: 'Nyx dodges!', type: 'enemy' },
    { id: '3', text: 'Round 1 complete!', type: 'system' }
  ]}
/>

// Resource counter
<WC3ResourceCounter
  icon={<Trophy className="w-5 h-5" />}
  value={47}
  label="Victories"
/>

// Loading bar
<WC3LoadingBar 
  progress={75}        // 0-100
  text="Step 3 of 4"   // Optional text overlay
/>
```

## 🎨 CSS Classes You Can Use

```css
/* Cards */
.wc3-card               /* Basic card */
.wc3-card-elevated      /* Darker, more prominent */
.wc3-dialog             /* Modal/dialog style */
.wc3-hero-card          /* Full hero card layout */

/* Buttons */
.wc3-btn                /* Secondary button (gold text) */
.wc3-btn-primary        /* Primary CTA (gold background) */
.wc3-cmd-btn            /* 64x64 command button */

/* Bars */
.wc3-bar                /* Health/mana bar container */
.wc3-bar--large         /* Taller bar */
.wc3-bar-fill           /* The colored fill */
.wc3-bar-fill--health   /* Green health bar */
.wc3-bar-fill--mana     /* Blue mana bar */
.wc3-bar-fill--energy   /* Orange energy bar */

/* Text Colors */
.wc3-text-gold          /* Gold text (#fcd312) */
.wc3-text-primary       /* Light text (#e2e9ff) */
.wc3-text-secondary     /* Gray text (#9aa4c0) */

/* Effects */
.wc3-glow-gold          /* Gold glow shadow */
.wc3-hover-glow         /* Glow on hover */

/* Scrollbar */
.wc3-scrollbar          /* Custom WC3-style scrollbar */

/* Chat */
.wc3-chat-log           /* Chat container */
.wc3-chat-line--ally    /* Blue (your actions) */
.wc3-chat-line--enemy   /* Red (opponent) */
.wc3-chat-line--system  /* Gold (system) */
```

## 🎯 Color Palette

```
Gold (Primary):     #fcd312
Dark Gold:          #cca300
Light Gold:         #f4d45e

Background:         #08080f
Card BG:            #111118
Card Elevated:      #1c2333

Text Primary:       #e2e9ff
Text Body:          #d3ddfb
Text Secondary:     #9aa4c0
Text Muted:         #6b7489

Health:             #22c55e (green)
Mana:               #3b82f6 (blue)
Energy:             #f59e0b (orange)

Chat Ally:          #8fc0ff (blue)
Chat Enemy:         #f29090 (red)
Chat System:        #f0d775 (gold)
```

## 🏃 Quick Start

1. **Import components:**
   ```tsx
   import { WC3Card, WC3Button } from '@/components/wc3';
   ```

2. **Use in JSX:**
   ```tsx
   <WC3Card>
     <h2 className="wc3-text-gold">Champion Stats</h2>
     <WC3Button primary>Battle!</WC3Button>
   </WC3Card>
   ```

3. **All text automatically has text-shadow** (applied globally in `globals.css`)

4. **Headings automatically gold** (`<h1>`, `<h2>`, etc.)

## 💡 Tips

- **Use primary buttons** for main CTAs (Forge Champion, Enter Battle)
- **Use gold text** for important labels and values
- **Health bars** should always be `type="health"` (green)
- **Mana/Energy bars** use `type="mana"` or `type="energy"`
- **Chat messages** auto-scroll when new ones added
- **Command buttons** work great in grids (3x3 or 4x4)

## 🔥 Example Page Structure

```tsx
export default function MyPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Page Header */}
        <h1 className="text-5xl font-bold wc3-text-gold mb-4">
          ⚔️ Page Title
        </h1>
        <p className="text-text-body mb-8">
          Description goes here
        </p>

        {/* Content Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WC3Card>
            <h3 className="wc3-text-gold mb-4">Card Title</h3>
            <p className="text-text-body">Content here</p>
          </WC3Card>
          
          <WC3Card elevated>
            <h3 className="wc3-text-gold mb-4">Elevated Card</h3>
            <WC3Bar current={75} max={100} type="health" />
          </WC3Card>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <WC3Button primary>
            <Icon className="w-5 h-5" />
            Take Action
          </WC3Button>
        </div>
      </div>
    </div>
  );
}
```

---

That's it! You now have a **complete WC3-style design system**. 🎮⚔️

**Questions?** Check `WC3UI_INTEGRATION.md` for full details.
