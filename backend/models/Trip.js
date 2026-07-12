import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    tripCode: {
      type: String,
      required: true,
      unique: true, // e.g. TR001
    },
    source: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    cargoWeight: {
      type: Number,
      required: true,
    },
    plannedDistance: {
      type: Number,
      required: true,
    },
    finalOdometer: {
      type: Number,
      default: null,
    },
    fuelConsumed: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["Draft", "Dispatched", "Completed", "Cancelled"],
      default: "Draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Trip = mongoose.model("Trip", tripSchema);
export default Trip;