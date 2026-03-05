import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getPlanUsage } from "@/lib/usage-limits";
import { canCreateScenarios } from "@/lib/usage-limits";

export const dynamic = "force-dynamic";

function getToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

/** GET /api/billing/plan — devuelve el plan actual del usuario y sus permisos */
export async function GET(req: Request) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const [usage, scenarioPerm] = await Promise.all([
    getPlanUsage(payload.id),
    canCreateScenarios(payload.id),
  ]);

  return NextResponse.json({
    plan: usage.plan,
    remainingToday: usage.remainingToday,
    remainingThisWeek: usage.remainingThisWeek,
    canCreateScenarios: scenarioPerm.allowed,
    scenarioLimit: scenarioPerm.limit,
    scenarioCurrent: scenarioPerm.current,
  });
}
