import MaintenanceLog from "../models/MaintenanceLog.js";
import Vehicle from "../models/Vehicle.js";
import { emitMaintenanceRelated } from "../utils/emitSocketEvent.js";

// @desc  Create a maintenance record — auto sets vehicle to "In Shop"
// @route POST /api/maintenance
export const createMaintenanceLog = async (req, res) => {
  try {
    const { vehicle, serviceType, cost, date } = req.body;

    if (!vehicle || !serviceType || cost === undefined) {
      return res.status(400).json({ message: "Vehicle, service type, and cost are required" });
    }

    const veh = await Vehicle.findById(vehicle);
    if (!veh) return res.status(404).json({ message: "Vehicle not found" });

    // Rule: Cannot send an On Trip vehicle to maintenance
    if (veh.status === "On Trip") {
      return res.status(400).json({ message: "Vehicle is currently On Trip and cannot be sent to maintenance" });
    }

    // Rule: Retired vehicles cannot receive new active maintenance
    if (veh.status === "Retired") {
      return res.status(400).json({ message: "Vehicle is Retired and cannot be added to maintenance" });
    }

    // Rule: Prevent duplicate active maintenance records for the same vehicle
    const existingActive = await MaintenanceLog.findOne({ vehicle, status: "Active" });
    if (existingActive) {
      return res.status(400).json({ message: "Vehicle already has an active maintenance record" });
    }

    const log = await MaintenanceLog.create({
      vehicle,
      serviceType,
      cost,
      date: date || Date.now(),
      status: "Active",
    });

    // Auto-transition: vehicle status -> In Shop, removed from dispatch pool
    veh.status = "In Shop";
    await veh.save();

    const populated = await log.populate("vehicle", "registrationNumber nameModel");
    res.status(201).json(populated);
    emitMaintenanceRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all maintenance logs (optional filters)
// @route GET /api/maintenance?status=&search=
export const getMaintenanceLogs = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== "All") filter.status = status;

    let logs = await MaintenanceLog.find(filter)
      .populate("vehicle", "registrationNumber nameModel type")
      .sort({ createdAt: -1 });

    if (search) {
      const term = search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.vehicle?.registrationNumber?.toLowerCase().includes(term) ||
          l.vehicle?.nameModel?.toLowerCase().includes(term) ||
          l.serviceType?.toLowerCase().includes(term)
      );
    }

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single maintenance log
// @route GET /api/maintenance/:id
export const getMaintenanceLogById = async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id).populate("vehicle");
    if (!log) return res.status(404).json({ message: "Maintenance log not found" });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update maintenance record (e.g. adjust cost/service type while still active)
// @route PUT /api/maintenance/:id
export const updateMaintenanceLog = async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Maintenance log not found" });

    if (log.status !== "Active") {
      return res.status(400).json({ message: "Only active maintenance records can be edited" });
    }

    const { serviceType, cost, date } = req.body;
    if (serviceType) log.serviceType = serviceType;
    if (cost !== undefined) log.cost = cost;
    if (date) log.date = date;

    await log.save();
    res.json(log);
    emitMaintenanceRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Close a maintenance record — restores vehicle to Available (unless Retired)
// @route PATCH /api/maintenance/:id/close
export const closeMaintenanceLog = async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Maintenance log not found" });

    if (log.status !== "Active") {
      return res.status(400).json({ message: "Maintenance record is already closed" });
    }

    const vehicle = await Vehicle.findById(log.vehicle);

    log.status = "Completed";
    await log.save();

    if (vehicle && vehicle.status !== "Retired") {
      vehicle.status = "Available";
      await vehicle.save();
    }

    res.json({ message: "Maintenance closed, vehicle restored", log, vehicle });
    emitMaintenanceRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete a maintenance log (only if already completed)
// @route DELETE /api/maintenance/:id
export const deleteMaintenanceLog = async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Maintenance log not found" });

    if (log.status === "Active") {
      return res.status(400).json({ message: "Close the maintenance record before deleting it" });
    }

    await log.deleteOne();
    res.json({ message: "Maintenance log removed" });
    emitMaintenanceRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};