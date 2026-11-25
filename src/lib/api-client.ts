'use client'

export interface ApiResult<T> { ok: boolean; status: number; data: T }

/** POST JSON to our API with the fan's (anonymous) Supabase session token. */
export async function postJson<T = Record<string, unknown>>(
  path: string, body: unknown, accessToken: string | null,
): Promise<ApiResult<T>> {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({})) as T
  return { ok: res.ok, status: res.status, data }
}
