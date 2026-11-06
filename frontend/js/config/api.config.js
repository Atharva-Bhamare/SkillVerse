/*
 * SkillVerse API configuration.
 *
 * Local backend default: http://localhost:5000/api
 *
 * For another environment, set window.SKILLVERSE_API_BASE_URL
 * before app.js loads. Do not put secrets in this configuration.
 */

const configuredBaseUrl = window.SKILLVERSE_API_BASE_URL;

const defaultBaseUrl = "http://localhost:5000/api";

function normalizeBaseUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("The SkillVerse API base URL is missing.");
  }

  const url = new URL(value.trim(), window.location.origin);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("The API URL must use HTTP or HTTPS.");
  }

  if (
    window.location.protocol === "https:" &&
    url.protocol !== "https:"
  ) {
    throw new Error("An HTTPS frontend cannot use an HTTP API.");
  }

  return url.href.replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(
  configuredBaseUrl || defaultBaseUrl
);

export const API_TIMEOUT_MS = 20000;