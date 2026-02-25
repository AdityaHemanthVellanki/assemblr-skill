import { NextResponse } from 'next/server';

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400, code = 'BAD_REQUEST') {
  return NextResponse.json({ error: code, message }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Wrap an async route handler with error handling.
 */
export function handler(fn: (req: Request, ctx?: any) => Promise<Response>) {
  return async (req: Request, ctx?: any): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      // If it's already a Response (thrown by requireSession/requireRole)
      if (e instanceof Response) return e;

      const msg = e instanceof Error ? e.message : 'Internal server error';
      console.error('[api]', msg);
      return error(msg, 500, 'INTERNAL_ERROR');
    }
  };
}
