// Detección de intención por keywords y scoring heurístico (sin LLM)
import { OBJECTION_TEMPLATES } from "./objection-templates";
import type { IntentMatch } from "./types";

const NORMALIZE_MAP: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u",
  ñ: "n", ç: "c",
};

function normalize(text: string): string {
  let t = text.toLowerCase().trim();
  for (const [k, v] of Object.entries(NORMALIZE_MAP)) t = t.replace(new RegExp(k, "g"), v);
  return t;
}

function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter(Boolean);
}

export function detectIntent(userText: string): IntentMatch | null {
  const tokens = tokenize(userText);
  if (tokens.length === 0) return null;

  let best: IntentMatch | null = null;
  for (const template of OBJECTION_TEMPLATES) {
    let score = 0;
    const matched: string[] = [];
    for (const trigger of template.trigger) {
      const normTrigger = normalize(trigger);
      for (const token of tokens) {
        if (token === normTrigger || token.includes(normTrigger) || normTrigger.includes(token)) {
          score += 2;
          if (!matched.includes(trigger)) matched.push(trigger);
        }
      }
      if (tokens.some((t) => t.length > 2 && normTrigger.includes(t))) {
        score += 1;
        if (!matched.includes(trigger)) matched.push(trigger);
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { intent: template.trigger[0], score, keywords: matched };
    }
  }
  return best;
}

export function isGreetingOrIntro(userText: string): boolean {
  const t = normalize(userText);
  const greetings = ["hola", "buenos", "buenas", "buen", "día", "tarde", "soy", "llamo", "hablo", "le", "llamaba", "presento", "empresa"];
  const words = tokenize(userText);
  return words.some((w) => greetings.some((g) => w.includes(g) || g.includes(w))) || t.length < 20;
}

export function isClosing(userText: string): boolean {
  const t = normalize(userText);
  const closing = ["adiós", "adios", "hasta luego", "gracias", "nada más", "eso es todo", "cuando quiera", "un placer", "cerramos", "colgar"];
  return closing.some((c) => t.includes(c));
}
