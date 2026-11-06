export function confirmDialog({
    title = "Are you sure?",
    message = "Please confirm that you want to continue.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = false
  } = {}) {
    return new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      dialog.className = "modal";
      dialog.setAttribute("aria-labelledby", "modal-title");
  
      const header = document.createElement("div");
      header.className = "modal__header";
  
      const heading = document.createElement("h2");
      heading.className = "modal__title";
      heading.id = "modal-title";
      heading.textContent = title;
  
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "icon-button";
      closeButton.setAttribute("aria-label", "Close dialog");
      closeButton.textContent = "×";
  
      header.append(heading, closeButton);
  
      const body = document.createElement("div");
      body.className = "modal__body";
  
      const paragraph = document.createElement("p");
      paragraph.textContent = message;
      body.append(paragraph);
  
      const footer = document.createElement("div");
      footer.className = "modal__footer";
  
      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "button button--secondary";
      cancelButton.textContent = cancelText;
  
      const confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.className = danger
        ? "button button--danger"
        : "button button--primary";
      confirmButton.textContent = confirmText;
  
      footer.append(cancelButton, confirmButton);
      dialog.append(header, body, footer);
  
      document.body.append(dialog);
  
      let settled = false;
  
      function finish(confirmed) {
        if (settled) return;
  
        settled = true;
  
        if (dialog.open) {
          dialog.close();
        }
  
        dialog.remove();
        resolve(confirmed);
      }
  
      cancelButton.addEventListener("click", () => finish(false));
      closeButton.addEventListener("click", () => finish(false));
      confirmButton.addEventListener("click", () => finish(true));
  
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        finish(false);
      });
  
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
          finish(false);
        }
      });
  
      dialog.addEventListener("close", () => {
        if (!settled) {
          finish(false);
        }
      });
  
      dialog.showModal();
      confirmButton.focus();
    });
  }