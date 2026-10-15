import { Router } from "express";
import {
  getDashboardStats,
  getAdminResponses,
  getAdminResponseById,
  updatePaymentStatus,
  getAdminInstruments,
  updateInstrumentAdmin,
} from "../controllers/adminDashboard.controller";

const router = Router();

// Dashboard analytics
router.get("/stats", getDashboardStats);

// Submissions / Responses
router.get("/responses", getAdminResponses);
router.get("/responses/:id", getAdminResponseById);
router.patch("/responses/:id/payment", updatePaymentStatus);

// Instruments management
router.get("/instruments", getAdminInstruments);
router.patch("/instruments/:slug", updateInstrumentAdmin);

export default router;
