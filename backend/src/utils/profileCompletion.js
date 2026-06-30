export const calculateStudentProfileCompletion = (
    student
  ) => {
    const fields = [
      student.headline,
      student.bio,
      student.avatar,
      student.college,
      student.degree,
      student.specialization,
      student.graduationYear,
      student.cgpa,
      student.skills?.length > 0,
      student.socialLinks?.github,
      student.socialLinks?.linkedin,
      student.socialLinks?.portfolio,
    ];
  
    const completed = fields.filter(Boolean).length;
  
    return Math.round(
      (completed / fields.length) * 100
    );
  };