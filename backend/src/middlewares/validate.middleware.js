import { validationResult } from "express-validator";

import AppError from "../utils/AppError.js";

const validate = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = {};

  result.array().forEach(({ path, msg }) => {
    if (!errors[path]) {
      errors[path] = msg;
    }
  });

  return next(
    new AppError(
      "Validation failed.",
      400,
      errors
    )
  );
};

export default validate;