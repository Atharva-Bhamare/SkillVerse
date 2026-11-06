import {
    API_BASE_URL,
    API_TIMEOUT_MS
  } from "../config/api.config.js";
  
  import { getAccessToken } from "../auth/token-store.js";
  
  export class ApiError extends Error {
    constructor(message, {
      status = 0,
      code = null,
      details = null
    } = {}) {
      super(message);
  
      this.name = "ApiError";
      this.status = status;
      this.code = code;
      this.details = details;
    }
  }
  
  function extractMessage(payload, fallback) {
    if (typeof payload?.message === "string") {
      return payload.message;
    }
  
    if (typeof payload?.error === "string") {
      return payload.error;
    }
  
    return fallback;
  }
  
  function buildUrl(path, query) {
    const cleanPath = String(path).replace(/^\/+/, "");
    const url = new URL(`${API_BASE_URL}/${cleanPath}`);
  
    if (query && typeof query === "object") {
      for (const [key, value] of Object.entries(query)) {
        if (
          value === undefined ||
          value === null ||
          value === ""
        ) {
          continue;
        }
  
        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(key, String(item));
          }
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }
  
    return url;
  }
  
  async function parseResponse(response) {
    if (response.status === 204) {
      return null;
    }
  
    const contentType = response.headers.get("content-type") || "";
  
    if (contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch {
        throw new ApiError("The server returned invalid JSON.", {
          status: response.status
        });
      }
    }
  
    const text = await response.text();
  
    return text || null;
  }
  
  export async function request(path, {
    method = "GET",
    body,
    query,
    headers = {},
    auth = true,
    signal,
    timeoutMs = API_TIMEOUT_MS
  } = {}) {
    const controller = new AbortController();
    let timedOut = false;
  
    const onExternalAbort = () => controller.abort();
  
    if (signal?.aborted) {
      controller.abort();
    } else {
      signal?.addEventListener("abort", onExternalAbort, {
        once: true
      });
    }
  
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  
    const requestHeaders = new Headers(headers);
    let requestBody = body;
  
    if (body !== undefined && !(body instanceof FormData)) {
      requestHeaders.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
  
    if (auth) {
      const token = getAccessToken();
  
      if (token) {
        requestHeaders.set("Authorization", `Bearer ${token}`);
      }
    }
  
    try {
      const response = await fetch(buildUrl(path, query), {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
        credentials: "omit"
      });
  
      const payload = await parseResponse(response);
  
      if (!response.ok) {
        throw new ApiError(
          extractMessage(payload, `Request failed (${response.status}).`),
          {
            status: response.status,
            code: payload?.code ?? null,
            details: payload?.errors ?? payload?.details ?? null
          }
        );
      }
  
      return payload;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
  
      if (timedOut) {
        throw new ApiError("The request timed out. Please try again.");
      }
  
      if (controller.signal.aborted) {
        throw new ApiError("The request was cancelled.");
      }
  
      throw new ApiError(
        "Unable to reach the server. Check your connection and try again."
      );
    } finally {
      clearTimeout(timeoutId);
  
      signal?.removeEventListener("abort", onExternalAbort);
    }
  }
  
  export const api = {
    get(path, options = {}) {
      return request(path, { ...options, method: "GET" });
    },
  
    post(path, body, options = {}) {
      return request(path, {
        ...options,
        method: "POST",
        body
      });
    },
  
    patch(path, body, options = {}) {
      return request(path, {
        ...options,
        method: "PATCH",
        body
      });
    },
  
    delete(path, options = {}) {
      return request(path, { ...options, method: "DELETE" });
    },
  
    upload(path, formData, options = {}) {
        if (!(formData instanceof FormData)) {
          throw new TypeError("Uploads must use FormData.");
        }
    
        return request(path, {
          ...options,
          method: options.method || "POST",
          body: formData
        });
      }
  };