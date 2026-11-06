
import { api } from "./api-client.js";

export const authApi = {
  register(payload) {
    return api.post("auth/register", payload, { auth: false });
  },

  login(payload) {
    return api.post("auth/login", payload, { auth: false });
  },

  refresh(refreshToken) {
    return api.post(
      "auth/refresh",
      { refreshToken },
      { auth: false }
    );
  },

  me() {
    return api.get("auth/me");
  },

  logout() {
    return api.post("auth/logout");
  },

  changePassword(payload) {
    return api.patch("auth/change-password", payload);
  }
};
