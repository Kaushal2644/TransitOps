import express from "express";
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicleController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getVehicles);
router.get("/:id", getVehicleById);

router.post("/", authorize("Fleet Manager"), createVehicle);
router.put("/:id", authorize("Fleet Manager", "Dispatcher"), updateVehicle);
router.delete("/:id", authorize("Fleet Manager"), deleteVehicle);

export default router;