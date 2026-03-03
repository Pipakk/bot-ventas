export type AiProvider = "openai" | "groq" | "ollama";

export interface AiEngineConfig {
  apiKey: string;
  provider?: AiProvider;
  ollamaBaseUrl?: string;
  systemPrompt?: string;
  prospectPersonality?: string;
  prospectType?: string;
  industry?: string;
  difficulty?: string;
  /** Contexto del escenario elegido (web, sales-training, loyalty-salon) para enriquecer el prompt */
  scenarioContext?: string;
  /** Límite de tokens para la respuesta (solo modelos OpenAI/Groq) */
  maxTokens?: number;
}

export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiReplyResult {
  reply: string;
  finishReason?: string;
}
