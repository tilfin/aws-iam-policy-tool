export type ErrorLike = {
  code?: string
  name?: string
  message?: string
  stack?: string
}

export function asError(err: unknown): ErrorLike {
  if (err && typeof err === 'object') {
    const e = err as ErrorLike
    const normalizedCode = e.code || (e.name ? e.name.replace(/Exception$/, '') : undefined)
    return {
      ...e,
      code: normalizedCode,
    }
  }

  const text = String(err)
  return {
    message: text,
    stack: text,
  }
}