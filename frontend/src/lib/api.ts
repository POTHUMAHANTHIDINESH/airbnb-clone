import { API } from "./utils";

export class ApiError extends Error { constructor(public status: number, msg: string) { super(msg); } }

export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem("token"));

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch(API + path, {
    method: opts.method || (opts.body || opts.form ? "POST" : "GET"), headers,
    body: opts.form ?? (opts.body ? JSON.stringify(opts.body) : undefined), cache: "no-store",
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data.detail;
    const msg = typeof d === "string" ? d : Array.isArray(d) ? d.map((e: any) => `${(e.loc || []).slice(-1)[0]}: ${e.msg}`).join(", ") : "Something went wrong";
    throw new ApiError(res.status, msg);
  }
  return data as T;
}
