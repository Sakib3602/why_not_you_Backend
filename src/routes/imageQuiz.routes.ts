import { Router } from "express";

import {
  createImageQuiz,
  listImageQuizzesAdmin,
  getImageQuizAdmin,
  updateImageQuizMeta,
  deleteImageQuiz,
  addImageQuizItem,
  updateImageQuizItem,
  deleteImageQuizItem,
  listPublishedImageQuizzes,
  getImageQuizDetailsPublic,
  getImageQuizForTaking,
  submitImageQuizResponse,
  getImageQuizResult,
} from "../controllers/imageQuiz.controller";
import upload from "../middleware/imageUpload.middleware";

const router = Router();

/* ---------------------------------------------------------------
   Admin routes
   ⚠ TODO: এখানে আপনার existing admin-auth middleware বসিয়ে দিন
   (যেমন: router.use(requireAdmin) — যেটা AmBattery admin route এ ব্যবহার করছেন সেটাই)
   --------------------------------------------------------------- */
router.post("/admin", createImageQuiz);
router.get("/admin", listImageQuizzesAdmin);
router.get("/admin/:slug", getImageQuizAdmin);
router.patch("/admin/:slug", updateImageQuizMeta);
router.delete("/admin/:slug", deleteImageQuiz);

router.post("/admin/:slug/items", upload.single("image"), addImageQuizItem);
router.put("/admin/:slug/items/:itemId", upload.single("image"), updateImageQuizItem);
router.delete("/admin/:slug/items/:itemId", deleteImageQuizItem);

/* ---------------------------------------------------------------
   Public routes
   --------------------------------------------------------------- */
router.get("/", listPublishedImageQuizzes);
router.get("/result/:responseId", getImageQuizResult); // ⚠ /:slug এর আগে থাকতে হবে
router.get("/:slug", getImageQuizDetailsPublic);
router.get("/:slug/quiz", getImageQuizForTaking);
router.post("/:slug/submit", submitImageQuizResponse);

export default router;
