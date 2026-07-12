import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import Driver from "../models/Driver.js";
import generateTripCode from "../utils/generateTripCode.js";

// @desc  Create a trip (status: Draft)
// @route POST /api/trips
export const createTrip = async (req, res) => {
  try {
    const { source, destination, vehicle, driver, cargoWeight, plannedDistance } = req.body;

    if (!source || !destination || cargoWeight === undefined || !plannedDistance) {
      return res.status(400).json({ message: "Source, destination, cargo weight, and distance are required" });
    }

    // If vehicle is pre-selected at Draft stage, validate capacity now
    if (vehicle) {
      const veh = await Vehicle.findById(vehicle);
      if (!veh) return res.status(404).json({ message: "Vehicle not found" });

      if (cargoWeight > veh.maxLoadCapacity) {
        return res.status(400).json({
          message: `Capacity exceeded by ${cargoWeight - veh.maxLoadCapacity} kg — dispatch blocked`,
        });
      }
    }

    const tripCode = await generateTripCode();

    const trip = await Trip.create({
      tripCode,
      source,
      destination,
      vehicle: vehicle || null,
      driver: driver || null,
      cargoWeight,
      plannedDistance,
      status: "Draft",
      createdBy: req.user.id,
    });

    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all trips (with optional status filter)
// @route GET /api/trips?status=&search=
export const getTrips = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== "All") filter.status = status;
    if (search) filter.tripCode = { $regex: search, $options: "i" };

    const trips = await Trip.find(filter)
      .populate("vehicle", "registrationNumber nameModel maxLoadCapacity status")
      .populate("driver", "name licenseNumber status licenseExpiry")
      .sort({ createdAt: -1 });

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single trip
// @route GET /api/trips/:id
export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate("vehicle")
      .populate("driver");
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update trip details while still in Draft (assign vehicle/driver, edit cargo etc.)
// @route PUT /api/trips/:id
export const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    if (trip.status !== "Draft") {
      return res.status(400).json({ message: "Only Draft trips can be edited" });
    }

    const { source, destination, vehicle, driver, cargoWeight, plannedDistance } = req.body;

    if (vehicle) {
      const veh = await Vehicle.findById(vehicle);
      if (!veh) return res.status(404).json({ message: "Vehicle not found" });
      const weightToCheck = cargoWeight ?? trip.cargoWeight;
      if (weightToCheck > veh.maxLoadCapacity) {
        return res.status(400).json({
          message: `Capacity exceeded by ${weightToCheck - veh.maxLoadCapacity} kg — dispatch blocked`,
        });
      }
    }

    if (source) trip.source = source;
    if (destination) trip.destination = destination;
    if (vehicle) trip.vehicle = vehicle;
    if (driver) trip.driver = driver;
    if (cargoWeight !== undefined) trip.cargoWeight = cargoWeight;
    if (plannedDistance) trip.plannedDistance = plannedDistance;

    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Dispatch a trip — THE CORE BUSINESS RULE ENGINE
// @route PATCH /api/trips/:id/dispatch
export const dispatchTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    if (trip.status !== "Draft") {
      return res.status(400).json({ message: "Only Draft trips can be dispatched" });
    }

    if (!trip.vehicle || !trip.driver) {
      return res.status(400).json({ message: "Vehicle and Driver must be assigned before dispatch" });
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    // Rule: Retired or In Shop vehicles cannot dispatch
    if (["Retired", "In Shop"].includes(vehicle.status)) {
      return res.status(400).json({ message: `Vehicle is ${vehicle.status} and cannot be dispatched` });
    }

    // Rule: Vehicle already On Trip cannot be assigned to another trip
    if (vehicle.status === "On Trip") {
      return res.status(400).json({ message: "Vehicle is already On Trip" });
    }

    // Rule: Suspended drivers cannot be assigned
    if (driver.status === "Suspended") {
      return res.status(400).json({ message: "Driver is Suspended and cannot be assigned" });
    }

    // Rule: Driver already On Trip cannot be assigned to another trip
    if (driver.status === "On Trip") {
      return res.status(400).json({ message: "Driver is already On Trip" });
    }

    // Rule: Expired license blocks assignment
    if (driver.licenseExpiry < new Date()) {
      return res.status(400).json({ message: "Driver's license has expired and cannot be assigned" });
    }

    // Rule: Cargo weight must not exceed vehicle capacity
    if (trip.cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({
        message: `Capacity exceeded by ${trip.cargoWeight - vehicle.maxLoadCapacity} kg — dispatch blocked`,
      });
    }

    // All checks passed — dispatch
    trip.status = "Dispatched";
    vehicle.status = "On Trip";
    driver.status = "On Trip";

    await trip.save();
    await vehicle.save();
    await driver.save();

    res.json({ message: "Trip dispatched successfully", trip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Complete a trip — restores vehicle & driver to Available
// @route PATCH /api/trips/:id/complete
export const completeTrip = async (req, res) => {
  try {
    const { finalOdometer, fuelConsumed } = req.body;

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    if (trip.status !== "Dispatched") {
      return res.status(400).json({ message: "Only Dispatched trips can be completed" });
    }

    if (finalOdometer === undefined || fuelConsumed === undefined) {
      return res.status(400).json({ message: "Final odometer and fuel consumed are required to complete a trip" });
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    trip.status = "Completed";
    trip.finalOdometer = finalOdometer;
    trip.fuelConsumed = fuelConsumed;

    if (vehicle) {
      vehicle.odometer = finalOdometer;
      vehicle.status = "Available";
      await vehicle.save();
    }

    if (driver) {
      driver.status = "Available";
      await driver.save();
    }

    await trip.save();
    res.json({ message: "Trip completed successfully", trip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Cancel a dispatched (or draft) trip — restores vehicle & driver to Available
// @route PATCH /api/trips/:id/cancel
export const cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    if (!["Draft", "Dispatched"].includes(trip.status)) {
      return res.status(400).json({ message: "Only Draft or Dispatched trips can be cancelled" });
    }

    const wasDispatched = trip.status === "Dispatched";
    trip.status = "Cancelled";
    await trip.save();

    // Only restore statuses if the trip had actually moved them to On Trip
    if (wasDispatched) {
      const vehicle = await Vehicle.findById(trip.vehicle);
      const driver = await Driver.findById(trip.driver);

      if (vehicle && vehicle.status === "On Trip") {
        vehicle.status = "Available";
        await vehicle.save();
      }
      if (driver && driver.status === "On Trip") {
        driver.status = "Available";
        await driver.save();
      }
    }

    res.json({ message: "Trip cancelled", trip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get vehicles/drivers eligible for dispatch (for the Trip Dispatcher dropdowns)
// @route GET /api/trips/eligible-resources
export const getEligibleResources = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: "Available" });
    const drivers = await Driver.find({
      status: "Available",
      licenseExpiry: { $gte: new Date() },
    });

    res.json({ vehicles, drivers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};