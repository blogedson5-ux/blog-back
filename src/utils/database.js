import mongoose from "mongoose";
import dns from "dns";

let isConnected = false;

if (process.env.FORCE_GOOGLE_DNS === "true") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

export const databaseConnection = async () => {
  if (isConnected) return;

  if (!process.env.URI) {
    throw new Error("🚨 MONGO_URI não definida nas variáveis de ambiente!");
  }

  try {
    const records = await dns.promises.resolveSrv(
      "_mongodb._tcp.post.rylpi5t.mongodb.net",
    );
  } catch (err) {
    console.error("❌ DNS SRV FALHOU DENTRO DO PROJETO:", err);
    throw err; // ⛔ PARA AQUI
  }

  try {
    console.log("🔗 Tentando conectar ao MongoDB...");

    const conn = await mongoose.connect(process.env.URI, {
      dbName: "armarinho",
      serverSelectionTimeoutMS: 30000,
    });

    isConnected = true;
    console.log(`✅ MongoDB conectado em: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Erro ao conectar no MongoDB:", error);
    throw new Error("Falha na conexão com o banco de dados");
  }
};
