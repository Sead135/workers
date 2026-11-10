import { StatusCodes } from 'http-status-codes';
import type { JsonObject } from 'type-fest';
import type { HandleFunction } from './handle-function.ts';

export interface SSEHandleGenerator<E> {
  (
    request: Request,
    env: E,
    context: ExecutionContext
  ): AsyncGenerator<SSEMessage>;
}

export interface SSEEvent {
  id?: string;
  event?: string;
  data: JsonObject;
}

export interface SSEComment {
  comment: string;
}

export type SSEMessage = SSEEvent | SSEComment;

export function withSSE<E>(
  handleGenerator: SSEHandleGenerator<E>
): HandleFunction<E> {
  return async function handleSSE(
    request: Request,
    env: E,
    context: ExecutionContext
  ): Promise<Response> {
    const stream = new TransformStream();
    const running = run(handleGenerator, stream.writable, request, env, context);
    context.waitUntil(running);
    return createResponse(stream.readable);
  };
}

async function run<E>(
  handleGenerator: SSEHandleGenerator<E>,
  writableStream: WritableStream,
  request: Request,
  env: E,
  context: ExecutionContext
): Promise<void> {
  const writer = writableStream.getWriter();
  try {
    for await (const message of handleGenerator(request, env, context)) {
      await writer.write(encodeMessage(message));
    }
  } finally {
    await writer.close();
  }
}

const textEncoder = new TextEncoder();

function encodeMessage(message: SSEMessage): Uint8Array {
  const lines: string[] = [];
  if ('comment' in message) {
    lines.push(`: ${message.comment}`);
  } else {
    if (message.id) lines.push(`id: ${message.id}`);
    if (message.event) lines.push(`event: ${message.event}`);
    lines.push(`data: ${JSON.stringify(message.data)}`);
  }
  return textEncoder.encode(`${lines.join('\n')}\n\n`);
}

function createResponse(readableStream: ReadableStream): Response {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  return new Response(readableStream, {
    headers,
    status: StatusCodes.OK
  });
}
