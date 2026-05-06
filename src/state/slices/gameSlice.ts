import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GameSliceState {
  version: string;
  currentTime: number;
  isRunning: boolean;
  resources: Record<string, number>;
  selectedAgentId?: string;
  selectedBuildingId?: string;
  modal: null | { type: 'newJob' | 'event'; data: unknown };
  log: string[];
}

const initialState: GameSliceState = {
  version: '0.1.0',
  currentTime: 0,
  isRunning: false,
  resources: { food: 100, water: 50, scrap: 20 },
  modal: null,
  log: ['Игра началась. Добро пожаловать в Приморск.'],
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    tick(state) {
      state.currentTime += 1;
    },
    setRunning(state, action: PayloadAction<boolean>) {
      state.isRunning = action.payload;
    },
    selectAgent(state, action: PayloadAction<string | undefined>) {
      state.selectedAgentId = action.payload;
    },
    selectBuilding(state, action: PayloadAction<string | undefined>) {
      state.selectedBuildingId = action.payload;
    },
    openModal(state, action: PayloadAction<{ type: 'newJob' | 'event'; data: unknown }>) {
      state.modal = action.payload;
    },
    closeModal(state) {
      state.modal = null;
    },
    addLog(state, action: PayloadAction<string>) {
      state.log.unshift(`[${state.currentTime}] ${action.payload}`);
      if (state.log.length > 100) state.log.pop();
    },
    spendResource(state, action: PayloadAction<{ resource: string; amount: number }>) {
      const { resource, amount } = action.payload;
      state.resources[resource] = Math.max(0, (state.resources[resource] ?? 0) - amount);
    },
    gainResource(state, action: PayloadAction<{ resource: string; amount: number }>) {
      const { resource, amount } = action.payload;
      state.resources[resource] = (state.resources[resource] ?? 0) + amount;
    },
  },
});

export const { tick, setRunning, selectAgent, selectBuilding, openModal, closeModal, addLog, spendResource, gainResource } = gameSlice.actions;
export default gameSlice.reducer;
