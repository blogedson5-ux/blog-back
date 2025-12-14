import { databaseConnection } from "../utils/database";
import billsSchema from "../models/bills";

export const createBills = async (body) => {
  await databaseConnection();

  try {
    const bills = await billsSchema.create(body);

    return bills;
  } catch (error) {
    throw new Error("Error interno ao cadastrar Boletos");
  }
};

export const updateBill = async (id, updatedFields) => {
  try {
    const updatedBill = await billsSchema.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      {
        new: true,
        runValidators: true,
      }
    );

    return updatedBill;
  } catch (error) {
    console.error("Erro ao atualizar Bill:", error);
    throw error;
  }
};

export const updatePaid = async (id, paid) => {
  try {
    console.log(paid);

    if (typeof paid !== "boolean") {
      throw new Error("O campo 'Paid' precisa ser boolean");
    }

    const updatedProduct = await billsSchema.findByIdAndUpdate(
      id,
      {
        $set: { paid: paid },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return updatedProduct;
  } catch (error) {
    console.error("Erro ao atualizar Paid:", error);
    throw error;
  }
};

export const deleteBills = async (idBills) => {
  await databaseConnection();

  try {
    const bills = await billsSchema.findById(idBills);

    if (!bills) {
      throw new Error("Boleto não encontrado!");
    }

    await billsSchema.findOneAndDelete(idBills);
  } catch (error) {
    throw new Error("Error no sistema interno");
  }
};

export const getBills = async () => {
  await databaseConnection();

  try {
    const bills = await billsSchema.find();

    if (!bills) {
      throw new Error("Produto não encontrado!");
    }

    return bills;
  } catch (error) {
    throw new Error("Erroa ao buscar boletos");
  }
};
