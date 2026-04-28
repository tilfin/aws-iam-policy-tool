export type ErrorLike = {
  code?: string
  message?: string
  stack?: string
}

export function asError(err: unknown): ErrorLike {
  if (err && typeof err === 'object') {
    return err as ErrorLike
  }

  const text = String(err)
  return {
    message: text,
    stack: text,
  }
}