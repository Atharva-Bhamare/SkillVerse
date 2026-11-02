
export const buildUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isActive: user.isActive,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,

  // Include the assigned company for placement officers.
  ...(user.role === "placement_officer" && user.company
    ? {
        company:
          typeof user.company === "object"
            ? user.company._id?.toString?.() ?? user.company.id
            : user.company.toString(),
      }
    : {}),
});
