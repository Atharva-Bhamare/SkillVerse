
const STORAGE_KEY = "skillverse.session";

let accessToken = null;
let refreshToken = null;
let currentUser = null;

function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) return;

    const session = JSON.parse(raw);

    if (
      typeof session.accessToken === "string" &&
      typeof session.refreshToken === "string" &&
      session.user &&
      typeof session.user === "object"
    ) {
      accessToken = session.accessToken;
      refreshToken = session.refreshToken;
      currentUser = session.user;
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    accessToken = null;
    refreshToken = null;
    currentUser = null;
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

function persistSession() {
  if (!accessToken || !refreshToken) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accessToken,
      refreshToken,
      user: currentUser
    })
  );
}

loadSession();

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function getCurrentUser() {
  return currentUser;
}

export function setSession({
  accessToken: newAccessToken,
  refreshToken: newRefreshToken,
  user
}) {
  if (
    typeof newAccessToken !== "string" ||
    !newAccessToken.trim()
  ) {
    throw new Error("A valid access token is required.");
  }

  if (
    typeof newRefreshToken !== "string" ||
    !newRefreshToken.trim()
  ) {
    throw new Error("A valid refresh token is required.");
  }

  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
  currentUser = user ?? null;

  persistSession();
}

export function updateAccessToken(newAccessToken) {
  if (
    typeof newAccessToken !== "string" ||
    !newAccessToken.trim()
  ) {
    throw new Error("A valid access token is required.");
  }

  accessToken = newAccessToken;
  persistSession();
}

export function clearSession() {
  accessToken = null;
  refreshToken = null;
  currentUser = null;

  sessionStorage.removeItem(STORAGE_KEY);
}
