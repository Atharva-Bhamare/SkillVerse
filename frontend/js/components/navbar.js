import { toggleTheme } from "../utils/theme.js";
import { authService } from "../auth/auth.service.js";

const APP_ROOT = new URL("../../", import.meta.url);
const navbarControllers = new WeakMap();

function appHref(path) {
  if (path.startsWith("#")) {
    return new URL(`index.html${path}`, APP_ROOT).href;
  }

  return new URL(path.replace(/^\.\/?/, ""), APP_ROOT).href;
}

const roleNavigation = {
  student: [
    { label: "Dashboard", href: "pages/student-dashboard.html" },
    { label: "Explore jobs", href: "pages/jobs.html" },
    { label: "My applications", href: "pages/applications.html" },
    { label: "My profile", href: "pages/student-profile.html" }
  ],

  placement_officer: [
    { label: "Dashboard", href: "pages/placement-dashboard.html" },
    { label: "Manage jobs", href: "pages/placement-jobs.html" },
    { label: "Applications", href: "pages/placement-applications.html" }
  ],

  admin: [
    { label: "Dashboard", href: "pages/admin-dashboard.html" },
    { label: "Companies", href: "pages/admin-companies.html" },
    { label: "Job oversight", href: "pages/admin-jobs.html" }
  ]
};

const publicNavigation = [
  { label: "For students", href: "#students" },
  { label: "For placement teams", href: "#placement-teams" }
];

function getCurrentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isCurrentLink(href) {
  if (href.startsWith("#")) {
    return false;
  }

  try {
    const targetPath = new URL(appHref(href)).pathname.replace(/\/+$/, "");
    return targetPath === getCurrentPath();
  } catch {
    return false;
  }
}

export function renderNavbar({
  user = null,
  mount = document.getElementById("site-header")
} = {}) {
  if (!mount) {
    return;
  }

  navbarControllers.get(mount)?.abort();

  const controller = new AbortController();
  navbarControllers.set(mount, controller);

  const isAuthenticated = Boolean(user);

  const normalizedRole = String(
    user?.role || user?.user?.role || ""
  ).toLowerCase().trim();
  
  const links = isAuthenticated
    ? (roleNavigation[normalizedRole] || [])
    : publicNavigation;
  
  if (isAuthenticated && links.length === 0) {
    console.warn("SkillVerse navbar: unrecognized user role.", {
      role: user?.role,
      user,
    });
  }

  const linksMarkup = links.map((link) => {
    const current = isCurrentLink(link.href);

    return `
      <a
        class="navbar__link"
        href="${appHref(link.href)}"
        ${current ? 'aria-current="page"' : ""}
      >${link.label}</a>
    `;
  }).join("");

  mount.innerHTML = `
    <nav class="navbar" aria-label="Main navigation">
      <a class="brand" href="${appHref("index.html")}" aria-label="SkillVerse home">
        <span class="brand__mark" aria-hidden="true">S</span>
        <span>SkillVerse</span>
      </a>

      <div class="navbar__links" id="primary-navigation">
        ${linksMarkup}

        <div class="navbar__mobile-actions">
          ${
            isAuthenticated
              ? '<button class="button button--secondary" type="button" data-logout>Sign out</button>'
              : `
                <a class="button button--secondary" href="${appHref("login.html")}">Sign in</a>
                <a class="button button--primary" href="${appHref("register.html")}">Get started</a>
              `
          }
        </div>
      </div>

      <div class="navbar__actions">
        <button
          class="icon-button theme-toggle"
          type="button"
          data-theme-toggle
          aria-label="Toggle color theme"
          aria-pressed="false"
        >☾</button>

        ${
          isAuthenticated
            ? `
              <button class="button button--secondary navbar__desktop-only"
                      type="button" data-logout>Sign out</button>
            `
            : `
              <a class="button button--secondary navbar__desktop-only"
                 href="${appHref("login.html")}">Sign in</a>
              <a class="button button--primary navbar__desktop-only"
                 href="${appHref("register.html")}">Get started</a>
            `
        }

        <button
          class="icon-button navbar__toggle"
          type="button"
          aria-label="Open navigation menu"
          aria-expanded="false"
          aria-controls="primary-navigation"
          data-menu-toggle
        >☰</button>
      </div>
    </nav>
  `;

  mount.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", toggleTheme);
  });

  const menu = mount.querySelector("#primary-navigation");
  const menuToggle = mount.querySelector("[data-menu-toggle]");

  function closeMenu() {
    menu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    menuToggle.textContent = "☰";
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    },
    { signal: controller.signal }
  );

  mount.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Signing out…";
  
      try {
        await authService.logout();
      } catch (error) {
        console.error("Server sign-out request failed.", error);
      } finally {
        authService.clearLocalSession();
        window.location.replace(appHref("login.html"));
      }
    });
  });
}