import mongoose from "mongoose";

const billsSchema = new mongoose.Schema({
  name: { type: String },
  price: { type: String },
  date: { type: String },
  cod: { type: String },
});

export default mongoose.model.Bills || mongoose.model("Bills", billsSchema);
