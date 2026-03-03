import { NextResponse } from "next/server";
import { getBearerUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const userId = getBearerUserId(_request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const session = await prisma.callSession.findFirst({
    where: { id: params.sessionId, userId },
    include: {
      transcriptEntries: { orderBy: { createdAt: "asc" } },
      scoreResult: true,
    },
  });
  if (!session) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }
  const score = session.scoreResult;
  return NextResponse.json({
    session: {
      id: session.id,
      mode: session.mode,
      difficulty: session.difficulty,
      durationSeconds: session.durationSeconds,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    },
    transcript: session.transcriptEntries,
    score: score
      ? {
          totalScore: score.totalScore,
          objectionHandling: score.objectionHandling,
          questionQuality: score.questionQuality,
          conversationControl: score.conversationControl,
          talkListenRatio: score.talkListenRatio,
          confidence: score.confidence,
          persistence: score.persistence,
          spinUsage: score.spinUsage,
          tonalityProxy: score.tonalityProxy,
          breakdownJson: score.breakdownJson,
          suggestionsJson: score.suggestionsJson,
          weakResponsesJson: score.weakResponsesJson,
          expertAnalysis: score.expertAnalysis,
        }
      : null,
  });
}
