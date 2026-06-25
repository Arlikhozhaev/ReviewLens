import type { ApiResponse } from "@/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseJsonResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const text = await res.text();

  if (!text) {
    throw new ApiError(
      res.ok ? "Empty response from server" : `Request failed (${res.status})`,
      undefined,
      res.status
    );
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      res.ok
        ? "Invalid response from server"
        : `Request failed (${res.status})`,
      undefined,
      res.status
    );
  }
}

/**
 * Type-safe fetch wrapper for ReviewLens API routes.
 *
 * All API routes return ApiResponse<T>. This function unwraps the envelope
 * and throws ApiError on failure — so callers get typed data or a typed error,
 * never an untyped JSON blob.
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  let res: Response;

  try {
    res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });
  } catch {
    throw new ApiError("Network error — check your connection.");
  }

  const json = await parseJsonResponse<T>(res);

  if (!json.success) {
    throw new ApiError(json.error, json.code, res.status);
  }

  return json.data;
}

/**
 * Convenience helper: POST JSON to a route handler.
 */
export async function apiPost<TResponse, TBody = unknown>(
  url: string,
  body: TBody
): Promise<TResponse> {
  return apiFetch<TResponse>(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
