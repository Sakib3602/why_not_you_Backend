import { Request, Response } from "express";

import cloudinary from "../config/cloudinary";
import ImageQuiz from "../models/ImageQuiz.model";
import ImageQuizResponse from "../models/ImageQuizResponse.model";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function nextItemId(existingCount: number) {
  return `Q${existingCount + 1}`;
}

/* ==================================================================
   ADMIN
   ================================================================== */

export const createImageQuiz = async (req: Request, res: Response) => {
  try {
    const { slug, name, description, coverImage, price } = req.body;

    if (!slug || !name?.bn) {
      return res.status(400).json({ message: "Slug ও নাম (বাংলা) আবশ্যক।" });
    }

    const exists = await ImageQuiz.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: "এই slug আগে থেকেই ব্যবহৃত হয়েছে।" });
    }

    const quiz = await ImageQuiz.create({
      slug,
      name,
      description,
      coverImage,
      price: Number(price) || 0,
      ageGroup: req.body.ageGroup || null,
      status: "draft",
      items: [],
    });

    res.status(201).json(quiz);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "তৈরি করা যায়নি।" });
  }
};

export const listImageQuizzesAdmin = async (_req: Request, res: Response) => {
  try {
    const quizzes = await ImageQuiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "তালিকা লোড করা যায়নি।" });
  }
};

export const getImageQuizAdmin = async (req: Request, res: Response) => {
  try {
    const quiz = await ImageQuiz.findOne({ slug: req.params.slug });
    if (!quiz) return res.status(404).json({ message: "পাওয়া যায়নি।" });
    res.json(quiz);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "লোড করা যায়নি।" });
  }
};

// name / description / coverImage / price / status — যেকোনো একটা বা একাধিক আপডেট
export const updateImageQuizMeta = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const allowed = ["name", "description", "coverImage", "price", "status", "ageGroup"];
    const update: Record<string, any> = {};
    const unset: Record<string, any> = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "ageGroup" && (!req.body[key] || req.body[key] === "none" || req.body[key] === "null")) {
          unset["ageGroup"] = 1;
        } else {
          update[key] = req.body[key];
        }
      }
    }

    const query: Record<string, any> = {};
    if (Object.keys(update).length > 0) query.$set = update;
    if (Object.keys(unset).length > 0) query.$unset = unset;

    const quiz = await ImageQuiz.findOneAndUpdate({ slug }, query, { new: true });
    if (!quiz) return res.status(404).json({ message: "পাওয়া যায়নি।" });
    res.json(quiz);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "আপডেট করা যায়নি।" });
  }
};

export const deleteImageQuiz = async (req: Request, res: Response) => {
  try {
    const quiz = await ImageQuiz.findOne({ slug: req.params.slug });
    if (!quiz) return res.status(404).json({ message: "পাওয়া যায়নি।" });

    // Cloudinary থেকে সব ছবি ক্লিনআপ
    for (const item of quiz.items) {
      if (item.imagePublicId) {
        await cloudinary.uploader.destroy(item.imagePublicId).catch(() => {});
      }
    }

    await quiz.deleteOne();
    res.json({ message: "ডিলিট হয়েছে।" });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "ডিলিট করা যায়নি।" });
  }
};

// multipart/form-data: image (file), optionsCount, correctOptionId, note_bn?
export const addImageQuizItem = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { optionsCount, correctOptionId, note_bn } = req.body;
    const file = req.file as (Express.Multer.File & { path: string; filename: string }) | undefined;

    if (!file) return res.status(400).json({ message: "প্রশ্নের ছবি আবশ্যক।" });
    if (!optionsCount || !correctOptionId) {
      return res.status(400).json({ message: "optionsCount ও correctOptionId আবশ্যক।" });
    }

    const count = Number(optionsCount);
    if (!(count >= 2 && count <= 8)) {
      return res.status(400).json({ message: "optionsCount ২ থেকে ৮ এর মধ্যে হতে হবে।" });
    }
    if (!LETTERS.slice(0, count).includes(correctOptionId)) {
      return res.status(400).json({ message: "correctOptionId অপশন সংখ্যার মধ্যে হতে হবে।" });
    }

    const quiz = await ImageQuiz.findOne({ slug });
    if (!quiz) return res.status(404).json({ message: "কুইজ পাওয়া যায়নি।" });

    const id = nextItemId(quiz.items.length);

    // multer-storage-cloudinary সাধারণত file.path -এ secure_url আর file.filename -এ public_id দেয়
    quiz.items.push({
      id,
      imageUrl: file.path,
      imagePublicId: file.filename,
      optionsCount: count,
      correctOptionId,
      note_bn: note_bn || undefined,
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "যোগ করা যায়নি।" });
  }
};

// multipart/form-data: image (file, optional — না দিলে পুরনো ছবিই থাকবে), optionsCount, correctOptionId, note_bn?
export const updateImageQuizItem = async (req: Request, res: Response) => {
  try {
    const { slug, itemId } = req.params;
    const { optionsCount, correctOptionId, note_bn } = req.body;
    const file = req.file as (Express.Multer.File & { path: string; filename: string }) | undefined;

    const quiz = await ImageQuiz.findOne({ slug });
    if (!quiz) return res.status(404).json({ message: "কুইজ পাওয়া যায়নি।" });

    const item = quiz.items.find((it) => it.id === itemId);
    if (!item) return res.status(404).json({ message: "প্রশ্ন পাওয়া যায়নি।" });

    const nextOptionsCount = optionsCount ? Number(optionsCount) : item.optionsCount;
    const nextCorrectOptionId = correctOptionId || item.correctOptionId;

    if (!LETTERS.slice(0, nextOptionsCount).includes(nextCorrectOptionId)) {
      return res.status(400).json({ message: "correctOptionId অপশন সংখ্যার মধ্যে হতে হবে।" });
    }

    item.optionsCount = nextOptionsCount;
    item.correctOptionId = nextCorrectOptionId;
    if (note_bn !== undefined) item.note_bn = note_bn || undefined;

    if (file) {
      if (item.imagePublicId) {
        await cloudinary.uploader.destroy(item.imagePublicId).catch(() => {});
      }
      item.imageUrl = file.path;
      item.imagePublicId = file.filename;
    }

    await quiz.save();
    res.json(quiz);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "আপডেট করা যায়নি।" });
  }
};

export const deleteImageQuizItem = async (req: Request, res: Response) => {
  try {
    const { slug, itemId } = req.params;
    const quiz = await ImageQuiz.findOne({ slug });
    if (!quiz) return res.status(404).json({ message: "কুইজ পাওয়া যায়নি।" });

    const item = quiz.items.find((it) => it.id === itemId);
    if (item?.imagePublicId) {
      await cloudinary.uploader.destroy(item.imagePublicId).catch(() => {});
    }

    quiz.items = quiz.items.filter((it) => it.id !== itemId) as any;
    await quiz.save();
    res.json(quiz);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "ডিলিট করা যায়নি।" });
  }
};

/* ==================================================================
   PUBLIC
   ================================================================== */

export const listPublishedImageQuizzes = async (_req: Request, res: Response) => {
  try {
    const quizzes = await ImageQuiz.find({ status: "published" }).select(
      "slug name coverImage price ageGroup"
    );
    res.json(quizzes);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "তালিকা লোড করা যায়নি।" });
  }
};

export const getImageQuizDetailsPublic = async (req: Request, res: Response) => {
  try {
    const quiz = await ImageQuiz.findOne({
      slug: req.params.slug,
      status: "published",
    }).select("slug name description coverImage price items");

    if (!quiz) return res.status(404).json({ message: "পাওয়া যায়নি।" });

    res.json({
      slug: quiz.slug,
      name: quiz.name,
      description: quiz.description,
      coverImage: quiz.coverImage,
      price: quiz.price,
      itemCount: quiz.items.length,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "তথ্য পাওয়া যায়নি।" });
  }
};

export const getImageQuizForTaking = async (req: Request, res: Response) => {
  try {
    const quiz = await ImageQuiz.findOne({ slug: req.params.slug, status: "published" });
    if (!quiz) return res.status(404).json({ message: "পাওয়া যায়নি।" });

    res.json({
      slug: quiz.slug,
      name: quiz.name,
      price: quiz.price,
      items: quiz.items.map((it) => ({
        id: it.id,
        imageUrl: it.imageUrl,
        optionsCount: it.optionsCount,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "লোড করা যায়নি।" });
  }
};

export const submitImageQuizResponse = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { answers, candidateInfo } = req.body;

    const quiz = await ImageQuiz.findOne({ slug, status: "published" });
    if (!quiz) return res.status(404).json({ message: "পাওয়া যায়নি।" });

    const details = quiz.items.map((it) => {
      const selected = answers?.[it.id];
      return {
        itemId: it.id,
        correctOptionId: it.correctOptionId,
        selected,
        isCorrect: selected === it.correctOptionId,
      };
    });

    const score = details.filter((d) => d.isCorrect).length;
    const total = quiz.items.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    const paymentStatus = quiz.price > 0 ? "pending" : "free";

    const response: any = await ImageQuizResponse.create({
      quizSlug: String(slug),
      answers,
      candidateInfo,
      computedResult: { score, total, percentage, details },
      paymentStatus,
      submittedAt: new Date(),
    } as any);

    res.status(201).json({
      responseId: response._id,
      paymentRequired: paymentStatus === "pending",
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "জমা দেওয়া যায়নি।" });
  }
};

export const getImageQuizResult = async (req: Request, res: Response) => {
  try {
    const response = await ImageQuizResponse.findById(req.params.responseId);
    if (!response) return res.status(404).json({ message: "পাওয়া যায়নি।" });

    if (response.paymentStatus === "pending") {
      return res.json({ paymentRequired: true, responseId: response._id });
    }

    const quiz = await ImageQuiz.findOne({ slug: response.quizSlug }).select("name items");

    const noteMap: Record<string, string | undefined> = {};
    quiz?.items.forEach((it) => (noteMap[it.id] = it.note_bn));

    res.json({
      paymentRequired: false,
      quizName: quiz?.name,
      candidateInfo: response.candidateInfo,
      result: {
        ...response.computedResult,
        details: response.computedResult?.details.map((d) => ({
          ...d,
          note_bn: noteMap[d.itemId],
        })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "রিপোর্ট পাওয়া যায়নি।" });
  }
};
