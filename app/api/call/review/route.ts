import { NextResponse } from "next/server";
import { z } from "zod";
import { getBearerUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateScore } from "@/modules/scoring/calculateScore";
import { getAiReply } from "@/modules/ai-engine/chat";
import type { AiProvider } from "@/modules/ai-engine/types";

function cleanAnalysisText(raw: string): string {
  let txt = raw.replace(/\*\*(.+?)\*\*/g, "$1");
  txt = txt.replace(/^\s*\*\s+/gm, "- ");
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

    const durationSeconds =
      session.durationSeconds ??
      Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

    const segments = session.transcriptEntries.map((e) => ({
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
    const scoreResultHeuristic = calculateScore(scoreInput);

    // Valores base heurísticos que podremos sobreescribir con la IA
    let totalScore = scoreResultHeuristic.totalScore;
    let objectionHandling = scoreResultHeuristic.breakdown.objectionHandling;
    let questionQuality = scoreResultHeuristic.breakdown.questionQuality;
    let conversationControl = scoreResultHeuristic.breakdown.conversationControl;
    let talkListenRatio = scoreResultHeuristic.breakdown.talkListenRatio;
    let confidence = scoreResultHeuristic.breakdown.confidence;
    let persistence = scoreResultHeuristic.breakdown.persistence;
    let spinUsage = scoreResultHeuristic.breakdown.spinUsage;
    let tonalityProxy = scoreResultHeuristic.breakdown.tonalityProxy;

    let suggestions = scoreResultHeuristic.suggestions;
    let weakResponses = scoreResultHeuristic.weakResponses;

    // Análisis experto con IA (solo si hay configuración válida)
    let expertAnalysis: string | null = null;
    if (ai?.provider && (ai.provider === "ollama" || ai.apiKey?.trim())) {
      const provider: AiProvider = ai.provider;
      const apiKey = ai.apiKey?.trim() ?? "";
      const industry = session.industry ?? "general";
      const prospectType = session.prospectType ?? "Business Owner";
      const personality = session.personality ?? "Polite but resistant";
      const scenarioName = ai.scenarioName ?? "Práctica libre";

      const transcriptText = segments
        .map((s) => `${s.speaker === "user" ? "Vendedor" : "Prospecto"}: ${s.text}`)
        .join("\n");

      // 1) Pedimos a la IA métricas numéricas 1-10 para mapear a nuestros campos (0-100)
      try {
        const metricsPrompt = `Eres un experto en ventas senior. Analiza la siguiente conversación (vendedor vs prospecto) y devuelve SOLO un JSON válido, sin texto adicional, con esta estructura:
{
  "apertura": number,            // 1-10
  "descubrimiento": number,      // 1-10
  "gestion_objeciones": number,  // 1-10
  "adaptacion_psicologica": number, // 1-10
  "cierre": number,              // 1-10
  "nivel_global": number         // 1-10
}

La conversación es:
${transcriptText}`;

        const metricsReply = await getAiReply(
          {
            apiKey,
            provider,
            systemPrompt: metricsPrompt,
            maxTokens: 300,
          },
          [{ role: "user", content: "Devuelve solo el JSON solicitado, sin explicación adicional." }]
        );

        if (metricsReply.reply) {
          const parsed = JSON.parse(metricsReply.reply) as {
            apertura?: number;
            descubrimiento?: number;
            gestion_objeciones?: number;
            adaptacion_psicologica?: number;
            cierre?: number;
            nivel_global?: number;
          };

          const clamp10 = (v: unknown, fallback: number) => {
            const n = typeof v === "number" ? v : fallback;
            return Math.max(1, Math.min(10, n));
          };

          const apertura = clamp10(parsed.apertura, 7);
          const descubrimiento = clamp10(parsed.descubrimiento, 7);
          const gestion = clamp10(parsed.gestion_objeciones, 7);
          const adaptacion = clamp10(parsed.adaptacion_psicologica, 7);
          const cierre = clamp10(parsed.cierre, 7);
          const global = clamp10(parsed.nivel_global, 7);

          // Mapear 1-10 a 0-100
          totalScore = global * 10;
          objectionHandling = gestion * 10;
          questionQuality = descubrimiento * 10;
          conversationControl = apertura * 10;
          confidence = adaptacion * 10;
          persistence = Math.round(((descubrimiento + gestion) / 2) * 10);
          // Mantenemos SPIN y tonalidad del cálculo heurístico
          spinUsage = scoreResultHeuristic.breakdown.spinUsage;
          tonalityProxy = scoreResultHeuristic.breakdown.tonalityProxy;
        }
      } catch {
        // Si falla el parseo o la llamada, mantenemos los valores heurísticos
      }

      // 2) Generamos el análisis cualitativo siguiendo tu plantilla
      try {
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

    const dataToSave = {
      totalScore,
      objectionHandling,
      questionQuality,
      conversationControl,
      talkListenRatio,
      confidence,
      persistence,
      spinUsage,
      tonalityProxy,
      breakdownJson: JSON.stringify({
        objectionHandling,
        questionQuality,
        conversationControl,
        talkListenRatio,
        confidence,
        persistence,
        spinUsage,
        tonalityProxy,
      }),
      suggestionsJson: JSON.stringify(suggestions),
      weakResponsesJson: JSON.stringify(weakResponses),
      expertAnalysis,
    };

    const existing = await prisma.scoreResult.findUnique({ where: { sessionId } });
    if (existing) {
      await prisma.scoreResult.update({
        where: { sessionId },
        data: dataToSave,
      });
    } else {
      await prisma.scoreResult.create({
        data: {
          sessionId,
          ...dataToSave,
        },
      });
    }

    return NextResponse.json({
      score: {
        ...dataToSave,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al analizar la llamada" }, { status: 500 });
  }
}

