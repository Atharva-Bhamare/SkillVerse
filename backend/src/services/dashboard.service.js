import mongoose from "mongoose";
import Application from "../models/application.model.js";
import Notification from "../models/notification.model.js";
import AppError from "../utils/AppError.js";
import Job from "../models/job.model.js";

const RECENT_APPLICATIONS_LIMIT = 5;


export const getStudentDashboard = async (studentId, userRole) => {
    if (userRole !== "student") {
      throw new AppError(
        "You are not authorized to access the student dashboard.",
        403
      );
    }
  
    // Calculate today's date in India, independent of server timezone.
    const now = new Date();
  
    const indiaDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  
    const [year, month, day] = indiaDate.split("-").map(Number);
  
    // Midnight IST, six calendar days before today.
    const trendStart = new Date(
      Date.UTC(year, month - 1, day - 6) - 330 * 60 * 1000
    );

    const studentObjectId = new mongoose.Types.ObjectId(
        studentId.toString()
      );
  
    const [
      totalApplications,
      statusCounts,
      recentApplications,
      unreadNotifications,
      applicationTrends,
    ] = await Promise.all([
      Application.countDocuments({ student: studentId }),
  
      Application.aggregate([
        { $match: { student: studentObjectId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
  
      Application.find({ student: studentId })
        .sort({ appliedAt: -1, _id: -1 })
        .limit(RECENT_APPLICATIONS_LIMIT)
        .populate("job", "title company location employmentType status")
        .lean(),
  
      Notification.countDocuments({
        recipient: studentId,
        isRead: false,
      }),
  
      Application.aggregate([
        {
          $match: {
            student: studentObjectId,
            appliedAt: { $gte: trendStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$appliedAt",
                timezone: "Asia/Kolkata",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);
  
    const applicationsByStatus = {
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };
  
    for (const item of statusCounts) {
      if (
        Object.prototype.hasOwnProperty.call(
          applicationsByStatus,
          item._id
        )
      ) {
        applicationsByStatus[item._id] = item.count;
      }
    }
  
    const trendCounts = new Map(
      applicationTrends.map((item) => [item._id, item.count])
    );
  
    const applicationsLast7Days = Array.from(
      { length: 7 },
      (_, index) => {
        // Build each date from the India calendar date, using UTC
        // arithmetic to avoid server-local timezone differences.
        const date = new Date(
          Date.UTC(year, month - 1, day - 6 + index)
        );
  
        const dateKey = [
          date.getUTCFullYear(),
          String(date.getUTCMonth() + 1).padStart(2, "0"),
          String(date.getUTCDate()).padStart(2, "0"),
        ].join("-");
  
        return {
          date: dateKey,
          count: trendCounts.get(dateKey) ?? 0,
        };
      }
    );
  
    return {
      summary: {
        totalApplications,
        ...applicationsByStatus,
        unreadNotifications,
      },
      applicationsLast7Days,
      recentApplications,
    };
  };
  

export const getPlacementDashboard = async (userId, userRole) => {
    if (!["admin", "placement_officer"].includes(userRole)) {
      throw new AppError(
        "You are not authorized to access the placement dashboard.",
        403
      );
    }
  
    // Admins see platform-wide data; placement officers see their own jobs.
    const jobFilter =
      userRole === "admin" ? {} : { postedBy: userId };
  
    const jobs = await Job.find(jobFilter)
      .select("_id status isActive")
      .lean();
  
    const jobIds = jobs.map((job) => job._id);
  
    const applicationFilter =
      userRole === "admin"
        ? {}
        : { job: { $in: jobIds } };
  
    // Use the server's local calendar day consistently for both queries
    // and the seven-day trend normalization.
    const now = new Date();

const indiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(now);

const [year, month, day] = indiaDate.split("-").map(Number);

const trendStart = new Date(
  Date.UTC(year, month - 1, day - 6) - 330 * 60 * 1000
);
  
    const [
      totalJobs,
      openJobs,
      activeJobs,
      totalApplications,
      statusCounts,
      recentApplications,
      applicationTrends,
    ] = await Promise.all([
      Job.countDocuments(jobFilter),
  
      Job.countDocuments({
        ...jobFilter,
        status: "open",
        applicationDeadline: { $gt: new Date() },
      }),
  
      Job.countDocuments({
        ...jobFilter,
        isActive: true,
      }),
  
      Application.countDocuments(applicationFilter),
  
      Application.aggregate([
        { $match: applicationFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
  
      Application.find(applicationFilter)
        .sort({ appliedAt: -1, _id: -1 })
        .limit(5)
        .populate("student", "name email")
        .populate("job", "title company postedBy")
        .lean(),
  
      Application.aggregate([
        {
          $match: {
            ...applicationFilter,
            appliedAt: { $gte: trendStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$appliedAt",
                timezone: "Asia/Kolkata",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);
  
    const applicationsByStatus = {
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };
  
    for (const item of statusCounts) {
      if (
        Object.prototype.hasOwnProperty.call(
          applicationsByStatus,
          item._id
        )
      ) {
        applicationsByStatus[item._id] = item.count;
      }
    }
  
    const trendCounts = new Map(
      applicationTrends.map((item) => [item._id, item.count])
    );
  
    const applicationsLast7Days = Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(trendStart);
        date.setDate(trendStart.getDate() + index);
  
        // Format using the same timezone as the MongoDB aggregation.
        const dateKey = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(date);
  
        return {
          date: dateKey,
          count: trendCounts.get(dateKey) ?? 0,
        };
      }
    );
  
    return {
      summary: {
        totalJobs,
        openJobs,
        activeJobs,
        totalApplications,
        ...applicationsByStatus,
      },
      applicationsLast7Days,
      recentApplications,
    };
  };  
  