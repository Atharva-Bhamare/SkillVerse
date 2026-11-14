import { authService } from "../auth/auth.service.js";
import { requireRole } from "../auth/route-guard.js";
import { initializeTheme } from "../utils/theme.js";
import { renderNavbar } from "../components/navbar.js";
import { showNotification } from "../utils/notification.js";
import { confirmDialog } from "../components/modal.js";
import { officerApplicationAdminApi } from "../api/officer-application-admin.api.js";

const elements = {
  refresh: document.querySelector("#refresh-applications"),
  pendingCount: document.querySelector("#count-pending"),
  approvedCount: document.querySelector("#count-approved"),
  rejectedCount: document.querySelector("#count-rejected"),
  totalCount: document.querySelector("#count-total"),
  filterForm: document.querySelector("#application-filters"),
  search: document.querySelector("#application-search"),
  status: document.querySelector("#application-status-filter"),
  limit: document.querySelector("#application-limit"),
  clearFilters: document.querySelector("#clear-filters"),
  resultsSummary: document.querySelector("#results-summary"),
  tableBody: document.querySelector("#applications-table-body"),
  mobileList: document.querySelector("#applications-mobile-list"),
  paginationInfo: document.querySelector("#pagination-info"),
  previousPage: document.querySelector("#previous-page"),
  nextPage: document.querySelector("#next-page"),
  detailsDialog: document.querySelector("#application-details-dialog"),
  detailsContent: document.querySelector("#application-details-content"),
  detailsActions: document.querySelector("#application-details-actions"),
  rejectionDialog: document.querySelector("#rejection-dialog"),
  rejectionForm: document.querySelector("#rejection-form"),
  rejectionReason: document.querySelector("#rejection-reason"),
  rejectionError: document.querySelector("#rejection-error"),
  rejectionButton: document.querySelector("#confirm-rejection"),
};

const state = {
  page: 1,
  limit: 10,
  search: "",
  status: "",
  totalPages: 1,
  currentApplicationId: null,
  loading: false,
};

const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function notify(message, type = "info") {
  showNotification(message, type);
}

function formatNumber(value) {
  return (Number(value) || 0).toLocaleString("en-IN");
}

function formatDate(value, includeTime = false) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? { hour: "numeric", minute: "2-digit" }
      : {}),
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function getApplicant(application) {
  return application?.user && typeof application.user === "object"
    ? application.user
    : {};
}

function getStatusMarkup(status) {
  const safeStatus = STATUS_LABELS[status] ? status : "pending";

  return `
    <span class="officer-status officer-status--${safeStatus}">
      ${STATUS_LABELS[safeStatus]}
    </span>
  `;
}

function getVerificationMarkup(verified) {
  return verified
    ? '<span class="officer-verification officer-verification--verified">✓ Verified</span>'
    : '<span class="officer-verification officer-verification--unverified">Not verified</span>';
}

function getApplicantMarkup(user) {
  const name = user.fullName || "Unknown applicant";
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return `
    <div class="officer-applicant-cell">
      <div class="officer-applicant-avatar">${escapeHtml(initial)}</div>
      <div class="officer-applicant-info">
        <strong>${escapeHtml(name)}</strong>
        <span>${escapeHtml(user.email || "Email unavailable")}</span>
      </div>
    </div>
  `;
}

function setTableMessage(message) {
  elements.tableBody.innerHTML = `
    <tr>
      <td colspan="7" class="officer-admin-table-message">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;

  elements.mobileList.innerHTML = `
    <p class="officer-admin-table-message">${escapeHtml(message)}</p>
  `;
}

function renderApplications(applications = []) {
  if (!applications.length) {
    setTableMessage("No applications match your search.");
    return;
  }

  elements.tableBody.innerHTML = applications.map((application) => {
    const user = getApplicant(application);
    const status = application.status || "pending";

    return `
      <tr>
        <td>${getApplicantMarkup(user)}</td>
        <td>${escapeHtml(application.organizationName || "—")}</td>
        <td>${escapeHtml(application.designation || "—")}</td>
        <td>${getVerificationMarkup(Boolean(user.emailVerified))}</td>
        <td>${escapeHtml(formatDate(application.createdAt))}</td>
        <td>${getStatusMarkup(status)}</td>
        <td>
          <button
            class="officer-row-action"
            type="button"
            data-view-application="${escapeHtml(application._id)}"
          >Review</button>
        </td>
      </tr>
    `;
  }).join("");

  elements.mobileList.innerHTML = applications.map((application) => {
    const user = getApplicant(application);
    const status = application.status || "pending";

    return `
      <article class="officer-mobile-card">
        <div class="officer-mobile-card-header">
          ${getApplicantMarkup(user)}
          ${getStatusMarkup(status)}
        </div>

        <div class="officer-mobile-card-meta">
          <div>
            <span>Organization</span>
            <strong>${escapeHtml(application.organizationName || "—")}</strong>
          </div>
          <div>
            <span>Designation</span>
            <strong>${escapeHtml(application.designation || "—")}</strong>
          </div>
          <div>
            <span>Email verification</span>
            ${getVerificationMarkup(Boolean(user.emailVerified))}
          </div>
          <div>
            <span>Submitted</span>
            <strong>${escapeHtml(formatDate(application.createdAt))}</strong>
          </div>
        </div>

        <div class="officer-mobile-card-footer">
          <span class="officer-admin-muted">Application review</span>
          <button
            class="officer-row-action"
            type="button"
            data-view-application="${escapeHtml(application._id)}"
          >View details →</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderPagination(pagination = {}) {
  state.page = Number(pagination.page) || 1;
  state.limit = Number(pagination.limit) || state.limit;
  state.totalPages = Math.max(Number(pagination.totalPages) || 1, 1);

  const total = Number(pagination.total) || 0;
  const start = total ? (state.page - 1) * state.limit + 1 : 0;
  const end = Math.min(state.page * state.limit, total);

  elements.resultsSummary.textContent =
    `${formatNumber(total)} application${total === 1 ? "" : "s"} found`;

  elements.paginationInfo.textContent =
    `Showing ${formatNumber(start)}–${formatNumber(end)} of ${formatNumber(total)} · Page ${state.page} of ${state.totalPages}`;

  elements.previousPage.disabled = !pagination.hasPreviousPage;
  elements.nextPage.disabled = !pagination.hasNextPage;
}

async function loadStatistics() {
  const statuses = ["pending", "approved", "rejected"];

  const results = await Promise.all(
    statuses.map((status) =>
      officerApplicationAdminApi.listApplications({
        status,
        page: 1,
        limit: 1,
      })
    )
  );

  const counts = {};

  statuses.forEach((status, index) => {
    counts[status] = Number(results[index]?.data?.pagination?.total) || 0;
  });

  elements.pendingCount.textContent = formatNumber(counts.pending);
  elements.approvedCount.textContent = formatNumber(counts.approved);
  elements.rejectedCount.textContent = formatNumber(counts.rejected);
  elements.totalCount.textContent = formatNumber(
    counts.pending + counts.approved + counts.rejected
  );
}

async function loadApplications({ refreshStatistics = false } = {}) {
  if (state.loading) return;

  state.loading = true;
  elements.refresh.disabled = true;
  elements.refresh.textContent = "Loading...";
  setTableMessage("Loading applications...");

  try {
    const response = await officerApplicationAdminApi.listApplications({
      page: state.page,
      limit: state.limit,
      search: state.search,
      status: state.status,
    });

    const data = response?.data;

    if (!data || !Array.isArray(data.applications) || !data.pagination) {
      throw new Error("The server returned an unexpected application list.");
    }

    renderApplications(data.applications);
    renderPagination(data.pagination);

    if (refreshStatistics) {
      await loadStatistics();
    }
  } catch (error) {
    console.error("Unable to load Placement Officer applications.", error);
    setTableMessage(error.message || "Unable to load applications.");
    elements.resultsSummary.textContent = "Applications could not be loaded.";
    elements.paginationInfo.textContent = "—";
    elements.previousPage.disabled = true;
    elements.nextPage.disabled = true;
    notify(error.message || "Unable to load applications.", "error");
  } finally {
    state.loading = false;
    elements.refresh.disabled = false;
    elements.refresh.textContent = "↻ Refresh";
  }
}

function createDetailItem(label, value, fullWidth = false) {
  return `
    <div class="officer-detail-item ${fullWidth ? "officer-detail-item--full" : ""}">
      <span class="officer-detail-label">${escapeHtml(label)}</span>
      <div class="officer-detail-value">${value}</div>
    </div>
  `;
}

function renderApplicationDetails(application) {
  const user = getApplicant(application);
  const verified = Boolean(user.emailVerified);
  const status = application.status || "pending";
  const isPending = status === "pending";

  const details = [
    createDetailItem("Applicant name", escapeHtml(user.fullName || "—")),
    createDetailItem("Email address", escapeHtml(user.email || "—")),
    createDetailItem("Organization", escapeHtml(application.organizationName || "—")),
    createDetailItem("Designation", escapeHtml(application.designation || "—")),
    createDetailItem("Contact number", escapeHtml(application.contactNumber || "—")),
    createDetailItem("Email verification", getVerificationMarkup(verified)),
    createDetailItem("Submitted on", escapeHtml(formatDate(application.createdAt, true))),
    createDetailItem("Application status", getStatusMarkup(status)),
    createDetailItem("Reason for applying", escapeHtml(application.reason || "—"), true),
  ];

  if (application.reviewedAt) {
    details.push(
      createDetailItem("Reviewed on", escapeHtml(formatDate(application.reviewedAt, true)))
    );
  }

  if (application.reviewedBy) {
    details.push(
      createDetailItem(
        "Reviewed by",
        escapeHtml(application.reviewedBy.fullName || application.reviewedBy.email || "Administrator")
      )
    );
  }

  if (application.rejectionReason) {
    details.push(
      createDetailItem("Rejection reason", escapeHtml(application.rejectionReason), true)
    );
  }

  elements.detailsContent.innerHTML = `
    <div class="officer-detail-grid">${details.join("")}</div>
    ${
      isPending && !verified
        ? `<div class="officer-review-note">
             <strong>Email verification required.</strong>
             This applicant must verify their email address before approval is possible.
           </div>`
        : ""
    }
  `;

  if (isPending) {
    elements.detailsActions.innerHTML = `
      <button class="button button--secondary" type="button" data-close-details>Close</button>
      <button class="button button--danger" type="button" data-open-rejection>
        Reject application
      </button>
      <button
        class="button button--primary"
        type="button"
        data-approve-application="${escapeHtml(application._id)}"
        ${verified ? "" : "disabled"}
        title="${verified ? "Approve this application" : "Email verification is required"}"
      >
        Approve application
      </button>
    `;
  } else {
    elements.detailsActions.innerHTML = `
      <button class="button button--secondary" type="button" data-close-details>Close</button>
    `;
  }
}

async function openApplicationDetails(applicationId) {
  elements.detailsContent.innerHTML =
    '<p class="officer-admin-muted">Loading application details...</p>';

  elements.detailsActions.innerHTML = `
    <button class="button button--secondary" type="button" data-close-details>Close</button>
  `;

  elements.detailsDialog.showModal();

  try {
    const response =
      await officerApplicationAdminApi.getApplicationById(applicationId);

    const application = response?.data?.application;

    if (!application) {
      throw new Error("Application details were not found.");
    }

    state.currentApplicationId = application._id;
    renderApplicationDetails(application);
  } catch (error) {
    console.error("Unable to retrieve application details.", error);

    elements.detailsContent.innerHTML = `
      <p class="officer-admin-form-error">
        ${escapeHtml(error.message || "Unable to load application details.")}
      </p>
    `;
    notify(error.message || "Unable to load application details.", "error");
  }
}

async function approveApplication(applicationId) {
  const confirmed = await confirmDialog({
    title: "Approve Placement Officer?",
    message:
      "This will activate the applicant's Placement Officer account. They will be able to sign in after approval.",
    confirmText: "Approve application",
    cancelText: "Cancel",
  });

  if (!confirmed) return;

  try {
    const response =
      await officerApplicationAdminApi.approveApplication(applicationId);

    const emailSent = response?.data?.emailSent;

    elements.detailsDialog.close();
    notify(
      emailSent === false
        ? "Application approved, but the notification email could not be sent."
        : "Placement Officer application approved successfully.",
      emailSent === false ? "warning" : "success"
    );

    await loadApplications({ refreshStatistics: true });
  } catch (error) {
    console.error("Unable to approve application.", error);
    notify(error.message || "Unable to approve this application.", "error");
  }
}

function openRejectionDialog() {
  if (!state.currentApplicationId) return;

  elements.rejectionForm.reset();
  elements.rejectionError.textContent = "";
  elements.rejectionDialog.showModal();
  elements.rejectionReason.focus();
}

async function rejectApplication(event) {
  event.preventDefault();

  const rejectionReason = elements.rejectionReason.value.trim();

  if (rejectionReason.length < 5 || rejectionReason.length > 500) {
    elements.rejectionError.textContent =
      "Please provide a reason between 5 and 500 characters.";
    return;
  }

  if (!state.currentApplicationId) return;

  elements.rejectionButton.disabled = true;
  elements.rejectionButton.textContent = "Submitting...";

  try {
    const response =
      await officerApplicationAdminApi.rejectApplication(
        state.currentApplicationId,
        rejectionReason
      );

    const emailSent = response?.data?.emailSent;

    elements.rejectionDialog.close();
    elements.detailsDialog.close();

    notify(
      emailSent === false
        ? "Application rejected, but the notification email could not be sent."
        : "Placement Officer application rejected successfully.",
      emailSent === false ? "warning" : "success"
    );

    state.currentApplicationId = null;
    await loadApplications({ refreshStatistics: true });
  } catch (error) {
    console.error("Unable to reject application.", error);
    elements.rejectionError.textContent =
      error.message || "Unable to reject this application.";
  } finally {
    elements.rejectionButton.disabled = false;
    elements.rejectionButton.textContent = "Reject application";
  }
}

async function initializeAdminPage() {
  const authorized = await requireRole(["admin"]);

  if (!authorized) return;

  try {
    const response = await authService.getCurrentUser();
    const user =
      response?.user ??
      response?.data?.user ??
      response?.data ??
      response;

    if (!user || user.role !== "admin") {
      authService.clearLocalSession();
      window.location.replace("../login.html");
      return;
    }

    renderNavbar({
      user,
      mount: document.querySelector("#site-header"),
    });

    await Promise.all([
      loadApplications({ refreshStatistics: true }),
    ]);
  } catch (error) {
    console.error("Unable to initialize Officer Applications page.", error);
    notify("Unable to initialize the Admin workspace. Please reload the page.", "error");
  }
}

// Search and filter submission.
elements.filterForm.addEventListener("submit", (event) => {
  event.preventDefault();

  state.search = elements.search.value.trim();
  state.status = elements.status.value;
  state.page = 1;

  loadApplications();
});

elements.clearFilters.addEventListener("click", () => {
  elements.search.value = "";
  elements.status.value = "";

  state.search = "";
  state.status = "";
  state.page = 1;

  loadApplications();
});

elements.limit.addEventListener("change", () => {
  state.limit = Number(elements.limit.value) || 10;
  state.page = 1;
  loadApplications();
});

elements.previousPage.addEventListener("click", () => {
  if (state.page <= 1) return;
  state.page -= 1;
  loadApplications();
});

elements.nextPage.addEventListener("click", () => {
  if (state.page >= state.totalPages) return;
  state.page += 1;
  loadApplications();
});

elements.refresh.addEventListener("click", () => {
  loadApplications({ refreshStatistics: true });
});

// Delegate application detail actions.
document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view-application]");

  if (viewButton) {
    openApplicationDetails(viewButton.dataset.viewApplication);
    return;
  }

  const approveButton = event.target.closest("[data-approve-application]");

  if (approveButton) {
    approveApplication(approveButton.dataset.approveApplication);
    return;
  }

  if (event.target.closest("[data-open-rejection]")) {
    openRejectionDialog();
    return;
  }

  if (event.target.closest("[data-close-details]")) {
    elements.detailsDialog.close();
    return;
  }

  if (event.target.closest("[data-close-rejection]")) {
    elements.rejectionDialog.close();
  }
});

elements.rejectionForm.addEventListener("submit", rejectApplication);

elements.rejectionReason.addEventListener("input", () => {
  elements.rejectionError.textContent = "";
});

for (const dialog of [elements.detailsDialog, elements.rejectionDialog]) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}

document.querySelector("#current-year").textContent =
  new Date().getFullYear();

initializeTheme();

initializeAdminPage().catch((error) => {
  console.error("Officer Applications initialization failed.", error);
  notify("The page could not be initialized. Please reload it.", "error");
});