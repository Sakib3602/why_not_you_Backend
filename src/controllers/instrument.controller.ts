import { Request, Response } from "express";

import Instrument from "../models/instrument.model";


/**
 * GET /api/instruments
 * লিস্ট পেজের জন্য — শুধু card দেখানোর মতো হালকা ফিল্ড।
 * পুরো quiz config (items/occupations) এখানে পাঠানো হয় না।
 */
export const listInstruments = async (req: Request, res: Response) => {
  try {
    const instruments = await Instrument.find(
      { isActive: true },
      {
        instrumentSlug: 1,
        instrumentName: 1,
        coverImage: 1,
        price: 1,
      }
    );

    return res.status(200).json({
      instruments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

/**
 * GET /api/instruments/:slug/details
 * ডিটেইলস পেজের জন্য — টাইটেল, ছবি, দাম, বিবরণ, আনুমানিক সময়, প্রশ্ন সংখ্যা।
 * এখনো পুরো quiz config (items/occupations) পাঠানো হচ্ছে না — সেটা দরকার
 * শুধু "Buy Now" চাপার পর, যখন আসলে quiz শুরু হবে।
 */
export const getInstrumentDetails = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const instrument = await Instrument.findOne(
      { instrumentSlug: slug, isActive: true },
      {
        instrumentSlug: 1,
        instrumentName: 1,
        description: 1,
        coverImage: 1,
        price: 1,
        estimatedMinutes: 1,
        itemCount: 1,
        scoringType: 1,
      }
    );

    if (!instrument) {
      return res.status(404).json({
        message: "Instrument not found",
      });
    }

    return res.status(200).json({
      instrument,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

/**
 * GET /api/instruments/:slug/quiz
 * "Buy Now" চাপার পর quiz শুরু হওয়ার সময় এই endpoint কল হবে —
 * এখানেই পুরো config (items, occupations, bands...) যায়, কারণ প্রশ্ন রেন্ডার করতে এগুলো লাগবে।
 */
export const getQuizConfig = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const instrument = await Instrument.findOne({
      instrumentSlug: slug,
      isActive: true,
    });

    if (!instrument) {
      return res.status(404).json({
        message: "Instrument not found",
      });
    }

    return res.status(200).json({
      instrument,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* ================= ADMIN ================= */

export const createInstrument = async (req: Request, res: Response) => {
  try {
    const instrument = await Instrument.create(req.body);

    return res.status(201).json({
      message: "Instrument created successfully",
      instrument,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Invalid instrument data",
    });
  }
};

export const updateInstrument = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const updated = await Instrument.findOneAndUpdate(
      { instrumentSlug: slug },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Instrument not found",
      });
    }

    return res.status(200).json({
      message: "Instrument updated successfully",
      instrument: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const toggleInstrument = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const instrument = await Instrument.findOne({ instrumentSlug: slug });

    if (!instrument) {
      return res.status(404).json({
        message: "Instrument not found",
      });
    }

    instrument.isActive = !instrument.isActive;
    await instrument.save();

    return res.status(200).json({
      message: `Instrument is now ${instrument.isActive ? "active" : "inactive"}`,
      instrument,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};