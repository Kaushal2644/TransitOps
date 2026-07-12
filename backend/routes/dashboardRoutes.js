import express from "express";
import { getDashboardKPIs, getRecentTrips, getAnalytics } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/kpis", getDashboardKPIs);
router.get("/recent-trips", getRecentTrips);
router.get("/analytics", getAnalytics); // all roles can view; Financial Analyst relies on this most

export default router;