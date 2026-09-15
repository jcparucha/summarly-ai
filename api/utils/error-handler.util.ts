export function getErrorStatusCode(error: any): number {
  // Detect if this error or any underlying fallback model error is a 429 / Resource Exhausted / Rate limit error
  const errText = error.message || JSON.stringify(error) || "";

  const isRateLimited =
    error.status === 429 ||
    error.statusCode === 429 ||
    /429|RESOURCE_EXHAUSTED|quota|too many requests/i.test(errText);

  return isRateLimited ? 429 : 500;
}
