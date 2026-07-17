import AppError from "../utils/AppError.js";

import { ROLES } from "../config/constants.js";

const authorize = (...allowedRoles) => {
  // Validate the roles passed to the middleware
  const validRoles = Object.values(ROLES);

  const invalidRoles = allowedRoles.filter(
    (role) => !validRoles.includes(role)
  );

  if (invalidRoles.length > 0) {
    throw new Error(
      `Invalid role(s) supplied to authorize(): ${invalidRoles.join(", ")}`
    );
  }

  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError(
          "Authentication required.",
          401
        )
      );
    }

    if (!req.user.isActive) {
      return next(
        new AppError(
          "Your account has been deactivated.",
          403
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action.",
          403
        )
      );
    }

    next();
  };
};

export default authorize;