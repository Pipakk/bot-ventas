import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildScenarioPrompt, type CustomScenarioPayload } from "@/lib/scenario-builder";
import { getTeamPermissions } from "@/lib/usage-limits";

export const dynamic = "force-dynamic";

function getToken(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

/** GET /api/team/scenarios?teamId=xxx — escenarios del equipo (todos los miembros pueden ver) */
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

  const scenarios = await prisma.teamScenario.findMany({
    where: { teamId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prospectName: true,
      industry: true,
      product: true,
      callGoal: true,
      prospectType: true,
      personality: true,
      difficulty: true,
      locale: true,
      prepNotes: true,
      createdById: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ scenarios });
}

/** POST /api/team/scenarios — crear escenario de equipo (solo managers o con permiso) */
export async function POST(req: Request) {
  const tok = getToken(req);
  if (!tok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(tok);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { teamId, ...scenarioData } = body;

  if (!teamId) return NextResponse.json({ error: "teamId requerido" }, { status: 400 });

  const perms = await getTeamPermissions(payload.userId, teamId);
  if (!perms.isMember) return NextResponse.json({ error: "No eres miembro de este equipo" }, { status: 403 });
  if (!perms.canCreateScenarios) {
    return NextResponse.json({ error: "No tienes permiso para crear escenarios en este equipo.", code: "NO_PERMISSION" }, { status: 403 });
  }

  const required = ["name", "prospectName", "industry", "product", "callGoal", "prospectType", "personality", "context", "difficulty", "locale"];
  for (const f of required) {
    if (!scenarioData[f]?.toString().trim()) {
      return NextResponse.json({ error: `Campo requerido: ${f}` }, { status: 400 });
    }
  }

  const objections: string[] = Array.isArray(scenarioData.objections)
    ? scenarioData.objections.filter((o: string) => o.trim()).slice(0, 8)
    : [];
  if (objections.length < 1) return NextResponse.json({ error: "Añade al menos 1 objeción." }, { status: 400 });

  const sanitized: CustomScenarioPayload = {
    name: scenarioData.name.trim().slice(0, 120),
    prospectName: scenarioData.prospectName.trim().slice(0, 80),
    industry: scenarioData.industry.trim().slice(0, 100),
    product: scenarioData.product.trim().slice(0, 200),
    callGoal: scenarioData.callGoal,
    prospectType: scenarioData.prospectType,
    personality: scenarioData.personality,
    context: scenarioData.context.trim().slice(0, 2000),
    objections,
    constraints: scenarioData.constraints?.trim().slice(0, 1000) ?? "",
    difficulty: scenarioData.difficulty,
    locale: scenarioData.locale,
    tone: scenarioData.tone ?? "formal",
  };

  const { prompt, prepNotes } = buildScenarioPrompt(sanitized);

  const scenario = await prisma.teamScenario.create({
    data: {
      teamId,
      createdById: payload.userId,
      name: sanitized.name,
      prospectName: sanitized.prospectName,
      industry: sanitized.industry,
      product: sanitized.product,
      callGoal: sanitized.callGoal,
      prospectType: sanitized.prospectType,
      personality: sanitized.personality,
      context: sanitized.context,
      objections: JSON.stringify(sanitized.objections),
      constraints: sanitized.constraints ?? null,
      difficulty: sanitized.difficulty,
      locale: sanitized.locale,
      tone: sanitized.tone ?? "formal",
      generatedPrompt: prompt,
      prepNotes,
    },
  });

  return NextResponse.json({ scenario, prompt }, { status: 201 });
}

/** DELETE /api/team/scenarios?id=xxx — solo managers */
export async function DELETE(req: Request) {
  const tok = getToken(req);
  if (!tok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(tok);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const scenario = await prisma.teamScenario.findUnique({ where: { id }, select: { teamId: true } });
  if (!scenario) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const perms = await getTeamPermissions(payload.userId, scenario.teamId);
  if (!perms.isManager) return NextResponse.json({ error: "Solo los gestores pueden eliminar escenarios del equipo" }, { status: 403 });

  await prisma.teamScenario.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
