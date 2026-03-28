import mongoose from "mongoose";
import { databaseConnection } from "../utils/database";
import cloudinary from "../utils/cloudinary";
import Ad from "../models/ad";

export const createAd = async (data, files) => {
  await databaseConnection();

  if (!data || !files || !Array.isArray(files) || files.length === 0) {
    throw new Error("Dados inválidos para criação do anúncio");
  }

  if (files.length > 3) {
    throw new Error("Só é permitido enviar no máximo 3 imagens por anúncio");
  }

  const { titulo, link } = data;

  if (!titulo) {
    throw new Error("Título é obrigatório");
  }

  const uploadSingleImage = (file) =>
    new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "ads" }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        })
        .end(file.buffer);
    });

  const uploadedImages = [];

  for (const file of files) {
    const uploadResult = await uploadSingleImage(file);

    uploadedImages.push({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });
  }

  const ad = await Ad.create({
    titulo,
    link,
    images: uploadedImages,
  });

  return ad;
};

export const getAd = async () => {
  await databaseConnection();

  try {
    const findAd = await Ad.find();
    return findAd;
  } catch (error) {
    console.log(error, "Error interno");
    throw new Error("Erro ao buscar anúncios");
  }
};

export const getAdById = async (id) => {
  await databaseConnection();

  try {
    if (!id) {
      throw new Error("ID do anúncio não informado");
    }

    if (!mongoose.isValidObjectId(id)) {
      throw new Error("ID inválido");
    }

    const findAd = await Ad.findById(id);

    if (!findAd) {
      throw new Error("Anúncio não encontrado");
    }

    return {
      ad: findAd,
    };
  } catch (error) {
    console.log(error, "Error interno");
    throw new Error(error.message || "Erro ao buscar anúncio");
  }
};

export const updateAd = async (id, data, files) => {
  await databaseConnection();

  try {
    if (!id) {
      throw new Error("ID do anúncio não informado");
    }

    if (!mongoose.isValidObjectId(id)) {
      throw new Error("ID inválido");
    }

    const { titulo, link } = data || {};

    if (!titulo) {
      throw new Error("Título é obrigatório");
    }

    const findAd = await Ad.findById(id);

    if (!findAd) {
      throw new Error("Anúncio não encontrado");
    }

    let updatedImages = findAd.images || [];

    const hasNewFiles = files && Array.isArray(files) && files.length > 0;

    if (hasNewFiles) {
      if (files.length > 3) {
        throw new Error(
          "Só é permitido enviar no máximo 3 imagens por anúncio",
        );
      }

      for (const image of findAd.images || []) {
        if (image && image.public_id) {
          await cloudinary.uploader.destroy(image.public_id);
        }
      }

      const uploadSingleImage = (file) =>
        new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "ads" }, (error, result) => {
              if (error) return reject(error);
              resolve(result);
            })
            .end(file.buffer);
        });

      updatedImages = [];

      for (const file of files) {
        const uploadResult = await uploadSingleImage(file);

        updatedImages.push({
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        });
      }
    }

    findAd.titulo = titulo;
    findAd.link = link;
    findAd.images = updatedImages;

    await findAd.save();

    return {
      message: "Anúncio atualizado com sucesso",
      ad: findAd,
    };
  } catch (error) {
    console.log(error, "Error interno");
    throw new Error(error.message || "Erro ao atualizar anúncio");
  }
};

export const deleteAd = async (id) => {
  await databaseConnection();

  try {
    if (!id) {
      throw new Error("ID do anúncio não informado");
    }

    if (!mongoose.isValidObjectId(id)) {
      throw new Error("ID inválido");
    }

    const findAd = await Ad.findById(id);

    if (!findAd) {
      throw new Error("Anúncio não encontrado");
    }

    for (const image of findAd.images || []) {
      if (image && image.public_id) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    await Ad.findByIdAndDelete(id);

    return {
      message: "Anúncio deletado com sucesso",
    };
  } catch (error) {
    console.log(error, "Error interno");
    throw new Error(error.message || "Erro ao deletar anúncio");
  }
};
