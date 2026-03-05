import { prisma } from "@/lib/db";

/**
 * Planes disponibles:
 * - free: 1 llamada/semana, sin equipo, sin escenarios custom
 * - professional: llamadas ilimitadas, 1 equipo hasta 10 asientos, escenarios del equipo
 * - premium: llamadas ilimitadas, equipos ilimitados, escenarios ilimitados
 *
 * Compatibilidad hacia atrás:
 * - growth  → professional
 * - unlimited → premium
 */
export type UserPlan = "free" | "professional" | "premium";

export function normalizePlan(role: string | null, plan: string | null): UserPlan {
  // Nuevos valores
  if (plan === "professional" || plan === "premium" || plan === "free") return plan;
  // Valores legacy
  if (plan === "growth") return "professional";
  if (plan === "unlimited") return "premium";
  if (role === "pro") return "premium";
  return "free";
}

// ─── Llamadas ────────────────────────────────────────────────────────────────

export async function getPlanUsage(userId: string): Promise<{
  plan: UserPlan;
  remainingToday: number | null;
  remainingThisWeek: number | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, plan: true },
  });
  if (!user) return { plan: "free", remainingToday: 0, remainingThisWeek: 0 };

  const plan = normalizePlan(user.role, user.plan);

  // Professional y Premium: llamadas ilimitadas
  if (plan === "professional" || plan === "premium") {
    return { plan, remainingToday: null, remainingThisWeek: null };
  }

  // Free: 1 llamada/semana
  const now = new Date();
  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const diff = (day + 6) % 7;
  weekStart.setDate(weekStart.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);

  const countWeek = await prisma.callSession.count({
    where: { userId, mode: "ai", startedAt: { gte: weekStart } },
  });
  return {
    plan,
    remainingToday: null,
    remainingThisWeek: Math.max(0, 1 - countWeek),
  };
}

export async function canStartCall(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  plan?: UserPlan;
}> {
  const usage = await getPlanUsage(userId);
  if (usage.plan === "professional" || usage.plan === "premium") {
    return { allowed: true, plan: usage.plan };
  }
  if ((usage.remainingThisWeek ?? 0) <= 0) {
    return {
      allowed: false,
      plan: usage.plan,
      reason: "Con el plan gratuito solo puedes hacer 1 llamada IA a la semana. Actualiza a Profesional para llamadas ilimitadas.",
    };
  }
  return { allowed: true, plan: usage.plan };
}

export async function canUseAiMode(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return !!user;
}

// ─── Escenarios personalizados ────────────────────────────────────────────────

/**
 * Escenarios custom individuales (solo para usuarios sin equipo o uso personal).
 * En equipos, los escenarios los crea el manager y son compartidos.
 */
export const SCENARIO_LIMITS: Record<UserPlan, number | null> = {
  free: 0,
  professional: 0, // en professional los escenarios son del equipo, no individuales
  premium: null,   // premium puede tener escenarios personales ilimitados también
};

export async function canCreateScenarios(userId: string): Promise<{
  allowed: boolean;
  plan: UserPlan;
  limit: number | null;
  current: number;
  viaTeam: boolean; // true si el permiso viene de ser manager de un equipo
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      plan: true,
      _count: { select: { customScenarios: true } },
      teamMemberships: {
        where: { teamRole: "manager" },
        select: { id: true },
      },
    },
  });
  if (!user) return { allowed: false, plan: "free", limit: 0, current: 0, viaTeam: false };

  const plan = normalizePlan(user.role, user.plan);
  const isTeamManager = user.teamMemberships.length > 0;
  const current = user._count.customScenarios;

  // Premium: puede crear escenarios ilimitados
  if (plan === "premium") return { allowed: true, plan, limit: null, current, viaTeam: false };

  // Manager de equipo: puede crear escenarios del equipo (TeamScenario)
  if (isTeamManager) return { allowed: true, plan, limit: null, current, viaTeam: true };

  return { allowed: false, plan, limit: 0, current, viaTeam: false };
}

// ─── Equipos ──────────────────────────────────────────────────────────────────

export const TEAM_LIMITS: Record<UserPlan, { maxTeams: number | null; maxSeats: number }> = {
  free: { maxTeams: 0, maxSeats: 0 },
  professional: { maxTeams: 1, maxSeats: 10 },
  premium: { maxTeams: null, maxSeats: 999 },
};

export async function canCreateTeam(userId: string): Promise<{
  allowed: boolean;
  plan: UserPlan;
  reason?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, plan: true, _count: { select: { ownedTeams: true } } },
  });
  if (!user) return { allowed: false, plan: "free", reason: "Usuario no encontrado" };

  const plan = normalizePlan(user.role, user.plan);
  const limits = TEAM_LIMITS[plan];

  if (limits.maxTeams === 0) {
    return { allowed: false, plan, reason: "Tu plan gratuito no incluye equipos. Actualiza a Profesional o Premium." };
  }
  if (limits.maxTeams !== null && user._count.ownedTeams >= limits.maxTeams) {
    return { allowed: false, plan, reason: `Con el plan Profesional puedes tener 1 equipo. Actualiza a Premium para múltiples equipos.` };
  }
  return { allowed: true, plan };
}

export async function getTeamPermissions(userId: string, teamId: string): Promise<{
  isMember: boolean;
  isManager: boolean;
  canCreateScenarios: boolean;
  canViewTeamCalls: boolean;
}> {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!membership) return { isMember: false, isManager: false, canCreateScenarios: false, canViewTeamCalls: false };

  const isManager = membership.teamRole === "manager";
  return {
    isMember: true,
    isManager,
    canCreateScenarios: isManager || membership.canCreateScenarios,
    canViewTeamCalls: isManager || membership.canViewTeamCalls,
  };
}
