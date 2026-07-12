import FuelLog from "../models/FuelLog.js";
import Vehicle from "../models/Vehicle.js";
import { emitFuelRelated } from "../utils/emitSocketEvent.js";

// @desc  Log a fuel entry
// @route POST /api/fuel
export const createFuelLog = async (req, res) => {
  try {
    const { vehicle, trip, date, liters, cost } = req.body;

    if (!vehicle || liters === undefined || cost === undefined) {
      return res.status(400).json({ message: "Vehicle, liters, and cost are required" });
    }

    const veh = await Vehicle.findById(vehicle);
    if (!veh) return res.status(404).json({ message: "Vehicle not found" });

    const log = await FuelLog.create({
      vehicle,
      trip: trip || null,
      date: date || Date.now(),
      liters,
      cost,
    });

    const populated = await log.populate("vehicle", "registrationNumber nameModel");
    res.status(201).json(populated);
    emitFuelRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/fuel?vehicle=&search=
export const getFuelLogs = async (req, res) => {
  try {
    const { vehicle, search } = req.query;
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;

    let logs = await FuelLog.find(filter)
      .populate("vehicle", "registrationNumber nameModel")
      .sort({ date: -1 });

    if (search) {
      const term = search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.vehicle?.registrationNumber?.toLowerCase().includes(term) ||
          l.vehicle?.nameModel?.toLowerCase().includes(term)
      );
    }

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update a fuel log
// @route PUT /api/fuel/:id
export const updateFuelLog = async (req, res) => {
  try {
    const log = await FuelLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Fuel log not found" });

    const { liters, cost, date } = req.body;
    if (liters !== undefined) log.liters = liters;
    if (cost !== undefined) log.cost = cost;
    if (date) log.date = date;

    await log.save();
    res.json(log);
    emitFuelRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete a fuel log
// @route DELETE /api/fuel/:id
export const deleteFuelLog = async (req, res) => {
  try {
    const log = await FuelLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Fuel log not found" });

    await log.deleteOne();
    res.json({ message: "Fuel log removed" });
    emitFuelRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};