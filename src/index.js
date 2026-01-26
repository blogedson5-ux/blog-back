import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import routerUser from "../src/controllers/user";
import routerProduct from "../src/controllers/product";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://simoesbone.netlify.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// ✅ trata preflight
app.options("*", cors());

// ✅ JSON só onde precisa
app.use("/auth", express.json());

// ❌ upload não passa por json parser
app.use("/product", routerProduct);

export default app;
