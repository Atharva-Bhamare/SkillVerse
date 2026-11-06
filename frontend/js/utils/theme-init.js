
/**
 * SkillVerse shared theme initialization.
 * Load this classic script before stylesheets to reduce theme flash.
 */

(function initializeSkillVerseTheme() {
    const THEME_KEY = "skillverse-theme";
    let theme = "light";
  
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
  
      if (savedTheme === "light" || savedTheme === "dark") {
        theme = savedTheme;
      } else {
        theme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
    } catch {
      try {
        theme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      } catch {
        theme = "light";
      }
    }
  
    document.documentElement.dataset.theme = theme;
  })();
  