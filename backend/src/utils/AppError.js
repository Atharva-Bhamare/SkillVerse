class AppError extends Error {
  constructor(message, statusCode = 500, errors = {}) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.statusText =
      statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;