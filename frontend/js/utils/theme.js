const THEME_KEY = "skillverse-theme";

export function getPreferredTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme, { persist = true } = {}) {
  const nextTheme = theme === "dark" ? "dark" : "light";

  document.documentElement.dataset.theme = nextTheme;

  const themeColor = document.querySelector(
    'meta[name="theme-color"]'
  );

  if (themeColor) {
    themeColor.setAttribute(
      "content",
      nextTheme === "dark" ? "#0b1120" : "#f8fafc"
    );
  }

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const isDark = nextTheme === "dark";

    button.textContent = isDark ? "☀" : "☾";
    button.setAttribute(
      "aria-label",
      isDark ? "Switch to light theme" : "Switch to dark theme"
    );
    button.setAttribute("aria-pressed", String(isDark));
  });

  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      // The current theme still works for this page.
    }
  }

  return nextTheme;
}

export function toggleTheme() {
  const currentTheme =
    document.documentElement.dataset.theme || getPreferredTheme();

  return applyTheme(currentTheme === "dark" ? "light" : "dark");
}

export function initializeTheme() {
    return applyTheme(getPreferredTheme(), { persist: false });
  }