import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema(
  {
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    page: {
      type: String,
      required: true,
      index: true,
    },
    visits: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true },
);

AnalyticsSchema.index({ dateKey: 1, page: 1 }, { unique: true });

export default mongoose.models.Analytics ||
  mongoose.model("Analytics", AnalyticsSchema);