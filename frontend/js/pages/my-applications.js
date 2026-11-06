
import { authService } from "../auth/auth.service.js";
import { requireRole } from "../auth/route-guard.js";
import { initializeTheme } from "../utils/theme.js";
import { renderNavbar } from "../components/navbar.js";
import { applicationApi } from "../api/application.api.js";

const PAGE_SIZE = 10;

const elements = {
  total: document.getElementById("totalApplications"),
  active: document.getElementById("activeApplications"),
  accepted: document.getElementById("acceptedApplications"),
  count: document.getElementById("applicationsCount"),
  search: document.getElementById("applicationSearch"),
  status: document.getElementById("applicationStatusFilter"),
  reset: document.getElementById("resetApplicationFilters"),
  refresh: document.getElementById("refreshApplications"),
  feedback: document.getElementById("applicationsFeedback"),
  loading: document.getElementById("applicationsLoading"),
  list: document.getElementById("applicationsList"),
  empty: document.getElementById("applicationsEmptyState"),
  emptyTitle: document.getElementById("applicationsEmptyTitle"),
  emptyMessage: document.getElementById("applicationsEmptyMessage"),
  pagination: document.getElementById("applicationsPagination"),
  previous: document.getElementById("previousApplicationsPage"),
  next: document.getElementById("nextApplicationsPage"),
  pageInfo: document.getElementById("applicationsPageInfo"),
};

let applications = [];
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

function unwrapResponse(response) {
  let result = response?.data ?? response;

  // Support API clients that return a Fetch Response.
  if (result && typeof result.json === "function") {
    return result.json();
  }

  return result;
}

function extractApplications(response) {
  const result = unwrapResponse(response);

  if (result && typeof result.then === "function") {
    return result.then(extractApplications);
  }

  const data = result?.data ?? result;

  return {
    applications: Array.isArray(data?.applications)
      ? data.applications
      : [],
    pagination: data?.pagination ?? {},
  };
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return replacements[character];
  });
}

function formatLabel(value) {
  return String(value ?? "Unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getJob(application) {
  return application?.job && typeof application.job === "object"
    ? application.job
    : {};
}

function getCompanyName(job) {
  if (typeof job.company === "object" && job.company !== null) {
    return job.company.name || "Company not available";
  }

  return job.companyName || "Company not available";
}

function getAppliedDate(application) {
  return application.appliedAt || application.createdAt;
}

function normalizeStatus(status) {
  return String(status || "pending").toLowerCase();
}

function setFeedback(message = "", type = "info") {
  elements.feedback.textContent = message;
  elements.feedback.hidden = !message;
  elements.feedback.dataset.type = type;
}

function setLoading(loading) {
  isLoading = loading;
  elements.loading.hidden = !loading;
  elements.refresh.disabled = loading;
  elements.refresh.textContent = loading ? "Refreshing..." : "↻ Refresh";
}

function updateOverview() {
  elements.total.textContent = String(
    applications.length
  );

  elements.active.textContent = String(
    applications.filter((application) =>
      ["pending", "reviewing", "shortlisted", "interview"].includes(
        normalizeStatus(application.status)
      )
    ).length
  );

  elements.accepted.textContent = String(
    applications.filter(
      (application) =>
        normalizeStatus(application.status) === "accepted"
    ).length
  );
}

function getFilteredApplications() {
  const search = elements.search.value.trim().toLowerCase();
  const status = elements.status.value;

  return applications.filter((application) => {
    const job = getJob(application);
    const company = getCompanyName(job);

    const matchesSearch =
      !search ||
      String(job.title || "").toLowerCase().includes(search) ||
      company.toLowerCase().includes(search);

    const matchesStatus =
      status === "all" ||
      normalizeStatus(application.status) === status;

    return matchesSearch && matchesStatus;
  });
}

function createApplicationCard(application) {
  const job = getJob(application);
  const status = normalizeStatus(application.status);
  const company = getCompanyName(job);
  const title = job.title || "Job details unavailable";
  const location =
    job.location ||
    (typeof job.company === "object" ? job.company.location : "") ||
    "Location not specified";

  const card = document.createElement("article");
  card.className = "application-card";

  const heading = document.createElement("div");
  heading.className = "application-card__heading";

  const details = document.createElement("div");
  details.className = "application-card__identity";

  const companyElement = document.createElement("p");
  companyElement.className = "application-card__company";
  companyElement.textContent = company;

  const titleElement = document.createElement("h3");
  titleElement.className = "application-card__title";
  titleElement.textContent = title;

  details.append(companyElement, titleElement);

  const badge = document.createElement("span");
  badge.className = `application-status application-status--${status}`;
  badge.textContent = formatLabel(status);
  badge.setAttribute("aria-label", `Application status: ${formatLabel(status)}`);

  heading.append(details, badge);

  const meta = document.createElement("div");
  meta.className = "application-card__meta";

  const locationItem = document.createElement("span");
  locationItem.textContent = `⌖ ${location}`;

  const dateItem = document.createElement("span");
  dateItem.textContent = `Applied ${formatDate(getAppliedDate(application))}`;

  meta.append(locationItem, dateItem);

  const footer = document.createElement("div");
  footer.className = "application-card__footer";

  const idText = document.createElement("span");
  idText.className = "application-card__reference";

  const applicationId = application.id || application._id;
  idText.textContent = applicationId
    ? `Application ID: ${String(applicationId).slice(-8)}`
    : "Application submitted";

  footer.append(idText);

  if (application.resume) {
    const resumeLink = document.createElement("a");
    resumeLink.className = "application-card__resume";
    resumeLink.href = application.resume;
    resumeLink.target = "_blank";
    resumeLink.rel = "noopener noreferrer";
    resumeLink.textContent = "View submitted resume";
    footer.append(resumeLink);
  }

  card.append(heading, meta, footer);

  return card;
}

function renderApplications() {
  const filtered = getFilteredApplications();

  elements.list.replaceChildren();

  elements.count.textContent =
    `${filtered.length} ${filtered.length === 1 ? "application" : "applications"} shown`;

  if (filtered.length === 0) {
    elements.empty.hidden = false;
    elements.pagination.hidden = true;

    const hasFilters =
      elements.search.value.trim() !== "" ||
      elements.status.value !== "all";

    elements.emptyTitle.textContent = hasFilters
      ? "No matching applications"
      : "Your next opportunity starts here";

    elements.emptyMessage.textContent = hasFilters
      ? "Try another search term or reset your status filter."
      : "You haven't applied for any jobs on this page yet. Explore available opportunities and submit your first application.";

    return;
  }

  elements.empty.hidden = true;

  const fragment = document.createDocumentFragment();

  filtered.forEach((application) => {
    fragment.append(createApplicationCard(application));
  });

  elements.list.append(fragment);

  elements.pagination.hidden = totalPages <= 1;
  elements.previous.disabled = currentPage <= 1;
  elements.next.disabled = currentPage >= totalPages;
  elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

async function loadApplications({ page = currentPage } = {}) {
  if (isLoading) return;

  setLoading(true);
  setFeedback();

  try {
    const response = await applicationApi.list({
      page,
      limit: PAGE_SIZE,
    });

    const result = await extractApplications(response);

    applications = result.applications;
    currentPage = Number(result.pagination.page) || page;
    totalPages = Math.max(Number(result.pagination.totalPages) || 1, 1);

    updateOverview();
    renderApplications();

    if (applications.length === 0 && currentPage === 1) {
      elements.count.textContent = "No applications found";
    }
  } catch (error) {
    console.error("Unable to load applications.", error);
    setFeedback(
      error?.message || "Unable to load applications. Please try again.",
      "error"
    );
    elements.count.textContent = "Applications could not be loaded";
  } finally {
    setLoading(false);
  }
}

function bindEvents() {
  elements.search.addEventListener("input", renderApplications);
  elements.status.addEventListener("change", renderApplications);

  elements.reset.addEventListener("click", () => {
    elements.search.value = "";
    elements.status.value = "all";
    renderApplications();
  });

  elements.refresh.addEventListener("click", () => {
    loadApplications({ page: currentPage });
  });

  elements.previous.addEventListener("click", () => {
    if (currentPage > 1) {
      loadApplications({ page: currentPage - 1 });
    }
  });

  elements.next.addEventListener("click", () => {
    if (currentPage < totalPages) {
      loadApplications({ page: currentPage + 1 });
    }
  });
}

async function initializeApplicationsPage() {
    initializeTheme();
  
    const authorized = await requireRole(["student"]);
  
    if (!authorized) return;
  
    // Retrieve the actual authenticated user instead of passing
    // requireRole's boolean result to the navbar.
    const response = await authService.getCurrentUser();
    const user = response?.data?.user ?? response?.data ?? response?.user ?? response;
  
    if (!user || typeof user !== "object" || !user.role) {
      console.error("Unable to retrieve the authenticated student.", response);
      return;
    }
  
    renderNavbar({ user });
    bindEvents();
    await loadApplications({ page: 1 });
  }  

initializeApplicationsPage().catch((error) => {
  console.error("Unable to initialize My Applications page.", error);
  setFeedback(
    error?.message || "Unable to initialize the page. Please refresh.",
    "error"
  );
});
