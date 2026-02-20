import express from "express";
import multer from "multer";

import { createPost } from "../server/post";
import { updatePost } from "../server/post";
import { deletePost } from "../server/post";
import { getPost } from "../server/post";
import { getPostById } from "../server/post";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(), // mantém o arquivo na memória
  limits: { fileSize: 5 * 1024 * 1024 }, // limite de 5MB
});

router.post("/create-post", upload.single("image"), async (req, res) => {
  try {
    const { titulo, textOne, textTwo } = req.body;
    const file = req.file;

    console.log("🟢 req.file existe?", !!file);
    console.log("🟢 req.body:", req.body);

    if (!file) {
      return res.status(400).json({ message: "Imagem não enviada" });
    }

    if (!titulo || !textOne || !textTwo) {
      return res.status(400).json({ message: "Campos obrigatórios" });
    }

    const result = await createPost(
      {
        titulo,
        textOne,
        textTwo,
      },
      file,
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 ERRO CREATE POST:", error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update-post/:id", upload.single("image"), async (req, res) => {
  try {
    const { titulo, textOne, textTwo } = req.body;
    const file = req.file;
    const { id } = req.params;

    if (!titulo || !textOne || !textTwo) {
      return res.status(400).json({ message: "Campos obrigatórios" });
    }

    const result = await updatePost(
      id,
      {
        titulo,
        textOne,
        textTwo,
      },
      file, // pode ser undefined
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 ERRO UPDATE POST:", error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete-post/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID não informado" });
    }

    const result = await deletePost(id);

    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 ERRO DELETE POST:", error);

    res.status(500).json({
      message: error.message || "Erro ao deletar post",
    });
  }
});

router.get("/get-posts", async (req, res) => {
  try {
    const posts = await getPost();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/get-post/:id", async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    res.status(200).json(post);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
