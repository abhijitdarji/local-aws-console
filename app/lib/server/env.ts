import { cookies } from 'next/headers';

export type EnvRegion = { env: string; region: string };

/**
 * Reads env + region from the Zustand persist cookie.
 * Zustand persist (createJSONStorage) stores state as:
 *   { state: { environment: string; region: string }, version: number }
 * under the cookie key "localaws".
 */
export async function resolveEnvRegion(): Promise<EnvRegion> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('localaws')?.value;
  if (!raw) return { env: '', region: '' };
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    const env = parsed?.state?.environment ?? '';
    const region = parsed?.state?.region ?? '';
    return { env, region };
  } catch {
    return { env: '', region: '' };
  }
}
