import { api } from "./api-client.js";

const BASE_PATH = "/companies";

export const companyApi = {
  // List companies with search, filters, and pagination.
  listCompanies(filters = {}) {
    return api.get(BASE_PATH, {
      query: filters,
    });
  },

  // Retrieve one company.
  getCompanyById(companyId) {
    if (!companyId) {
      throw new TypeError("A company ID is required.");
    }

    return api.get(`${BASE_PATH}/${encodeURIComponent(companyId)}`);
  },

  // Create a company.
  createCompany(companyData) {
    return api.post(BASE_PATH, companyData);
  },

  // Update a company.
  updateCompany(companyId, companyData) {
    if (!companyId) {
      throw new TypeError("A company ID is required.");
    }

    return api.patch(
      `${BASE_PATH}/${encodeURIComponent(companyId)}`,
      companyData
    );
  },

  // Deactivate a company.
  deactivateCompany(companyId) {
    if (!companyId) {
      throw new TypeError("A company ID is required.");
    }

    return api.delete(`${BASE_PATH}/${encodeURIComponent(companyId)}`);
  },

  // Retrieve placement officers and their current company assignments.
  listPlacementOfficers() {
    return api.get(`${BASE_PATH}/officers`);
  },

  // Assign, transfer, or unassign a placement officer.
  assignOfficer(companyId, officerId, action) {
    if (!companyId || !officerId) {
      throw new TypeError("Company ID and officer ID are required.");
    }

    if (!["assign", "transfer", "unassign"].includes(action)) {
      throw new TypeError(
        "Action must be assign, transfer, or unassign."
      );
    }

    return api.patch(
      `${BASE_PATH}/${encodeURIComponent(companyId)}/officers/${encodeURIComponent(officerId)}`,
      { action }
    );
  },

  // Reactivate a deactivated company.
  reactivateCompany(companyId) {
    if (!companyId) {
      throw new TypeError("A company ID is required.");
    }

    return api.patch(
      `${BASE_PATH}/${encodeURIComponent(companyId)}/reactivate`,
      {}
    );
  },

  // Permanently delete a company and its associated records.
  permanentlyDeleteCompany(companyId) {
    if (!companyId) {
      throw new TypeError("A company ID is required.");
    }

    return api.delete(
      `${BASE_PATH}/${encodeURIComponent(companyId)}/permanent`
    );
  },
};
