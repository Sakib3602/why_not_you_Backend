import { Router } from "express";

import {
  createInstrument,
  updateInstrument,
  toggleInstrument,
} from "../controllers/instrument.controller";
// import { requireAuth } from "../middleware/auth"; // পরে বসাবেন, role==="admin" চেক করার জন্য

const router = Router();

router.post("/", /* requireAuth, */ createInstrument);
router.put("/:slug", /* requireAuth, */ updateInstrument);
router.patch("/:slug/toggle", /* requireAuth, */ toggleInstrument);

export default router;