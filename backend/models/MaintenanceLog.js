import mongoose from "mongoose";

const maintenanceLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    serviceType: {
      type: String,
      required: true, // e.g. Oil Change, Engine Repair, Tyre Replace
    },
    cost: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Active", "Completed"],
      default: "Active",
    },
  },
  { timestamps: true }
);

const MaintenanceLog = mongoose.model("MaintenanceLog", maintenanceLogSchema);
export default MaintenanceLog;