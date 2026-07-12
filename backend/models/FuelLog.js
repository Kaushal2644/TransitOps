import mongoose from "mongoose";

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    liters: {
      type: Number,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const FuelLog = mongoose.model("FuelLog", fuelLogSchema);
export default FuelLog;