'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Sparkles, Flame, Wand2, Ghost, Shield } from 'lucide-react';
import { Origin, PersonalityTraits, ORIGIN_CONFIG } from '@/types/agent';
import { createAgent, generateAgentStats } from '@/lib/agentUtils';
import { saveAgent, initializeSampleAgents } from '@/lib/storage';
import { WC3Card, WC3Button, WC3Bar, WC3LoadingBar } from '@/components/wc3';

type Step = 'origin' | 'traits' | 'details' | 'preview';

const ORIGIN_ICONS = {
  dragon: Flame,
  scholar: Wand2,
  shadow: Ghost,
  sentinel: Shield,
};

export default function CreateAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('origin');
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [traits, setTraits] = useState<PersonalityTraits>({
    bravery: 50,
    loyalty: 50,
    strategy: 50,
    social: 50,
  });
  const [name, setName] = useState('');
  const [backstory, setBackstory] = useState('');

  // Initialize sample agents on mount
  useEffect(() => {
    initializeSampleAgents();
  }, []);

  const handleOriginSelect = (selectedOrigin: Origin) => {
    setOrigin(selectedOrigin);
    setTimeout(() => setStep('traits'), 300);
  };

  const handleTraitsNext = () => {
    setStep('details');
  };

  const handleDetailsNext = () => {
    if (!name.trim()) {
      alert('Your champion requires a name!');
      return;
    }
    setStep('preview');
  };

  const handleCreate = () => {
    if (!origin) return;
    
    const agent = createAgent(name, origin, traits, backstory || undefined);
    saveAgent(agent);
    router.push(`/agent/${agent.id}`);
  };

  const stats = origin ? generateAgentStats(origin, traits) : null;
  
  const progressPercentage =
    step === 'origin' ? 25 :
    step === 'traits' ? 50 :
    step === 'details' ? 75 :
    100;

  return (
    <div className="min-h-screen">
      {/* Progress bar - WC3 style */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-4xl mx-auto">
          <WC3LoadingBar progress={progressPercentage} text={`Step ${progressPercentage / 25} of 4`} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 pt-32">
        <AnimatePresence mode="wait">
          {step === 'origin' && (
            <motion.div
              key="origin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold wc3-text-gold mb-4">🔥 Choose Your Origin</h1>
                <p className="text-text-body text-lg">Each origin bestows unique powers and destiny upon your champion</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Object.keys(ORIGIN_CONFIG) as Origin[]).map((originKey) => {
                  const config = ORIGIN_CONFIG[originKey];
                  const Icon = ORIGIN_ICONS[originKey];
                  
                  return (
                    <motion.button
                      key={originKey}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOriginSelect(originKey)}
                      className="text-left"
                    >
                      <WC3Card className={`wc3-hover-glow border-2 border-border-medium hover:border-wc3-gold/50 bg-gradient-to-br ${config.gradient} bg-opacity-5`}>
                        <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(252,211,18,0.2)] border-2 border-wc3-gold/30`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        
                        <h3 className="text-2xl font-bold wc3-text-gold mb-2">{config.name}</h3>
                        <p className="text-text-body mb-6 text-sm">{config.description}</p>
                        
                        <div className="space-y-2">
                          <p className="text-xs text-text-muted uppercase tracking-wider mb-3 font-bold">⚔️ Base Attributes</p>
                          {Object.entries(config.statBonus).map(([stat, value]) => (
                            <div key={stat} className="flex items-center justify-between">
                              <span className="text-sm text-text-secondary uppercase font-bold">{stat}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-black/50 border border-border-subtle rounded overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r from-wc3-dark-gold to-wc3-gold`}
                                    style={{ width: `${(value / 25) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-mono wc3-text-gold w-8 text-right">+{value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </WC3Card>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 'traits' && origin && (
            <motion.div
              key="traits"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold wc3-text-gold mb-4">🎭 Shape Their Soul</h1>
                <p className="text-text-body text-lg">These traits shall forge their combat style and destiny in battle</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {[
                  { key: 'bravery', left: 'Cautious', right: 'Valiant', icon: '⚔️', desc: 'Courage in the heat of battle' },
                  { key: 'loyalty', left: 'Selfish', right: 'Loyal', icon: '🤝', desc: 'Devotion to allies and cause' },
                  { key: 'strategy', left: 'Reckless', right: 'Tactical', icon: '🎯', desc: 'Battle cunning and planning' },
                  { key: 'social', left: 'Lone Wolf', right: 'Pack Hunter', icon: '👥', desc: 'Affinity for companionship' },
                ].map((trait) => (
                  <WC3Card key={trait.key} className="border border-border-medium">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{trait.icon}</span>
                        <div>
                          <h3 className="text-sm font-bold wc3-text-gold uppercase tracking-wider">
                            {trait.left} vs {trait.right}
                          </h3>
                          <p className="text-xs text-text-muted">{trait.desc}</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold font-mono wc3-text-gold min-w-[4rem] text-right">
                        {traits[trait.key as keyof PersonalityTraits]}%
                      </span>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={traits[trait.key as keyof PersonalityTraits]}
                        onChange={(e) =>
                          setTraits({
                            ...traits,
                            [trait.key]: parseInt(e.target.value),
                          })
                        }
                        className="wc3-slider w-full h-3 bg-black/50 border border-border-subtle rounded appearance-none cursor-pointer"
                      />
                      {/* Tick marks */}
                      <div className="absolute top-0 left-0 right-0 h-3 pointer-events-none flex justify-between px-1">
                        {[0, 25, 50, 75, 100].map(mark => (
                          <div key={mark} className="w-0.5 h-full bg-border-medium" />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-text-muted font-bold">{trait.left}</span>
                      <span className="text-xs text-text-muted font-bold">{trait.right}</span>
                    </div>
                  </WC3Card>
                ))}
              </div>

              <div className="flex items-center justify-between mt-12">
                <WC3Button onClick={() => setStep('origin')}>
                  <ArrowLeft className="w-4 h-4" />
                  Return
                </WC3Button>
                
                <WC3Button primary onClick={handleTraitsNext}>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </WC3Button>
              </div>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold wc3-text-gold mb-4">📜 Name Your Champion</h1>
                <p className="text-text-body text-lg">Bestow upon them a name that shall echo through eternity</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <WC3Card>
                  <label className="block text-sm font-bold wc3-text-gold mb-3 uppercase tracking-wider">
                    Champion Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter a legendary name..."
                    className="w-full px-4 py-3 bg-black/50 border-2 border-border-medium rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-wc3-gold transition-colors wc3-text-primary"
                    maxLength={30}
                  />
                </WC3Card>

                <WC3Card>
                  <label className="block text-sm font-bold wc3-text-gold mb-3 uppercase tracking-wider">
                    Chronicle of Origins <span className="text-text-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={backstory}
                    onChange={(e) => setBackstory(e.target.value)}
                    placeholder="Inscribe their tale, or let the ancient scribes weave one..."
                    rows={6}
                    className="w-full px-4 py-3 bg-black/50 border-2 border-border-medium rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-wc3-gold transition-colors resize-none wc3-text-primary"
                    maxLength={500}
                  />
                  <p className="text-xs text-text-muted mt-2">
                    {backstory.length}/500 runes inscribed
                    {!backstory && ' · The scribes shall craft a tale if left untold'}
                  </p>
                </WC3Card>
              </div>

              <div className="flex items-center justify-between mt-12">
                <WC3Button onClick={() => setStep('traits')}>
                  <ArrowLeft className="w-4 h-4" />
                  Return
                </WC3Button>
                
                <WC3Button primary onClick={handleDetailsNext}>
                  Preview Champion
                  <ArrowRight className="w-4 h-4" />
                </WC3Button>
              </div>
            </motion.div>
          )}

          {step === 'preview' && origin && stats && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold wc3-text-gold mb-4">🏆 Your Champion Awaits</h1>
                <p className="text-text-body text-lg">Seal the pact and summon them into existence</p>
              </div>

              <div className="max-w-2xl mx-auto">
                <WC3Card elevated className="border-2 border-wc3-gold/40 wc3-glow-gold">
                  {/* Agent Preview */}
                  <div className="flex items-start gap-6 mb-8">
                    <div className={`w-24 h-24 rounded-lg bg-gradient-to-br ${ORIGIN_CONFIG[origin].gradient} flex items-center justify-center shadow-[0_0_30px_rgba(252,211,18,0.3)] border-2 border-wc3-gold/50`}>
                      {React.createElement(ORIGIN_ICONS[origin], { className: 'w-12 h-12 text-white' })}
                    </div>
                    
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold wc3-text-gold mb-2">{name}</h2>
                      <p className="text-sm text-text-secondary mb-3">{ORIGIN_CONFIG[origin].name}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded bg-card-elevated border border-border-medium text-xs wc3-text-gold font-bold">Level 1</span>
                        <span className="px-3 py-1 rounded bg-card-elevated border border-border-medium text-xs text-text-muted">Untested in Combat</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mb-8">
                    <h3 className="text-sm font-bold wc3-text-gold uppercase tracking-wider mb-4">⚔️ Battle Attributes</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(stats).map(([stat, value]) => (
                        <div key={stat}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-text-secondary uppercase font-bold">{stat}</span>
                            <span className="text-sm font-mono wc3-text-gold">{value}</span>
                          </div>
                          <div className="h-2.5 bg-black/50 border border-border-subtle rounded overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r from-wc3-dark-gold to-wc3-gold`}
                              style={{ width: `${(value / 150) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Personality Summary */}
                  <div className="mb-8">
                    <h3 className="text-sm font-bold wc3-text-gold uppercase tracking-wider mb-4">🎭 Forged Traits</h3>
                    <div className="flex flex-wrap gap-2">
                      {traits.bravery > 60 && (
                        <span className="px-3 py-1.5 rounded border border-wc3-gold/30 bg-wc3-gold/10 text-xs wc3-text-gold">⚔️ Valiant</span>
                      )}
                      {traits.bravery < 40 && (
                        <span className="px-3 py-1.5 rounded border border-border-medium bg-card-elevated text-xs text-text-secondary">🛡️ Cautious</span>
                      )}
                      {traits.loyalty > 60 && (
                        <span className="px-3 py-1.5 rounded border border-wc3-gold/30 bg-wc3-gold/10 text-xs wc3-text-gold">🤝 Loyal</span>
                      )}
                      {traits.strategy > 60 && (
                        <span className="px-3 py-1.5 rounded border border-wc3-gold/30 bg-wc3-gold/10 text-xs wc3-text-gold">🎯 Tactical</span>
                      )}
                      {traits.strategy < 40 && (
                        <span className="px-3 py-1.5 rounded border border-border-medium bg-card-elevated text-xs text-text-secondary">⚡ Reckless</span>
                      )}
                      {traits.social < 40 && (
                        <span className="px-3 py-1.5 rounded border border-border-medium bg-card-elevated text-xs text-text-secondary">🐺 Lone Wolf</span>
                      )}
                      {traits.social > 60 && (
                        <span className="px-3 py-1.5 rounded border border-wc3-gold/30 bg-wc3-gold/10 text-xs wc3-text-gold">👥 Pack Hunter</span>
                      )}
                    </div>
                  </div>

                  {/* Backstory */}
                  <div>
                    <h3 className="text-sm font-bold wc3-text-gold uppercase tracking-wider mb-3">📜 Chronicle</h3>
                    <p className="text-sm text-text-body leading-relaxed">
                      {backstory || `The scribes shall inscribe a tale befitting a ${ORIGIN_CONFIG[origin].name} of such renown, drawn from the ancient texts and their essence.`}
                    </p>
                  </div>
                </WC3Card>

                <div className="flex items-center justify-between mt-8">
                  <WC3Button onClick={() => setStep('details')}>
                    <ArrowLeft className="w-4 h-4" />
                    Return
                  </WC3Button>
                  
                  <WC3Button primary onClick={handleCreate} className="text-lg wc3-glow-gold">
                    <Sparkles className="w-5 h-5" />
                    FORGE CHAMPION
                    <ArrowRight className="w-5 h-5" />
                  </WC3Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .wc3-slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 3px;
          background: linear-gradient(135deg, var(--color-wc3-dark-gold), var(--color-wc3-gold));
          cursor: pointer;
          border: 2px solid rgba(0,0,0,0.5);
          box-shadow: 0 0 12px rgba(252, 211, 18, 0.4), inset 0 1px 0 rgba(255,255,255,0.3);
        }

        .wc3-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 3px;
          background: linear-gradient(135deg, var(--color-wc3-dark-gold), var(--color-wc3-gold));
          cursor: pointer;
          border: 2px solid rgba(0,0,0,0.5);
          box-shadow: 0 0 12px rgba(252, 211, 18, 0.4), inset 0 1px 0 rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
}
