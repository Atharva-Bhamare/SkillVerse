export function createLoadingIndicator(
    message = "Loading..."
  ) {
    const container = document.createElement("div");
    container.className = "loading-indicator";
    container.setAttribute("role", "status");
  
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");
  
    const text = document.createElement("span");
    text.textContent = message;
  
    container.append(spinner, text);
  
    return container;
  }
  
  export function createSkeleton({
    width = "100%",
    height = "18px"
  } = {}) {
    const skeleton = document.createElement("div");
  
    skeleton.className = "skeleton";
    skeleton.setAttribute("aria-hidden", "true");
    skeleton.style.width = width;
    skeleton.style.height = height;
  
    return skeleton;
  }
  
  export function createEmptyState({
    title = "Nothing here yet",
    message = "There is no information to display."
  } = {}) {
    const container = document.createElement("section");
    container.className = "empty-state";
  
    const heading = document.createElement("h3");
    heading.textContent = title;
  
    const description = document.createElement("p");
    description.textContent = message;
  
    container.append(heading, description);
  
    return container;
  }
  
  export function createErrorState({
    title = "Something went wrong",
    message = "Please try again."
  } = {}) {
    const container = document.createElement("section");
    container.className = "error-state";
    container.setAttribute("role", "alert");
  
    const heading = document.createElement("h3");
    heading.textContent = title;
  
    const description = document.createElement("p");
    description.textContent = message;
  
    container.append(heading, description);
  
    return container;
  }