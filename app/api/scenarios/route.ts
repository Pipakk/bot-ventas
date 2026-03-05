import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateScenarios } from "@/lib/usage-limits";
import {
  buildScenarioPrompt,
  type CustomScenarioPayload,
} from "@/lib/scenario-builder";

export const dynamic = "force-dynamic";

function getToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

/** GET /api/scenarios — lista los escenarios custom del usuario */
export async function GET(req: Request) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const scenarios = await prisma.customScenario.findMany({
    where: { userId: payload.userId },
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
      tone: true,
      prepNotes: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ scenarios });
}

/** POST /api/scenarios — crear escenario custom */
export async function POST(req: Request) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  // Comprobar permiso de plan
  const permission = await canCreateScenarios(payload.userId);
  if (!permission.allowed) {
    return NextResponse.json(
      {
        error:
          permission.plan === "free"
            ? "Tu plan gratuito no incluye escenarios personalizados. Actualiza a Crecimiento o Pro."
            : `Has alcanzado el límite de ${permission.limit} escenarios para tu plan.`,
        code: "PLAN_LIMIT",
        plan: permission.plan,
      },
      { status: 403 }
    );
  }

  let body: CustomScenarioPayload & { name: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Validaciones básicas
  const required: (keyof typeof body)[] = [
    "name",
    "prospectName",
    "industry",
    "product",
    "callGoal",
    "prospectType",
    "personality",
    "context",
    "difficulty",
    "locale",
  ];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json({ error: `Campo requerido: ${field}` }, { status: 400 });
    }
  }

  const objections: string[] = Array.isArray(body.objections)
    ? body.objections.filter((o: string) => o.trim() !== "").slice(0, 8)
    : [];

  if (objections.length < 1) {
    return NextResponse.json(
      { error: "Añade al menos 1 objeción." },
      { status: 400 }
    );
  }

  const sanitized: CustomScenarioPayload = {
    name: body.name.trim().slice(0, 120),
    prospectName: body.prospectName.trim().slice(0, 80),
    industry: body.industry.trim().slice(0, 100),
    product: body.product.trim().slice(0, 200),
    callGoal: body.callGoal.trim(),
    prospectType: body.prospectType,
    personality: body.personality,
    context: body.context.trim().slice(0, 2000),
    objections,
    constraints: body.constraints?.trim().slice(0, 1000) ?? "",
    difficulty: body.difficulty,
    locale: body.locale,
    tone: body.tone ?? "formal",
  };

  const { prompt, prepNotes } = buildScenarioPrompt(sanitized);

  const scenario = await prisma.customScenario.create({
    data: {
      userId: payload.userId,
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
