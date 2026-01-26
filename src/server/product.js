// ================= IMPORTS =================
import Product from "../models/product.js";
import cloudinary from "../utils/cloudinary.js";
import { databaseConnection } from "../utils/database.js";

// ============================================
//  Helper: upload de imagem para Cloudinary
// ============================================
const uploadImageToCloudinary = async (imageBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "products",
        timeout: 180000, // 3 minutos
      },
      (err, result) => {
        if (err) {
          console.error("❌ Erro Cloudinary:", err);
          return reject(new Error("Falha ao enviar imagem para Cloudinary"));
        }
        resolve(result);
      }
    );
    uploadStream.end(imageBuffer);
  });
};

// ============================================
//  FUNÇÃO PARA INICIALIZAR O MONGO (async)
// ============================================
export const initializeDatabase = async () => {
  try {
    await databaseConnection();
    console.log("✅ MongoDB conectado");
  } catch (err) {
    console.error("❌ Falha ao conectar MongoDB:", err);
    throw err;
  }
};

// ============================================
//  CREATE PRODUCT
// ============================================
export const createProduct = async (data, image) => {
  if (!image) throw new Error("Imagem não enviada");

  try {
    console.log("➡️ Upload da imagem para Cloudinary...");
    const uploadResult = await uploadImageToCloudinary(image.buffer, image.originalname);

    const productData = {
      name: data.name,
      category: data.category,
      priceUnit: Number(data.priceUnit) || 0,
      priceWholesale: Number(data.priceWholesale) || 0,
      image: {
        url: uploadResult.secure_url,
        filename: image.originalname,
        public_id: uploadResult.public_id,
      },
    };

    console.log("➡️ Salvando produto no MongoDB...");
    const product = await Product.create(productData);
    console.log("✅ Produto criado:", product._id);
    return product;
  } catch (err) {
    console.error("🔥 Erro ao criar produto:", err);
    throw err;
  }
};

// ============================================
//  UPDATE PRODUCT
// ============================================
export const updateProduct = async (id, data, image) => {
  const product = await Product.findById(id);
  if (!product) throw new Error("Produto não encontrado");

  try {
    // Atualiza imagem se houver nova
    if (image) {
      if (product.image && product.image.public_id) {
        await cloudinary.uploader.destroy(product.image.public_id);
        console.log("🗑️ Imagem antiga removida do Cloudinary");
      }

      const uploadResult = await uploadImageToCloudinary(image.buffer, image.originalname);
      product.image = {
        url: uploadResult.secure_url,
        filename: image.originalname,
        public_id: uploadResult.public_id,
      };
    }

    // Atualiza dados do produto
    product.name = data.name;
    product.category = data.category;
    product.priceUnit = Number(data.priceUnit) || 0;
    product.priceWholesale = Number(data.priceWholesale) || 0;

    await product.save();
    console.log("✅ Produto atualizado:", product._id);
    return product;
  } catch (err) {
    console.error("🔥 Erro ao atualizar produto:", err);
    throw err;
  }
};

// ============================================
//  DELETE PRODUCT
// ============================================
export const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new Error("Produto não encontrado");

  // Remove imagem do Cloudinary
  if (product.image && product.image.public_id) {
    await cloudinary.uploader.destroy(product.image.public_id);
    console.log("🗑️ Imagem removida do Cloudinary");
  }

  await Product.findByIdAndDelete(id);
  console.log("✅ Produto deletado:", id);
  return product;
};

// ============================================
//  GET ALL PRODUCTS
// ============================================
export const getAllProducts = async () => {
  try {
    const products = await Product.find();
    return products || [];
  } catch (err) {
    console.error("🔥 Erro ao buscar produtos:", err);
    throw new Error("Erro interno ao buscar produtos");
  }
};
