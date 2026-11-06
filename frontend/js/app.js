import { renderNavbar } from "./components/navbar.js";
import { initializeTheme } from "./utils/theme.js";

function initializeApp() {
  initializeTheme();

  // Authentication will supply the real user in Phase 3.
  // Until then, show only public navigation.
  renderNavbar({ user: null });

  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp, {
    once: true
  });
} else {
  initializeApp();
}