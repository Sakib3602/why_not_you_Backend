import { Router } from "express";

import {
  listAmBatteries,
  getAmBatteryDetails,
  getAmBatteryQuizConfig,
  listAmBatteriesAdmin,
  getAmBatteryAdmin,
  createAmBattery,
  updateAmBattery,
  setAmBatteryStatus,
  setAmBatteryPrice,
  deleteAmBattery,
  addAmBatteryItem,
  updateAmBatteryItem,
  deleteAmBatteryItem,
} from "../controllers/Ambattery.controller";
import { submitAmResponse, getAmResult } from "../controllers/Amresponse.controller";

import { isAdmin } from "../middleware/auth.middleware";

const router = Router();

/* ================= PUBLIC (candidate-facing) ================= */
router.get("/", listAmBatteries);
router.get("/:slug/details", getAmBatteryDetails);
router.get("/:slug/quiz", getAmBatteryQuizConfig);
router.post("/:slug/submit", submitAmResponse);
router.get("/response/:id", getAmResult);

/* ================= ADMIN ================= */
router.get("/admin/list", isAdmin,       listAmBatteriesAdmin);
router.get("/admin/:slug", isAdmin,     getAmBatteryAdmin);
router.post("/admin", isAdmin, createAmBattery);
router.put("/admin/:slug", isAdmin, updateAmBattery);
router.patch("/admin/:slug/status", isAdmin, setAmBatteryStatus);
router.patch("/admin/:slug/price", isAdmin, setAmBatteryPrice);
router.delete("/admin/:slug", isAdmin, deleteAmBattery);

router.post("/admin/:slug/items", isAdmin, addAmBatteryItem);
router.put("/admin/:slug/items/:itemId", isAdmin, updateAmBatteryItem);
router.delete("/admin/:slug/items/:itemId", isAdmin, deleteAmBatteryItem);

export default router;