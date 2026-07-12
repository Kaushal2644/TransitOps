import Vehicle from "../models/Vehicle.js";
import Driver from "../models/Driver.js";
import Trip from "../models/Trip.js";
import FuelLog from "../models/FuelLog.js";
import MaintenanceLog from "../models/MaintenanceLog.js";

// @desc  Dashboard KPI cards
// @route GET /api/dashboard/kpis?type=&status=&region=
export const getDashboardKPIs = async (req, res) => {
  try {
    const { type, region } = req.query;
    const vehicleFilter = {};
    if (type && type !== "All") vehicleFilter.type = type;
    if (region && region !== "All") vehicleFilter.region = region;

    const vehicles = await Vehicle.find(vehicleFilter);
    const drivers = await Driver.find();
    const trips = await Trip.find();

    const activeVehicles = vehicles.filter((v) => v.status !== "Retired").length;
    const availableVehicles = vehicles.filter((v) => v.status === "Available").length;
    const vehiclesInMaintenance = vehicles.filter((v) => v.status === "In Shop").length;
    const activeTrips = trips.filter((t) => t.status === "Dispatched").length;
    const pendingTrips = trips.filter((t) => t.status === "Draft").length;
    const driversOnDuty = drivers.filter((d) => d.status === "On Trip").length;

    // Fleet Utilization % = vehicles On Trip / total non-retired vehicles
    const onTripVehicles = vehicles.filter((v) => v.status === "On Trip").length;
    const nonRetiredCount = vehicles.filter((v) => v.status !== "Retired").length;
    const fleetUtilization = nonRetiredCount > 0 ? Math.round((onTripVehicles / nonRetiredCount) * 100) : 0;

    // Vehicle status breakdown for the bar chart
    const statusBreakdown = {
      Available: vehicles.filter((v) => v.status === "Available").length,
      "On Trip": onTripVehicles,
      "In Shop": vehiclesInMaintenance,
      Retired: vehicles.filter((v) => v.status === "Retired").length,
    };

    res.json({
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
      statusBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Recent trips for dashboard table
// @route GET /api/dashboard/recent-trips
export const getRecentTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate("vehicle", "registrationNumber nameModel")
      .populate("driver", "name")
      .sort({ createdAt: -1 })
      .limit(6);

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Reports & Analytics KPI cards + charts
// @route GET /api/dashboard/analytics
export const getAnalytics = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    const completedTrips = await Trip.find({ status: "Completed" });
    const fuelLogs = await FuelLog.find();
    const maintenanceLogs = await MaintenanceLog.find();

    // --- Fuel Efficiency (km/l) = total distance / total fuel consumed ---
    const totalDistance = completedTrips.reduce((sum, t) => sum + (t.plannedDistance || 0), 0);
    const totalFuelConsumed = completedTrips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
    const fuelEfficiency = totalFuelConsumed > 0 ? +(totalDistance / totalFuelConsumed).toFixed(1) : 0;

    // --- Fleet Utilization % (reuse same logic as KPI) ---
    const onTripVehicles = vehicles.filter((v) => v.status === "On Trip").length;
    const nonRetiredCount = vehicles.filter((v) => v.status !== "Retired").length;
    const fleetUtilization = nonRetiredCount > 0 ? Math.round((onTripVehicles / nonRetiredCount) * 100) : 0;

    // --- Operational Cost (Fuel + Maintenance), fleet-wide ---
    const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
    const totalMaintenanceCost = maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
    const operationalCost = totalFuelCost + totalMaintenanceCost;

    // --- Per-vehicle cost & revenue map, for ROI + Top Costliest ---
    const perVehicle = {};
    vehicles.forEach((v) => {
      perVehicle[v._id.toString()] = {
        vehicle: v,
        fuelCost: 0,
        maintenanceCost: 0,
        revenue: 0,
      };
    });

    fuelLogs.forEach((f) => {
      const id = f.vehicle.toString();
      if (perVehicle[id]) perVehicle[id].fuelCost += f.cost;
    });

    maintenanceLogs.forEach((m) => {
      const id = m.vehicle.toString();
      if (perVehicle[id]) perVehicle[id].maintenanceCost += m.cost;
    });

    completedTrips.forEach((t) => {
      const id = t.vehicle?.toString();
      if (id && perVehicle[id]) perVehicle[id].revenue += t.revenue || 0;
    });

    // --- Vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost ---
    const roiList = Object.values(perVehicle).map((p) => {
      const cost = p.fuelCost + p.maintenanceCost;
      const roi = p.vehicle.acquisitionCost > 0 ? (p.revenue - cost) / p.vehicle.acquisitionCost : 0;
      return {
        vehicle: p.vehicle.registrationNumber,
        nameModel: p.vehicle.nameModel,
        revenue: p.revenue,
        cost,
        roi: +(roi * 100).toFixed(1), // as %
      };
    });

    const fleetAvgROI =
      roiList.length > 0 ? +(roiList.reduce((sum, r) => sum + r.roi, 0) / roiList.length).toFixed(1) : 0;

    // --- Top Costliest Vehicles (for horizontal bar chart) ---
    const topCostliest = Object.values(perVehicle)
      .map((p) => ({
        vehicle: p.vehicle.nameModel,
        totalCost: p.fuelCost + p.maintenanceCost,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);

    // --- Monthly Revenue chart (last 7 months, based on completed trip dates) ---
    const monthlyRevenueMap = {};
    completedTrips.forEach((t) => {
      const month = new Date(t.updatedAt).toLocaleString("default", { month: "short", year: "2-digit" });
      monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + (t.revenue || 0);
    });
    const monthlyRevenue = Object.entries(monthlyRevenueMap).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    res.json({
      fuelEfficiency,
      fleetUtilization,
      operationalCost,
      fleetAvgROI,
      monthlyRevenue,
      topCostliest,
      roiByVehicle: roiList,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};