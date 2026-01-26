import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import routerUser from "../src/controllers/user";
import routerProduct from "../src/controllers/product";

const app = express();

// 🔐 CORS (antes de tudo)
app.use(
  cors({
    origin: ["http://localhost:3000", "https://simoesbone.netlify.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// 🔁 Preflight
app.options("*", cors());

// 🔐 JSON APENAS para auth
app.use("/auth", express.json(), routerUser);

// 📦 Upload / produtos SEM json parser
app.use("/product", routerProduct);

// rota teste
app.get("/", (_, res) => res.send("API OK"));

export default app;
