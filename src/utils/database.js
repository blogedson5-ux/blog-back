// database.js
import mongoose from "mongoose";
import dns from "dns";

// 🔹 Forçar DNS se configurado
if (process.env.FORCE_GOOGLE_DNS === "true") {
  console.log("🌐 Forçando DNS do Google...");
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

// 🔹 Verifica se URI está definida
if (!process.env.URI) {
  throw new Error("🚨 MONGO_URI não definida nas variáveis de ambiente!");
}

// 🔥 Cache global para serverless (Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const databaseConnection = async () => {
  // 🔹 Retorna conexão existente se houver
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      try {
        console.log("🔎 Testando resolução DNS SRV do Atlas...");

        // Teste SRV para garantir que o host resolve
        await dns.promises.resolveSrv("_mongodb._tcp.post.rylpi5t.mongodb.net");
        console.log("✅ Host resolvido via DNS SRV");

        console.log("🔗 Tentando conectar ao MongoDB Atlas...");

        // Conexão MongoDB usando TLS/porta 443
        const conn = await mongoose.connect(process.env.URI, {
          dbName: "armarinho",
          serverSelectionTimeoutMS: 30000,
          bufferCommands: false,
          tls: true, // força TLS/HTTPS
          tlsAllowInvalidCertificates: false,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });

        return conn;

      } catch (err) {
        console.error("❌ Erro durante a conexão:", err);
        throw err;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
    console.log(`✅ MongoDB conectado em: ${cached.conn.connection.host}`);
    return cached.conn;
  } catch (error) {
    console.error("❌ Falha ao conectar no MongoDB:", error);
    throw new Error("Falha na conexão com o banco de dados");
  }
};