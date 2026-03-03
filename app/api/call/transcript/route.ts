import { NextResponse } from "next/server";
import { z } from "zod";
import { getBearerUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  sessionId: z.string(),
  entries: z.array(
    z.object({
      speaker: z.enum(["user", "prospect"]),
      text: z.string(),
      startMs: z.number().optional(),
      endMs: z.number().optional(),
    })
  ),
});

export async function POST(request: Request) {
  const userId = getBearerUserId(request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { sessionId, entries } = bodySchema.parse(body);
    const session = await prisma.callSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }
    await prisma.transcriptEntry.createMany({
      data: entries.map((e) => ({
        sessionId,
        speaker: e.speaker,
        text: e.text,
        startMs: e.startMs ?? null,
        endMs: e.endMs ?? null,
      })),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al guardar transcript" }, { status: 500 });
  }
}
