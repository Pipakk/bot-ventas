/**
 * Punto único para respuestas IA: elige OpenAI, Groq o Ollama según config.provider.
 */
import type { AiEngineConfig, AiMessage, AiReplyResult } from "./types";
import { getAiReply as getOpenAiReply } from "./openai-client";
import { getAiReplyGroq } from "./groq-client";
import { getAiReplyOllama } from "./ollama-client";

export async function getAiReply(config: AiEngineConfig, messages: AiMessage[]): Promise<AiReplyResult> {
  const provider = config.provider ?? "openai";
  switch (provider) {
    case "groq":
      return getAiReplyGroq(config, messages);
    case "ollama":
      return getAiReplyOllama(config, messages);
    case "openai":
    default:
      return getOpenAiReply(config, messages);
  }
}
