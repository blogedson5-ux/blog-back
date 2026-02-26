import mongoose from "mongoose";
import dns from "dns";

/* if (process.env.FORCE_GOOGLE_DNS === "true") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}
 */

dns.setServers(["8.8.8.8", "8.8.4.4"]);

if (!process.env.URI) {
  throw new Error("🚨 MONGO_URI não definida nas variáveis de ambiente!");
}

// 🔥 Cache global para ambiente serverless (Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const databaseConnection = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    try {
      console.log("🔎 Testando DNS SRV...");

      await dns.promises.resolveSrv("_mongodb._tcp.post.rylpi5t.mongodb.net");

      console.log("🔗 Tentando conectar ao MongoDB...");

      cached.promise = mongoose.connect(process.env.URI, {
        dbName: "armarinho",
        serverSelectionTimeoutMS: 30000,
        bufferCommands: false,
      });
    } catch (err) {
      console.error("❌ Erro antes da conexão:", err);
      throw err;
    }
  }

  try {
    cached.conn = await cached.promise;
    console.log(`✅ MongoDB conectado em: ${cached.conn.connection.host}`);
    return cached.conn;
  } catch (error) {
    console.error("❌ Erro ao conectar no MongoDB:", error);
    throw new Error("Falha na conexão com o banco de dados");
  }
};
