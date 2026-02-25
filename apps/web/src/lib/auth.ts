import { SignJWT, jwtVerify } from 'jose';
import { headers } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export interface JWTPayload {
  sub: string;      // userId
  orgId: string;
  role: string;      // OrgRole
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JWTPayload;
}

/**
 * Extract and verify JWT from the Authorization header.
 * Used in API route handlers.
 */
export async function getSession(): Promise<JWTPayload | null> {
  const hdrs = await headers();
  const auth = hdrs.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  try {
    return await verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

/**
 * Require authenticated session. Throws if not authenticated.
 */
export async function requireSession(): Promise<JWTPayload> {
  const session = await getSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: 'UNAUTHORIZED', message: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return session;
}

/**
 * Require specific role. Throws 403 if insufficient permissions.
 */
export function requireRole(session: JWTPayload, ...roles: string[]) {
  if (!roles.includes(session.role)) {
    throw new Response(JSON.stringify({ error: 'FORBIDDEN', message: `Requires: ${roles.join(', ')}` }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
