// Cálculo de puntuación post-llamada a partir del transcript y metadatos
export interface TranscriptSegment {
  speaker: "user" | "prospect";
  text: string;
  startMs?: number;
  endMs?: number;
}

export interface ScoreInput {
  segments: TranscriptSegment[];
  durationSeconds: number;
  difficulty: string;
}

export interface ScoreBreakdown {
  objectionHandling: number;
  questionQuality: number;
  conversationControl: number;
  talkListenRatio: number;
  confidence: number;
  persistence: number;
  spinUsage: number;
  tonalityProxy: number;
}

export interface ScoreResult {
  totalScore: number;
  breakdown: ScoreBreakdown;
  suggestions: string[];
  weakResponses: string[];
}

function sumUserTalkMs(segments: TranscriptSegment[]): number {
  let total = 0;
  for (const s of segments) {
    if (s.speaker !== "user") continue;
    if (s.startMs != null && s.endMs != null) total += Math.max(0, s.endMs - s.startMs);
    else if (s.text) total += Math.min(60000, s.text.length * 50);
  }
  return total;
}

function sumProspectTalkMs(segments: TranscriptSegment[]): number {
  let total = 0;
  for (const s of segments) {
    if (s.speaker !== "prospect") continue;
    if (s.startMs != null && s.endMs != null) total += Math.max(0, s.endMs - s.startMs);
    else if (s.text) total += Math.min(60000, s.text.length * 50);
  }
  return total;
}

const QUESTION_WORDS = ["qué", "cómo", "cuándo", "cuánto", "por qué", "quién", "cuál", "dónde", "?"];
const SPIN_WORDS = ["situación", "problema", "implicación", "necesidad", "beneficio", "resultado", "consecuencia"];

export function calculateScore(input: ScoreInput): ScoreResult {
  const { segments, durationSeconds, difficulty } = input;
  const durationMs = durationSeconds * 1000 || 1;
  const userMs = sumUserTalkMs(segments);
  const prospectMs = sumProspectTalkMs(segments);
  const totalTalk = userMs + prospectMs || 1;
  const talkListenRatio = prospectMs > 0 ? userMs / prospectMs : 1;
  const idealRatio = 0.4;
  const ratioScore = Math.max(0, 100 - Math.abs(talkListenRatio - idealRatio) * 50);

  const userTexts = segments.filter((s: TranscriptSegment) => s.speaker === "user").map((s: TranscriptSegment) => s.text);
  const prospectTexts = segments.filter((s: TranscriptSegment) => s.speaker === "prospect").map((s: TranscriptSegment) => s.text);
  const questionCount = userTexts.filter((t: string) => QUESTION_WORDS.some((q: string) => t.toLowerCase().includes(q)) || t.includes("?")).length;
  const questionQuality = Math.min(100, questionCount * 12 + 30);

  const spinCount = userTexts.reduce((acc: number, t: string) => acc + SPIN_WORDS.filter((w: string) => t.toLowerCase().includes(w)).length, 0);
  const spinUsage = Math.min(100, spinCount * 15 + 20);

  const objectionCount = prospectTexts.length;
  const objectionHandling = objectionCount === 0 ? 70 : Math.min(100, 30 + objectionCount * 8 + Math.min(40, userTexts.length * 5));

  const controlScore = userTexts.length >= 2 && prospectTexts.length >= 1 ? 70 : userTexts.length >= 1 ? 50 : 30;
  const confidence = Math.min(100, userTexts.length * 6 + 40);
  const persistence = Math.min(100, userTexts.length * 4 + objectionCount * 5);

  const avgLen = userTexts.reduce((a: number, t: string) => a + t.length, 0) / (userTexts.length || 1);
  const tonalityProxy = avgLen > 20 && avgLen < 120 ? 75 : avgLen <= 20 ? 60 : 70;

  const breakdown: ScoreBreakdown = {
    objectionHandling,
    questionQuality,
    conversationControl: controlScore,
    talkListenRatio: Math.round(talkListenRatio * 100) / 100,
    confidence,
    persistence,
    spinUsage,
    tonalityProxy,
  };

  const totalScore = Math.round(
    (breakdown.objectionHandling * 0.2 +
      breakdown.questionQuality * 0.15 +
      breakdown.conversationControl * 0.2 +
      ratioScore * 0.15 +
      breakdown.confidence * 0.1 +
      breakdown.persistence * 0.1 +
      breakdown.spinUsage * 0.05 +
      breakdown.tonalityProxy * 0.05)
  );

  const suggestions: string[] = [];
  if (ratioScore < 60) suggestions.push("Intenta escuchar más y hablar menos; el ratio ideal está alrededor de 40% tú / 60% prospecto.");
  if (questionQuality < 50) suggestions.push("Haz más preguntas abiertas (qué, cómo, por qué) para guiar la conversación.");
  if (spinUsage < 50) suggestions.push("Introduce preguntas tipo SPIN (Situación, Problema, Implicación, Necesidad) para profundizar.");
  if (objectionHandling < 60) suggestions.push("Practica respuestas breves a objeciones habituales (precio, tiempo, competencia).");
  if (suggestions.length === 0) suggestions.push("Sigue practicando para afinar el ritmo y el cierre.");

  const weakResponses = userTexts.filter((t: string) => t.length < 10 && t.length > 0).slice(0, 5);

  return {
    totalScore: Math.max(0, Math.min(100, totalScore)),
    breakdown,
    suggestions,
    weakResponses,
  };
}
