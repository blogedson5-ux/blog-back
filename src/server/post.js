import { databaseConnection } from "../utils/database";
import cloudinary from "../utils/cloudinary";
import Post from "../models/post";

export const createPost = async (data, file) => {
  await databaseConnection();

  if (!data || !file) {
    throw new Error("Dados inválidos para criação do post");
  }

  const now = new Date();

  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );

  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  const postsToday = await Post.countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  if (postsToday >= 20) {
    throw new Error(
      "Limite diário atingido. Apenas 20 posts por dia são permitidos.",
    );
  }

  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "posts" }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      })
      .end(file.buffer);
  });

  const post = await Post.create({
    titulo: data.titulo,
    textOne: data.textOne,
    category: data.category,
    videoUrl: data.videoUrl || "",
    image: {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    },
  });

  return post;
};

export const updatePost = async (id, data, file) => {
  await databaseConnection();

  if (!id || !data) {
    throw new Error("Dados inválidos para atualização do post");
  }

  const post = await Post.findById(id);
  if (!post) {
    throw new Error("Post não encontrado");
  }

  post.titulo = data.titulo;
  post.textOne = data.textOne;
  post.category = data.category;
  post.videoUrl = data.videoUrl || "";

  if (file && file.buffer && file.buffer.length > 0) {
    let oldPublicId = null;

    if (post.image && post.image.public_id) {
      oldPublicId = post.image.public_id;
    }

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "posts" }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        })
        .end(file.buffer);
    });

    post.image = {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };

    await post.save();

    if (oldPublicId) {
      await cloudinary.uploader.destroy(oldPublicId);
    }

    return post;
  }

  await post.save();
  return post;
};

export const deletePost = async (postId) => {
  await databaseConnection();

  if (!postId) {
    throw new Error("ID do post não informado");
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new Error("Post não encontrado");
  }

  await cloudinary.uploader.destroy(post.image.public_id);
  await Post.findByIdAndDelete(postId);

  return { message: "Post deletado com sucesso" };
};

export const getPost = async () => {
  await databaseConnection();

  try {
    const posts = await Post.find();

    if (!posts || posts.length === 0) {
      throw new Error("Nenhum post encontrado");
    }

    return posts;
  } catch (error) {
    console.error("error getPost:", error);
    throw error;
  }
};

export const getPostById = async (id) => {
  await databaseConnection();

  const post = await Post.findById(id);

  if (!post) {
    throw new Error("Post não encontrado");
  }

  return post;
};