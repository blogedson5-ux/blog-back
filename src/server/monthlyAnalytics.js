import cron from "node-cron";
import { databaseConnection } from "../utils/database";
import Analytics from "../models/analytics";
import MonthlyAnalyticsReport from "../models/monthlyAnalyticsReport";

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getPreviousMonthDate(referenceDate = new Date()) {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
}

function getMonthDateRange(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");

    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function parseReferenceDate(dateString) {
  if (!dateString) {
    return new Date();
  }

  const parts = String(dateString).split("-");

  if (parts.length !== 3) {
    return new Date(dateString);
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  return new Date(year, month - 1, day);
}

function getPageLabel(page) {
  if (!page) return "Página desconhecida";

  if (page === "/") return "Página inicial";

  if (page.indexOf("/categoria/") === 0) {
    const slug = decodeURIComponent(page.replace("/categoria/", ""))
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (char) {
        return char.toUpperCase();
      });

    return `Categoria: ${slug}`;
  }

  if (page.indexOf("/noticia/") === 0) {
    return page;
  }

  return page;
}

async function buildMonthlyAnalyticsSummary(referenceDate) {
  const monthKey = getMonthKey(referenceDate);
  const monthDates = getMonthDateRange(referenceDate);

  const groupedByPage = await Analytics.aggregate([
    {
      $match: {
        dateKey: { $in: monthDates },
      },
    },
    {
      $group: {
        _id: "$page",
        visits: { $sum: "$visits" },
      },
    },
    {
      $sort: { visits: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  const totalGrouped = await Analytics.aggregate([
    {
      $match: {
        dateKey: { $in: monthDates },
      },
    },
    {
      $group: {
        _id: null,
        visits: { $sum: "$visits" },
      },
    },
  ]);

  const detailedCount = await Analytics.countDocuments({
    dateKey: { $in: monthDates },
  });

  const totalVisits = totalGrouped[0] ? totalGrouped[0].visits : 0;
  const avgDailyVisits =
    monthDates.length > 0 ? Math.round(totalVisits / monthDates.length) : 0;

  const previousMonthDate = getPreviousMonthDate(referenceDate);
  const previousMonthKey = getMonthKey(previousMonthDate);

  const previousReport = await MonthlyAnalyticsReport.findOne({
    monthKey: previousMonthKey,
  });

  const previousTotalVisits = previousReport ? previousReport.totalVisits : 0;

  let growthPercentage = 0;

  if (previousTotalVisits > 0) {
    growthPercentage =
      ((totalVisits - previousTotalVisits) / previousTotalVisits) * 100;
  }

  const topPages = groupedByPage.map(function (item) {
    return {
      key: item._id,
      label: getPageLabel(item._id),
      visits: item.visits,
    };
  });

  return {
    monthKey,
    totalVisits,
    avgDailyVisits,
    topPages,
    comparison: {
      previousMonthKey,
      previousTotalVisits,
      growthPercentage: Number(growthPercentage.toFixed(2)),
    },
    detailedCount,
    monthDates,
  };
}

export const previewMonthlyAnalytics = async (referenceDate) => {
  await databaseConnection();

  try {
    const targetDate = parseReferenceDate(referenceDate);
    const summary = await buildMonthlyAnalyticsSummary(targetDate);

    return {
      message: "Prévia do fechamento mensal gerada com sucesso",
      preview: {
        monthKey: summary.monthKey,
        totalVisits: summary.totalVisits,
        avgDailyVisits: summary.avgDailyVisits,
        topPages: summary.topPages,
        comparison: summary.comparison,
        recordsToDelete: summary.detailedCount,
      },
    };
  } catch (error) {
    console.log(error, "Error interno");
    throw new Error(error.message || "Erro ao gerar prévia do fechamento");
  }
};

export const closeMonthlyAnalytics = async (options) => {
  await databaseConnection();

  try {
    const referenceDate =
      options && options.referenceDate
        ? parseReferenceDate(options.referenceDate)
        : new Date();

    const clearDetailedData =
      options && typeof options.clearDetailedData === "boolean"
        ? options.clearDetailedData
        : false;

    const summary = await buildMonthlyAnalyticsSummary(referenceDate);

    const report = await MonthlyAnalyticsReport.findOneAndUpdate(
      { monthKey: summary.monthKey },
      {
        monthKey: summary.monthKey,
        totalVisits: summary.totalVisits,
        avgDailyVisits: summary.avgDailyVisits,
        topPages: summary.topPages,
        comparison: summary.comparison,
        generatedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    let deletedCount = 0;

    if (clearDetailedData) {
      const deleteResult = await Analytics.deleteMany({
        dateKey: { $in: summary.monthDates },
      });

      deletedCount = deleteResult.deletedCount || 0;
    }

    return {
      message: clearDetailedData
        ? "Resumo mensal fechado e dados detalhados apagados com sucesso"
        : "Resumo mensal fechado com sucesso",
      report,
      deletedCount,
    };
  } catch (error) {
    console.log(error, "Error interno");
    throw new Error(error.message || "Erro ao fechar analytics mensal");
  }
};

async function closePreviousMonthIfNeeded(currentDate) {
  await databaseConnection();

  const baseDate = currentDate || new Date();
  const previousMonthDate = getPreviousMonthDate(baseDate);
  const previousMonthKey = getMonthKey(previousMonthDate);

  const alreadyClosed = await MonthlyAnalyticsReport.findOne({
    monthKey: previousMonthKey,
  });

  if (alreadyClosed) {
    console.log(`📁 Mês ${previousMonthKey} já foi fechado.`);
    return {
      skipped: true,
      monthKey: previousMonthKey,
      message: `Mês ${previousMonthKey} já foi fechado.`,
    };
  }

  console.log(`📊 Fechando automaticamente o mês ${previousMonthKey}...`);

  const result = await closeMonthlyAnalytics({
    referenceDate: previousMonthDate,
    clearDetailedData: true,
  });

  console.log("✅ Fechamento automático concluído:", result.message);

  return {
    skipped: false,
    monthKey: previousMonthKey,
    result,
  };
}

export function startMonthlyAnalyticsJob() {
  cron.schedule("0 0 1 * *", async () => {
    console.log("📊 Iniciando fechamento automático do mês...");

    try {
      await closePreviousMonthIfNeeded();
    } catch (error) {
      console.error("❌ Erro no fechamento automático:", error);
    }
  });
}

export async function runMonthlyAnalyticsStartupCheck(currentDate) {
  try {
    console.log("🔎 Verificando fechamento pendente do mês anterior...");
    await closePreviousMonthIfNeeded(currentDate);
  } catch (error) {
    console.error(
      "❌ Erro na verificação inicial do fechamento mensal:",
      error,
    );
  }
}
