import type { ApiResponse, PaginatedApiResponse, ApiError } from "./types";
import { ACCESS_TOKEN_KEY, clearAuthSession } from "@/auth/session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

/**
 * Normalize pagination response to always use `pageNumber` field.
 * Backend may return either `currentPage` or `pageNumber`.
 */
function normalizePaginatedResponse<T>(
  response: PaginatedApiResponse<T>,
): PaginatedApiResponse<T> {
  const pagination = response.pagination;

  if (!pagination) {
    return response;
  }

  return {
    ...response,
    pagination: {
      ...pagination,
      pageNumber: pagination.pageNumber ?? pagination.currentPage ?? 1,
    },
  };
}

/**
 * Build HTTP headers with Bearer token and optional idempotency key.
 */
function buildHeaders(
  contentType = "application/json",
  idempotencyKey?: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  return headers;
}

/**
 * Parse JSON response body and throw on non-ok status.
 * On 401 Unauthorized, clear session and re-throw.
 */
async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const body = text ? (JSON.parse(text) as T | ApiError) : null;

  if (!res.ok) {
    // Clear session on 401 since backend has no refresh endpoint
    if (res.status === 401) {
      clearAuthSession();
    }
    throw body as ApiError;
  }

  return body as T;
}

/**
 * Make a JSON request to the backend.
 * On 401, session is cleared and error is re-thrown.
 */
async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });

  return parseResponse<T>(res);
}

/**
 * Make a request to an absolute URL (e.g., file download, external).
 */
async function requestByUrl<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
  });

  return parseResponse<T>(res);
}

export const apiClient = {
  async get<T>(path: string): Promise<ApiResponse<T>> {
    return request<ApiResponse<T>>(path, {
      method: "GET",
      headers: buildHeaders(),
    });
  },

  async getPaginated<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<PaginatedApiResponse<T>> {
    const url = new URL(`${API_BASE_URL}${path}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await requestByUrl<PaginatedApiResponse<T>>(
      url.toString(),
      {
        method: "GET",
        headers: buildHeaders(),
      },
    );

    return normalizePaginatedResponse(response);
  },

  async post<T>(
    path: string,
    body: unknown,
    idempotencyKey?: string,
  ): Promise<ApiResponse<T>> {
    return request<ApiResponse<T>>(path, {
      method: "POST",
      headers: buildHeaders("application/json", idempotencyKey),
      body: JSON.stringify(body),
    });
  },

  async postFormData<T>(
    path: string,
    formData: FormData,
  ): Promise<ApiResponse<T>> {
    const headers = buildHeaders("", undefined);
    // Remove Content-Type for FormData; browser will set it with boundary
    delete headers["Content-Type"];

    return request<ApiResponse<T>>(path, {
      method: "POST",
      headers,
      body: formData,
    });
  },

  async put<T>(
    path: string,
    body: unknown,
    idempotencyKey?: string,
  ): Promise<ApiResponse<T>> {
    return request<ApiResponse<T>>(path, {
      method: "PUT",
      headers: buildHeaders("application/json", idempotencyKey),
      body: JSON.stringify(body),
    });
  },

  async patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return request<ApiResponse<T>>(path, {
      method: "PATCH",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
  },

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return request<ApiResponse<T>>(path, {
      method: "DELETE",
      headers: buildHeaders(),
    });
  },

  /**
   * Download file from a URL path and return the response.
   * Used for streaming file content (e.g., photos, KYC documents).
   */
  async downloadFile(path: string): Promise<{ blob: Blob; filename?: string }> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearAuthSession();
      }
      throw new Error(`Download failed: ${res.statusText}`);
    }

    const blob = await res.blob();
    const filename = res.headers
      .get("content-disposition")
      ?.split("filename=")[1]
      ?.replace(/"/g, "");

    return { blob, filename };
  },
};
