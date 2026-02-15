import type { BackgroundJob } from '@quiz/api-client';
import { create } from 'zustand';

interface JobState {
  jobs: BackgroundJob[];
  isPolling: boolean;
  setJobs: (jobs: BackgroundJob[]) => void;
  updateJob: (job: BackgroundJob) => void;
  removeJob: (jobId: string) => void;
  setPolling: (val: boolean) => void;
  clearAll: () => void;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  isPolling: false,
  setJobs: (jobs) => set({ jobs }),
  updateJob: (job) => set((state) => ({
    jobs: [...state.jobs.filter(j => j.id !== job.id), job]
  })),
  removeJob: (jobId) => set((state) => ({
    jobs: state.jobs.filter(j => j.id !== jobId)
  })),
  setPolling: (val) => set({ isPolling: val }),
  clearAll: () => set({ jobs: [], isPolling: false }),
}));
