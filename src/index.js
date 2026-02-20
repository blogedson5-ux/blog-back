import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import routerUser from "../src/controllers/user";
import routerProduct from "../src/controllers/post.js";

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

// 🔐 JSON APENAS para auth
app.use("/auth", express.json(), routerUser);

app.use("/post", routerProduct);

app.get("/", (_, res) => res.send("API OK"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});

export default app;
