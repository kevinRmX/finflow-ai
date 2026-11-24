import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

// Los tokens viven en el Keychain (iOS) / Keystore (Android), nunca en AsyncStorage.
const KEY = 'finflow.session';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  currency: string;
  locale: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface SessionState {
  ready: boolean;
  user: SessionUser | null;
  tokens: Tokens | null;
  /** Se pide Face ID / huella al volver a la app. */
  locked: boolean;
  load: () => Promise<void>;
  signIn: (user: SessionUser, tokens: Tokens) => Promise<void>;
  setTokens: (tokens: Tokens) => Promise<void>;
  signOut: () => Promise<void>;
  setLocked: (locked: boolean) => void;
}

export const useSession = create<SessionState>((set, get) => ({
  ready: false,
  user: null,
  tokens: null,
  locked: false,
  async load() {
    const raw = await SecureStore.getItemAsync(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { user: SessionUser; tokens: Tokens };
      set({ user: saved.user, tokens: saved.tokens, locked: true });
    }
    set({ ready: true });
  },
  async signIn(user, tokens) {
    await SecureStore.setItemAsync(KEY, JSON.stringify({ user, tokens }));
    set({ user, tokens, locked: false });
  },
  async setTokens(tokens) {
    const { user } = get();
    if (user) await SecureStore.setItemAsync(KEY, JSON.stringify({ user, tokens }));
    set({ tokens });
  },
  async signOut() {
    await SecureStore.deleteItemAsync(KEY);
    set({ user: null, tokens: null, locked: false });
  },
  setLocked(locked) {
    set({ locked });
  },
}));
