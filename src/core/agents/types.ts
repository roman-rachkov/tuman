export type AgentState = 'idle' | 'moving_to_start' | 'executing' | 'moving_to_end';

export interface Agent {
  id: string;
  name: string;
  currentNodeId: string;
  state: AgentState;
  inventory: Record<string, number>;
  speed: number;
  currentJobId?: string;
  targetNodePath?: string[];
  positionLat?: number;
  positionLng?: number;
  pathProgress?: number;
  pathSegment?: number;
}
