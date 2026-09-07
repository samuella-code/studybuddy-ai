import { create } from "zustand";

import type { User } from "../services/api";
import { clearStoredSession, loadSession, saveSession } from "../services/auth-storage";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  hydrated: boolean;
  setSession: (user: User, accessToken: string) => void;
  hydrate: () => Promise<void>;
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  hydrated: false,
  setSession: (user, accessToken) => {
    set({ user, accessToken });
    void saveSession(accessToken, user);
  },
  hydrate: async () => {
    const session = await loadSession();
    set(session ? { user: session.user, accessToken: session.token, hydrated: true } : { hydrated: true });
  },
  clearSession: async () => {
    await clearStoredSession();
    set({ user: null, accessToken: null });
  },
}));
