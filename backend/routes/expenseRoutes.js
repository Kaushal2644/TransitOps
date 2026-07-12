import express from "express";
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getOperationalCost,
} from "../controllers/expenseController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/operational-cost", getOperationalCost); // all roles can view (Financial Analyst needs this)
router.get("/", getExpenses);
router.post("/", authorize("Fleet Manager", "Dispatcher"), createExpense);
router.put("/:id", authorize("Fleet Manager", "Dispatcher"), updateExpense);
router.delete("/:id", authorize("Fleet Manager"), deleteExpense);

export default router;