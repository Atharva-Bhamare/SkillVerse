export const sendSuccess = (
    res,
    statusCode = 200,
    message = "Success",
    data = null
  ) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  };
  
  export const sendCreated = (
    res,
    message = "Resource created successfully.",
    data = null
  ) => {
    return sendSuccess(res, 201, message, data);
  };
  
  export const sendNoContent = (res) => {
    return res.status(204).send();
  };