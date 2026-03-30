import express from "express";
import MonthlyAnalyticsReport from "../models/monthlyAnalyticsReport";

const router = express.Router();

router.get("/get-reports", async (req, res) => {
  try {
    const reports = await MonthlyAnalyticsReport.find().sort({
      monthKey: -1,
    });

    res.status(200).json(reports);
  } catch (error) {
    console.error("🔥 ERRO GET REPORTS:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
