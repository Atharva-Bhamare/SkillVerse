
import { authService } from "../auth/auth.service.js";
import { requireRole } from "../auth/route-guard.js";
import { initializeTheme } from "../utils/theme.js";
import { renderNavbar } from "../components/navbar.js";
import { initializeAccountSecurity } from "../components/account-security.js";

const welcomeTitle = document.querySelector("#welcome-title");
const officerAvatar = document.querySelector("#officer-avatar");
const officerName = document.querySelector("#officer-name");
const officerEmail = document.querySelector("#officer-email");
const officerRole = document.querySelector("#officer-role");
const companyAssignment = document.querySelector("#company-assignment");
const feedback = document.querySelector("#dashboard-feedback");

function setFeedback(message, state = "info") {
  feedback.textContent = message;
  feedback.dataset.state = state;
}

function getUserFromResponse(response) {
  return (
    response?.data?.user ??
    response?.data ??
    response?.user ??
    response
  );
}

function getInitials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "P";

  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function getCompanyDisplay(company) {
  // The company may be populated as an object or returned as an ID.
  if (company && typeof company === "object") {
    return company.name || company.companyName || "Company assigned";
  }

  if (typeof company === "string" && company.trim()) {
    // Don't display a raw database ID as if it were a company name.
    return "Company assigned";
  }

  return "No company assignment found";
}

function displayOfficer(user) {
  const name = user.fullName || "Placement Officer";
  const email = user.email || "Email unavailable";

  welcomeTitle.textContent = `Welcome back, ${name.trim().split(/\s+/)[0]}`;
  officerAvatar.textContent = getInitials(name);
  officerName.textContent = name;
  officerEmail.textContent = email;
  officerRole.textContent = "Placement Officer";
  companyAssignment.textContent = getCompanyDisplay(user.company);
}

async function loadDashboard() {
  const authorized = await requireRole(["placement_officer"]);

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

    displayOfficer(user);

    initializeAccountSecurity("../login.html");

    setFeedback(
      "You're signed in. Your placement workspace is ready.",
      "success"
    );
  } catch (error) {
    console.error("Unable to load the placement officer account.", error);

    setFeedback(
      "We couldn't load your account details. Please sign in again and retry.",
      "error"
    );
  }
}

initializeTheme();

loadDashboard().catch((error) => {
  console.error("Placement dashboard initialization failed.", error);

  setFeedback(
    "The dashboard could not be initialized. Please reload the page.",
    "error"
  );
});
