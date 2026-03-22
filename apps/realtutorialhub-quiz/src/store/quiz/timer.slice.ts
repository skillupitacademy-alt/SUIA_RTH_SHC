import { StateCreator } from 'zustand';

export interface TimerSlice {
  timeLeft: number;
  updateTimer: () => void;
  updateTimeLeft: () => void; // Alias
  setTimeRemaining: (time: number) => void;
  resetTimer: () => void;
}

export const createTimerSlice: StateCreator<TimerSlice> = (set, get) => ({
  timeLeft: 0,
  updateTimer: () => set((state) => ({
    timeLeft: state.timeLeft > 0 ? state.timeLeft - 1 : 0
  })),
  updateTimeLeft: () => get().updateTimer(),
  setTimeRemaining: (time) => set({ timeLeft: time }),
  resetTimer: () => set({ timeLeft: 0 })
});
