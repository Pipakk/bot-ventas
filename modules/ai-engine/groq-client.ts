/**
 * Groq: API gratuita con registro (console.groq.com).
 * Compatible con formato OpenAI.
 */
import type { AiEngineConfig, AiMessage, AiReplyResult } from "./types";

const DEFAULT_SYSTEM = `Eres una persona real en España que acaba de coger una llamada en frío (cold call). Actúa como alguien que ha descolgado el teléfono: directo, sin rodeos, sin ser proactivo ni dar la bienvenida elaborada. Reglas estrictas: (1) Responde en UNA frase corta, a lo sumo dos. (2) NUNCA hagas dos preguntas seguidas ni preguntas tipo "¿De qué se trata?" o "¿Tienes algún producto que presentar?" al inicio; eso suena a IA. (3) Al abrir, di solo cosas como: "Sí, dígame", "Diga", "¿Qué quiere?", "Vale, ¿y qué?", "Dígame" — como una persona real que coge y espera. (4) No expliques que eres una IA ni hables de datos, bases de datos o registros. (5) Si no conoces a alguien que nombran, responde como un humano (ej: "No le conozco", "¿Quién?", "Aquí no hay nadie con ese nombre") sin mencionar "no tengo información". Sé breve y natural, como en una llamada real.`;

function buildSystemPrompt(config: AiEngineConfig): string {
  const base = config.systemPrompt?.trim() || DEFAULT_SYSTEM;
  const parts = [base];
  if (config.prospectPersonality) parts.push(`Personalidad: ${config.prospectPersonality}.`);
  if (config.prospectType) parts.push(`Tipo: ${config.prospectType}.`);
  if (config.industry) parts.push(`Sector: ${config.industry}.`);
  if (config.difficulty) parts.push(`Resistencia: ${config.difficulty}.`);
  if (config.scenarioContext?.trim()) {
    const industry = config.industry || "general";
    const prospectType = config.prospectType || "Business Owner";
    const personality = config.prospectPersonality || "Polite but resistant";
    let ctx = config.scenarioContext
      .replace(/{{industry}}/g, industry)
      .replace(/{{prospect_type}}/g, prospectType)
      .replace(/{{personality}}/g, personality);
    parts.push(ctx.trim());
    parts.push(
      "ESTADO INTERNO DINÁMICO:\nInterés inicial: 3/10\nConfianza inicial: 2/10\nPaciencia inicial: depende de personalidad.\nAjusta estos niveles según la calidad del vendedor. No lo menciones explícitamente."
    );
  }
  return parts.join(" ");
}

export async function getAiReplyGroq(config: AiEngineConfig, messages: AiMessage[]): Promise<AiReplyResult> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) throw new Error("API key de Groq necesaria. Regístrate gratis en console.groq.com");

  const systemContent = buildSystemPrompt(config);
  const body = {
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemContent },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: config.maxTokens ?? 150,
    temperature: 0.8,
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string }; finish_reason?: string }> };
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  return { reply: content, finishReason: data.choices?.[0]?.finish_reason };
}
