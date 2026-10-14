
const buildSalaryResponse = (salary) => ({
    min: salary?.min ?? null,
    max: salary?.max ?? null,
    currency: salary?.currency ?? "INR",
    isDisclosed: salary?.isDisclosed ?? true,
  });
  
  const buildExperienceResponse = (experience) => ({
    minYears: experience?.minYears ?? 0,
    maxYears: experience?.maxYears ?? null,
  });
  
  export const buildJobResponse = (job) => {
    if (!job) {
      return null;
    }
  
    const company =
      job.company && typeof job.company === "object"
        ? {
            id: job.company._id?.toString(),
            name: job.company.name,
            industry: job.company.industry,
            location: job.company.location,
            logo: job.company.logo,
          }
        : job.company?.toString() ?? null;
  
    const postedBy =
      job.postedBy && typeof job.postedBy === "object"
        ? {
            id: job.postedBy._id?.toString(),
            fullName: job.postedBy.fullName,
          }
        : job.postedBy?.toString() ?? null;
  
    return {
      id: job._id?.toString(),
      title: job.title,
      description: job.description,
      responsibilities: job.responsibilities ?? [],
      requirements: job.requirements ?? [],
      skills: job.skills ?? [],
      company,
      postedBy,
      employmentType: job.employmentType,
      workMode: job.workMode,
      location: job.location,
      salary: buildSalaryResponse(job.salary),
      experience: buildExperienceResponse(job.experience),
      openings: job.openings,
      applicationDeadline: job.applicationDeadline,
      status: job.status,
      isActive: job.isActive,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  };
  
  export const buildJobListResponse = (jobs) => {
    return jobs.map(buildJobResponse);
  };
  