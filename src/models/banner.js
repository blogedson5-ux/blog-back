import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema(
  {
    image: {
      url: { type: String, required: true },
      filename: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    active: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Banner ||
  mongoose.model("Banner", BannerSchema);
