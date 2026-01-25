import { databaseConnection } from "../utils/database";
import cloudinary from "../utils/cloudinary";

import Product from "../models/product";

export const createProduct = async (data, image) => {
  console.log("➡️ Iniciando createProduct");

  await databaseConnection();
  console.log("✅ MongoDB conectado");

  try {
    console.log("➡️ Enviando imagem ao Cloudinary");

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "products" }, (error, result) => {
          if (error) {
            console.error("❌ Erro Cloudinary:", error);
            return reject(error);
          }
          resolve(result);
        })
        .end(image.buffer);
    });

    console.log("✅ Upload Cloudinary concluído");

    const product = await Product.create({
      name: data.name,
      category: data.category,
      priceUnit: data.priceUnit,
      priceWholesale: data.priceWholesale,
      image: {
        url: result.secure_url,
        filename: image.originalname,
        public_id: result.public_id,
      },
    });

    console.log("✅ Produto salvo no MongoDB");

    return product;
  } catch (error) {
    console.error("🔥 ERRO FINAL:", error);
    throw new Error(`Erro interno ao criar produto: ${error.message}`);
  }
};

export const updateProduct = async (id, data, image) => {
  await databaseConnection();

  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Produto não encontrado");
  }

  // 🔁 Atualiza imagem se houver nova
  if (image) {
    await cloudinary.uploader.destroy(product.image.public_id);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "products" }, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        })
        .end(image.buffer);
    });

    product.image = {
      url: uploadResult.secure_url,
      filename: image.originalname,
      public_id: uploadResult.public_id,
    };
  }

  // ✏️ Atualiza dados
  product.name = data.name;
  product.category = data.category;
  product.priceUnit = Number(data.priceUnit);
  product.priceWholesale = Number(data.priceWholesale);

  await product.save();
  return product;
};

export const deleteProduct = async (id) => {
  await databaseConnection();

  const product = await Product.findById(id);

  if (!product) {
    throw new Error("Produto não encontrado");
  }

  // 🗑️ Remove imagem do Cloudinary
  if (product.image && product.image.public_id) {
    await cloudinary.uploader.destroy(product.image.public_id);
  }

  // 🗑️ Remove produto do Mongo
  await Product.findByIdAndDelete(id);

  return product;
};

export const getAllProducts = async () => {
  await databaseConnection();

  try {
    const findProduct = await Product.find();

    if (!findProduct) {
      throw new Error("Produtos não encontrado...");
    }

    return findProduct;
  } catch (error) {
    console.log("Error de servidor...");
  }
};
