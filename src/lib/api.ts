/** Calls the Render backend (server/). Its address comes from VITE_API_URL at build time. */

export const API_URL = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Fired when the owner's login is rejected, so the app can drop the session. */
export const SESSION_EXPIRED = "portfolio:session-expired";

type Options = { method?: string; body?: unknown; token?: string };

export const api = async <T>(path: string, { method = "GET", body, token }: Options = {}) => {
  if (!API_URL) throw new ApiError("The server address isn't set (VITE_API_URL).", 0);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Couldn't reach the server. Check your connection and try again.", 0);
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || data === null) {
    if (res.status === 401 && token) window.dispatchEvent(new Event(SESSION_EXPIRED));
    throw new ApiError(data?.error ?? `The server answered ${res.status}.`, res.status);
  }
  return data;
};

/**
 * Render's free plan sleeps after 15 idle minutes and takes up to a minute to wake.
 * Calls `onSlow` if the work is still running after a few seconds, to say so on screen.
 */
export const whileWaking = async <T>(work: Promise<T>, onSlow: (slow: boolean) => void) => {
  const timer = setTimeout(() => onSlow(true), 2500);
  try {
    return await work;
  } finally {
    clearTimeout(timer);
    onSlow(false);
  }
};
