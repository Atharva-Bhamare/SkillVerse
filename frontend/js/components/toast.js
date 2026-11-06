const DEFAULT_DURATION = 4500;

const toastTitles = {
  success: "Success",
  error: "Something went wrong",
  warning: "Please note",
  info: "Information"
};

export function showToast({
  title,
  message,
  type = "info",
  duration = DEFAULT_DURATION
}) {
  const region = document.getElementById("toast-region");

  if (!region) {
    return null;
  }

  const safeType = Object.hasOwn(toastTitles, type) ? type : "info";

  const toast = document.createElement("div");
  toast.className = `toast toast--${safeType}`;
  toast.setAttribute("role", safeType === "error" ? "alert" : "status");

  const indicator = document.createElement("span");
  indicator.className = "toast__indicator";
  indicator.setAttribute("aria-hidden", "true");

  const content = document.createElement("div");
  content.className = "toast__content";

  const heading = document.createElement("p");
  heading.className = "toast__title";
  heading.textContent = title || toastTitles[safeType];

  const description = document.createElement("p");
  description.className = "toast__message";
  description.textContent = String(message ?? "");

  const closeButton = document.createElement("button");
  closeButton.className = "toast__close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Dismiss notification");
  closeButton.textContent = "×";

  content.append(heading, description);
  toast.append(indicator, content, closeButton);
  region.append(toast);

  let timeoutId = null;

  const dismiss = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    toast.remove();
  };

  closeButton.addEventListener("click", dismiss);

  if (duration > 0) {
    timeoutId = setTimeout(dismiss, duration);
  }

  return dismiss;
}