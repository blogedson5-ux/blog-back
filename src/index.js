// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import routerUser from "./controllers/user.js";
import routerProduct from "./controllers/post.js";
import routerAd from "./controllers/ad.js";
import { databaseConnection } from "./utils/database.js";

const app = express();

// 🔐 CORS (antes de tudo)
app.use(
  cors({
    origin: ["http://localhost:3000", "https://blogedson.netlify.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// 🔁 Preflight
app.options("*", cors());

// 🔐 JSON apenas para auth
app.use("/auth", express.json(), routerUser);

// Rotas principais
app.use("/post", routerProduct);

app.use("/ads", routerAd);

// Rota raiz
app.get("/", (_, res) => res.send("API OK"));

// 🔹 Conectar ao MongoDB antes de iniciar o servidor
const startServer = async () => {
  try {
    await databaseConnection(); // Conecta ao MongoDB
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 API rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Não foi possível iniciar o servidor:", err);
    process.exit(1); // encerra o processo se não conectar
  }
};

startServer();

export default app;
