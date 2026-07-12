import Driver from "../models/Driver.js";
import { emitDriverRelated } from "../utils/emitSocketEvent.js";

// @desc  Create a new driver
// @route POST /api/drivers
export const createDriver = async (req, res) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiry, contactNumber, safetyScore } = req.body;

    if (!name || !licenseNumber || !licenseCategory || !licenseExpiry || !contactNumber) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const existing = await Driver.findOne({ licenseNumber });
    if (existing) {
      return res.status(400).json({ message: "License Number must be unique" });
    }

    const driver = await Driver.create({
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiry,
      contactNumber,
      safetyScore: safetyScore ?? 100,
    });

    res.status(201).json(driver);
    emitDriverRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all drivers (with optional filters)
// @route GET /api/drivers?status=&search=
export const getDrivers = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== "All") filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { licenseNumber: { $regex: search, $options: "i" } },
      ];
    }

    const drivers = await Driver.find(filter).sort({ createdAt: -1 });

    // Attach computed isLicenseExpired flag for frontend badges
    const enriched = drivers.map((d) => ({
      ...d.toObject(),
      isLicenseExpired: d.licenseExpiry < new Date(),
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single driver
// @route GET /api/drivers/:id
export const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update driver
// @route PUT /api/drivers/:id
export const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    if (req.body.licenseNumber && req.body.licenseNumber !== driver.licenseNumber) {
      const existing = await Driver.findOne({ licenseNumber: req.body.licenseNumber });
      if (existing) {
        return res.status(400).json({ message: "License Number must be unique" });
      }
    }

    if (req.body.status === "On Trip") {
      return res.status(400).json({ message: "Status 'On Trip' can only be set via Trip Dispatch" });
    }

    Object.assign(driver, req.body);
    await driver.save();
    res.json(driver);
    emitDriverRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete driver
// @route DELETE /api/drivers/:id
export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    if (driver.status === "On Trip") {
      return res.status(400).json({ message: "Cannot delete a driver who is currently On Trip" });
    }

    await driver.deleteOne();
    res.json({ message: "Driver removed" });
    emitDriverRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Suspend / Un-suspend a driver (Safety Officer action)
// @route PATCH /api/drivers/:id/suspend
export const toggleSuspend = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    driver.status = driver.status === "Suspended" ? "Available" : "Suspended";
    await driver.save();
    res.json(driver);
    emitDriverRelated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};