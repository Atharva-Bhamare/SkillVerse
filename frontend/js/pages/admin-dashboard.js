 
import { authService } from "../auth/auth.service.js";
import { requireRole } from "../auth/route-guard.js";
import { initializeTheme } from "../utils/theme.js";
import { renderNavbar } from "../components/navbar.js";
import { api } from "../api/api-client.js";
import { showNotification } from "../utils/notification.js";
import { initializeAccountSecurity } from "../components/account-security.js";

const elements = {
  welcomeTitle: document.querySelector("#admin-welcome-title"),
  refresh: document.querySelector("#dashboard-refresh"),
  totalJobs: document.querySelector("#stat-total-jobs"),
  openJobs: document.querySelector("#stat-open-jobs"),
  activeJobs: document.querySelector("#stat-active-jobs"),
  totalApplications: document.querySelector("#stat-total-applications"),
  trend: document.querySelector("#application-trend"),
  statuses: document.querySelector("#application-statuses"),
  recent: document.querySelector("#recent-applications"),
};

const STATUS_LABELS = {
  pending: "Pending",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

function getResponseBody(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getUserFromResponse(response) {
  return response?.data?.user ?? response?.data ?? response?.user ?? response;
}

function setFeedback(message, state = "info") {
    const notificationType =
      state === "error"
        ? "error"
        : state === "success"
          ? "success"
          : "info";
  
    showNotification(message, notificationType);
  }

function formatNumber(value) {
  return (Number(value) || 0).toLocaleString("en-IN");
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

function renderSummary(summary = {}) {
  elements.totalJobs.textContent = formatNumber(summary.totalJobs);
  elements.openJobs.textContent = formatNumber(summary.openJobs);
  elements.activeJobs.textContent = formatNumber(summary.activeJobs);
  elements.totalApplications.textContent = formatNumber(
    summary.totalApplications
  );
}

function renderTrend(trend = []) {
  if (!trend.length) {
    elements.trend.innerHTML =
      '<p class="admin-empty">No application trend data is available.</p>';
    return;
  }

  const maximum = Math.max(1, ...trend.map((item) => Number(item.count) || 0));

  elements.trend.innerHTML = trend.map((item) => {
    const count = Number(item.count) || 0;
    const height = Math.max(4, (count / maximum) * 100);

    const date = new Date(`${item.date}T12:00:00`);
    const label = Number.isNaN(date.getTime())
      ? item.date
      : new Intl.DateTimeFormat("en-IN", {
          weekday: "short",
          day: "numeric",
        }).format(date);

    return `
      <div class="admin-trend-column" title="${escapeHtml(label)}: ${count} applications">
        <span class="admin-trend-count">${formatNumber(count)}</span>
        <div class="admin-trend-track">
          <div class="admin-trend-bar" style="height:${height}%"></div>
        </div>
        <span class="admin-trend-label">${escapeHtml(label)}</span>
      </div>
    `;
  }).join("");
}

function renderStatuses(summary = {}) {
  const statuses = Object.entries(STATUS_LABELS);

  const total = statuses.reduce(
    (sum, [key]) => sum + (Number(summary[key]) || 0),
    0
  );

  elements.statuses.innerHTML = statuses.map(([key, label]) => {
    const count = Number(summary[key]) || 0;
    const percentage = total ? (count / total) * 100 : 0;

    return `
      <div class="admin-status-item">
        <div class="admin-status-meta">
          <span class="admin-status-label">
            <span class="admin-status-dot admin-status-dot--${key}"></span>
            ${label}
          </span>
          <strong>${formatNumber(count)}</strong>
        </div>
        <div class="admin-status-track">
          <div
            class="admin-status-bar admin-status-bar--${key}"
            style="width:${percentage}%"
          ></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderRecentApplications(applications = []) {
  if (!applications.length) {
    elements.recent.innerHTML = `
      <p class="admin-empty">No applications have been submitted yet.</p>
    `;
    return;
  }

  elements.recent.innerHTML = applications.map((application) => {
    const studentName = application.student?.name || "Unknown student";
    const studentEmail = application.student?.email || "Email unavailable";
    const jobTitle = application.job?.title || "Job details unavailable";
    const status = application.status || "pending";
    const statusLabel = STATUS_LABELS[status] || status;

    return `
      <article class="admin-recent-item">
        <div class="admin-recent-person">
          <div class="admin-recent-avatar">
            ${escapeHtml(studentName.trim().charAt(0).toUpperCase() || "?")}
          </div>
          <div class="admin-recent-details">
            <strong>${escapeHtml(studentName)}</strong>
            <span>${escapeHtml(studentEmail)}</span>
          </div>
        </div>

        <div class="admin-recent-job">
          <strong>${escapeHtml(jobTitle)}</strong>
          <span>Applied ${escapeHtml(formatDate(application.appliedAt))}</span>
        </div>

        <span class="admin-status-pill admin-status-pill--${escapeHtml(status)}">
          ${escapeHtml(statusLabel)}
        </span>
      </article>
    `;
  }).join("");
}

async function loadDashboard() {
  elements.refresh.disabled = true;
  elements.refresh.textContent = "Loading...";

  try {
    const response = await api.get("/dashboard/placement");
    const dashboard = getResponseBody(response);

    if (!dashboard?.summary) {
      throw new Error("The dashboard response has an unexpected format.");
    }

    renderSummary(dashboard.summary);
    renderTrend(dashboard.applicationsLast7Days);
    renderStatuses(dashboard.summary);
    renderRecentApplications(dashboard.recentApplications);

    setFeedback("Platform statistics updated successfully.", "success");
  } catch (error) {
    console.error("Unable to load admin dashboard data.", error);

    setFeedback(
      error?.message || "Unable to load platform statistics. Please try again.",
      "error"
    );
  } finally {
    elements.refresh.disabled = false;
    elements.refresh.textContent = "↻ Refresh";
  }
}

async function initializeAdminDashboard() {
  const authorized = await requireRole(["admin"]);

  if (!authorized) return;

  try {
    const response = await authService.getCurrentUser();
    const user = getUserFromResponse(response);

    if (!user || user.role !== "admin") {
      authService.clearLocalSession();
      window.location.replace("../login.html");
      return;
    }

    renderNavbar({
      user,
      mount: document.getElementById("site-header"),
    });

    initializeAccountSecurity("../login.html");

    const firstName = user.fullName?.trim().split(/\s+/)[0];

    elements.welcomeTitle.textContent = firstName
      ? `Welcome back, ${firstName}`
      : "Admin Dashboard";

    await loadDashboard();
  } catch (error) {
    console.error("Unable to initialize admin dashboard.", error);

    setFeedback(
      "We couldn't initialize the admin dashboard. Please reload the page.",
      "error"
    );
  }
}

elements.refresh.addEventListener("click", loadDashboard);

document.querySelector("#current-year").textContent =
  new Date().getFullYear();

initializeTheme();

initializeAdminDashboard().catch((error) => {
  console.error("Admin dashboard initialization failed.", error);
  setFeedback("The dashboard could not be initialized. Please reload the page.", "error");
});
