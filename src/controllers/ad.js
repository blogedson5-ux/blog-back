import express from "express";
import multer from "multer";

import { createAd } from "../server/ad";
import { updateAd } from "../server/ad";
import { deleteAd } from "../server/ad";
import { getAd } from "../server/ad";
import { getAdById } from "../server/ad";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/create-ad", upload.array("images", 3), async (req, res) => {
  try {
    const { titulo, link } = req.body;
    const files = req.files;

    console.log("🟢 req.files existe?", !!files);
    console.log("🟢 quantidade de imagens:", files ? files.length : 0);
    console.log("🟢 req.body:", req.body);

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res
        .status(400)
        .json({ message: "Pelo menos 1 imagem deve ser enviada" });
    }

    if (files.length > 3) {
      return res.status(400).json({
        message: "Só é permitido enviar no máximo 3 imagens por anúncio",
      });
    }

    if (!titulo || !link) {
      return res.status(400).json({ message: "Campos obrigatórios" });
    }

    const result = await createAd(
      {
        titulo,
        link,
      },
      files,
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 ERRO CREATE AD:", error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update-ad/:id", upload.array("images", 3), async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, link } = req.body;
    const files = req.files;

    const result = await updateAd(
      id,
      {
        titulo,
        link,
      },
      files,
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 ERRO UPDATE AD:", error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete-ad/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteAd(id);

    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 ERRO DELETE AD:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/get-ad", async (req, res) => {
  try {
    const result = await getAd();
    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 ERRO GET AD:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/get-ad/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getAdById(id);

    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 ERRO GET AD BY ID:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;