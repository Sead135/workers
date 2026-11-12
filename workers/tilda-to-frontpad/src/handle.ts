import type { HandleFunction } from '@workers/primitives';
import { StatusCodes } from 'http-status-codes';
import type { Env } from './env';
import { buildOrder, encodeOrder } from './order';
import type { WebhookPayload, WebhookStatus } from './types';
import { CustomError, sendFrontpad } from './utils';
import { updateWebhookLogStatus, webhookLog } from './webhook-log';

export const handle: HandleFunction<Env> = async (request, env) => {
  if (request.method === 'GET') {
    return new Response('ok', { status: StatusCodes.OK });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: StatusCodes.METHOD_NOT_ALLOWED
    });
  }

  function updateLogStatus(logId: number, status: WebhookStatus) {
    return updateWebhookLogStatus(env.DB, logId, status);
  }

  let params: URLSearchParams;
  let body = {} as WebhookPayload;
  let logId: number | undefined;
  try {
    body = await request.json();
    logId = await webhookLog(env.DB, JSON.stringify(body));

    if (body.test === 'test') {
      await updateLogStatus(logId, 'success');
      return new Response('ok', { status: StatusCodes.OK });
    }

    const order = buildOrder(body, env.FRONTPAD_SECRET);
    params = encodeOrder(order);
  } catch (error) {
    if (logId !== undefined) {
      await updateLogStatus(logId, 'failed');
    }

    if (error instanceof CustomError) {
      return new Response(error.message, { status: error.status });
    }

    if (error instanceof SyntaxError) {
      return new Response('Невалидный JSON', {
        status: StatusCodes.BAD_REQUEST
      });
    }

    throw error;
  }

  try {
    const { success, text } = await sendFrontpad(params);

    await updateLogStatus(logId, success ? 'success' : 'failed');

    return new Response(text, {
      status: success ? StatusCodes.OK : StatusCodes.BAD_GATEWAY,
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  } catch (error) {
    await updateLogStatus(logId, 'failed');

    throw error;
  }
};
