'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Swords, ArrowLeft, Trophy, Zap, Heart, Shield as ShieldIcon, Target, Wind, Sparkles } from 'lucide-react';
import { Agent, BattleRound } from '@/types/agent';
import { ORIGIN_CONFIG } from '@/types/agent';
import { getAllAgents, getRandomOpponent, saveBattle } from '@/lib/storage';
import { simulateBattle } from '@/lib/battleEngine';
import { Flame, Wand2, Ghost, Shield } from 'lucide-react';
import { WC3Card, WC3Button, WC3Bar, WC3ChatLog, WC3ChatMessage, WC3CommandButton } from '@/components/wc3';

const ORIGIN_ICONS = {
  dragon: Flame,
  scholar: Wand2,
  shadow: Ghost,
  sentinel: Shield,
};

const ACTION_ICONS = {
  attack: Swords,
  defend: ShieldIcon,
  special: Zap,
  dodge: Wind,
};

const ACTION_LABELS = {
  attack: 'Attack',
  defend: 'Defend',
  special: 'Special',
  dodge: 'Dodge',
};

const ACTION_HOTKEYS = {
  attack: 'Q',
  defend: 'W',
  special: 'E',
  dodge: 'R',
};

export default function BattlePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [opponent, setOpponent] = useState<Agent | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [rounds, setRounds] = useState<BattleRound[]>([]);
  const [battleComplete, setBattleComplete] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<WC3ChatMessage[]>([]);

  useEffect(() => {
    setAgents(getAllAgents());
  }, []);

  const addChatMessage = (text: string, type: 'ally' | 'enemy' | 'system') => {
    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${Math.random()}`,
      text,
      type,
      timestamp: Date.now()
    }]);
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    const randomOpponent = getRandomOpponent([agent.id]);
    setOpponent(randomOpponent);
  };

  const startBattle = () => {
    if (!selectedAgent || !opponent) return;
    
    const battle = simulateBattle(selectedAgent, opponent);
    setRounds(battle.rounds);
    setWinnerId(battle.winnerId);
    setBattleStarted(true);
    setCurrentRound(0);
    setChatMessages([]);
    
    addChatMessage(`${selectedAgent.name} enters the arena!`, 'system');
    addChatMessage(`${opponent.name} approaches, ready for battle!`, 'system');
    
    // Animate through rounds
    let round = 0;
    const interval = setInterval(() => {
      round++;
      setCurrentRound(round);
      
      const roundData = battle.rounds[round - 1];
      if (roundData) {
        // Add chat messages for actions
        addChatMessage(
          `${selectedAgent.name} uses ${ACTION_LABELS[roundData.agent1Action]}${roundData.agent2Damage > 0 ? ` - ${roundData.agent2Damage} damage!` : '!'}`,
          'ally'
        );
        addChatMessage(
          `${opponent.name} uses ${ACTION_LABELS[roundData.agent2Action]}${roundData.agent1Damage > 0 ? ` - ${roundData.agent1Damage} damage!` : '!'}`,
          'enemy'
        );
      }
      
      if (round >= battle.rounds.length) {
        clearInterval(interval);
        setTimeout(() => {
          setBattleComplete(true);
          saveBattle(battle);
          const winner = battle.winnerId === selectedAgent.id ? selectedAgent.name : opponent.name;
          addChatMessage(`⚔️ ${winner} emerges victorious!`, 'system');
        }, 1000);
      }
    }, 2000);
  };

  const reset = () => {
    setSelectedAgent(null);
    setOpponent(null);
    setBattleStarted(false);
    setCurrentRound(0);
    setRounds([]);
    setBattleComplete(false);
    setWinnerId(null);
    setChatMessages([]);
    setAgents(getAllAgents()); // Refresh agents after battle
  };

  const currentRoundData = rounds[currentRound - 1];
  const agent1HP = currentRoundData?.agent1HP ?? selectedAgent?.stats.hp ?? 0;
  const agent2HP = currentRoundData?.agent2HP ?? opponent?.stats.hp ?? 0;

  if (!battleStarted) {
    return (
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-wc3-gold transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Hall
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold wc3-text-gold mb-4">⚔️ Battle Arena</h1>
            <p className="text-text-body text-lg">Choose your champion and face a worthy opponent</p>
          </div>

          {!selectedAgent ? (
            <div>
              <h2 className="text-2xl font-bold wc3-text-gold mb-6">Select Your Champion</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => {
                  const Icon = ORIGIN_ICONS[agent.origin];
                  return (
                    <motion.button
                      key={agent.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectAgent(agent)}
                    >
                      <WC3Card className="group wc3-hover-glow cursor-pointer text-left">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${ORIGIN_CONFIG[agent.origin].gradient} flex items-center justify-center border-2 border-border-medium`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold wc3-text-gold">{agent.name}</h3>
                            <p className="text-xs text-text-muted">{ORIGIN_CONFIG[agent.origin].name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-text-muted">Level</span>
                            <span className="ml-2 font-mono wc3-text-gold">{agent.level}</span>
                          </div>
                          <div>
                            <span className="text-text-muted">Victories</span>
                            <span className="ml-2 font-mono wc3-text-gold">{agent.wins}</span>
                          </div>
                          <div>
                            <span className="text-text-muted">Defeats</span>
                            <span className="ml-2 font-mono text-text-muted">{agent.losses}</span>
                          </div>
                        </div>
                      </WC3Card>
                    </motion.button>
                  );
                })}
              </div>
              
              {agents.length === 0 && (
                <WC3Card dialog className="text-center py-12 max-w-lg mx-auto">
                  <p className="text-text-body mb-6">No champions await. Forge your first hero!</p>
                  <Link href="/create">
                    <WC3Button primary>
                      <Sparkles className="w-5 h-5" />
                      Forge Champion
                    </WC3Button>
                  </Link>
                </WC3Card>
              )}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Your Agent */}
                <WC3Card className="border-2 border-wc3-gold/30 bg-gradient-to-br from-wc3-gold/5 to-transparent">
                  <p className="text-xs wc3-text-gold uppercase tracking-wider mb-4 font-bold">⚔️ Your Champion</p>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${ORIGIN_CONFIG[selectedAgent.origin].gradient} flex items-center justify-center border-2 border-wc3-gold/50`}>
                      {React.createElement(ORIGIN_ICONS[selectedAgent.origin], { className: 'w-8 h-8 text-white' })}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold wc3-text-gold">{selectedAgent.name}</h3>
                      <p className="text-sm text-text-secondary">{ORIGIN_CONFIG[selectedAgent.origin].name}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(selectedAgent.stats).map(([stat, value]) => (
                      <div key={stat} className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary uppercase font-bold">{stat}</span>
                        <span className="font-mono wc3-text-gold">{value}</span>
                      </div>
                    ))}
                  </div>
                </WC3Card>

                {/* Opponent */}
                {opponent && (
                  <WC3Card className="border-2 border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent">
                    <p className="text-xs text-red-400 uppercase tracking-wider mb-4 font-bold">🛡️ Your Opponent</p>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${ORIGIN_CONFIG[opponent.origin].gradient} flex items-center justify-center border-2 border-red-500/50`}>
                        {React.createElement(ORIGIN_ICONS[opponent.origin], { className: 'w-8 h-8 text-white' })}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-red-400">{opponent.name}</h3>
                        <p className="text-sm text-text-secondary">{ORIGIN_CONFIG[opponent.origin].name}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {Object.entries(opponent.stats).map(([stat, value]) => (
                        <div key={stat} className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary uppercase font-bold">{stat}</span>
                          <span className="font-mono text-red-400">{value}</span>
                        </div>
                      ))}
                    </div>
                  </WC3Card>
                )}
              </div>

              <div className="flex items-center justify-center gap-4">
                <WC3Button onClick={reset}>
                  Choose Different Champion
                </WC3Button>
                
                {opponent && (
                  <WC3Button primary onClick={startBattle} className="text-lg">
                    <Swords className="w-5 h-5" />
                    BEGIN BATTLE
                  </WC3Button>
                )}
                
                {!opponent && (
                  <p className="text-text-muted">No worthy opponents available</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Battle Screen
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!battleComplete ? (
            <motion.div
              key="battle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold wc3-text-gold mb-2">⚔️ Round {currentRound} / {rounds.length}</h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Agent 1 */}
                <WC3Card elevated className="border-2 border-wc3-gold/40">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${ORIGIN_CONFIG[selectedAgent!.origin].gradient} flex items-center justify-center border-2 border-wc3-gold/50`}>
                      {React.createElement(ORIGIN_ICONS[selectedAgent!.origin], { className: 'w-10 h-10 text-white' })}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold wc3-text-gold">{selectedAgent!.name}</h3>
                      <p className="text-sm text-text-secondary">{ORIGIN_CONFIG[selectedAgent!.origin].name}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-text-muted uppercase font-bold">Health</span>
                      <span className="font-mono wc3-text-gold">{agent1HP} / {selectedAgent!.stats.hp}</span>
                    </div>
                    <WC3Bar 
                      current={agent1HP} 
                      max={selectedAgent!.stats.hp} 
                      type="health"
                      large
                      showText={false}
                    />
                  </div>

                  {currentRoundData && (
                    <div className="flex items-center gap-3 p-3 bg-black/30 rounded border border-wc3-gold/20">
                      <WC3CommandButton
                        icon={React.createElement(ACTION_ICONS[currentRoundData.agent1Action], { className: 'w-5 h-5 text-wc3-gold' })}
                        hotkey={ACTION_HOTKEYS[currentRoundData.agent1Action]}
                        disabled
                        className="w-12 h-12"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold wc3-text-gold block">{ACTION_LABELS[currentRoundData.agent1Action]}</span>
                        {currentRoundData.agent2Damage > 0 && (
                          <span className="text-xs text-red-400 font-mono">
                            Dealt {currentRoundData.agent2Damage} damage
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </WC3Card>

                {/* VS */}
                <div className="flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-wc3-dark-gold to-wc3-gold flex items-center justify-center shadow-[0_0_40px_rgba(252,211,18,0.5)]"
                  >
                    <Swords className="w-12 h-12 text-black" />
                  </motion.div>
                </div>

                {/* Agent 2 */}
                <WC3Card elevated className="border-2 border-red-500/40">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${ORIGIN_CONFIG[opponent!.origin].gradient} flex items-center justify-center border-2 border-red-500/50`}>
                      {React.createElement(ORIGIN_ICONS[opponent!.origin], { className: 'w-10 h-10 text-white' })}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-red-400">{opponent!.name}</h3>
                      <p className="text-sm text-text-secondary">{ORIGIN_CONFIG[opponent!.origin].name}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-text-muted uppercase font-bold">Health</span>
                      <span className="font-mono text-red-400">{agent2HP} / {opponent!.stats.hp}</span>
                    </div>
                    <WC3Bar 
                      current={agent2HP} 
                      max={opponent!.stats.hp} 
                      type="health"
                      large
                      showText={false}
                    />
                  </div>

                  {currentRoundData && (
                    <div className="flex items-center gap-3 p-3 bg-black/30 rounded border border-red-500/20">
                      <WC3CommandButton
                        icon={React.createElement(ACTION_ICONS[currentRoundData.agent2Action], { className: 'w-5 h-5 text-red-400' })}
                        hotkey={ACTION_HOTKEYS[currentRoundData.agent2Action]}
                        disabled
                        className="w-12 h-12"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-red-400 block">{ACTION_LABELS[currentRoundData.agent2Action]}</span>
                        {currentRoundData.agent1Damage > 0 && (
                          <span className="text-xs text-red-400 font-mono">
                            Dealt {currentRoundData.agent1Damage} damage
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </WC3Card>
              </div>

              {/* Battle Chat Log */}
              <WC3Card>
                <h3 className="text-lg font-bold wc3-text-gold mb-4">⚔️ Battle Chronicle</h3>
                <WC3ChatLog messages={chatMessages} className="h-48" />
              </WC3Card>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <WC3Card dialog className="max-w-2xl mx-auto">
                  <Trophy className={`w-24 h-24 mx-auto mb-6 ${winnerId === selectedAgent!.id ? 'text-wc3-gold' : 'text-red-400'}`} />
                  <h1 className="text-5xl font-bold wc3-text-gold mb-4">
                    {winnerId === selectedAgent!.id ? '🏆 VICTORY!' : '💀 DEFEAT!'}
                  </h1>
                  <p className="text-2xl text-text-body mb-6">
                    {winnerId === selectedAgent!.id ? selectedAgent!.name : opponent!.name} emerges victorious from the arena!
                  </p>

                  <div className="flex items-center justify-center gap-4 mt-8">
                    <WC3Button onClick={reset}>
                      Return to Arena
                    </WC3Button>
                    
                    <Link href={`/agent/${winnerId}`}>
                      <WC3Button primary>
                        <Trophy className="w-5 h-5" />
                        View Champion
                      </WC3Button>
                    </Link>
                  </div>
                </WC3Card>
              </motion.div>

              {/* Battle Summary */}
              <WC3Card className="max-w-2xl mx-auto mt-6">
                <h3 className="text-lg font-bold wc3-text-gold mb-4">Battle Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-muted block mb-1">Total Rounds</span>
                    <span className="wc3-text-gold font-bold text-xl">{rounds.length}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block mb-1">Winner</span>
                    <span className="wc3-text-gold font-bold text-xl">
                      {winnerId === selectedAgent!.id ? selectedAgent!.name : opponent!.name}
                    </span>
                  </div>
                </div>
              </WC3Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
