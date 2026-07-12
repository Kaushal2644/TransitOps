import express from "express";
import {
  createFuelLog,
  getFuelLogs,
  updateFuelLog,
  deleteFuelLog,
} from "../controllers/fuelController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getFuelLogs);
router.post("/", authorize("Fleet Manager", "Dispatcher"), createFuelLog);
router.put("/:id", authorize("Fleet Manager", "Dispatcher"), updateFuelLog);
router.delete("/:id", authorize("Fleet Manager"), deleteFuelLog);

export default router;