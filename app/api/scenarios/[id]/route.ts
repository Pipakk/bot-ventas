import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function getToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

/** GET /api/scenarios/[id] — detalle completo incluyendo prompt */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const scenario = await prisma.customScenario.findUnique({
    where: { id: params.id },
  });
  if (!scenario || scenario.userId !== payload.userId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ scenario });
}

/** DELETE /api/scenarios/[id] — borrar escenario propio */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const scenario = await prisma.customScenario.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!scenario || scenario.userId !== payload.userId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.customScenario.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
