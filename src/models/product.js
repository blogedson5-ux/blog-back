import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    priceUnit: { type: Number, required: true },
    priceWholesale: { type: Number },

    image: {
      url: { type: String, required: true },
      filename: { type: String, required: true },
      public_id: { type: String, required: true },
    },
  },
  { timestamps: true },
);

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
