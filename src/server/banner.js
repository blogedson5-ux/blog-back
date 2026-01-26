import { databaseConnection } from "../utils/database.js";
import cloudinary from "../utils/cloudinary.js";
import Banner from "../models/banner.js";

export const createBanner = async (image) => {
  console.log("➡️ Iniciando createBanner");

  await databaseConnection();
  console.log("✅ MongoDB conectado");

  if (!image) {
    throw new Error("Imagem do banner não enviada");
  }

  try {
    console.log("➡️ Enviando banner ao Cloudinary");

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "banners" }, (error, result) => {
          if (error) {
            console.error("❌ Erro Cloudinary:", error);
            return reject(error);
          }
          resolve(result);
        })
        .end(image.buffer); // 🔥 AQUI ESTÁ A CHAVE
    });

    console.log("✅ Upload Cloudinary concluído");

    const banner = await Banner.create({
      image: {
        url: result.secure_url,
        filename: image.originalname,
        public_id: result.public_id,
      },
    });

    console.log("✅ Banner salvo no MongoDB");

    return banner;
  } catch (error) {
    console.error("🔥 ERRO FINAL:", error);
    throw new Error(`Erro interno ao criar banner: ${error.message}`);
  }
};

export const getAllBanners = async () => {
  await databaseConnection();
  return Banner.find().sort({ order: 1, createdAt: -1 });
};

export const deleteBanner = async (id) => {
  await databaseConnection();

  const banner = await Banner.findById(id);
  if (!banner) throw new Error("Banner não encontrado");

  // remove imagem
  if (banner.image && banner.image.public_id) {
    await cloudinary.uploader.destroy(banner.image.public_id);
  }

  await Banner.findByIdAndDelete(id);
  return banner;
};
