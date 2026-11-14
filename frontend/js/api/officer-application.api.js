
import { api } from "./api-client.js";

const BASE_PATH = "officer-applications";

export const officerApplicationApi = {
  submit(payload) {
    return api.post(BASE_PATH, payload, { auth: false });
  },

  verifyEmail(token) {
    return api.get(`${BASE_PATH}/verify-email`, {
      auth: false,
      query: { token },
    });
  },

  resendVerification(email) {
    return api.post(
      `${BASE_PATH}/resend-verification`,
      { email },
      { auth: false }
    );
  },
};
