import { NextResponse } from "next/server";
import { z } from "zod";
import { getBearerUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canStartCall } from "@/lib/usage-limits";

const bodySchema = z.object({
  industry: z.string().optional(),
  difficulty: z.enum(["normal", "hard"]),
  prospectType: z.string().optional(),
  personality: z.string().optional(),
  aiApiKey: z.string().optional(),
  aiProvider: z.enum(["openai", "groq", "ollama"]).optional(),
});

export async function POST(request: Request) {
  const userId = getBearerUserId(request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const data = bodySchema.parse(body);

    const { allowed, reason } = await canStartCall(userId);
    if (!allowed) {
      return NextResponse.json(
        { error: reason ?? "Has alcanzado el límite de llamadas para tu plan." },
        { status: 403 }
      );
    }
    const provider = data.aiProvider ?? "openai";
    if (provider !== "ollama" && !data.aiApiKey?.trim()) {
      return NextResponse.json(
        { error: provider === "groq" ? "API key de Groq requerida (gratis en console.groq.com)" : "API key de OpenAI requerida" },
        { status: 400 }
      );
    }

    const session = await prisma.callSession.create({
      data: {
        userId,
        mode: "ai",
        industry: data.industry ?? null,
        difficulty: data.difficulty,
        prospectType: data.prospectType ?? null,
        personality: data.personality ?? null,
      },
    });
    return NextResponse.json({
      sessionId: session.id,
      difficulty: session.difficulty,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al iniciar llamada" }, { status: 500 });
  }
}
