import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true },
    textOne: { type: String, required: true },
    textTwo: { type: String, required: true },

    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
  },
  { timestamps: true },
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
