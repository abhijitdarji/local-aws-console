import { notFound } from 'next/navigation';

// AWS SDK error names / messages that mean "the resource you asked for does
// not exist". Used by server pages to translate AWS not-found exceptions
// into Next.js's built-in `notFound()` flow (renders `app/not-found.tsx`),
// instead of bubbling through `app/error.tsx` as a generic
// "Something went wrong" — which is what users see in production builds
// because Next.js redacts Server Component error names + messages.
const NOT_FOUND_NAME_RE = /NotFound|DoesNotExist|NoSuchEntity|NoSuchBucket|NoSuchKey/i;
const NOT_FOUND_MSG_RE = /not found|does not exist|could not be found/i;

export function isAwsNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as {
    name?: string;
    message?: string;
    __type?: string;
    $metadata?: { httpStatusCode?: number };
  };
  if (NOT_FOUND_NAME_RE.test(e.name || '')) return true;
  if (NOT_FOUND_NAME_RE.test(e.__type || '')) return true;
  if (e.$metadata?.httpStatusCode === 404) return true;
  if (e.name === 'ValidationError' && /does not exist|not found/i.test(e.message || '')) {
    return true;
  }
  return NOT_FOUND_MSG_RE.test(e.message || '');
}

/**
 * Wraps an AWS SDK promise so a not-found error resolves to `null` instead
 * of throwing. Use this INSIDE `'use cache'` functions — because in
 * production Next.js may transform errors that cross the cache boundary,
 * making post-hoc detection unreliable. By converting to `null` before the
 * boundary, callers can do a simple `if (!value) notFound()` check.
 */
export async function nullIfAwsNotFound<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (err) {
    if (isAwsNotFoundError(err)) return null;
    throw err;
  }
}

/**
 * Awaits an AWS SDK promise from a Server Component. Triggers Next.js
 * `notFound()` (which renders the closest `not-found.tsx`) when either:
 *   - the promise resolves to `null` (cache function already swallowed the
 *     AWS not-found error via `nullIfAwsNotFound`), or
 *   - the promise rejects with a not-found-shaped error (uncached path).
 *
 * Any other error re-throws and ends up in the `error.tsx` boundary.
 *
 * `notFound()` must be called during Server Component render, which is why
 * we await on the server rather than letting the rejected promise reach
 * the client-side `use()` boundary.
 */
export async function awaitOrNotFound<T>(promise: Promise<T | null>): Promise<T> {
  let value: T | null;
  try {
    value = await promise;
  } catch (err) {
    if (isAwsNotFoundError(err)) notFound();
    throw err;
  }
  if (value === null) notFound();
  return value;
}
