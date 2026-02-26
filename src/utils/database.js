// database.js
import mongoose from "mongoose";
import dns from "dns";

// 🔹 Força Cloudflare DNS (1.1.1.1 e 1.0.0.1)
dns.setServers(["1.1.1.1", "1.0.0.1"]);

if (!process.env.URI) {
  throw new Error("🚨 MONGO_URI não definida!");
}

// 🔥 Cache global (serverless)
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export const databaseConnection = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = (async () => {
      try {
        // 🔎 Resolve SRV do Atlas antes de conectar
        await dns.promises.resolveSrv("_mongodb._tcp.post.rylpi5t.mongodb.net");
        console.log("✅ Host resolvido via Cloudflare DNS");

        const conn = await mongoose.connect(process.env.URI, {
          dbName: "armarinho",
          serverSelectionTimeoutMS: 30000,
          bufferCommands: false,
          tls: true,
          tlsAllowInvalidCertificates: false,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });

        return conn;
      } catch (err) {
        console.error("❌ Erro na conexão MongoDB:", err);
        throw err;
      }
    })();
  }

  cached.conn = await cached.promise;
  console.log(`✅ MongoDB conectado em: ${cached.conn.connection.host}`);
  return cached.conn;
};