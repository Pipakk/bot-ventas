import { NextResponse } from "next/server";
import { getBearerUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const userId = getBearerUserId(request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const sessions = await prisma.callSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: limit,
    select: {
      id: true,
      mode: true,
      difficulty: true,
      industry: true,
      prospectType: true,
      personality: true,
      durationSeconds: true,
      startedAt: true,
      endedAt: true,
      scoreResult: {
        select: { totalScore: true },
      },
    },
  });
  const list = sessions.map((s: typeof sessions[number]) => ({
    id: s.id,
    mode: s.mode,
    difficulty: s.difficulty,
    industry: s.industry,
    prospectType: s.prospectType,
    personality: s.personality,
    durationSeconds: s.durationSeconds,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    totalScore: s.scoreResult?.totalScore ?? null,
  }));
  return NextResponse.json({ sessions: list });
}
