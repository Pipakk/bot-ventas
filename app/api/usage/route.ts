import { NextResponse } from "next/server";
import { getBearerUserId } from "@/lib/auth";
import { canUseAiMode } from "@/lib/usage-limits";

export async function GET(request: Request) {
  const userId = getBearerUserId(request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const aiEnabled = await canUseAiMode(userId);
  return NextResponse.json({
    aiModeEnabled: aiEnabled,
  });
}
