import { Request, Response } from "express";

import Instrument from "../models/instrument.model";
import ResponseModel from "../models/response.model";
import { computeScore } from "../utils/scoring/Index";



export const submitResponse = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { answers, consentAck, consentVersion } = req.body;

    const instrument = await Instrument.findOne({
      instrumentSlug: slug,
      isActive: true,
    });

    if (!instrument) {
      return res.status(404).json({
        message: "Instrument not found",
      });
    }

    if (instrument.data.consent?.required && !consentAck) {
      return res.status(400).json({
        message: "Consent is required before submission",
      });
    }

    const computedResult = computeScore(instrument.scoringType, instrument.data, answers);

    // req.user আপনার auth middleware বসালে পাওয়া যাবে (JWT verify করে)।
    // এখনো middleware না বসালে userId undefined থাকবে — guest submission হিসেবে চলবে।
    const userId = (req as any).user?.userId;

    // TODO: পেমেন্ট গেটওয়ে বসানোর পর নিচের লাইনটা আবার আগের মতো করে দিন:
    // paymentStatus: instrument.price > 0 ? "pending" : "free",
    const response = await ResponseModel.create({
      instrumentSlug: slug,
      userId,
      answers,
      computedResult,
      consentAck: !!consentAck,
      consentVersion,
      paymentStatus: "free", // TEMP: পেমেন্ট বসানো পর্যন্ত সবসময় free ধরা হচ্ছে
      submittedAt: new Date(),
    });

    return res.status(201).json({
      message: "Submitted successfully",
      responseId: response._id,
      result: computedResult,
    });

    // TODO: পেমেন্ট গেটওয়ে বসানোর পর উপরের return বাদ দিয়ে নিচের কন্ডিশনাল লজিক আবার চালু করুন:
    //
    // if (response.paymentStatus === "free") {
    //   return res.status(201).json({
    //     message: "Submitted successfully",
    //     responseId: response._id,
    //     result: computedResult,
    //   });
    // }
    //
    // return res.status(201).json({
    //   message: "Submitted successfully, payment required to view result",
    //   responseId: response._id,
    //   paymentRequired: true,
    //   amount: instrument.price,
    // });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const response = await ResponseModel.findById(id);

    if (!response) {
      return res.status(404).json({
        message: "Response not found",
      });
    }

    if (response.paymentStatus === "pending") {
      return res.status(402).json({
        message: "Payment required",
        responseId: response._id,
      });
    }

    return res.status(200).json({
      result: response.computedResult,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};