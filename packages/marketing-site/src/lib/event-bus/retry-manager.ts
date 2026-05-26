export async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 3) {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      attempt += 1;
    }
  }

  throw lastError;
}

