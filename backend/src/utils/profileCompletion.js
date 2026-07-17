export const calculateStudentProfileCompletion = (student) => {
  const fields = [
    Boolean(student.headline),
    Boolean(student.bio),
    Boolean(student.avatar?.url),
    Boolean(student.college),
    Boolean(student.degree),
    Boolean(student.specialization),
    Boolean(student.graduationYear),
    Boolean(student.cgpa),
    Boolean(student.skills?.length),
    Boolean(student.socialLinks?.github),
    Boolean(student.socialLinks?.linkedin),
    Boolean(student.socialLinks?.portfolio),
  ];

  const completedFields = fields.filter(Boolean).length;

  return Math.round(
    (completedFields / fields.length) * 100
  );
};