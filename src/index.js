import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import routerUser from "./controllers/user.js";
import routerProduct from "./controllers/post.js";
import routerAd from "./controllers/ad.js";
import routerEmbed from "./controllers/embed.js";
import routerAnalytics from "./controllers/analytics.js";
import routerMonthlyAnalytics from "./controllers/monthlyAnalytics.js";

import { databaseConnection } from "./utils/database.js";
import {
  startMonthlyAnalyticsJob,
  runMonthlyAnalyticsStartupCheck,
} from "./server/monthlyAnalytics.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://perfiledsonferreira.netlify.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.options("*", cors());

app.use("/auth", express.json(), routerUser);
app.use("/analytics", express.json(), routerAnalytics);
app.use("/monthly-analytics", express.json(), routerMonthlyAnalytics);

app.use("/post", routerProduct);
app.use("/ads", routerAd);
app.use("/embed", routerEmbed);

app.get("/", (_, res) => res.send("API OK"));

const startServer = async () => {
  try {
    await databaseConnection();
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, async () => {
      console.log(`🚀 API rodando em http://localhost:${PORT}`);

      startMonthlyAnalyticsJob();
      await runMonthlyAnalyticsStartupCheck();
    });
  } catch (err) {
    console.error("❌ Não foi possível iniciar o servidor:", err);
    process.exit(1);
  }
};

startServer();

export default app;
