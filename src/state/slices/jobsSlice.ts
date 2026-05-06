import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Job } from '../../core/jobs/types';

interface JobsState {
  jobs: Record<string, Job>;
}

const initialState: JobsState = {
  jobs: {},
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    addJob(state, action: PayloadAction<Job>) {
      state.jobs[action.payload.id] = action.payload;
    },
    updateJob(state, action: PayloadAction<Partial<Job> & { id: string }>) {
      const { id, ...updates } = action.payload;
      if (state.jobs[id]) {
        Object.assign(state.jobs[id], updates);
      }
    },
    removeJob(state, action: PayloadAction<string>) {
      delete state.jobs[action.payload];
    },
  },
});

export const { addJob, updateJob, removeJob } = jobsSlice.actions;
export default jobsSlice.reducer;
