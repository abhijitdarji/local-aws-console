// Serializable envelope used to surface AWS errors across the Server Action
// boundary. In production builds Next.js redacts the message of any Error
// thrown from a Server Action and replaces it with the generic "An error
// occurred in the Server Components render..." text. Returning an explicit
// result object keeps the original AWS error message intact so the UI can
// show it (e.g. "Token is expired. Run 'aws sso login'...").

export type AwsActionResult<T = Record<string, unknown>> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; name: string } };
