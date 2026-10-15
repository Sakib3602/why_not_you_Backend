import { Request, Response } from "express";
import AmBattery from "../models/Ambattery.model ";
import { computeAmBatteryScore } from "../utils/scoring/Ambatteryscoring";
import AmResponse from "../models/Amresponse.model";



export const submitAmResponse = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { assignedForm, answers, candidateInfo, consentAck } = req.body;

    if (!assignedForm || !answers) {
      return res.status(400).json({ message: "assignedForm ও answers আবশ্যক" });
    }

    const battery = await AmBattery.findOne({ slug, status: "published" });
    if (!battery) return res.status(404).json({ message: "Battery not found" });

    if (battery.config.consent?.required && !consentAck) {
      return res.status(400).json({ message: "Consent is required before submission" });
    }

    const computedResult = computeAmBatteryScore(battery.config, answers, assignedForm);

    const response: any = await AmResponse.create({
      batterySlug: String(slug),
      assignedForm,
      answers,
      candidateInfo,
      computedResult,
      consentAck: !!consentAck,
      paymentStatus: battery.price > 0 ? "pending" : "free",
      submittedAt: new Date(),
    } as any);

    if (response.paymentStatus === "free") {
      return res.status(201).json({
        message: "Submitted successfully",
        responseId: response._id,
        result: computedResult,
      });
    }

    return res.status(201).json({
      message: "Submitted successfully, payment required to view result",
      responseId: response._id,
      paymentRequired: true,
      amount: battery.price,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/am-battery/response/:id
 */
export const getAmResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const response = await AmResponse.findById(id);
    if (!response) return res.status(404).json({ message: "Response not found" });

    if (response.paymentStatus === "pending") {
      return res.status(402).json({
        message: "Payment required",
        responseId: response._id,
      });
    }

    return res.status(200).json({
      result: response.computedResult,
      candidateInfo: response.candidateInfo,
      assignedForm: response.assignedForm,
      batterySlug: response.batterySlug,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};