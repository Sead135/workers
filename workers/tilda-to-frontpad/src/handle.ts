import type { HandleFunction } from '@workers/primitives';
import { StatusCodes } from 'http-status-codes';
import type { Env } from './env';
import { buildOrder, encodeOrder } from './order';
import { CustomError, readBody } from './utils';
import { webhookLog } from './webhook-log';

const FRONTPAD_NEW_ORDER = 'https://app.frontpad.ru/api/index.php?new_order';

export const handle: HandleFunction<Env> = async (request, env) => {
  if (request.method === 'GET') {
    return new Response('ok', { status: StatusCodes.OK });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: StatusCodes.METHOD_NOT_ALLOWED
    });
  }

  let params: URLSearchParams;
  let body: Record<string, unknown> = {};
  try {
    body = await readBody(request);
    if (field(body, 'test') === 'test') {
      return new Response('ok', { status: StatusCodes.OK });
    }
    params = encodeOrder(buildOrder(body, env.FRONTPAD_SECRET));
  } catch (error) {
    if (error instanceof CustomError) {
      return new Response(error.message, { status: error.status });
    }
    if (error instanceof SyntaxError) {
      return new Response('Невалидный JSON', {
        status: StatusCodes.BAD_REQUEST
      });
    }
    throw error;
  } finally {
    await webhookLog(env.DB, JSON.stringify(body));
  }

  const frontpad = await fetch(FRONTPAD_NEW_ORDER, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params
  });

  const text = await frontpad.text();
  const failed =
    !frontpad.ok || /result=error|"result"\s*:\s*"error"/.test(text);
  return new Response(text, {
    status: failed ? StatusCodes.BAD_GATEWAY : StatusCodes.OK,
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
};

function field(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === 'string' ? value.trim() : '';
}
