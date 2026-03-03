import { NextResponse } from "next/server";
import { getBearerUserId } from "@/lib/auth";
import { getPlanUsage } from "@/lib/usage-limits";

export async function GET(request: Request) {
  const userId = getBearerUserId(request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const usage = await getPlanUsage(userId);
  return NextResponse.json({
    plan: usage.plan,
    remainingToday: usage.remainingToday,
    remainingThisWeek: usage.remainingThisWeek,
  });
}
