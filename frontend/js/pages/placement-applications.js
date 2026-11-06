
import { authService } from "../auth/auth.service.js";
import { requireRole } from "../auth/route-guard.js";
import { initializeTheme } from "../utils/theme.js";
import { renderNavbar } from "../components/navbar.js";
import { applicationApi } from "../api/application.api.js";
import { showNotification } from "../utils/notification.js";

const PAGE_SIZE = 20;

const STATUS_TRANSITIONS = {
  pending: ["reviewing", "rejected"],
  reviewing: ["shortlisted", "accepted", "rejected"],
  shortlisted: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
  withdrawn: []
};

const elements = {
  search: document.querySelector("#applicationSearch"),
  status: document.querySelector("#applicationStatusFilter"),
  reset: document.querySelector("#resetApplicationFilters"),
  refresh: document.querySelector("#refreshApplications"),

  summary: document.querySelector("#applicationsResultsSummary"),
  loading: document.querySelector("#applicationsLoading"),
  list: document.querySelector("#applicationsList"),

  empty: document.querySelector("#applicationsEmpty"),
  emptyTitle: document.querySelector("#applicationsEmptyTitle"),
  emptyDescription: document.querySelector(
    "#applicationsEmptyDescription"
  ),
  clearEmpty: document.querySelector("#clearApplicationsEmpty"),

  pagination: document.querySelector("#applicationsPagination"),
  previous: document.querySelector("#previousApplicationsPage"),
  next: document.querySelector("#nextApplicationsPage"),
  pageInfo: document.querySelector("#applicationsPageInfo")
};

let applications = [];
let currentPage = 1;
let totalPages = 1;
let totalApplications = 0;
let searchTimer = null;
let requestNumber = 0;

function getUserFromResponse(response) {
  return (
    response?.data?.user ??
    response?.data ??
    response?.user ??
    response
  );
}

function getResponseBody(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getResourceId(resource) {
  if (!resource) return "";

  if (typeof resource === "object") {
    return String(resource.id || resource._id || "");
  }

  return String(resource);
}

function formatLabel(value) {
  if (!value) return "Not specified";

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function getSafeResumeUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function setLoading(isLoading) {
  elements.loading.hidden = !isLoading;

  elements.refresh.disabled = isLoading;
  elements.previous.disabled =
    isLoading || currentPage <= 1;

  elements.next.disabled =
    isLoading || currentPage >= totalPages;
}

function showEmptyState(title, description, showClearButton = false) {
  elements.list.hidden = true;
  elements.list.replaceChildren();

  elements.emptyTitle.textContent = title;
  elements.emptyDescription.textContent = description;

  elements.clearEmpty.hidden = !showClearButton;
  elements.empty.hidden = false;
}

function getSearchableText(application) {
  const student = application.student;
  const job = application.job;

  return [
    student?.fullName,
    student?.email,
    job?.title,
    job?.company?.name,
    application.status
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function createStatusBadge(status) {
  const badge = createElement(
    "span",
    `application-status application-status--${status || "unknown"}`,
    formatLabel(status)
  );

  return badge;
}

function createDetail(label, value) {
  const wrapper = createElement("div", "application-detail");

  const labelElement = createElement(
    "span",
    "application-detail__label",
    label
  );

  const valueElement = createElement(
    "span",
    "application-detail__value",
    value || "Not specified"
  );

  wrapper.append(labelElement, valueElement);

  return wrapper;
}

function createResumeLink(application) {
  const resumeUrl = getSafeResumeUrl(application.resume);

  if (!resumeUrl) {
    return createElement(
      "span",
      "application-resume-unavailable",
      "Resume not available"
    );
  }

  const link = createElement(
    "a",
    "application-resume-link",
    "View resume ↗"
  );

  link.href = resumeUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", "Open applicant resume in a new tab");

  return link;
}

function createStatusControls(application) {
  const wrapper = createElement(
    "div",
    "application-status-controls"
  );

  const applicationId = getResourceId(application);
  const nextStatuses =
    STATUS_TRANSITIONS[application.status] ?? [];

  if (nextStatuses.length === 0) {
    const message =
      application.status === "withdrawn"
        ? "Withdrawn applications cannot be updated."
        : "No further status changes are available.";

    wrapper.append(
      createElement(
        "p",
        "application-status-note",
        message
      )
    );

    return wrapper;
  }

  const label = createElement(
    "label",
    "application-status-label",
    "Update application status"
  );

  const select = document.createElement("select");
  select.className = "application-status-select";
  select.setAttribute(
    "aria-label",
    `Select new status for application ${applicationId}`
  );

  const placeholder = createElement(
    "option",
    "",
    "Choose a new status"
  );

  placeholder.value = "";
  placeholder.selected = true;
  placeholder.disabled = true;

  select.append(placeholder);

  nextStatuses.forEach((status) => {
    const option = createElement(
      "option",
      "",
      formatLabel(status)
    );

    option.value = status;
    select.append(option);
  });

  const updateButton = createElement(
    "button",
    "applications-button applications-button--primary",
    "Update status"
  );

  updateButton.type = "button";
  updateButton.disabled = true;

  select.addEventListener("change", () => {
    updateButton.disabled = !select.value;
  });

  updateButton.addEventListener("click", () => {
    updateApplicationStatus(
      application,
      select.value,
      updateButton,
      select
    );
  });

  const controls = createElement(
    "div",
    "application-status-controls__actions"
  );

  controls.append(select, updateButton);
  wrapper.append(label, controls);

  return wrapper;
}

function createApplicationCard(application) {
  const card = createElement(
    "article",
    "application-card"
  );

  const student = application.student;
  const job = application.job;

  const top = createElement(
    "div",
    "application-card__top"
  );

  const headingGroup = createElement(
    "div",
    "application-card__heading"
  );

  const studentName = createElement(
    "h3",
    "application-card__student",
    student?.fullName || "Student information unavailable"
  );

  const studentEmail = createElement(
    "p",
    "application-card__email",
    student?.email || "Email not available"
  );

  const jobTitle = createElement(
    "p",
    "application-card__job",
    job?.title || "Job information unavailable"
  );

  headingGroup.append(studentName, studentEmail, jobTitle);

  top.append(
    headingGroup,
    createStatusBadge(application.status)
  );

  const details = createElement(
    "div",
    "application-card__details"
  );

  details.append(
    createDetail(
      "Company",
      job?.company?.name || "Not specified"
    ),
    createDetail(
      "Applied on",
      formatDate(application.appliedAt)
    ),
    createDetail(
      "Employment type",
      formatLabel(job?.employmentType)
    ),
    createDetail(
      "Work mode",
      formatLabel(job?.workMode)
    ),
    createDetail(
      "Location",
      job?.location || "Not specified"
    )
  );

  const footer = createElement(
    "div",
    "application-card__footer"
  );

  const resumeGroup = createElement(
    "div",
    "application-card__resume"
  );

  resumeGroup.append(
    createElement(
      "span",
      "application-detail__label",
      "Student resume"
    ),
    createResumeLink(application)
  );

  footer.append(resumeGroup);

  card.append(top, details);

  if (application.coverLetter?.trim()) {
    const coverLetterDetails = document.createElement("details");
    coverLetterDetails.className =
      "application-cover-letter";

    const summary = createElement(
      "summary",
      "",
      "View cover letter"
    );

    const coverLetter = createElement(
      "p",
      "application-cover-letter__text",
      application.coverLetter
    );

    coverLetterDetails.append(summary, coverLetter);
    card.append(coverLetterDetails);
  }

  card.append(
    footer,
    createStatusControls(application)
  );

  return card;
}

function renderApplications() {
  const searchTerm = elements.search.value
    .trim()
    .toLowerCase();

  const filteredApplications = applications.filter(
    (application) => {
      return (
        !searchTerm ||
        getSearchableText(application).includes(searchTerm)
      );
    }
  );

  elements.list.replaceChildren();

  if (filteredApplications.length === 0) {
    if (applications.length === 0) {
      showEmptyState(
        "No applications yet",
        "Applications submitted for your company's job openings will appear here."
      );
    } else {
      showEmptyState(
        "No matching applications",
        "Try a different search term or reset your filters.",
        true
      );
    }

    elements.summary.textContent =
      `0 matching applications on this page · ${totalApplications} total`;

    return;
  }

  filteredApplications.forEach((application) => {
    elements.list.append(
      createApplicationCard(application)
    );
  });

  elements.list.hidden = false;
  elements.empty.hidden = true;

  elements.summary.textContent =
    `${filteredApplications.length} shown on this page · ` +
    `${totalApplications} total matching applications`;
}

async function loadApplications() {
  const thisRequest = ++requestNumber;

  setLoading(true);

  elements.list.hidden = true;
  elements.empty.hidden = true;
  elements.pagination.hidden = true;

  try {
    const filters = {
      page: currentPage,
      limit: PAGE_SIZE,
      ...(elements.status.value
        ? { status: elements.status.value }
        : {})
    };

    const response = await applicationApi.list(filters);

    if (thisRequest !== requestNumber) return;

    const body = getResponseBody(response);

    applications = Array.isArray(body?.applications)
      ? body.applications
      : [];

    const pagination = body?.pagination ?? {};

    currentPage = Number(pagination.page) || currentPage;

    totalPages = Math.max(
      1,
      Number(pagination.totalPages) || 1
    );

    totalApplications = Number(pagination.total) || 0;

    elements.pageInfo.textContent =
      `Page ${currentPage} of ${totalPages}`;

    elements.previous.disabled =
      currentPage <= 1 ||
      pagination.hasPreviousPage === false;

    elements.next.disabled =
      currentPage >= totalPages ||
      pagination.hasNextPage === false;

    elements.pagination.hidden = totalPages <= 1;

    renderApplications();
  } catch (error) {
    if (thisRequest !== requestNumber) return;

    console.error("Unable to load applications.", error);

    applications = [];
    totalApplications = 0;

    showEmptyState(
      "Unable to load applications",
      error?.message ||
        "We couldn't load applications. Please refresh and try again."
    );

    elements.summary.textContent =
      "Applications could not be loaded.";

    showNotification(
      error?.message ||
        "Unable to load applications. Please try again.",
      "error"
    );
  } finally {
    if (thisRequest === requestNumber) {
      setLoading(false);
    }
  }
}

async function updateApplicationStatus(
  application,
  newStatus,
  button,
  select
) {
  const applicationId = getResourceId(application);

  if (!applicationId || !newStatus) {
    showNotification(
      "Select a valid application status.",
      "error"
    );
    return;
  }

  if (
    newStatus === "accepted" ||
    newStatus === "rejected"
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to mark this application as ${newStatus}?`
    );

    if (!confirmed) {
      select.value = "";
      button.disabled = true;
      return;
    }
  }

  button.disabled = true;
  select.disabled = true;
  button.textContent = "Updating...";

  try {
    const response = await applicationApi.updateStatus(
      applicationId,
      newStatus
    );

    const body = getResponseBody(response);

    const updatedApplication =
      body?.application ?? body;

    const updatedId = getResourceId(updatedApplication);

    const index = applications.findIndex(
      (item) => getResourceId(item) === applicationId
    );

    if (index !== -1) {
      if (updatedId === applicationId) {
        applications[index] = {
          ...applications[index],
          ...updatedApplication
        };
      } else {
        applications[index] = {
          ...applications[index],
          status: newStatus
        };
      }
    }

    renderApplications();

    showNotification(
      "Application status updated successfully.",
      "success"
    );
  } catch (error) {
    console.error(
      "Unable to update application status.",
      error
    );

    select.disabled = false;
    select.value = "";
    button.disabled = true;
    button.textContent = "Update status";

    showNotification(
      error?.message ||
        "Unable to update the application status. Please try again.",
      "error"
    );
  }
}

function resetFilters() {
  elements.search.value = "";
  elements.status.value = "";

  currentPage = 1;

  loadApplications();
}

function bindEvents() {
  elements.search.addEventListener("input", () => {
    window.clearTimeout(searchTimer);

    searchTimer = window.setTimeout(() => {
      renderApplications();
    }, 250);
  });

  elements.status.addEventListener("change", () => {
    currentPage = 1;
    loadApplications();
  });

  elements.reset.addEventListener("click", resetFilters);
  elements.clearEmpty.addEventListener("click", resetFilters);

  elements.refresh.addEventListener(
    "click",
    loadApplications
  );

  elements.previous.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      loadApplications();
    }
  });

  elements.next.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      loadApplications();
    }
  });
}

async function initializeApplicationsPage() {
  initializeTheme();

  const authorized = await requireRole([
    "placement_officer"
  ]);

  if (!authorized) return;

  try {
    const response = await authService.getCurrentUser();
    const user = getUserFromResponse(response);

    if (!user || user.role !== "placement_officer") {
      authService.clearLocalSession();
      window.location.replace("../login.html");
      return;
    }

    renderNavbar({
      user,
      mount: document.getElementById("site-header")
    });

    bindEvents();

    await loadApplications();
  } catch (error) {
    console.error(
      "Unable to initialize the Placement Applications page.",
      error
    );

    showEmptyState(
      "Unable to open applications",
      "Please reload the page and try again."
    );

    showNotification(
      error?.message ||
        "Unable to initialize the applications page.",
      "error"
    );
  }
}

initializeApplicationsPage().catch((error) => {
  console.error(
    "Placement Applications initialization failed.",
    error
  );
});
