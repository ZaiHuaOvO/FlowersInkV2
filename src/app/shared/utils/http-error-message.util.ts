export function extractHttpErrorMessage(error: unknown, fallback: string): string {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  const maybeObject = error as any;

  if (Array.isArray(maybeObject?.error?.message)) {
    return maybeObject.error.message.join(', ') || fallback;
  }

  if (typeof maybeObject?.error?.message === 'string') {
    return maybeObject.error.message;
  }

  if (typeof maybeObject?.message === 'string') {
    return maybeObject.message;
  }

  if (typeof maybeObject?.error === 'string') {
    return maybeObject.error;
  }

  return fallback;
}
