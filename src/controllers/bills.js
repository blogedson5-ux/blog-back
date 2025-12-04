import express from "express";

import { createBills } from "../server/bills";
import { updateBill } from "../server/bills";
import { deleteBills } from "../server/bills";
import { getBills } from "../server/bills";

const router = express.Router();

router.post("/create-bills", async (req, res) => {
  const body = req.body;

  try {
    const results = createBills(body);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/update-bills/:id", async (req, res) => {
  try {
    const updated = await updateBill(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar" });
  }
});

router.delete("/delete-bills/:idBills", async (req, res) => {
  const idBills = req.params.idBills;

  try {
    const results = await deleteBills(idBills);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/get-bills", async (req, res) => {
  try {
    const results = await getBills();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
