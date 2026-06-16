"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark";
type ViewMode = "board" | "table" | "gantt" | "calendar";

type UiState = {
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  activeWorkspaceSlug?: string;
  activeSpaceId?: string;
  viewMode: ViewMode;
  commandPaletteOpen: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleSidebar: () => void;
  setActiveWorkspaceSlug: (slug: string) => void;
  setActiveSpaceId: (spaceId: string) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setCommandPaletteOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "dark",
      sidebarCollapsed: false,
      viewMode: "board",
      commandPaletteOpen: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setActiveWorkspaceSlug: (activeWorkspaceSlug) =>
        set({ activeWorkspaceSlug }),
      setActiveSpaceId: (activeSpaceId) => set({ activeSpaceId }),
      setViewMode: (viewMode) => set({ viewMode }),
      setCommandPaletteOpen: (commandPaletteOpen) =>
        set({ commandPaletteOpen }),
    }),
    { name: "pixel-cat-office-ui" },
  ),
);
