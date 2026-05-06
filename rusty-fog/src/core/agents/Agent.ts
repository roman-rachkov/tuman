export type AgentState = 'idle' | 'moving_to_start' | 'executing' | 'moving_to_end';
export type AgentPersonality = 'greedy' | 'altruist' | 'coward';

export interface AgentSkills {
  repair: number;
  combat: number;
  stealth: number;
}

export interface AgentNeeds {
  hunger: number;
  thirst: number;
}

export interface Agent {
  id: string;
  name: string;
  currentNodeId: string;
  state: AgentState;
  inventory: Map<string, number>;
  skills: AgentSkills;
  needs: AgentNeeds;
  personality: AgentPersonality;
  currentJobId?: string;
  targetNodePath?: string[];
  positionLatLng?: { lat: number; lng: number };
}

export function createAgent(
  id: string,
  name: string,
  currentNodeId: string,
  personality: AgentPersonality = 'greedy'
): Agent {
  return {
    id,
    name,
    currentNodeId,
    state: 'idle',
    inventory: new Map(),
    skills: { repair: 1, combat: 1, stealth: 1 },
    needs: { hunger: 0, thirst: 0 },
    personality,
  };
}
