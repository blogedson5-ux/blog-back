import mongoose from "mongoose";
import { databaseConnection } from "../utils/database";
import Analytics from "../models/analytics";

function getDateKey() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLastDaysRange(days = 14) {
  const dates = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    dates.push(`${year}-${month}-${day}`);
  }

  return dates;
}

export const trackVisit = async (data) => {
  await databaseConnection();

  try {
    const { page } = data || {};

    if (!page) {
      throw new Error("Página é obrigatória para registrar acesso");
    }

    const dateKey = getDateKey();

    const analytics = await Analytics.findOneAndUpdate(
      { dateKey, page },
      { $inc: { visits: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return {
      message: "Acesso registrado com sucesso",
      analytics,
    };
  } catch (error) {
    console.log(error, "Error interno");
    throw new Error(error.message || "Erro ao registrar acesso");
  }
};

export const getAnalyticsSummary = async () => {
  await databaseConnection();

  try {
    const last14Days = getLastDaysRange(14);
    const last7Days = getLastDaysRange(7);
    const todayKey = getDateKey();

    const groupedByDay = await Analytics.aggregate([
      {
        $match: {
          dateKey: { $in: last14Days },
        },
      },
      {
        $group: {
          _id: "$dateKey",
          visits: { $sum: "$visits" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const topPages = await Analytics.aggregate([
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
        $group: {
          _id: null,
          visits: { $sum: "$visits" },
        },
      },
    ]);

    const todayGrouped = await Analytics.aggregate([
      {
        $match: {
          dateKey: todayKey,
        },
      },
      {
        $group: {
          _id: null,
          visits: { $sum: "$visits" },
        },
      },
    ]);

    const thisWeekGrouped = await Analytics.aggregate([
      {
        $match: {
          dateKey: { $in: last7Days },
        },
      },
      {
        $group: {
          _id: null,
          visits: { $sum: "$visits" },
        },
      },
    ]);

    const visitsMap = new Map();

    for (const item of groupedByDay) {
      visitsMap.set(item._id, item.visits);
    }

    const chartData = last14Days.map((date) => ({
      date,
      visits: visitsMap.get(date) || 0,
    }));

    const totalVisits = totalGrouped[0] ? totalGrouped[0].visits : 0;
    const todayVisits = todayGrouped[0] ? todayGrouped[0].visits : 0;
    const thisWeekVisits = thisWeekGrouped[0] ? thisWeekGrouped[0].visits : 0;

    const totalChartVisits = chartData.reduce(function (acc, item) {
      return acc + item.visits;
    }, 0);

    const avgDailyVisits =
      chartData.length > 0
        ? Math.round(totalChartVisits / chartData.length)
        : 0;

    return {
      totalVisits,
      todayVisits,
      thisWeekVisits,
      avgDailyVisits,
      chartData,
      topPages: topPages.map((item) => ({
        page: item._id,
        visits: item.visits,
      })),
    };
  } catch (error) {
    console.log(error, "Error interno");
    throw new Error(error.message || "Erro ao buscar resumo do analytics");
  }
};
export const getAnalyticsByPage = async (page) => {
  await databaseConnection();

  try {
    if (!page) {
      throw new Error("Página não informada");
    }

    const findAnalytics = await Analytics.find({ page }).sort({
      dateKey: -1,
    });

    return {
      analytics: findAnalytics,
    };
  } catch (error) {
    console.log(error, "Error interno");
    throw new Error(error.message || "Erro ao buscar analytics da página");
  }
};

export const deleteAnalyticsById = async (id) => {
  await databaseConnection();

  try {
    if (!id) {
      throw new Error("ID não informado");
    }

    if (!mongoose.isValidObjectId(id)) {
      throw new Error("ID inválido");
    }

    const findAnalytics = await Analytics.findById(id);

    if (!findAnalytics) {
      throw new Error("Registro de analytics não encontrado");
    }

    await Analytics.findByIdAndDelete(id);

    return {
      message: "Registro de analytics deletado com sucesso",
    };
  } catch (error) {
    console.log(error, "Error interno");
    throw new Error(error.message || "Erro ao deletar analytics");
  }
};
