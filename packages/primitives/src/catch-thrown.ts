import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import type { HandleFunction } from './handle-function.ts';

export interface CatchThrownOptions {
  throwErrors?: boolean;
}

export function withCatchThrown<E>(
  handle: HandleFunction<E>,
  { throwErrors = false }: CatchThrownOptions = {}
): HandleFunction<E> {
  return async function handleWithCatchThrown(
    request: Request,
    env: E,
    context: ExecutionContext
  ) {
    try {
      return await handle(request, env, context);
    } catch (thrown) {
      if (thrown instanceof Response) {
        return thrown;
      }
      if (thrown instanceof Error) {
        if (throwErrors) {
          throw thrown;
        }
        console.error(thrown);
        return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
          status: StatusCodes.INTERNAL_SERVER_ERROR
        });
      }
      throw new Error(
        'When a handle function throws, it is expected an Error or a Response to be thrown.'
      );
    }
  };
}
