import express from "express";
import {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  toggleSuspend,
} from "../controllers/driverController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getDrivers); // all roles can view
router.get("/:id", getDriverById);

router.post("/", authorize("Fleet Manager", "Safety Officer"), createDriver);
router.put("/:id", authorize("Fleet Manager", "Safety Officer"), updateDriver);
router.delete("/:id", authorize("Fleet Manager"), deleteDriver);
router.patch("/:id/suspend", authorize("Safety Officer"), toggleSuspend);

export default router;