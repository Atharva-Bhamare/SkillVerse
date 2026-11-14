import { api } from "./api-client.js";

const BASE_PATH = "/officer-applications";

function requireId(applicationId) {
  if (!applicationId) {
    throw new TypeError("An application ID is required.");
  }

  return encodeURIComponent(applicationId);
}

export const officerApplicationAdminApi = {
  listApplications(filters = {}) {
    return api.get(BASE_PATH, { query: filters });
  },

  getApplicationById(applicationId) {
    return api.get(`${BASE_PATH}/${requireId(applicationId)}`);
  },

  approveApplication(applicationId) {
    return api.patch(`${BASE_PATH}/${requireId(applicationId)}/approve`, {});
  },

  rejectApplication(applicationId, rejectionReason) {
    return api.patch(
      `${BASE_PATH}/${requireId(applicationId)}/reject`,
      { rejectionReason }
    );
  },
};