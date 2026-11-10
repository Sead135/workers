import jwt from '@tsndr/cloudflare-worker-jwt';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import type { HandleFunction } from './handle-function.ts';

export interface WithJwtOptions {
  /** Secret or public key string used by `@tsndr/cloudflare-worker-jwt` */
  key: string;
  algorithm?: 'HS256' | 'RS256';
  /** Default: Authorization Bearer. Set header and/or query to customize. */
  header?: string;
  query?: string;
}

export function withJwt<E>(
  handle: HandleFunction<E>,
  { key, algorithm = 'HS256', header, query }: WithJwtOptions
): HandleFunction<E> {
  return async function handleWithJwt(
    request: Request,
    env: E,
    context: ExecutionContext
  ): Promise<Response> {
    const encoded = extractToken(request, header, query);
    if (!encoded) {
      return unauthorized();
    }

    const verified = await jwt.verify(encoded, key, { algorithm });
    if (!verified) {
      return unauthorized();
    }

    const { payload } = verified;
    if (!payload || typeof payload !== 'object') {
      return new Response(ReasonPhrases.BAD_REQUEST, {
        status: StatusCodes.BAD_REQUEST
      });
    }

    setJwtPayload(request, payload as Record<string, unknown>);
    return handle(request, env, context);
  };
}

function extractToken(
  request: Request,
  header?: string,
  query?: string
): string | null {
  if (header) {
    const raw = request.headers.get(header);
    if (raw) return stripBearer(raw);
  }
  if (query) {
    const value = new URL(request.url).searchParams.get(query);
    if (value) return value;
  }
  if (!header && !query) {
    const auth = request.headers.get('Authorization');
    if (auth) return stripBearer(auth);
  }
  return null;
}

function stripBearer(value: string): string {
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match ? match[1] : value.trim();
}

function unauthorized() {
  return new Response(ReasonPhrases.UNAUTHORIZED, {
    status: StatusCodes.UNAUTHORIZED
  });
}

const vault = new WeakMap<Request, Record<string, unknown>>();

function setJwtPayload(request: Request, payload: Record<string, unknown>) {
  vault.set(request, payload);
}

export function getJwtPayload<T = Record<string, unknown>>(
  request: Request
): T | undefined {
  return vault.get(request) as T | undefined;
}
