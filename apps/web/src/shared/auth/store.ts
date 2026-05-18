import { create } from "zustand";
import { persist } from "zustand/middleware";

import { PortalModule, User } from "../api/types";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  permissions: string[];
  modules: PortalModule[];
  setSession: (accessToken: string, refreshToken: string, user: User) => void;
  setPermissions: (permissions: string[]) => void;
  setModules: (modules: PortalModule[]) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      permissions: [],
      modules: [],
      setSession: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),
      setPermissions: (permissions) => set({ permissions }),
      setModules: (modules) => set({ modules }),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          permissions: [],
          modules: [],
        }),
    }),
    { name: "portal-vesper-session" },
  ),
);
