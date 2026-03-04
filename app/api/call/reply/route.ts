import { NextResponse } from "next/server";
import { z } from "zod";
import { getBearerUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiReply } from "@/modules/ai-engine/chat";

const bodySchema = z.object({
  sessionId: z.string(),
  userText: z.string(),
  industry: z.string().optional(),
  difficulty: z.enum(["normal", "hard"]),
  prospectType: z.string().optional(),
  personality: z.string().optional(),
  aiApiKey: z.string().optional(),
  /** openai | groq | ollama — groq/ollama son opciones gratuitas */
  aiProvider: z.enum(["openai", "groq", "ollama"]).optional(),
  /** Contexto del escenario (para modo IA) */
  scenarioContext: z.string().optional(),
  messageHistory: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional(),
});

export async function POST(request: Request) {
  const userId = getBearerUserId(request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const data = bodySchema.parse(body);

    const session = await prisma.callSession.findFirst({
      where: { id: data.sessionId, userId },
    });
    if (!session) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }
    if (session.endedAt) {
      return NextResponse.json({ error: "Llamada ya finalizada" }, { status: 400 });
    }

    const messages = (data.messageHistory ?? []).concat([{ role: "user" as const, content: data.userText }]);
    const provider = data.aiProvider ?? "openai";
    const config = {
      apiKey: data.aiApiKey ?? "",
      provider,
      systemPrompt: undefined as string | undefined,
      prospectPersonality: data.personality,
      prospectType: data.prospectType,
      industry: data.industry,
      difficulty: data.difficulty,
      scenarioContext: data.scenarioContext,
    };
    const { reply } = await getAiReply(config, messages.map((m: { role: "user" | "assistant"; content: string }) => ({ role: m.role, content: m.content })));
    const delayMs = 300 + Math.floor(Math.random() * 400);
    return NextResponse.json({
      reply,
      delayMs,
      nextState: null,
      mood: "neutral",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
