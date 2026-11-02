export const buildStudentResponse = (student) => ({
    id: student._id,
  
    user: student.user,
  
    headline: student.headline,
  
    bio: student.bio,
  
    avatar: {
      url: student.avatar?.url || "",
      originalName: student.avatar?.originalName || "",
      size: student.avatar?.size || 0,
    },
    
    resume: {
      url: student.resume?.url || "",
      originalName: student.resume?.originalName || "",
      size: student.resume?.size || 0,
      publicId: student.resume?.publicId || "",
    },
  
    college: student.college,
  
    degree: student.degree,
  
    specialization: student.specialization,
  
    graduationYear: student.graduationYear,
  
    cgpa: student.cgpa,
  
    skills: student.skills,
  
    socialLinks: {
      github: student.socialLinks?.github || "",
      linkedin: student.socialLinks?.linkedin || "",
      portfolio: student.socialLinks?.portfolio || "",
    },
  
    profileCompletion: student.profileCompletion,
  
    isProfileComplete: student.isProfileComplete,
  
    profileVisibility: student.profileVisibility,
  
    createdAt: student.createdAt,
  
    updatedAt: student.updatedAt,
  });