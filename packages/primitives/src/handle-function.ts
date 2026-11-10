export interface HandleFunction<E> {
  (
    request: Request,
    env: E,
    context: ExecutionContext
  ): Response | Promise<Response>;
}
