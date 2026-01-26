import express from "express";
import multer from "multer";

import { createBanner, getAllBanners, deleteBanner } from "../server/banner.js";

const router = express.Router();
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// 📤 Criar banner
router.post("/banner", upload.single("image"), async (req, res) => {
  const banner = await createBanner(req.file);
  res.status(201).json(banner);
});

// 📥 Listar banners
router.get("/banners-get", async (req, res) => {
  try {
    const banners = await getAllBanners();
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🗑️ Deletar banner
router.delete("/delete-banner/:id", async (req, res) => {
  try {
    const banner = await deleteBanner(req.params.id);
    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
