import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import Driver from "../models/Driver.js";
import Trip from "../models/Trip.js";
import MaintenanceLog from "../models/MaintenanceLog.js";
import FuelLog from "../models/FuelLog.js";
import Expense from "../models/Expense.js";

dotenv.config();

// ---------- ENUM MAPPINGS FROM YOUR SCHEMA ----------
const VEHICLE_TYPE_MAP = {
  "Mini Truck": "Mini",
  Pickup: "Van",
  "Light Truck": "Van",
  "Medium Truck": "Truck",
  Truck: "Truck",
  "Heavy Truck": "Truck",
  Van: "Van",
};

const VEHICLE_STATUS_MAP = {
  Available: "Available",
  "On Trip": "On Trip",
  Maintenance: "In Shop",
};

const DRIVER_STATUS_MAP = {
  Available: "Available",
  "On Trip": "On Trip",
  "On Leave": "Off Duty",
  "Maintenance Duty": "Off Duty",
  Suspended: "Suspended",
};

const TRIP_STATUS_MAP = {
  Completed: "Completed",
  "In Progress": "Dispatched",
  Cancelled: "Cancelled",
};

// ---------- RAW DATA ARRAYS ----------
const seedUsers = [
  {
    name: "kaushal Patel",
    email: "kaushal@transitops.com",
    password: "password123",
    role: "Fleet Manager",
  },
  {
    name: "Priya Patel",
    email: "priya.patel@transitops.com",
    password: "password123",
    role: "Fleet Manager",
  },
  {
    name: "Rahul Sharma",
    email: "rahul.sharma@transitops.com",
    password: "password123",
    role: "Dispatcher",
  },
  {
    name: "Neha Shah",
    email: "neha.shah@transitops.com",
    password: "password123",
    role: "Financial Analyst",
  },
  {
    name: "Anjali Singh",
    email: "anjali.singh@transitops.com",
    password: "password123",
    role: "Safety Officer",
  },
];

const seedVehiclesRaw = [
  {
    _id: "VEH001",
    registrationNumber: "GJ01AB1234",
    model: "Tata Ace Gold",
    type: "Mini Truck",
    maxLoadCapacity: 1000,
    odometer: 85432,
    acquisitionCost: 650000,
    status: "Available",
  },
  {
    _id: "VEH002",
    registrationNumber: "GJ05CD5678",
    model: "Ashok Leyland Dost",
    type: "Pickup",
    maxLoadCapacity: 1500,
    odometer: 125600,
    acquisitionCost: 875000,
    status: "On Trip",
  },
  {
    _id: "VEH003",
    registrationNumber: "GJ18EF9988",
    model: "Mahindra Bolero Pickup",
    type: "Pickup",
    maxLoadCapacity: 1700,
    odometer: 67400,
    acquisitionCost: 940000,
    status: "Maintenance",
  },
  {
    _id: "VEH004",
    registrationNumber: "GJ01GH4455",
    model: "Eicher Pro 2049",
    type: "Light Truck",
    maxLoadCapacity: 3500,
    odometer: 148200,
    acquisitionCost: 1650000,
    status: "Available",
  },
  {
    _id: "VEH005",
    registrationNumber: "GJ06JK3321",
    model: "Tata Intra V30",
    type: "Pickup",
    maxLoadCapacity: 1300,
    odometer: 43200,
    acquisitionCost: 920000,
    status: "On Trip",
  },
  {
    _id: "VEH006",
    registrationNumber: "GJ03LM8754",
    model: "Mahindra Jeeto",
    type: "Mini Truck",
    maxLoadCapacity: 700,
    odometer: 55600,
    acquisitionCost: 510000,
    status: "Available",
  },
  {
    _id: "VEH007",
    registrationNumber: "GJ07NP4567",
    model: "BharatBenz 1217R",
    type: "Medium Truck",
    maxLoadCapacity: 7000,
    odometer: 218400,
    acquisitionCost: 2850000,
    status: "On Trip",
  },
  {
    _id: "VEH008",
    registrationNumber: "GJ09QR2345",
    model: "Eicher Pro 2095XP",
    type: "Medium Truck",
    maxLoadCapacity: 9000,
    odometer: 185600,
    acquisitionCost: 3250000,
    status: "Available",
  },
  {
    _id: "VEH009",
    registrationNumber: "GJ10ST9087",
    model: "Tata Ultra T.7",
    type: "Truck",
    maxLoadCapacity: 7500,
    odometer: 102400,
    acquisitionCost: 2950000,
    status: "Maintenance",
  },
  {
    _id: "VEH010",
    registrationNumber: "GJ11UV6543",
    model: "Ashok Leyland Partner",
    type: "Truck",
    maxLoadCapacity: 6000,
    odometer: 113500,
    acquisitionCost: 2450000,
    status: "Available",
  },
];

const seedDriversRaw = [
  {
    _id: "DRV001",
    name: "Amit Kumar",
    licenseNumber: "GJ01DL12345",
    phone: "9876500001",
    safetyScore: 95,
    status: "Available",
  },
  {
    _id: "DRV002",
    name: "Rakesh Singh",
    licenseNumber: "GJ05DL45678",
    phone: "9876500002",
    safetyScore: 91,
    status: "On Trip",
  },
  {
    _id: "DRV003",
    name: "Vikram Shah",
    licenseNumber: "GJ18DL78965",
    phone: "9876500003",
    safetyScore: 89,
    status: "Available",
  },
  {
    _id: "DRV004",
    name: "Manoj Patel",
    licenseNumber: "GJ06DL11223",
    phone: "9876500004",
    safetyScore: 93,
    status: "On Leave",
  },
  {
    _id: "DRV005",
    name: "Suresh Yadav",
    licenseNumber: "GJ02DL33445",
    phone: "9876500005",
    safetyScore: 97,
    status: "Available",
  },
];

const seedTripsRaw = [
  {
    _id: "TRP001",
    tripCode: "TR-2026-001",
    source: "Ahmedabad",
    destination: "Vadodara",
    vehicleId: "VEH001",
    driverId: "DRV001",
    distance: 110,
    cargoWeight: 850,
    status: "Completed",
  },
  {
    _id: "TRP002",
    tripCode: "TR-2026-002",
    source: "Surat",
    destination: "Rajkot",
    vehicleId: "VEH002",
    driverId: "DRV002",
    distance: 520,
    cargoWeight: 1400,
    status: "Completed",
  },
  {
    _id: "TRP021",
    tripCode: "TR-2026-021",
    source: "Rajkot",
    destination: "Junagadh",
    vehicleId: "VEH001",
    driverId: "DRV005",
    distance: 103,
    cargoWeight: 900,
    status: "In Progress",
  },
];

const seedFuelRaw = [
  {
    tripId: "TRP001",
    vehicleId: "VEH001",
    liters: 18,
    totalCost: 1710,
    fuelDate: "2026-07-01T07:30:00Z",
  },
  {
    tripId: "TRP002",
    vehicleId: "VEH002",
    liters: 42,
    totalCost: 3990,
    fuelDate: "2026-07-01T06:40:00Z",
  },
];

const seedMaintenanceRaw = [
  {
    vehicleId: "VEH001",
    maintenanceType: "Engine Oil Change",
    cost: 4500,
    serviceDate: "2026-07-05",
    status: "Completed",
  },
  {
    vehicleId: "VEH003",
    maintenanceType: "Battery Check",
    cost: 1200,
    serviceDate: "2026-07-10",
    status: "Completed",
  },
];

const seedExpenseRaw = [
  {
    tripId: "TRP001",
    vehicleId: "VEH001",
    expenseType: "Toll Fee",
    amount: 320,
  },
  {
    tripId: "TRP002",
    vehicleId: "VEH002",
    expenseType: "Parking",
    amount: 150,
  },
];

// ---------- RUN SEEDER ----------
const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear old data
    await Promise.all([
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Trip.deleteMany({}),
      MaintenanceLog.deleteMany({}),
      FuelLog.deleteMany({}),
      Expense.deleteMany({}),
    ]);
    console.log("Cleared existing collections.");

    // 1. Seed Users
    for (const u of seedUsers) {
      await User.create(u); // Middleware handles hashing
    }
    console.log(`Seeded ${seedUsers.length} users.`);

    // 2. Seed Vehicles
    const vehicleIdMap = {};
    for (const v of seedVehiclesRaw) {
      const doc = await Vehicle.create({
        registrationNumber: v.registrationNumber,
        nameModel: v.model,
        type: VEHICLE_TYPE_MAP[v.type] || "Van",
        maxLoadCapacity: v.maxLoadCapacity,
        odometer: v.odometer,
        acquisitionCost: v.acquisitionCost,
        status: VEHICLE_STATUS_MAP[v.status] || "Available",
        region: "Gujarat",
      });
      vehicleIdMap[v._id] = doc._id;
    }
    console.log(`Seeded ${seedVehiclesRaw.length} vehicles.`);

    // 3. Seed Drivers
    const driverIdMap = {};
    for (const d of seedDriversRaw) {
      const doc = await Driver.create({
        name: d.name,
        licenseNumber: d.licenseNumber,
        licenseCategory: "LMV",
        licenseExpiry: new Date("2030-12-31"),
        contactNumber: d.phone,
        safetyScore: d.safetyScore,
        status: DRIVER_STATUS_MAP[d.status] || "Available",
      });
      driverIdMap[d._id] = doc._id;
    }
    console.log(`Seeded ${seedDriversRaw.length} drivers.`);

    // 4. Seed Trips
    const tripIdMap = {};
    const adminUser = await User.findOne({ role: "Dispatcher" });
    for (const t of seedTripsRaw) {
      const vehicle = vehicleIdMap[t.vehicleId] || null;
      const driver = driverIdMap[t.driverId] || null;
      const status = TRIP_STATUS_MAP[t.status] || "Draft";

      const doc = await Trip.create({
        tripCode: t.tripCode,
        source: t.source,
        destination: t.destination,
        vehicle,
        driver,
        cargoWeight: t.cargoWeight,
        plannedDistance: t.distance,
        status,
        createdBy: adminUser?._id,
        finalOdometer: status === "Completed" ? t.distance : null,
        fuelConsumed:
          status === "Completed" ? Math.round(t.distance / 8) : null,
        revenue: status === "Completed" ? t.cargoWeight * 15 : 0,
      });
      tripIdMap[t._id] = doc._id;
    }
    console.log(`Seeded ${seedTripsRaw.length} trips.`);

    // 5. Seed Fuel Logs
    for (const f of seedFuelRaw) {
      const vehicle = vehicleIdMap[f.vehicleId];
      const trip = tripIdMap[f.tripId] || null;
      if (!vehicle) continue;
      await FuelLog.create({
        vehicle,
        trip,
        date: new Date(f.fuelDate),
        liters: f.liters,
        cost: f.totalCost,
      });
    }
    console.log(`Seeded ${seedFuelRaw.length} fuel logs.`);

    // 6. Seed Maintenance Logs
    for (const m of seedMaintenanceRaw) {
      const vehicle = vehicleIdMap[m.vehicleId];
      if (!vehicle) continue;
      await MaintenanceLog.create({
        vehicle,
        serviceType: m.maintenanceType,
        cost: m.cost,
        date: new Date(m.serviceDate),
        status: m.status === "Completed" ? "Completed" : "Active",
      });
    }
    console.log(`Seeded ${seedMaintenanceRaw.length} maintenance logs.`);

    // 7. Seed Expenses
    for (const e of seedExpenseRaw) {
      const vehicle = vehicleIdMap[e.vehicleId];
      const trip = tripIdMap[e.tripId] || null;
      if (!vehicle) continue;

      const isToll = e.expenseType === "Toll Fee";
      await Expense.create({
        trip,
        vehicle,
        toll: isToll ? e.amount : 0,
        other: isToll ? 0 : e.amount,
        status: "Completed",
      });
    }
    console.log(`Seeded ${seedExpenseRaw.length} expenses.`);

    console.log("============== SEEDING SUCCESSFUL ==============");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

run();