import mongoose from "mongoose";

let isConnected = false;

export const databaseConnection = async () => {
  if (isConnected) return;

  if (!process.env.URI) {
    throw new Error("🚨 MONGO_URI não definida nas variáveis de ambiente!");
  }

  try {
    console.log("🔗 Tentando conectar ao MongoDB...");

    const conn = await mongoose.connect(process.env.URI, {
      dbName: "armarinho",
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // espera 30s antes de dar timeout
    });

    isConnected = true;
    console.log(`✅ MongoDB conectado em: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Erro ao conectar no MongoDB:", error);
    throw new Error("Falha na conexão com o banco de dados");
  }
};
