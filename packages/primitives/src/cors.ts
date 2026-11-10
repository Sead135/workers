import { StatusCodes } from 'http-status-codes';
import type { HandleFunction } from './handle-function.ts';

export interface CORSOptions {
  allowedOrigin: string | ((request: Request) => string);
  allowedMethods?: string[] | ((request: Request) => string[]);
  allowedHeaders?: string[] | ((request: Request) => string[]);
}

export function withCORS<E>(
  handle: HandleFunction<E>,
  { allowedOrigin, allowedMethods, allowedHeaders }: CORSOptions
): HandleFunction<E> {
  function patchResponse(request: Request, response: Response): Response {
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Max-Age', '3600');
    headers.set(
      'Access-Control-Allow-Origin',
      getOptionValue(allowedOrigin, request)
    );
    if (allowedMethods) {
      headers.set(
        'Access-Control-Allow-Methods',
        getOptionValue(allowedMethods, request).join(',')
      );
    }
    if (allowedHeaders) {
      headers.set(
        'Access-Control-Allow-Headers',
        getOptionValue(allowedHeaders, request).join(',')
      );
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  return async function handleWithCORS(
    request: Request,
    env: E,
    context: ExecutionContext
  ) {
    if (request.method === 'OPTIONS') {
      return patchResponse(
        request,
        new Response(null, { status: StatusCodes.NO_CONTENT })
      );
    }
    const response = await handle(request, env, context);
    return patchResponse(request, response);
  };
}

export function corsAllowAnyOriginExplicitly(request: Request): string {
  return request.headers.get('origin') || '*';
}

function getOptionValue<V>(
  valueOrFactory: V | ((request: Request) => V),
  request: Request
): V {
  if (typeof valueOrFactory === 'function') {
    return (valueOrFactory as (request: Request) => V)(request);
  }
  return valueOrFactory;
}
