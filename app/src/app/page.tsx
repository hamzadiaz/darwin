'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Swords, Trophy, Zap, ArrowRight, Brain, Flame, Ghost, Shield, Wand2 } from 'lucide-react';
import { ORIGIN_CONFIG } from '@/types/agent';
import { WC3Card, WC3Button } from '@/components/wc3';

const EVOLVE_WORDS = ['Think', 'Fight', 'Evolve', 'Dominate'];

function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % EVOLVE_WORDS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block relative min-w-[200px]">
      <AnimatePresence mode="wait">
        <motion.span
          key={EVOLVE_WORDS[index]}
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="wc3-text-gold inline-block"
        >
          {EVOLVE_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const SAMPLE_AGENTS = [
  {
    name: 'Dracarys',
    origin: 'dragon' as const,
    traits: ['Aggressive', 'Brave', 'Fierce'],
    stats: { atk: 92, def: 65, spd: 78 },
    wins: 47,
  },
  {
    name: 'Arcturus',
    origin: 'scholar' as const,
    traits: ['Strategic', 'Wise', 'Calculated'],
    stats: { atk: 68, def: 72, spd: 85 },
    wins: 43,
  },
  {
    name: 'Nyx',
    origin: 'shadow' as const,
    traits: ['Cunning', 'Swift', 'Deadly'],
    stats: { atk: 85, def: 60, spd: 95 },
    wins: 51,
  },
  {
    name: 'Aegis',
    origin: 'sentinel' as const,
    traits: ['Loyal', 'Defensive', 'Unyielding'],
    stats: { atk: 70, def: 98, spd: 62 },
    wins: 38,
  },
];

const ORIGIN_ICONS = {
  dragon: Flame,
  scholar: Wand2,
  shadow: Ghost,
  sentinel: Shield,
};

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle backdrop-blur-xl" style={{ background: 'rgba(8,8,15,0.9)' }}>
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-wc3-dark-gold to-wc3-gold flex items-center justify-center shadow-[0_0_20px_rgba(252,211,18,0.3)]">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight wc3-text-gold">DARWIN</h1>
              <p className="text-[9px] text-text-muted hidden sm:block uppercase tracking-[0.2em]">Legendary Creatures</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/leaderboard"
              className="text-xs text-text-secondary hover:text-wc3-gold transition-colors hidden sm:block"
            >
              Leaderboard
            </Link>
            <Link href="/create">
              <WC3Button className="text-xs">
                Create Agent
                <ArrowRight className="w-3.5 h-3.5" />
              </WC3Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated background - subtle WC3 vibe */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-wc3-gold/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-wc3-dark-gold/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ 
            backgroundImage: 'linear-gradient(rgba(252,211,18,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(252,211,18,0.3) 1px, transparent 1px)', 
            backgroundSize: '80px 80px' 
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6 pb-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-10 text-center"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-wc3-gold/30"
              style={{ background: 'rgba(252,211,18,0.08)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-wc3-gold animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.3em] wc3-text-gold font-bold">AI-Powered · Solana NFTs</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold wc3-text-gold tracking-tight leading-[1.1] mb-4">
              Forge Legendary
            </h1>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] wc3-text-gold">
              Creatures That <RotatingWord />
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-lg sm:text-xl text-text-body leading-relaxed mb-12 max-w-3xl mx-auto text-center"
          >
            Summon AI-powered agents from the depths of Solana. Each creature bears a unique soul, shaped by your choices. Train them in battle. Watch them evolve into legends.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex items-center justify-center gap-6 flex-wrap mb-20"
          >
            <Link href="/create">
              <WC3Button primary className="text-base px-12 py-6 wc3-glow-gold">
                <Sparkles className="w-5 h-5" />
                <span>Forge Your Hero</span>
                <ArrowRight className="w-5 h-5" />
              </WC3Button>
            </Link>
            
            <Link href="/battle">
              <WC3Button className="text-base px-8 py-5">
                <Swords className="w-5 h-5" />
                <span>Enter the Arena</span>
              </WC3Button>
            </Link>
          </motion.div>

          {/* Sample Agent Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <p className="text-center text-sm wc3-text-gold mb-8 uppercase tracking-widest">Champions of the Realm</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {SAMPLE_AGENTS.map((agent, i) => {
                const Icon = ORIGIN_ICONS[agent.origin];
                return (
                  <motion.div
                    key={agent.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 + i * 0.1 }}
                  >
                    <WC3Card className="wc3-hover-glow cursor-pointer">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${ORIGIN_CONFIG[agent.origin].gradient} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-text-muted uppercase tracking-wider">Victories</div>
                          <div className="text-lg font-bold wc3-text-gold">{agent.wins}</div>
                        </div>
                      </div>
                      
                      <h3 className="text-base font-bold wc3-text-gold mb-1">{agent.name}</h3>
                      <p className="text-xs text-text-secondary mb-3">{ORIGIN_CONFIG[agent.origin].description}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {agent.traits.map((trait) => (
                          <span key={trait} className="text-[9px] px-2 py-1 rounded bg-card-elevated border border-border-subtle text-text-secondary">
                            {trait}
                          </span>
                        ))}
                      </div>
                      
                      <div className="space-y-1.5">
                        {Object.entries(agent.stats).map(([stat, value]) => (
                          <div key={stat} className="flex items-center gap-2">
                            <span className="text-[10px] text-text-muted uppercase w-8 font-bold">{stat}</span>
                            <div className="flex-1 h-2 bg-black/50 border border-border-subtle rounded overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-wc3-dark-gold to-wc3-gold rounded transition-all duration-500"
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-text-primary font-bold font-mono w-6 text-right">{value}</span>
                          </div>
                        ))}
                      </div>
                    </WC3Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-20 lg:py-32 px-6 relative">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] uppercase tracking-[0.4em] wc3-text-gold font-bold mb-4">The Path to Glory</p>
            <h2 className="text-4xl sm:text-5xl font-bold wc3-text-gold mb-6">Forge, Battle, Ascend</h2>
            <p className="text-base text-text-body max-w-2xl mx-auto">Every hero forged in Darwin is unique. Their destiny is yours to shape.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'Personality Forge',
                desc: 'Shape your creature\'s essence through ancient rituals. Each choice carves their soul, defining stats and battle tactics.',
                color: 'from-wc3-dark-gold/10 to-wc3-gold/10',
                border: 'border-wc3-gold/30',
              },
              {
                icon: Swords,
                title: 'Trial by Combat',
                desc: 'Clash steel with rival champions. Victory yields experience, strength, and glory. The weak fall. Legends rise.',
                color: 'from-wc3-dark-gold/10 to-wc3-gold/10',
                border: 'border-wc3-gold/30',
              },
              {
                icon: Trophy,
                title: 'Eternal Legacy',
                desc: 'Ascend the Hall of Champions. The mightiest warriors earn their place in legend, forever remembered.',
                color: 'from-wc3-dark-gold/10 to-wc3-gold/10',
                border: 'border-wc3-gold/30',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <WC3Card className={`border-2 ${feature.border} bg-gradient-to-br ${feature.color} wc3-hover-glow`}>
                  <div className="w-14 h-14 rounded-lg bg-card-bg border border-border-medium flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 wc3-text-gold" />
                  </div>
                  <h3 className="text-xl font-bold wc3-text-gold mb-3">{feature.title}</h3>
                  <p className="text-sm text-text-body leading-relaxed">{feature.desc}</p>
                </WC3Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 lg:py-32 px-6">
        <div className="max-w-[800px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold wc3-text-gold mb-6">
              The Forge Awaits
            </h2>
            <p className="text-base text-text-body mb-10 max-w-lg mx-auto">
              Will you summon a hero worthy of legend? The realm calls for champions. Answer the call.
            </p>
            <Link href="/create">
              <WC3Button primary className="text-lg px-14 py-6 wc3-glow-gold">
                <Sparkles className="w-6 h-6" />
                <span>Begin Your Journey</span>
                <ArrowRight className="w-6 h-6" />
              </WC3Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center py-8 border-t border-border-subtle">
        <p className="text-[10px] text-text-muted uppercase tracking-widest">
          Forged on Solana · Powered by Ancient Magic
        </p>
      </div>
    </div>
  );
}
