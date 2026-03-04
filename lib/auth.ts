import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const SALT_ROUNDS = 10;

export type JwtPayload = { userId: string; email: string };

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: { id: string; email: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email } as JwtPayload,
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function getBearerUserId(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}
