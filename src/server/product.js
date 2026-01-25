import { databaseConnection } from "../utils/database";
import cloudinary from "../utils/cloudinary";

import Product from "../models/product";

export const createProduct = async (data, image) => {
  console.log("➡️ Iniciando createProduct");

  // 1️⃣ Garantir conexão com MongoDB
  await databaseConnection();
  console.log("✅ MongoDB conectado");

  // 2️⃣ Função de upload com tentativas
  const uploadToCloudinary = async (imageFile, attempt = 1) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "products", timeout: 180000 }, // 3 minutos
          (error, result) => {
            if (error) {
              console.error(
                `❌ Cloudinary erro (tentativa ${attempt}):`,
                error,
              );
              return reject(error);
            }
            console.log(
              `✅ Upload Cloudinary concluído (tentativa ${attempt})`,
            );
            resolve(result);
          },
        )
        .end(imageFile.buffer);
    });
  };

  // 3️⃣ Tentar o upload até 3 vezes
  let uploadResult;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      uploadResult = await uploadToCloudinary(image, attempt);
      if (uploadResult) break;
    } catch (err) {
      if (attempt === 3) throw new Error("❌ Falha no upload para Cloudinary");
      console.log(`⏳ Tentativa ${attempt} falhou, tentando novamente...`);
      await new Promise((res) => setTimeout(res, 2000 * attempt));
    }
  }

  // 4️⃣ Salvar produto no MongoDB
  try {
    const product = await Product.create({
      name: data.name,
      category: data.category,
      priceUnit: data.priceUnit,
      priceWholesale: data.priceWholesale,
      image: {
        url: uploadResult.secure_url,
        filename: image.originalname,
        public_id: uploadResult.public_id,
      },
    });

    console.log("✅ Produto salvo no MongoDB");
    return product;
  } catch (error) {
    console.error("🔥 Erro ao salvar produto:", error);
    throw new Error(`Erro interno ao criar produto: ${error.message}`);
  }
};

export const updateProduct = async (id, data, image) => {
  console.log("➡️ Iniciando updateProduct");

  // 1️⃣ Conecta ao MongoDB
  await databaseConnection();
  console.log("✅ MongoDB conectado");

  // 2️⃣ Busca o produto
  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Produto não encontrado");
  }

  // 3️⃣ Função de upload com retry
  const uploadToCloudinary = async (imageFile, attempt = 1) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "products", timeout: 180000 }, // 3 minutos
          (err, result) => {
            if (err) {
              console.error(`❌ Cloudinary erro (tentativa ${attempt}):`, err);
              return reject(err);
            }
            console.log(
              `✅ Upload Cloudinary concluído (tentativa ${attempt})`,
            );
            resolve(result);
          },
        )
        .end(imageFile.buffer);
    });
  };

  // 4️⃣ Atualiza imagem se houver nova
  if (image) {
    // Remove imagem antiga
    if (product.image && product.image.public_id) {
      try {
        await cloudinary.uploader.destroy(product.image.public_id);
        console.log("🗑️ Imagem antiga removida do Cloudinary");
      } catch (err) {
        console.warn("⚠️ Erro ao remover imagem antiga:", err);
      }
    }

    // Upload nova imagem com retry
    let uploadResult;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        uploadResult = await uploadToCloudinary(image, attempt);
        if (uploadResult) break;
      } catch (err) {
        if (attempt === 3) throw new Error("❌ Falha no upload da nova imagem");
        console.log(`⏳ Tentativa ${attempt} falhou, tentando novamente...`);
        await new Promise((res) => setTimeout(res, 2000 * attempt));
      }
    }

    product.image = {
      url: uploadResult.secure_url,
      filename: image.originalname,
      public_id: uploadResult.public_id,
    };
  }

  // 5️⃣ Atualiza dados do produto
  product.name = data.name;
  product.category = data.category;
  product.priceUnit = Number(data.priceUnit);
  product.priceWholesale = Number(data.priceWholesale);

  // 6️⃣ Salva no MongoDB
  try {
    const updatedProduct = await product.save();
    console.log("✅ Produto atualizado no MongoDB");
    return updatedProduct;
  } catch (err) {
    console.error("🔥 Erro ao salvar produto atualizado:", err);
    throw new Error(`Erro interno ao atualizar produto: ${err.message}`);
  }
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
