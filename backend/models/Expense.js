import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    toll: {
      type: Number,
      default: 0,
    },
    other: {
      type: Number,
      default: 0,
    },
    maintenanceLinked: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Available", "Completed"],
      default: "Available",
    },
  },
  { timestamps: true }
);

// Auto-calc total before saving
expenseSchema.pre("save", function (next) {
  this.total = (this.toll || 0) + (this.other || 0) + (this.maintenanceLinked || 0);
  next();
});

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;