import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/video-thumbnail", async (req, res) => {
  try {
    const url = req.query.url;

    if (!url) {
      return res.status(400).json({ message: "URL não informada" });
    }

    // TikTok
    if (url.includes("tiktok.com")) {
      const response = await axios.get(
        "https://www.tiktok.com/oembed",
        {
          params: { url },
        },
      );

      return res.json({
        provider: "tiktok",
        thumbnail: response.data.thumbnail_url,
        title: response.data.title,
      });
    }

    // Instagram (fallback)
    if (url.includes("instagram.com")) {
      return res.json({
        provider: "instagram",
        thumbnail: null,
        fallback: true,
      });
    }

    return res.json({ provider: "unknown" });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar thumbnail" });
  }
});

export default router;