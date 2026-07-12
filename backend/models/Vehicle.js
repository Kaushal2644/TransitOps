import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    nameModel: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Van", "Truck", "Mini"],
      required: true,
    },
    maxLoadCapacity: {
      type: Number, // in kg
      required: true,
    },
    odometer: {
      type: Number,
      default: 0,
    },
    acquisitionCost: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "On Trip", "In Shop", "Retired"],
      default: "Available",
    },
    region: {
      type: String,
      default: "Unassigned",
    },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;