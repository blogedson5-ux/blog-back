import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

import routerUser from "../src/controllers/user";
import routerProduct from "../src/controllers/product";

const app = express();
const PORT = process.env.PORT || 5000;

// Configuração de CORS
const corsOptions = {
  origin: ["http://localhost:3000", "https://simoesbone.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

// Responde a preflight requests
app.options("*", cors(corsOptions));

// Usar CORS
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use("/auth", routerUser);
app.use("/product", routerProduct);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const server = app.listen(PORT, () => {
  console.log(`App rodando em http://localhost:${PORT}`);
});

// Tratar erro de porta ocupada
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Erro: Porta ${PORT} já está em uso.`);
    process.exit(1);
  }
});
