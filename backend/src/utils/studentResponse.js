export const buildStudentResponse = (student) => ({
    id: student._id,
  
    user: {
      id: student.user?._id || student.user,
      fullName: student.user?.fullName,
      email: student.user?.email,
      role: student.user?.role,
    },
  
    headline: student.headline,
    bio: student.bio,
    avatar: student.avatar,
  
    college: student.college,
    degree: student.degree,
    specialization: student.specialization,
    graduationYear: student.graduationYear,
    cgpa: student.cgpa,
  
    skills: student.skills,
  
    socialLinks: student.socialLinks,
  
    profileCompletion: student.profileCompletion,
  
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  });