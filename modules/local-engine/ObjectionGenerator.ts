// Genera la respuesta del prospecto según estado, perfil y dificultad. Sin IA.
import { OBJECTION_TEMPLATES, GREETING_TEMPLATES, CLOSE_TEMPLATES, ACKNOWLEDGMENT_PHRASES } from "./objection-templates";
import { detectIntent, isGreetingOrIntro, isClosing } from "./intent-detection";
import type { ConversationState, ProspectProfile, Difficulty, Personality } from "./types";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function delayMs(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function moodFromPersonality(p: Personality, difficulty: Difficulty): "neutral" | "skeptical" | "annoyed" | "interested" {
  if (p === "Hostile" || (p === "Impatient" && difficulty === "hard")) return "annoyed";
  if (p === "Skeptical") return "skeptical";
  if (p === "Polite but resistant") return "neutral";
  return "neutral";
}

export function getHumanDelayMs(difficulty: Difficulty): number {
  return difficulty === "hard"
    ? delayMs(400, 900)
    : delayMs(600, 1600);
}

export function shouldInterrupt(difficulty: Difficulty, turnIndex: number): boolean {
  if (difficulty !== "hard") return false;
  return turnIndex > 2 && Math.random() < 0.35;
}

export interface GenerateReplyInput {
  userText: string;
  state: ConversationState;
  profile: ProspectProfile;
}

export interface GenerateReplyOutput {
  reply: string;
  nextPhase: ConversationState["phase"];
  nextMood: ConversationState["prospectMood"];
  interrupt: boolean;
  delayMs: number;
}

export function generateReply(input: GenerateReplyInput): GenerateReplyOutput {
  const { userText, state, profile } = input;
  const { difficulty, personality } = profile;
  const interrupt = shouldInterrupt(difficulty, state.turnIndex);

  const delayMs = getHumanDelayMs(difficulty);
  const personalityKey = personality === "Polite but resistant" ? "polite" : personality.toLowerCase();
  const moodKey = `${difficulty}_${personalityKey}` as keyof typeof GREETING_TEMPLATES;
  const greetingSet = GREETING_TEMPLATES[moodKey] ?? GREETING_TEMPLATES["normal_neutral"];

  if (state.phase === "greeting") {
    return {
      reply: pickRandom(greetingSet),
      nextPhase: "intro",
      nextMood: moodFromPersonality(personality, difficulty),
      interrupt: false,
      delayMs,
    };
  }

  if (isClosing(userText)) {
    return {
      reply: pickRandom(CLOSE_TEMPLATES),
      nextPhase: "hangup",
      nextMood: state.prospectMood,
      interrupt: false,
      delayMs,
    };
  }

  const intent = detectIntent(userText);
  if (intent) {
    const template = OBJECTION_TEMPLATES.find((t) => t.trigger.includes(intent!.intent) || t.trigger.some((tr) => intent!.keywords.includes(tr)));
    const responses = template ? (difficulty === "hard" ? template.hard : template.normal) : (difficulty === "hard" ? ["No me cuadra. Siguiente."] : ["No estoy seguro. ¿Tiene algo más?"]);
    let reply = pickRandom(responses);
    if (reply.length > 15 && Math.random() < 0.5) {
      const ack = pickRandom(ACKNOWLEDGMENT_PHRASES);
      reply = ack + reply.charAt(0).toLowerCase() + reply.slice(1);
    }
    const nextMood = difficulty === "hard" && state.prospectMood === "neutral" ? "skeptical" : difficulty === "hard" ? "annoyed" : state.prospectMood;
    return {
      reply,
      nextPhase: "objection",
      nextMood: nextMood as ConversationState["prospectMood"],
      interrupt,
      delayMs,
    };
  }

  if (isGreetingOrIntro(userText) && state.phase === "intro") {
    return {
      reply: difficulty === "hard"
        ? "Vale, ¿y eso a mí qué me importa? Sea breve."
        : "Vale, ¿en qué consiste exactamente?",
      nextPhase: "objection",
      nextMood: state.prospectMood,
      interrupt: false,
      delayMs,
    };
  }

  const fallback = difficulty === "hard"
    ? ["No me ha quedado claro. Repita.", "Siguiente.", "¿Algo más?"]
    : ["No estoy seguro de qué me está ofreciendo.", "¿Puede concretar un poco?", "¿Qué ventaja tendría para nosotros?"];
  return {
    reply: pickRandom(fallback),
    nextPhase: state.phase === "greeting" ? "intro" : "objection",
    nextMood: state.prospectMood,
    interrupt: false,
    delayMs,
  };
}

export function createInitialState(profile: ProspectProfile): ConversationState {
  return {
    phase: "greeting",
    turnIndex: 0,
    objectionHistory: [],
    lastUserIntent: null,
    prospectMood: "neutral",
    interruptedCount: 0,
  };
}
