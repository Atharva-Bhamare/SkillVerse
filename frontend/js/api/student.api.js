
import { api } from "./api-client.js";

const BASE_PATH = "/student/profile";

export const studentApi = {
  getProfile() {
    return api.get(BASE_PATH);
  },

  createProfile(profileData) {
    return api.post(BASE_PATH, profileData);
  },

  updateProfile(profileData) {
    return api.patch(BASE_PATH, profileData);
  },

  uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);

    return api.upload(`${BASE_PATH}/avatar`, formData, {
      method: "PATCH",
    });
  },

  uploadResume(file) {
    const formData = new FormData();
    formData.append("document", file);

    return api.upload(`${BASE_PATH}/resume`, formData, {
      method: "PATCH",
    });
  },

  removeAvatar() {
    return api.delete(`${BASE_PATH}/avatar`);
  },

  removeResume() {
    return api.delete(`${BASE_PATH}/resume`);
  },
};
