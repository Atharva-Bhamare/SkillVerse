export const buildStudentResponse = (student) => ({
    id: student._id,
  
    user: student.user,
  
    headline: student.headline,
  
    bio: student.bio,
  
    avatar: {
      url: student.avatar?.url || "",
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