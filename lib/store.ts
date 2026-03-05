import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScenarioId } from "./scenarios";

export interface UserInfo {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  setAuth: (token: string, user: UserInfo) => void;
  logout: () => void;
  isPro: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isPro: () => get().user?.role === "pro",
    }),
    { name: "coldcall-auth" }
  )
);

export type AiProviderOption = "openai" | "groq" | "ollama";

/** Escenario personalizado guardado (vista resumida) */
export interface CustomScenarioSummary {
  id: string;
  name: string;
  prospectName: string;
  industry: string;
  personality: string;
  difficulty: string;
  prepNotes: string | null;
}

interface CallConfigState {
  industry: string;
  difficulty: "normal" | "hard";
  prospectType: string;
  personality: string;
  /** Escenario de práctica: free = práctica libre; web, sales-training, loyalty-salon = escenarios fijos */
  scenarioId: ScenarioId;
  /**
   * Si el usuario seleccionó un escenario personalizado, aquí va su ID de BD.
   * Cuando está activo, scenarioId debería ser "free" y scenarioContext contiene el prompt.
   */
  customScenarioId: string | null;
  /** Prompt del escenario personalizado seleccionado (sólo en memoria) */
  customScenarioPrompt: string;
  aiApiKey: string;
  aiProvider: AiProviderOption;
  selectedVoiceUri: string;
  setConfig: (c: Partial<CallConfigState>) => void;
}

export const useCallConfigStore = create<CallConfigState>()(
  persist(
    (set) => ({
      industry: "general",
      difficulty: "normal",
      prospectType: "Business Owner",
      personality: "Polite but resistant",
      scenarioId: "free",
      customScenarioId: null,
      customScenarioPrompt: "",
      aiApiKey: "",
      aiProvider: "groq",
      selectedVoiceUri: "",
      setConfig: (c) => set((s) => ({ ...s, ...c })),
    }),
    { name: "coldcall-config" }
  )
);
