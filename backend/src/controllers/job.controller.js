
import jobService from "../services/job.service.js";
import {
  buildJobResponse,
  buildJobListResponse,
} from "../transformers/job.transformer.js";
import {
  sendSuccess,
  sendCreated,
} from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createJob = asyncHandler(async (req, res) => {
  const job = await jobService.createJob(
    req.body,
    req.user.id,
    req.user.role
  );

  return sendCreated(
    res,
    "Job created successfully.",
    buildJobResponse(job)
  );
});

export const getJobById = asyncHandler(async (req, res) => {
  const job = await jobService.getJobById(
    req.params.jobId,
    req.user.role
  );

  return sendSuccess(
    res,
    200,
    "Job retrieved successfully.",
    buildJobResponse(job)
  );
});

export const listJobs = asyncHandler(async (req, res) => {
  const result = await jobService.listJobs(
    req.query,
    req.user.role
  );

  return sendSuccess(
    res,
    200,
    "Jobs retrieved successfully.",
    {
      jobs: buildJobListResponse(result.jobs),
      pagination: result.pagination,
    }
  );
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = await jobService.updateJob(
    req.params.jobId,
    req.body,
    req.user.role
  );

  return sendSuccess(
    res,
    200,
    "Job updated successfully.",
    buildJobResponse(job)
  );
});

export const deactivateJob = asyncHandler(async (req, res) => {
  const job = await jobService.deactivateJob(
    req.params.jobId,
    req.user.role
  );

  return sendSuccess(
    res,
    200,
    "Job deactivated successfully.",
    buildJobResponse(job)
  );
});
