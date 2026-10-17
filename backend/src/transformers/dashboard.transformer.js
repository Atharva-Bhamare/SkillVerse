
const toId = (value) => {
    if (!value) return null;
  
    if (typeof value === "object") {
      return (value._id ?? value.id)?.toString() ?? null;
    }
  
    return value.toString();
  };
  
  export const buildStudentDashboardResponse = (dashboard) => {
    return {
      summary: dashboard.summary,
      applicationsLast7Days: dashboard.applicationsLast7Days,
  
      recentApplications: dashboard.recentApplications.map(
        (application) => ({
          id: toId(application._id),
          status: application.status,
          appliedAt: application.appliedAt,
          statusUpdatedAt: application.statusUpdatedAt,
  
          job: application.job
            ? {
                id: toId(application.job._id ?? application.job),
                title: application.job.title ?? null,
                company: application.job.company ?? null,
                location: application.job.location ?? null,
                employmentType: application.job.employmentType ?? null,
                status: application.job.status ?? null,
              }
            : null,
        })
      ),
    };
  };
    
  export const buildPlacementDashboardResponse = (dashboard) => {
    return {
      summary: dashboard.summary,
      applicationsLast7Days: dashboard.applicationsLast7Days,
  
      recentApplications: dashboard.recentApplications.map(
        (application) => ({
          id: toId(application._id),
          status: application.status,
          appliedAt: application.appliedAt,
          statusUpdatedAt: application.statusUpdatedAt,
  
          student: application.student
            ? {
                id: toId(application.student._id ?? application.student),
                name: application.student.name ?? null,
                email: application.student.email ?? null,
              }
            : null,
  
          job: application.job
            ? {
                id: toId(application.job._id ?? application.job),
                title: application.job.title ?? null,
                company: toId(application.job.company),
              }
            : null,
        })
      ),
    };
  };
  