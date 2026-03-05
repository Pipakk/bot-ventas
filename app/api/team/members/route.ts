import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function getToken(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

async function requireManager(userId: string, teamId: string) {
  const m = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  return m?.teamRole === "manager";
}

/** GET /api/team/members?teamId=xxx — listar miembros */
export async function GET(req: Request) {
  const tok = getToken(req);
  if (!tok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(tok);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "teamId requerido" }, { status: 400 });

  const isManager = await requireManager(payload.userId, teamId);
  if (!isManager) return NextResponse.json({ error: "Solo los gestores pueden ver el equipo" }, { status: 403 });

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: { user: { select: { id: true, email: true, plan: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      teamRole: m.teamRole,
      canCreateScenarios: m.teamRole === "manager" || m.canCreateScenarios,
      canViewTeamCalls: m.teamRole === "manager" || m.canViewTeamCalls,
      createdAt: m.createdAt,
    })),
  });
}

/** POST /api/team/members — añadir miembro por email */
export async function POST(req: Request) {
  const tok = getToken(req);
  if (!tok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(tok);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { teamId, email, teamRole = "member", canCreateScenarios = false, canViewTeamCalls = false } = body;

  if (!teamId || !email) return NextResponse.json({ error: "teamId y email son obligatorios" }, { status: 400 });

  const isManager = await requireManager(payload.userId, teamId);
  if (!isManager) return NextResponse.json({ error: "Solo los gestores pueden añadir miembros" }, { status: 403 });

  // Verificar asientos disponibles
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { _count: { select: { members: true } } },
  });
  if (!team) return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
  if (team._count.members >= team.maxSeats) {
    return NextResponse.json({ error: `Has alcanzado el límite de ${team.maxSeats} miembros para este equipo.`, code: "SEAT_LIMIT" }, { status: 403 });
  }

  const targetUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!targetUser) return NextResponse.json({ error: "No existe ningún usuario con ese email. El usuario debe registrarse primero." }, { status: 404 });

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUser.id } },
  });
  if (existing) return NextResponse.json({ error: "Este usuario ya es miembro del equipo." }, { status: 409 });

  const member = await prisma.teamMember.create({
    data: {
      teamId,
      userId: targetUser.id,
      teamRole: teamRole === "manager" ? "manager" : "member",
      canCreateScenarios: teamRole === "manager" ? true : canCreateScenarios,
      canViewTeamCalls: teamRole === "manager" ? true : canViewTeamCalls,
    },
    include: { user: { select: { email: true } } },
  });

  return NextResponse.json({ member: { ...member, email: member.user.email } }, { status: 201 });
}

/** PATCH /api/team/members — actualizar permisos de un miembro */
export async function PATCH(req: Request) {
  const tok = getToken(req);
  if (!tok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(tok);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { memberId, teamId, canCreateScenarios, canViewTeamCalls, teamRole } = body;

  if (!memberId || !teamId) return NextResponse.json({ error: "memberId y teamId requeridos" }, { status: 400 });

  const isManager = await requireManager(payload.userId, teamId);
  if (!isManager) return NextResponse.json({ error: "Solo los gestores pueden modificar permisos" }, { status: 403 });

  const updated = await prisma.teamMember.update({
    where: { id: memberId },
    data: {
      ...(teamRole !== undefined && { teamRole }),
      ...(canCreateScenarios !== undefined && { canCreateScenarios }),
      ...(canViewTeamCalls !== undefined && { canViewTeamCalls }),
    },
  });

  return NextResponse.json({ member: updated });
}

/** DELETE /api/team/members?memberId=xxx&teamId=xxx — eliminar miembro */
export async function DELETE(req: Request) {
  const tok = getToken(req);
  if (!tok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(tok);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const teamId = searchParams.get("teamId");
  if (!memberId || !teamId) return NextResponse.json({ error: "memberId y teamId requeridos" }, { status: 400 });

  const isManager = await requireManager(payload.userId, teamId);
  if (!isManager) return NextResponse.json({ error: "Solo los gestores pueden eliminar miembros" }, { status: 403 });

  // No permitir eliminar al propio manager principal
  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
  if (member?.userId === team?.ownerId) {
    return NextResponse.json({ error: "No puedes eliminar al gestor principal del equipo." }, { status: 403 });
  }

  await prisma.teamMember.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}
