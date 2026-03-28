import mongoose from "mongoose";

const AdSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true },
    link: { type: String, required: false, default: "" },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.Ad || mongoose.model("Ad", AdSchema);
