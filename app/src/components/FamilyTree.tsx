'use client';

import { useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AgentGenome } from '@/types';
import { formatBpsUncapped } from '@/lib/utils';

interface FamilyTreeProps {
  agents: AgentGenome[];
  onSelectAgent?: (agent: AgentGenome) => void;
}

function AgentNode({ data }: { data: { agent: AgentGenome; selected: boolean } }) {
  const { agent, selected } = data;
  const pnlPos = agent.totalPnl >= 0;
  const borderColor = !agent.isAlive ? '#64748B' : pnlPos ? '#10B981' : '#EF4444';

  return (
    <div
      className="rounded-xl px-3 py-2 text-center min-w-[80px] transition-all"
      style={{
        background: 'rgba(21,27,46,0.9)',
        backdropFilter: 'blur(12px)',
        border: `1.5px solid ${borderColor}`,
        boxShadow: selected ? `0 0 20px ${borderColor}50` : `0 0 8px ${borderColor}20`,
      }}
    >
      <div className="text-[10px] font-mono font-bold text-text-primary">#{agent.id}</div>
      <div className={`text-xs font-mono font-bold ${pnlPos ? 'text-success' : 'text-danger'}`}>
        {formatBpsUncapped(agent.totalPnl)}
      </div>
      <div className="text-[8px] text-text-muted font-mono">Gen {agent.generation}</div>
      {!agent.isAlive && <div className="text-[8px] text-text-muted">💀</div>}
    </div>
  );
}

const nodeTypes = { agent: AgentNode };

export function FamilyTree({ agents, onSelectAgent }: FamilyTreeProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const genMap = new Map<number, AgentGenome[]>();
    agents.forEach(a => {
      const gen = a.generation;
      if (!genMap.has(gen)) genMap.set(gen, []);
      genMap.get(gen)!.push(a);
    });

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    genMap.forEach((genAgents, gen) => {
      genAgents.forEach((agent, idx) => {
        const x = idx * 120 - (genAgents.length * 120) / 2 + 60;
        const y = gen * 140;
        nodes.push({
          id: String(agent.id),
          type: 'agent',
          position: { x, y },
          data: { agent, selected: agent.id === selectedId },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });

        if (agent.parentA !== null) {
          edges.push({
            id: `e${agent.parentA}-${agent.id}-a`,
            source: String(agent.parentA),
            target: String(agent.id),
            animated: true,
            style: { stroke: '#8B5CF6', strokeWidth: 1.5 },
          });
        }
        if (agent.parentB !== null && agent.parentB !== agent.parentA) {
          edges.push({
            id: `e${agent.parentB}-${agent.id}-b`,
            source: String(agent.parentB),
            target: String(agent.id),
            animated: true,
            style: { stroke: '#06B6D4', strokeWidth: 1.5 },
          });
        }
      });
    });

    return { nodes, edges };
  }, [agents, selectedId]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const agent = agents.find(a => a.id === Number(node.id));
    if (agent) {
      setSelectedId(agent.id);
      onSelectAgent?.(agent);
    }
  }, [agents, onSelectAgent]);

  return (
    <div className="glass-card rounded-2xl overflow-hidden" style={{ height: 500 }}>
      <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
        <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Family Tree</span>
        <span className="text-[10px] text-text-muted font-mono">{agents.length} agents</span>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        style={{ background: '#0A0E1A' }}
      >
        <Background color="#1E2638" gap={20} size={1} />
        <Controls
          style={{ background: '#151B2E', borderColor: 'rgba(148,163,184,0.1)' }}
        />
        <MiniMap
          nodeColor={(n) => {
            const a = n.data?.agent as AgentGenome | undefined;
            if (!a) return '#64748B';
            if (!a.isAlive) return '#64748B';
            return a.totalPnl >= 0 ? '#10B981' : '#EF4444';
          }}
          style={{ background: '#0A0E1A', border: '1px solid rgba(148,163,184,0.1)' }}
        />
      </ReactFlow>
    </div>
  );
}
