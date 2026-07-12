import Vehicle from "../models/Vehicle.js";
import { emitVehicleRelated } from "../utils/emitSocketEvent.js";

// @desc  Create a new vehicle
// @route POST /api/vehicles
export const createVehicle = async (req, res) => {
  try {
    const { registrationNumber, nameModel, type, maxLoadCapacity, odometer, acquisitionCost, region } = req.body;

    if (!registrationNumber || !nameModel || !type || !maxLoadCapacity || !acquisitionCost) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const existing = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "Registration Number must be unique" });
    }

    const vehicle = await Vehicle.create({
      registrationNumber,
      nameModel,
      type,
      maxLoadCapacity,
      odometer: odometer || 0,
      acquisitionCost,
      region,
    });

    res.status(201).json(vehicle);
    emitVehicleRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all vehicles (with optional filters)
// @route GET /api/vehicles?type=&status=&region=&search=
export const getVehicles = async (req, res) => {
  try {
    const { type, status, region, search } = req.query;
    const filter = {};

    if (type && type !== "All") filter.type = type;
    if (status && status !== "All") filter.status = status;
    if (region && region !== "All") filter.region = region;
    if (search) {
      filter.$or = [
        { registrationNumber: { $regex: search, $options: "i" } },
        { nameModel: { $regex: search, $options: "i" } },
      ];
    }

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single vehicle
// @route GET /api/vehicles/:id
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update vehicle
// @route PUT /api/vehicles/:id
export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    // If reg number is being changed, re-check uniqueness
    if (req.body.registrationNumber && req.body.registrationNumber.toUpperCase() !== vehicle.registrationNumber) {
      const existing = await Vehicle.findOne({
        registrationNumber: req.body.registrationNumber.toUpperCase(),
      });
      if (existing) {
        return res.status(400).json({ message: "Registration Number must be unique" });
      }
    }

    // Prevent manually setting status to On Trip (should only happen via dispatch)
    if (req.body.status === "On Trip") {
      return res.status(400).json({ message: "Status 'On Trip' can only be set via Trip Dispatch" });
    }

    Object.assign(vehicle, req.body);
    await vehicle.save();
    res.json(vehicle);
    emitVehicleRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete vehicle
// @route DELETE /api/vehicles/:id
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    if (vehicle.status === "On Trip") {
      return res.status(400).json({ message: "Cannot delete a vehicle that is currently On Trip" });
    }

    await vehicle.deleteOne();
    res.json({ message: "Vehicle removed" });
    emitVehicleRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};