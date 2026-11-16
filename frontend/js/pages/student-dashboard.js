
import { authService } from "../auth/auth.service.js";
import { requireRole } from "../auth/route-guard.js";
import { initializeTheme } from "../utils/theme.js";
import { renderNavbar } from "../components/navbar.js";

const welcomeTitle = document.querySelector("#welcome-title");
const studentAvatar = document.querySelector("#student-avatar");
const studentName = document.querySelector("#student-name");
const studentEmail = document.querySelector("#student-email");
const studentRole = document.querySelector("#student-role");
const feedback = document.querySelector("#dashboard-feedback");

function setFeedback(message, state = "info") {
  feedback.textContent = message;
  feedback.dataset.state = state;
}

function getUserFromResponse(response) {
  return response?.data?.user ?? response?.data ?? response?.user ?? response;
}

function getInitials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "S";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function displayStudent(user) {
  const name = user.fullName || "Student";
  const email = user.email || "Email unavailable";

  welcomeTitle.textContent = `Welcome back, ${name.split(/\s+/)[0]}`;
  studentAvatar.textContent = getInitials(name);
  studentName.textContent = name;
  studentEmail.textContent = email;
  studentRole.textContent = "Student";
}

function initializeAccountDetailsAccordion() {
  const toggle = document.querySelector("#account-details-toggle");
  const content = document.querySelector("#account-details-content");

  if (!toggle || !content) return;

  toggle.addEventListener("click", () => {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";

    toggle.setAttribute("aria-expanded", String(!isExpanded));
    content.hidden = isExpanded;
  });
}

async function loadDashboard() {
  const authorized = await requireRole(["student"]);

  if (!authorized) return;

  try {
    const response = await authService.getCurrentUser();
    const user = getUserFromResponse(response);

    if (!user || user.role !== "student") {
      authService.clearLocalSession();
      window.location.replace("../login.html");
      return;
    }

    // Render the same shared navbar used by the Jobs and Profile pages.
    renderNavbar({
      user,
      mount: document.getElementById("site-header")
    });

    displayStudent(user);

    setFeedback(
      "You're signed in. Your student workspace is ready.",
      "success"
    );
  } catch (error) {
    console.error("Unable to load the student account.", error);

    setFeedback(
      "We couldn't load your account details. Please sign in again and retry.",
      "error"
    );
  }
}

initializeTheme();
initializeAccountDetailsAccordion();

loadDashboard().catch((error) => {
  console.error("Student dashboard initialization failed.", error);

  setFeedback(
    "The dashboard could not be initialized. Please reload the page.",
    "error"
  );
});
