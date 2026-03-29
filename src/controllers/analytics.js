import express from "express";

import {
  trackVisit,
  getAnalyticsSummary,
  getAnalyticsByPage,
  deleteAnalyticsById,
} from "../server/analytics";

const router = express.Router();

router.post("/track-visit", async (req, res) => {
  try {
    const { page } = req.body;

    if (!page) {
      return res.status(400).json({
        message: "O campo page é obrigatório",
      });
    }

    const result = await trackVisit({ page });

    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 ERRO TRACK VISIT:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/get-summary", async (req, res) => {
  try {
    const result = await getAnalyticsSummary();
    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 ERRO GET ANALYTICS SUMMARY:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/get-by-page", async (req, res) => {
  try {
    const { page } = req.query;

    const result = await getAnalyticsByPage(page);

    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 ERRO GET ANALYTICS BY PAGE:", error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete-analytics/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteAnalyticsById(id);

    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 ERRO DELETE ANALYTICS:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;