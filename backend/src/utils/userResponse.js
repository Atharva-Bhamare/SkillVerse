export const buildUserResponse = (user) => {
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  };