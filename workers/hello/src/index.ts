import { withCatchThrown, withCORS } from '@workers/primitives';
import { WorkerEntrypoint } from 'cloudflare:workers';
import type { Env } from './env.ts';
import { handle } from './handle.ts';

export default class Entrypoint extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    const isDevelopment = this.env.IS_DEVELOPMENT === 'true';
    return withCatchThrown(
      withCORS(handle, {
        allowedOrigin: '*',
        allowedMethods: ['GET', 'OPTIONS'],
        allowedHeaders: ['Content-Type']
      }),
      { throwErrors: isDevelopment }
    )(request, this.env, this.ctx);
  }
}
