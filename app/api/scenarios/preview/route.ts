import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
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

/** POST /api/scenarios/preview — genera el prompt sin guardar */
export async function POST(req: Request) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const permission = await canCreateScenarios(payload.id);
  if (!permission.allowed) {
    return NextResponse.json(
      {
        error:
          permission.plan === "free"
            ? "Tu plan gratuito no incluye escenarios personalizados."
            : "Has alcanzado el límite de escenarios de tu plan.",
        code: "PLAN_LIMIT",
      },
      { status: 403 }
    );
  }

  let body: CustomScenarioPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { prompt, prepNotes } = buildScenarioPrompt(body);
  return NextResponse.json({ prompt, prepNotes });
}
