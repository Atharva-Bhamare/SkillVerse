
import { api } from "./api-client.js";

const BASE_PATH = "/jobs";

export const jobApi = {
  // Get jobs with optional search, filters, and pagination.
  listJobs(filters = {}) {
    return api.get(BASE_PATH, {
      query: filters,
    });
  },

  // Get the details of one job.
  getJobById(jobId) {
    if (!jobId) {
      throw new TypeError("A job ID is required.");
    }

    return api.get(`${BASE_PATH}/${encodeURIComponent(jobId)}`);
  },

  // Create a job (admin or placement officer).
  createJob(jobData) {
    return api.post(BASE_PATH, jobData);
  },

  // Update a job (admin or placement officer).
  updateJob(jobId, jobData) {
    if (!jobId) {
      throw new TypeError("A job ID is required.");
    }

    return api.patch(
      `${BASE_PATH}/${encodeURIComponent(jobId)}`,
      jobData
    );
  },

  // Deactivate a job.
  deactivateJob(jobId) {
    if (!jobId) {
      throw new TypeError("A job ID is required.");
    }

    return api.delete(
      `${BASE_PATH}/${encodeURIComponent(jobId)}`
    );
  },

  // Reactivate a previously deactivated job.
  reactivateJob(jobId) {
    if (!jobId) {
      throw new TypeError("A job ID is required.");
    }

    return api.patch(
      `${BASE_PATH}/${encodeURIComponent(jobId)}/reactivate`,
      {}
    );
  },

  // Permanently delete a job and its associated applications.
  permanentlyDeleteJob(jobId) {
    if (!jobId) {
      throw new TypeError("A job ID is required.");
    }

    return api.delete(
      `${BASE_PATH}/${encodeURIComponent(jobId)}/permanent`
    );
  },

};
