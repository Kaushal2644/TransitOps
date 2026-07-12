import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    licenseCategory: {
      type: String,
      required: true, // e.g. LMV, HMV
    },
    licenseExpiry: {
      type: Date,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    safetyScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    tripCompletionRate: {
      type: Number,
      default: 100,
    },
    status: {
      type: String,
      enum: ["Available", "On Trip", "Off Duty", "Suspended"],
      default: "Available",
    },
  },
  { timestamps: true }
);

// Virtual: is license expired
driverSchema.virtual("isLicenseExpired").get(function () {
  return this.licenseExpiry < new Date();
});

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;