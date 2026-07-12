import Expense from "../models/Expense.js";
import MaintenanceLog from "../models/MaintenanceLog.js";
import FuelLog from "../models/FuelLog.js";
import Vehicle from "../models/Vehicle.js";

// @desc  Log an expense (toll / other) tied to a trip & vehicle
// @route POST /api/expenses
export const createExpense = async (req, res) => {
  try {
    const { trip, vehicle, toll, other } = req.body;

    if (!vehicle) {
      return res.status(400).json({ message: "Vehicle is required" });
    }

    const veh = await Vehicle.findById(vehicle);
    if (!veh) return res.status(404).json({ message: "Vehicle not found" });

    const expense = await Expense.create({
      trip: trip || null,
      vehicle,
      toll: toll || 0,
      other: other || 0,
      status: "Available",
    });

    const populated = await expense.populate([
      { path: "vehicle", select: "registrationNumber nameModel" },
      { path: "trip", select: "tripCode" },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all expenses
// @route GET /api/expenses?vehicle=&search=
export const getExpenses = async (req, res) => {
  try {
    const { vehicle, search } = req.query;
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;

    let expenses = await Expense.find(filter)
      .populate("vehicle", "registrationNumber nameModel")
      .populate("trip", "tripCode")
      .sort({ createdAt: -1 });

    if (search) {
      const term = search.toLowerCase();
      expenses = expenses.filter(
        (e) =>
          e.trip?.tripCode?.toLowerCase().includes(term) ||
          e.vehicle?.registrationNumber?.toLowerCase().includes(term)
      );
    }

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update an expense
// @route PUT /api/expenses/:id
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const { toll, other, status } = req.body;
    if (toll !== undefined) expense.toll = toll;
    if (other !== undefined) expense.other = other;
    if (status) expense.status = status;

    await expense.save(); // pre-save hook recalculates total
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete an expense
// @route DELETE /api/expenses/:id
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    await expense.deleteOne();
    res.json({ message: "Expense removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Auto-computed Total Operational Cost per vehicle (Fuel + Maintenance)
// @route GET /api/expenses/operational-cost
export const getOperationalCost = async (req, res) => {
  try {
    const { vehicle } = req.query;

    const fuelMatch = vehicle ? { vehicle } : {};
    const maintMatch = vehicle ? { vehicle } : {};

    const fuelLogs = await FuelLog.find(fuelMatch);
    const maintenanceLogs = await MaintenanceLog.find(maintMatch);

    // Aggregate per vehicle
    const costMap = {};

    fuelLogs.forEach((f) => {
      const vId = f.vehicle.toString();
      if (!costMap[vId]) costMap[vId] = { fuelCost: 0, maintenanceCost: 0 };
      costMap[vId].fuelCost += f.cost;
    });

    maintenanceLogs.forEach((m) => {
      const vId = m.vehicle.toString();
      if (!costMap[vId]) costMap[vId] = { fuelCost: 0, maintenanceCost: 0 };
      costMap[vId].maintenanceCost += m.cost;
    });

    const vehicles = await Vehicle.find({ _id: { $in: Object.keys(costMap) } }).select(
      "registrationNumber nameModel"
    );

    const result = vehicles.map((v) => {
      const c = costMap[v._id.toString()];
      return {
        vehicle: v,
        fuelCost: c.fuelCost,
        maintenanceCost: c.maintenanceCost,
        totalOperationalCost: c.fuelCost + c.maintenanceCost,
      };
    });

    const grandTotal = result.reduce((sum, r) => sum + r.totalOperationalCost, 0);

    res.json({ breakdown: result, grandTotal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};