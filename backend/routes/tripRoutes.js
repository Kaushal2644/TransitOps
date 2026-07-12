import express from "express";
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getEligibleResources,
} from "../controllers/tripController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/eligible-resources", getEligibleResources);
router.get("/", getTrips);
router.get("/:id", getTripById);

router.post("/", authorize("Fleet Manager", "Dispatcher"), createTrip);
router.put("/:id", authorize("Fleet Manager", "Dispatcher"), updateTrip);
router.patch("/:id/dispatch", authorize("Fleet Manager", "Dispatcher"), dispatchTrip);
router.patch("/:id/complete", authorize("Fleet Manager", "Dispatcher"), completeTrip);
router.patch("/:id/cancel", authorize("Fleet Manager", "Dispatcher"), cancelTrip);

export default router;