import { prisma } from "@/lib/db";

export async function canUseAiMode(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "pro";
}
