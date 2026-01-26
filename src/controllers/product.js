import express from "express";
import multer from "multer";

import { createProduct } from "../server/product";
import { updateProduct } from "../server/product";
import { getAllProducts } from "../server/product";
import product from "../models/product";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/create-product", upload.single("image"), async (req, res) => {
  try {
    const { name, category, priceUnit, priceWholesale } = req.body;
    const file = req.file;

    console.log("🟢 req.file existe?", !!file);

    if (!file) {
      return res.status(400).json({ message: "Imagem não enviada" });
    }

    const results = await createProduct(
      {
        name,
        category,
        priceUnit,
        priceWholesale,
      },
      file,
    );

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/update-product/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const file = req.file;

    const result = await updateProduct(id, data, file);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/get-product/:id", async (req, res) => {
  const product = await product.findById(req.params.id);
  res.status(200).json(product);
});

router.get("/get-all-product", async (req, res) => {
  try {
    const result = await getAllProducts();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
