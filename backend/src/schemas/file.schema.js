import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
      trim: true,
    },

    publicId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

export default fileSchema;