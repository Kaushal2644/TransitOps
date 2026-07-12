import express from "express";
import {
  createMaintenanceLog,
  getMaintenanceLogs,
  getMaintenanceLogById,
  updateMaintenanceLog,
  closeMaintenanceLog,
  deleteMaintenanceLog,
} from "../controllers/maintenanceController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getMaintenanceLogs);
router.get("/:id", getMaintenanceLogById);

router.post("/", authorize("Fleet Manager"), createMaintenanceLog);
router.put("/:id", authorize("Fleet Manager"), updateMaintenanceLog);
router.patch("/:id/close", authorize("Fleet Manager"), closeMaintenanceLog);
router.delete("/:id", authorize("Fleet Manager"), deleteMaintenanceLog);

export default router;