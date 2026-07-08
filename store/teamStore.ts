import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================
// TeamStore
// ============================================
// Stores the currently selected team ID globally.
// Persisted to localStorage so the selection survives page refresh.
//
// persist middleware automatically:
// - Saves state to localStorage on every change
// - Restores state from localStorage on page load

type TeamStore = {
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
  clearSelectedTeam: () => void;
};

export const useTeamStore = create<TeamStore>()(
  persist(
    (set) => ({
      selectedTeamId: null,

      setSelectedTeamId: (teamId) => set({ selectedTeamId: teamId }),

      clearSelectedTeam: () => set({ selectedTeamId: null }),
    }),
    {
      // Key used in localStorage
      name: "github-dashboard-team",

      // Only persist selectedTeamId — not the functions
      partialize: (state) => ({
        selectedTeamId: state.selectedTeamId,
      }),
    },
  ),
);
