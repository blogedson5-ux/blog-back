import express from "express";
import multer from "multer";
import Product from "../models/product";
import { databaseConnection } from "../utils/database";
import cloudinary from "../utils/cloudinary";

const app = express();
const upload = multer(); // para lidar com multipart/form-data

// Middleware CORS manual para serverless
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://simoesbone.netlify.app",
  ); // seu front
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Responde preflight
  }

  next();
});

// Rota de criar produto
app.post(
  "/product/create-product",
  upload.single("image"),
  async (req, res) => {
    try {
      await databaseConnection();

      const { name, category, priceUnit, priceWholesale } = req.body;
      const image = req.file;

      // Upload Cloudinary
      const result = await cloudinary.uploader.upload(image.path, {
        folder: "products",
        timeout: 180000,
      });

      // Salva no MongoDB
      const product = await Product.create({
        name,
        category,
        priceUnit,
        priceWholesale,
        image: {
          url: result.secure_url,
          filename: image.originalname,
          public_id: result.public_id,
        },
      });

      res.status(201).json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erro interno ao criar produto" });
    }
  },
);

export default app;
