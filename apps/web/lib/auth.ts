import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "busos-secret-key-change-in-production-32chars!!"
);
export const COOKIE_NAME = "busos_session";

export interface SessionPayload {
  userId: string;
  email: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}

/**
 * Drop-in replacement for the old Clerk-based getOrCreateUserFromClerk.
 * Returns the user ID from the JWT session cookie.
 */
export async function getOrCreateUserFromClerk(): Promise<string | null> {
  return getSessionUserId();
}

/**
 * Require auth: returns user id or throws.
 */
export async function requireUserId(): Promise<string> {
  const id = await getSessionUserId();
  if (!id) throw new Error("Unauthorized");
  return id;
}
