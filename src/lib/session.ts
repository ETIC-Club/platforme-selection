import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "session";

export type SessionPayload = {
  userId: number;
  email: string;
  isSuperAdmin: boolean;
};

const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}