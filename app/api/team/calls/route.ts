import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTeamPermissions } from "@/lib/usage-limits";

export const dynamic = "force-dynamic";

function getToken(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

/**
 * GET /api/team/calls?teamId=xxx
 * Devuelve las llamadas de todos los miembros del equipo.
 * Requiere ser manager o tener canViewTeamCalls = true.
 */
export async function GET(req: Request) {
  const tok = getToken(req);
  if (!tok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(tok);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "teamId requerido" }, { status: 400 });

  const perms = await getTeamPermissions(payload.userId, teamId);
  if (!perms.isMember) return NextResponse.json({ error: "No eres miembro de este equipo" }, { status: 403 });
  if (!perms.canViewTeamCalls) {
    return NextResponse.json({ error: "No tienes permiso para ver las llamadas del equipo", code: "NO_PERMISSION" }, { status: 403 });
  }

  // Obtener todos los miembros del equipo
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    select: { userId: true, user: { select: { email: true } } },
  });
  const memberUserIds = members.map((m) => m.userId);
  const emailByUserId = Object.fromEntries(members.map((m) => [m.userId, m.user.email]));

  const sessions = await prisma.callSession.findMany({
    where: { userId: { in: memberUserIds } },
    include: { scoreResult: { select: { totalScore: true, expertAnalysis: true } } },
    orderBy: { startedAt: "desc" },
    take: 200,
  });

  const calls = sessions.map((s) => ({
    id: s.id,
    userId: s.userId,
    userEmail: emailByUserId[s.userId] ?? "—",
    difficulty: s.difficulty,
    industry: s.industry,
    prospectType: s.prospectType,
    personality: s.personality,
    durationSeconds: s.durationSeconds,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    totalScore: s.scoreResult?.totalScore ?? null,
    hasAnalysis: !!s.scoreResult?.expertAnalysis,
  }));

  return NextResponse.json({ calls });
}
