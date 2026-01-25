import { databaseConnection } from "../utils/database";
import cloudinary from "../utils/cloudinary";
import Product from "../models/product";

// ================= CREATE PRODUCT =================
export const createProduct = async (data, image) => {
  console.log("➡️ Iniciando createProduct");

  await databaseConnection();
  console.log("✅ MongoDB conectado");

  if (!image) {
    throw new Error("Imagem é obrigatória para criar produto");
  }

  try {
    // 🔹 Upload da imagem usando buffer (compatível serverless)
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "products", timeout: 180000 }, // 3 minutos
        (error, result) => {
          if (error) {
            console.error("❌ Erro Cloudinary:", error);
            return reject(new Error("Falha ao enviar imagem para Cloudinary"));
          }
          resolve(result);
        },
      );
      uploadStream.end(image.buffer);
    });

    console.log("✅ Upload Cloudinary concluído");

    // 🔹 Salvar produto no MongoDB
    const product = await Product.create({
      name: data.name,
      category: data.category,
      priceUnit: Number(data.priceUnit),
      priceWholesale: Number(data.priceWholesale),
      image: {
        url: result.secure_url,
        filename: image.originalname,
        public_id: result.public_id,
      },
    });

    console.log("✅ Produto salvo no MongoDB");
    return product;
  } catch (error) {
    console.error("🔥 Erro ao criar produto:", error);
    throw new Error(error.message || "Erro interno ao criar produto");
  }
};

// ================= UPDATE PRODUCT =================
export const updateProduct = async (id, data, image) => {
  await databaseConnection();

  const product = await Product.findById(id);
  if (!product) throw new Error("Produto não encontrado");

  try {
    // 🔁 Atualiza imagem se houver nova
    if (image) {
      // Remove imagem antiga
      if (product.image && product.image.public_id) {
        await cloudinary.uploader.destroy(product.image.public_id);
        console.log("🗑️ Imagem antiga removida do Cloudinary");
      }

      // Upload da nova imagem
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "products", timeout: 180000 },
          (err, result) => {
            if (err) {
              console.error("❌ Erro Cloudinary:", err);
              return reject(
                new Error("Falha ao enviar imagem para Cloudinary"),
              );
            }
            resolve(result);
          },
        );
        uploadStream.end(image.buffer);
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
    console.log("✅ Produto atualizado com sucesso");
    return product;
  } catch (error) {
    console.error("🔥 Erro ao atualizar produto:", error);
    throw new Error(error.message || "Erro interno ao atualizar produto");
  }
};

// ================= DELETE PRODUCT =================
export const deleteProduct = async (id) => {
  await databaseConnection();

  const product = await Product.findById(id);
  if (!product) throw new Error("Produto não encontrado");

  // Remove imagem do Cloudinary
  if (product.image && product.image.public_id) {
    await cloudinary.uploader.destroy(product.image.public_id);
  }

  // Remove produto do Mongo
  await Product.findByIdAndDelete(id);

  console.log("✅ Produto deletado com sucesso");
  return product;
};

// ================= GET ALL PRODUCTS =================
export const getAllProducts = async () => {
  await databaseConnection();

  try {
    const products = await Product.find();
    if (!products || products.length === 0) return [];
    return products;
  } catch (error) {
    console.error("🔥 Erro ao buscar produtos:", error);
    throw new Error("Erro interno ao buscar produtos");
  }
};
