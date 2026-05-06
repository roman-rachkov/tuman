import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import agentsReducer from './slices/agentsSlice';
import jobsReducer from './slices/jobsSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    agents: agentsReducer,
    jobs: jobsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
