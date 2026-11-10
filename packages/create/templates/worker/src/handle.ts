import { StatusCodes } from 'http-status-codes';
import type { HandleFunction } from '@workers/primitives';
import type { Env } from './env.ts';

export const handle: HandleFunction<Env> = async (request) => {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: StatusCodes.METHOD_NOT_ALLOWED
    });
  }
  return new Response('ok', { status: StatusCodes.OK });
};
