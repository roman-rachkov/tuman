import React from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { selectAgent } from '../../../state/slices/gameSlice';
import graphData from '../../../assets/maps/snow_valley.json';
import { GraphNode } from '../../../core/graph/types';

const nodesMap: Record<string, GraphNode> = {};
for (const n of graphData.nodes as GraphNode[]) nodesMap[n.id] = n;

const STATE_LABEL: Record<string, string> = {
  idle: 'Ждёт',
  moving_to_start: 'В пути',
  executing: 'Выполняет',
  moving_to_end: 'Возвращается',
};

const STATE_CLASS: Record<string, string> = {
  idle: 'state-idle',
  moving_to_start: 'state-moving',
  executing: 'state-executing',
  moving_to_end: 'state-moving',
};

export default function AgentPanel() {
  const dispatch = useAppDispatch();
  const agentsMap = useAppSelector(s => s.agents.agents);
  const agents = Object.values(agentsMap);
  const selectedId = useAppSelector(s => s.game.selectedAgentId);

  return (
    <div className="panel">
      <div className="panel-header">Агенты ({agents.length})</div>
      <div className="panel-content">
        {agents.map(agent => (
          <div
            key={agent.id}
            className={`agent-row ${agent.id === selectedId ? 'selected' : ''}`}
            onClick={() => dispatch(selectAgent(agent.id === selectedId ? undefined : agent.id))}
          >
            <span>{agent.name}</span>
            <span className={`agent-state ${STATE_CLASS[agent.state] || ''}`}>
              {STATE_LABEL[agent.state] || agent.state}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
