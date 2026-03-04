/**
 * Ollama: 100% gratuito, corre en tu PC. No requiere API key.
 * Instalación: https://ollama.com — luego "ollama run llama3.2"
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

export async function getAiReplyOllama(config: AiEngineConfig, messages: AiMessage[]): Promise<AiReplyResult> {
  const baseUrl = (config.ollamaBaseUrl || "http://localhost:11434").replace(/\/$/, "");
  const systemContent = buildSystemPrompt(config);
  const ollamaMessages = [
    { role: "system" as const, content: systemContent },
    ...messages.map((m: AiMessage) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2",
      messages: ollamaMessages,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama error: ${res.status} ${err}. ¿Tienes Ollama en marcha? Ejecuta "ollama run llama3.2"`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  const content = data.message?.content?.trim() ?? "";
  return { reply: content };
}
