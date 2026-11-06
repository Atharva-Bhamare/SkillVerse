
let toastTimer;

const NOTIFICATION_DURATION = 3500;

const ALLOWED_TYPES = ["success", "error", "warning", "info"];

export function showNotification(message, type = "success") {
  let container = document.querySelector("#notification-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.className = "notification-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "true");
    document.body.appendChild(container);
  }

  const safeType = ALLOWED_TYPES.includes(type) ? type : "info";

  clearTimeout(toastTimer);
  container.replaceChildren();

  const toast = document.createElement("div");
  toast.className = `app-notification app-notification--${safeType}`;
  toast.setAttribute("role", safeType === "error" ? "alert" : "status");

  const icon = document.createElement("span");
  icon.className = "app-notification__icon";
  icon.setAttribute("aria-hidden", "true");

  icon.textContent =
    safeType === "success" ? "✓" :
    safeType === "info" ? "i" : "!";

  const text = document.createElement("span");
  text.className = "app-notification__text";
  text.textContent = String(message ?? "");

  const closeButton = document.createElement("button");
  closeButton.className = "app-notification__close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Dismiss notification");
  closeButton.textContent = "×";

  const dismiss = () => {
    clearTimeout(toastTimer);

    if (toast.parentElement === container) {
      toast.remove();
    }
  };

  closeButton.addEventListener("click", dismiss);

  toast.append(icon, text, closeButton);
  container.appendChild(toast);

  toastTimer = setTimeout(dismiss, NOTIFICATION_DURATION);

  return dismiss;
}
