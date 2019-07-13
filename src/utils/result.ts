export interface Result {
  status: string;
  message: string;
  target?: string;
  diff?: any;
}

export function OK(message: string, target?: any, diff?: any): Result {
  if (target === undefined) {
    target = message
    message = '%1'
  }
  return { status: 'OK', message, target, diff }
}

export function NG(message: string, target: any, diff?: any): Result {
  return { status: 'NG', message, target, diff }
}

export function Skip(message: string, target: any): Result {
  return { status: 'Skip', message, target }
}
