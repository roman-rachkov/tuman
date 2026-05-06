import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Agent } from '../../core/agents/types';

interface AgentsState {
  agents: Record<string, Agent>;
}

const initialState: AgentsState = {
  agents: {
    agent_1: {
      id: 'agent_1',
      name: 'Волк',
      currentNodeId: 'n_0',
      state: 'idle',
      inventory: {},
      speed: 1.5,
    },
    agent_2: {
      id: 'agent_2',
      name: 'Лиса',
      currentNodeId: 'n_211',
      state: 'idle',
      inventory: {},
      speed: 2.0,
    },
  },
};

const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {
    updateAgent(state, action: PayloadAction<Partial<Agent> & { id: string }>) {
      const { id, ...updates } = action.payload;
      if (state.agents[id]) {
        Object.assign(state.agents[id], updates);
      }
    },
    setAgentPosition(state, action: PayloadAction<{ id: string; lat: number; lng: number; nodeId?: string }>) {
      const { id, lat, lng, nodeId } = action.payload;
      if (state.agents[id]) {
        state.agents[id].positionLat = lat;
        state.agents[id].positionLng = lng;
        if (nodeId) state.agents[id].currentNodeId = nodeId;
      }
    },
  },
});

export const { updateAgent, setAgentPosition } = agentsSlice.actions;
export default agentsSlice.reducer;
