
const buildStudentResponse = (student) => {
  if (!student) {
    return null;
  }

  // Handles populated User documents.
  if (typeof student === "object" && student._id) {
    return {
      id: student._id.toString(),
      fullName: student.fullName,
      email: student.email,
    };
  }

  // Handles unpopulated ObjectId references.
  return student.toString();
};

const buildJobResponse = (job) => {
  if (!job) {
    return null;
  }

  // Handles populated Job documents.
  if (typeof job === "object" && job._id) {
    const company =
      job.company && typeof job.company === "object" && job.company._id
        ? {
            id: job.company._id.toString(),
            name: job.company.name,
            industry: job.company.industry,
            location: job.company.location,
          }
        : job.company?.toString() ?? null;

    return {
      id: job._id.toString(),
      title: job.title,
      company,
      employmentType: job.employmentType,
      workMode: job.workMode,
      location: job.location,
      applicationDeadline: job.applicationDeadline,
      status: job.status,
    };
  }

  // Handles unpopulated ObjectId references.
  return job.toString();
};

export const buildApplicationResponse = (application) => {
  if (!application) {
    return null;
  }

  const statusUpdatedBy = application.statusUpdatedBy
    ? typeof application.statusUpdatedBy === "object" &&
      application.statusUpdatedBy._id
      ? {
          id: application.statusUpdatedBy._id.toString(),
          fullName: application.statusUpdatedBy.fullName,
        }
      : application.statusUpdatedBy.toString()
    : null;

  return {
    id: application._id.toString(),
    student: buildStudentResponse(application.student),
    job: buildJobResponse(application.job),
    resume: application.resume ?? null,
    coverLetter: application.coverLetter ?? "",
    status: application.status,
    appliedAt: application.appliedAt,
    statusUpdatedAt: application.statusUpdatedAt,
    statusUpdatedBy,
    notes: application.notes ?? "",
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
};

export const buildApplicationListResponse = (applications) =>
  applications.map(buildApplicationResponse);
