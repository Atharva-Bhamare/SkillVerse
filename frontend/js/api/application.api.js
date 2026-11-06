
import { api } from "./api-client.js";

const BASE_PATH = "/applications";

export const applicationApi = {
  // Apply for a job.
  apply(jobId, coverLetter = "") {
    if (!jobId) {
      throw new TypeError("A job ID is required.");
    }

    const payload = {
      job: jobId,
    };

    if (typeof coverLetter === "string" && coverLetter.trim()) {
      payload.coverLetter = coverLetter.trim();
    }

    return api.post(BASE_PATH, payload);
  },

  // List applications with optional filters.
  list(filters = {}) {
    return api.get(BASE_PATH, {
      query: filters,
    });
  },

  // Update application status (admin/placement officer).
  updateStatus(applicationId, status) {
    if (!applicationId) {
      throw new TypeError("An application ID is required.");
    }

    const allowedStatuses = [
      "reviewing",
      "shortlisted",
      "rejected",
      "accepted",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new TypeError("Invalid application status.");
    }

    return api.patch(
      `${BASE_PATH}/${encodeURIComponent(applicationId)}/status`,
      { status }
    );
  },

  // Withdraw an application (student).
  withdraw(applicationId) {
    if (!applicationId) {
      throw new TypeError("An application ID is required.");
    }

    return api.patch(
      `${BASE_PATH}/${encodeURIComponent(applicationId)}/withdraw`,
      {}
    );
  },
};
