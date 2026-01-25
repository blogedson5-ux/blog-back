import { databaseConnection } from "../utils/database";
import cloudinary from "../utils/cloudinary";
import Product from "../models/product";

// ================= CREATE PRODUCT =================
import { databaseConnection } from "../utils/database";
import cloudinary from "../utils/cloudinary";
import Product from "../models/product";

export const createProduct = async (data, image) => {
  console.log("➡️ Iniciando createProduct");

  // 1️⃣ Conecta ao MongoDB
  await databaseConnection();
  console.log("✅ MongoDB conectado");

  if (!image) {
    throw new Error("Imagem não enviada");
  }

  let uploadResult;
  try {
    console.log("➡️ Enviando imagem ao Cloudinary");

    // 2️⃣ Função para upload com Promise
    uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "products" }, // aqui você pode adicionar timeout se quiser
          (err, result) => {
            if (err) {
              console.error("❌ Erro Cloudinary:", err);
              return reject(err);
            }
            resolve(result);
          },
        )
        .end(image.buffer); // garante que o buffer é enviado
    });

    if (!uploadResult || !uploadResult.secure_url) {
      throw new Error("Upload Cloudinary não retornou dados válidos");
    }

    console.log("✅ Upload Cloudinary concluído:", uploadResult.secure_url);
  } catch (err) {
    console.error("🔥 Falha ao enviar imagem:", err);
    throw new Error("Não foi possível enviar a imagem");
  }

  // 3️⃣ Só agora salvar no MongoDB
  try {
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

    console.log("➡️ Dados completos para salvar no MongoDB:", productData);

    const product = await Product.create(productData);
    console.log("✅ Produto salvo no MongoDB:", product._id);
    return product;
  } catch (err) {
    console.error("🔥 Erro ao salvar produto no MongoDB:", err);
    throw new Error("Erro interno ao criar produto");
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
