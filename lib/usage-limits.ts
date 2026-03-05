import { prisma } from "@/lib/db";

export type UserPlan = "free" | "growth" | "unlimited";

function getUserPlan(role: string | null, plan: string | null): UserPlan {
  if (plan === "growth" || plan === "unlimited" || plan === "free") return plan;
  // Compatibilidad hacia atrás: role "pro" => unlimited
  if (role === "pro") return "unlimited";
  return "free";
}

export async function getPlanUsage(userId: string): Promise<{
  plan: UserPlan;
  remainingToday: number | null;
  remainingThisWeek: number | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, plan: true },
  });
  if (!user) {
    return { plan: "free", remainingToday: 0, remainingThisWeek: 0 };
  }
  const plan = getUserPlan(user.role, user.plan as UserPlan | null);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(now);
  const day = weekStart.getDay(); // 0 domingo
  const diff = (day + 6) % 7; // lunes como inicio de semana
  weekStart.setDate(weekStart.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);

  if (plan === "unlimited") {
    return { plan, remainingToday: null, remainingThisWeek: null };
  }

  if (plan === "growth") {
    const countToday = await prisma.callSession.count({
      where: {
        userId,
        mode: "ai",
        startedAt: { gte: todayStart },
      },
    });
    const limitPerDay = 10;
    return {
      plan,
      remainingToday: Math.max(0, limitPerDay - countToday),
      remainingThisWeek: null,
    };
  }

  // plan free: 1 llamada/semana
  const countWeek = await prisma.callSession.count({
    where: {
      userId,
      mode: "ai",
      startedAt: { gte: weekStart },
    },
  });
  const limitPerWeek = 1;
  return {
    plan,
    remainingToday: null,
    remainingThisWeek: Math.max(0, limitPerWeek - countWeek),
  };
}

export async function canStartCall(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  plan?: UserPlan;
}> {
  const usage = await getPlanUsage(userId);
  if (usage.plan === "unlimited") return { allowed: true, plan: usage.plan };
  if (usage.plan === "growth") {
    if ((usage.remainingToday ?? 0) <= 0) {
      return {
        allowed: false,
        plan: usage.plan,
        reason: "Has alcanzado el máximo de 10 llamadas AI hoy con tu plan actual.",
      };
    }
    return { allowed: true, plan: usage.plan };
  }
  // free
  if ((usage.remainingThisWeek ?? 0) <= 0) {
    return {
      allowed: false,
      plan: usage.plan,
      reason: "Con el plan gratuito solo puedes hacer 1 llamada AI a la semana.",
    };
  }
  return { allowed: true, plan: usage.plan };
}

// Mantener para compatibilidad, pero ahora siempre true si existe usuario
export async function canUseAiMode(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return !!user;
}

/** Límites de escenarios personalizados por plan */
export const SCENARIO_LIMITS: Record<UserPlan, number | null> = {
  free: 0,
  growth: 10,
  unlimited: null, // ilimitado
};

/** Devuelve true si el usuario puede crear escenarios personalizados */
export async function canCreateScenarios(userId: string): Promise<{
  allowed: boolean;
  plan: UserPlan;
  limit: number | null;
  current: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, plan: true, _count: { select: { customScenarios: true } } },
  });
  if (!user) return { allowed: false, plan: "free", limit: 0, current: 0 };

  const plan = getUserPlan(user.role, user.plan as UserPlan | null);
  const limit = SCENARIO_LIMITS[plan];
  const current = user._count.customScenarios;

  if (limit === 0) return { allowed: false, plan, limit, current };
  if (limit === null) return { allowed: true, plan, limit, current };
  return { allowed: current < limit, plan, limit, current };
}
