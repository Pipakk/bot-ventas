import { NextResponse } from "next/server";
import { z } from "zod";
import { getBearerUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateScore } from "@/modules/scoring/calculateScore";
import { getAiReply } from "@/modules/ai-engine/chat";
import type { AiProvider } from "@/modules/ai-engine/types";

function cleanAnalysisText(raw: string): string {
  // Quitar markdown de negritas y bullets con asteriscos
  let txt = raw.replace(/\*\*(.+?)\*\*/g, "$1");
  txt = txt.replace(/^\s*\*\s+/gm, "- ");
  // Normalizar espacios y recortar
  return txt.trim();
}

const bodySchema = z.object({
  sessionId: z.string(),
  ai: z
    .object({
      provider: z.enum(["openai", "groq", "ollama"]).optional(),
      apiKey: z.string().optional(),
      scenarioName: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const userId = getBearerUserId(request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { sessionId, ai } = bodySchema.parse(body);
    const session = await prisma.callSession.findFirst({
      where: { id: sessionId, userId },
      include: { transcriptEntries: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }
    if (session.endedAt) {
      const existing = await prisma.scoreResult.findUnique({
        where: { sessionId },
      });
      if (existing) {
        return NextResponse.json({
          sessionId,
          endedAt: session.endedAt,
          durationSeconds: session.durationSeconds,
          score: existing,
        });
      }
    }

    const endedAt = new Date();
    const durationSeconds = Math.floor(
      (endedAt.getTime() - session.startedAt.getTime()) / 1000
    );
    await prisma.callSession.update({
      where: { id: sessionId },
      data: { endedAt, durationSeconds },
    });

    type TranscriptSegment = { speaker: "user" | "prospect"; text: string; startMs?: number; endMs?: number };
    const segments: TranscriptSegment[] = session.transcriptEntries.map((e: { speaker: string; text: string; startMs: number | null; endMs: number | null }) => ({
      speaker: e.speaker as "user" | "prospect",
      text: e.text,
      startMs: e.startMs ?? undefined,
      endMs: e.endMs ?? undefined,
    }));
    const scoreInput = {
      segments,
      durationSeconds,
      difficulty: session.difficulty,
    };
    const scoreResult = calculateScore(scoreInput);

    // Opcional: análisis experto con IA (solo si hay configuración AI válida)
    let expertAnalysis: string | null = null;
    if (ai?.provider && (ai.provider === "ollama" || ai.apiKey?.trim())) {
      try {
        const provider: AiProvider = ai.provider;
        const apiKey = ai.apiKey?.trim() ?? "";
        const industry = session.industry ?? "general";
        const prospectType = session.prospectType ?? "Business Owner";
        const personality = session.personality ?? "Polite but resistant";
        const scenarioName = ai.scenarioName ?? "Práctica libre";

        const transcriptText = segments
          .map((s) => `${s.speaker === "user" ? "Vendedor" : "Prospecto"}: ${s.text}`)
          .join("\n");

        const evaluationPrompt = `Actúa como un experto en ventas senior con más de 20 años de experiencia en ventas B2B y B2C, especializado en psicología de la persuasión, negociación y cierre.

Tu tarea es analizar la conversación completa entre el vendedor y el prospecto.

No repitas la conversación.
No hagas un resumen largo.
No seas genérico.
No uses frases motivacionales vacías.
No suavices en exceso los errores.

Sé claro, directo y profesional.

────────────────────────
CONTEXTO
────────────────────────

Escenario: ${scenarioName}
Industria: ${industry}
Tipo de prospecto: ${prospectType}
Personalidad del prospecto: ${personality}

Transcripción completa:
${transcriptText}

────────────────────────
ANALIZA EN PROFUNDIDAD
────────────────────────

Evalúa los siguientes aspectos:

1. Apertura
- ¿Captó atención?
- ¿Generó contexto?
- ¿Pidió permiso?
- ¿Fue claro o confuso?

2. Descubrimiento
- ¿Hizo preguntas relevantes?
- ¿Entendió dolor real?
- ¿Escuchó o solo habló?
- ¿Exploró impacto económico/emocional?

3. Adaptación al perfil
- ¿Se adaptó a la personalidad?
- ¿Detectó señales emocionales?
- ¿Ajustó velocidad y tono?

4. Gestión de objeciones
- ¿Respondió superficialmente?
- ¿Validó antes de argumentar?
- ¿Rebatió o entendió?
- ¿Convirtió objeciones en oportunidades?

5. Propuesta de valor
- ¿Habló de características o beneficios?
- ¿Cuantificó impacto?
- ¿Personalizó el mensaje?

6. Control de la conversación
- ¿Lideró o fue reactivo?
- ¿Hubo estructura?
- ¿Hubo momentos de pérdida de control?

7. Cierre
- ¿Intentó avanzar?
- ¿Fue prematuro?
- ¿Faltó compromiso claro?

────────────────────────
ENTREGA EL FEEDBACK EN ESTE FORMATO
────────────────────────

1️⃣ DIAGNÓSTICO GENERAL (máximo 6 líneas)
Evaluación honesta del nivel del vendedor.

2️⃣ ERRORES CLAVE
Lista concreta de los 3–5 errores más importantes.
Explica por qué impactaron negativamente.

3️⃣ OPORTUNIDADES PERDIDAS
Momentos donde podía profundizar más.

4️⃣ QUÉ HIZO BIEN
Aspectos positivos reales (si los hay).

5️⃣ CÓMO LO HARÍA UN VENDEDOR TOP 5%
Reescribe brevemente 2–3 momentos clave mostrando cómo debería haberse dicho.

6️⃣ CONSEJOS CONCRETOS PARA MEJORAR
Lista de 4–8 acciones prácticas y específicas para entrenar (en viñetas). Nada genérico como “escucha más” o “haz más preguntas”: cada consejo debe ser muy concreto, accionable y fácil de practicar en la próxima llamada.

7️⃣ PUNTUACIÓN FINAL
Evalúa del 1 al 10 en:
- Apertura
- Descubrimiento
- Gestión de objeciones
- Adaptación psicológica
- Cierre
- Nivel global

────────────────────────
NIVEL DE EXIGENCIA
────────────────────────

Si el desempeño es flojo → sé exigente.
Si es medio → explica cómo subir de nivel.
Si es alto → señala micro-mejoras de élite.

Habla como un mentor real, no como un chatbot motivacional.`;

        const { reply } = await getAiReply(
          {
            apiKey,
            provider,
            systemPrompt: evaluationPrompt,
            maxTokens: 900,
          },
          [{ role: "user", content: "Empieza el análisis ahora." }]
        );
        expertAnalysis = reply ? cleanAnalysisText(reply) : null;
      } catch {
        expertAnalysis = null;
      }
    }

    await prisma.scoreResult.create({
      data: {
        sessionId,
        totalScore: scoreResult.totalScore,
        objectionHandling: scoreResult.breakdown.objectionHandling,
        questionQuality: scoreResult.breakdown.questionQuality,
        conversationControl: scoreResult.breakdown.conversationControl,
        talkListenRatio: scoreResult.breakdown.talkListenRatio,
        confidence: scoreResult.breakdown.confidence,
        persistence: scoreResult.breakdown.persistence,
        spinUsage: scoreResult.breakdown.spinUsage,
        tonalityProxy: scoreResult.breakdown.tonalityProxy,
        breakdownJson: JSON.stringify(scoreResult.breakdown),
        suggestionsJson: JSON.stringify(scoreResult.suggestions),
        weakResponsesJson: JSON.stringify(scoreResult.weakResponses),
        expertAnalysis,
      },
    });

    return NextResponse.json({
      sessionId,
      endedAt,
      durationSeconds,
      score: {
        totalScore: scoreResult.totalScore,
        breakdown: scoreResult.breakdown,
        suggestions: scoreResult.suggestions,
        weakResponses: scoreResult.weakResponses,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al finalizar llamada" }, { status: 500 });
  }
}
