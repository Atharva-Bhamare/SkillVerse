
import { authService } from "./auth.service.js";
import {
  getAccessToken,
  clearSession
} from "./token-store.js";

const ROLE_DASHBOARDS = {
  student: "student-dashboard.html",
  placement_officer: "placement-dashboard.html",
  admin: "admin-dashboard.html"
};

function normalizeRole(user) {
  const role = user?.role ?? user?.account?.role;

  if (typeof role !== "string") return null;

  const normalized = role.toLowerCase().trim();

  if (normalized === "student") return "student";

  if (
    normalized === "admin" ||
    normalized === "administrator"
  ) {
    return "admin";
  }

  if (
    normalized === "placement_officer" ||
    normalized === "placement officer" ||
    normalized === "placement-officer"
  ) {
    return "placement_officer";
  }

  return null;
}

export function getDashboardPath(user) {
  const role = normalizeRole(user);
  const dashboard = ROLE_DASHBOARDS[role];

  if (!dashboard) return null;

  // Dashboard pages are inside frontend/pages/.
  // Login and registration pages are in the frontend root.
  const isInsidePagesDirectory =
    window.location.pathname.includes("/pages/");

  return isInsidePagesDirectory
    ? `./${dashboard}`
    : `./pages/${dashboard}`;
}

export async function redirectAfterLogin(selectedRole) {
  if (!getAccessToken()) {
    throw new Error("Your session is missing. Please sign in again.");
  }

  const response = await authService.getCurrentUser();

  const user =
    response?.user ??
    response?.data?.user ??
    response?.data ??
    response;

  const actualRole = normalizeRole(user);

  if (!actualRole) {
    clearSession();
    throw new Error(
      "Your account role could not be verified. Please contact support."
    );
  }

  if (actualRole !== selectedRole) {
    throw new Error(
      `This account is registered as ${actualRole.replaceAll("_", " ")}. Please select the matching workspace.`
    );
  }

  const destination = getDashboardPath(user);

  if (!destination) {
    throw new Error(
      "No dashboard is configured for this account role."
    );
  }

  window.location.assign(destination);
}

export async function requireRole(allowedRoles) {
  const token = getAccessToken();

  if (!token) {
    window.location.replace("../login.html");
    return false;
  }

  try {
    const response = await authService.getCurrentUser();

    const user =
      response?.user ??
      response?.data?.user ??
      response?.data ??
      response;

    const actualRole = normalizeRole(user);

    if (!actualRole) {
      clearSession();
      window.location.replace("../login.html");
      return false;
    }

    if (!allowedRoles.includes(actualRole)) {
      const destination = getDashboardPath(user);

      window.location.replace(
        destination || "../login.html"
      );

      return false;
    }

    return true;
  } catch {
    clearSession();
    window.location.replace("../login.html");
    return false;
  }
}
