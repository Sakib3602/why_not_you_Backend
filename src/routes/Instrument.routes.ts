import { Router } from "express";

import {
  listInstruments,
  getInstrumentDetails,
  getQuizConfig,
} from "../controllers/instrument.controller";
import {
  submitResponse,
  getResult,
} from "../controllers/response.controller";

const router = Router();

// লিস্ট পেজ — title, img, price
router.get("/", listInstruments);

// ডিটেইলস পেজ — title, img, price, description, estimatedMinutes
router.get("/:slug/details", getInstrumentDetails);

// Buy Now চাপার পর — পুরো quiz config
router.get("/:slug/quiz", getQuizConfig);

// quiz শেষে উত্তর জমা
router.post("/:slug/submit", submitResponse);

// রেজাল্ট আনা
router.get("/response/:id", getResult);

export default router;