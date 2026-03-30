import mongoose from "mongoose";

const MonthlyAnalyticsReportSchema = new mongoose.Schema(
  {
    monthKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    totalVisits: {
      type: Number,
      required: true,
      default: 0,
    },
    avgDailyVisits: {
      type: Number,
      required: true,
      default: 0,
    },
    topPages: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        visits: { type: Number, required: true, default: 0 },
      },
    ],
    comparison: {
      previousMonthKey: { type: String, default: "" },
      previousTotalVisits: { type: Number, default: 0 },
      growthPercentage: { type: Number, default: 0 },
    },
    pdfFileName: {
      type: String,
      default: "",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export default mongoose.models.MonthlyAnalyticsReport ||
  mongoose.model("MonthlyAnalyticsReport", MonthlyAnalyticsReportSchema);