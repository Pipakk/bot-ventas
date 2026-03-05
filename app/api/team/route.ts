import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateTeam, normalizePlan } from "@/lib/usage-limits";

export const dynamic = "force-dynamic";

function getToken(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

/** GET /api/team — obtiene los equipos del usuario (como manager o miembro) */
export async function GET(req: Request) {
  const tok = getToken(req);
  if (!tok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(tok);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const memberships = await prisma.teamMember.findMany({
    where: { userId: payload.userId },
    include: {
      team: {
        include: {
          _count: { select: { members: true } },
          owner: { select: { id: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const teams = memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    plan: m.team.plan,
    maxSeats: m.team.maxSeats,
    memberCount: m.team._count.members,
    ownerEmail: m.team.owner.email,
    isOwner: m.team.ownerId === payload.userId,
    myRole: m.teamRole,
    canCreateScenarios: m.teamRole === "manager" || m.canCreateScenarios,
    canViewTeamCalls: m.teamRole === "manager" || m.canViewTeamCalls,
  }));

  return NextResponse.json({ teams });
}

/** POST /api/team — crear un equipo */
export async function POST(req: Request) {
  const tok = getToken(req);
  if (!tok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(tok);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const perm = await canCreateTeam(payload.userId);
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.reason, code: "PLAN_LIMIT" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 80);
  if (!name) return NextResponse.json({ error: "El nombre del equipo es obligatorio" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { plan: true, role: true } });
  const plan = normalizePlan(user?.role ?? null, user?.plan ?? null);
  const maxSeats = plan === "premium" ? 999 : 10;

  const team = await prisma.team.create({
    data: {
      name,
      ownerId: payload.userId,
      plan,
      maxSeats,
      members: {
        create: {
          userId: payload.userId,
          teamRole: "manager",
          canCreateScenarios: true,
          canViewTeamCalls: true,
        },
      },
    },
    include: { _count: { select: { members: true } } },
  });

  return NextResponse.json({ team }, { status: 201 });
}
