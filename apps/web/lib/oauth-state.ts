import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(s);
}

export async function signOAuthState(payload: {
  ventureId: string;
  userId: string;
  provider: string;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function verifyOAuthState(token: string): Promise<{
  ventureId: string;
  userId: string;
  provider: string;
}> {
  const { payload } = await jwtVerify(token, getSecret());
  const ventureId = String(payload.ventureId ?? "");
  const userId = String(payload.userId ?? "");
  const provider = String(payload.provider ?? "");
  if (!ventureId || !userId || !provider) throw new Error("Invalid state");
  return { ventureId, userId, provider };
}

export function appBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (!env) return "http://localhost:3000";
  return env.startsWith("http") ? env : `https://${env}`;
}
