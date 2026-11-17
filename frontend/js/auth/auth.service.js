
import { authApi } from "../api/auth.api.js";

import {
  setSession,
  clearSession,
  getRefreshToken
} from "./token-store.js";

function normalizeAuthResponse(response) {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.data?.data
  ].filter(Boolean);

  const payload = candidates.find(
    (item) =>
      typeof item.accessToken === "string" &&
      typeof item.refreshToken === "string" &&
      item.user &&
      typeof item.user === "object"
  );

  if (!payload) {
    throw new Error(
      "The server response did not contain the expected user and token fields. Check the authentication response format."
    );
  }

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: payload.user
  };
}

async function establishSession(requestPromise) {
  const response = await requestPromise;
  const session = normalizeAuthResponse(response);

  setSession(session);

  return session.user;
}

export const authService = {
  async login(email, password) {
    return establishSession(
      authApi.login({ email, password })
    );
  },

  async sendRegistrationOtp(email) {
    return authApi.sendRegistrationOtp({ email });
  },

  async verifyRegistrationOtp({ email, otp }) {
    return authApi.verifyRegistrationOtp({ email, otp });
  },

  async register({
    fullName,
    email,
    password,
    confirmPassword,
    registrationToken,
  }) {
    return establishSession(
      authApi.register({
        fullName,
        email,
        password,
        confirmPassword,
        registrationToken,
      })
    );
  },

  async getCurrentUser() {
    return authApi.me();
  },

  async refreshSession() {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearSession();
      return false;
    }

    try {
      const response = await authApi.refresh(refreshToken);
      const session = normalizeAuthResponse(response);

      setSession(session);
      return true;
    } catch {
      clearSession();
      return false;
    }
  },

  async logout() {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  },

  async forgotPassword(email) {
    return authApi.forgotPassword({ email });
  },

  async resetPassword({ token, newPassword, confirmPassword }) {
    return authApi.resetPassword({
      token,
      newPassword,
      confirmPassword
    });
  },

  async changePassword(payload) {
    return authApi.changePassword(payload);
  },

  clearLocalSession() {
    clearSession();
  }
};
