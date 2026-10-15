import { Request, Response } from "express";
import ResponseModel from "../models/response.model";
import Instrument from "../models/instrument.model";

/**
 * GET /api/admin/dashboard/stats
 * Overview stats for the Admin Dashboard
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalResponses = await ResponseModel.countDocuments();
    const paidCount = await ResponseModel.countDocuments({ paymentStatus: "paid" });
    const pendingCount = await ResponseModel.countDocuments({ paymentStatus: "pending" });
    const freeCount = await ResponseModel.countDocuments({ paymentStatus: "free" });

    const instruments = await Instrument.find({});
    
    // Total revenue calculation from paid responses
    const paidResponses = await ResponseModel.find({ paymentStatus: "paid" }, { instrumentSlug: 1 });
    const priceMap: Record<string, number> = {};
    instruments.forEach((inst) => {
      priceMap[inst.instrumentSlug] = inst.price || 0;
    });

    const totalRevenue = paidResponses.reduce((sum, r) => sum + (priceMap[r.instrumentSlug] || 0), 0);

    // Instrument breakdown
    const breakdownPromises = instruments.map(async (inst) => {
      const count = await ResponseModel.countDocuments({ instrumentSlug: inst.instrumentSlug });
      return {
        slug: inst.instrumentSlug,
        name: inst.instrumentName?.en || inst.instrumentName?.bn || inst.instrumentSlug,
        count,
        price: inst.price || 0,
        isActive: inst.isActive,
      };
    });
    const instrumentBreakdown = await Promise.all(breakdownPromises);

    // Recent 8 submissions
    const recentSubmissions = await ResponseModel.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return res.status(200).json({
      success: true,
      stats: {
        totalResponses,
        paidCount,
        pendingCount,
        freeCount,
        totalInstruments: instruments.length,
        totalRevenue,
      },
      instrumentBreakdown,
      recentSubmissions,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({ success: false, message: "Failed to load dashboard stats" });
  }
};

/**
 * GET /api/admin/dashboard/responses
 * Search, filter, and paginate through participant submissions
 */
export const getAdminResponses = async (req: Request, res: Response) => {
  try {
    const { slug, paymentStatus, search, page = "1", limit = "20" } = req.query;

    const query: Record<string, any> = {};

    if (slug && slug !== "all") {
      query.instrumentSlug = slug;
    }

    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { "personalInfo.name": regex },
        { "personalInfo.email": regex },
        { instrumentSlug: regex },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [responses, totalCount] = await Promise.all([
      ResponseModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ResponseModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      responses,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Admin responses error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch responses" });
  }
};

/**
 * GET /api/admin/dashboard/responses/:id
 * Retrieve full single participant response
 */
export const getAdminResponseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await ResponseModel.findById(id).lean();
    if (!response) {
      return res.status(404).json({ success: false, message: "Response not found" });
    }

    const instrument = await Instrument.findOne({ instrumentSlug: response.instrumentSlug }).lean();

    return res.status(200).json({
      success: true,
      response,
      instrument,
    });
  } catch (error) {
    console.error("Admin response detail error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch response details" });
  }
};

/**
 * PATCH /api/admin/dashboard/responses/:id/payment
 * Update payment status
 */
export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!["paid", "pending", "free"].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: "Invalid payment status" });
    }

    const updated = await ResponseModel.findByIdAndUpdate(
      id,
      { paymentStatus },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Response not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      response: updated,
    });
  } catch (error) {
    console.error("Update payment error:", error);
    return res.status(500).json({ success: false, message: "Failed to update payment status" });
  }
};

/**
 * GET /api/admin/dashboard/instruments
 * List all assessment instruments for admin view & control
 */
export const getAdminInstruments = async (req: Request, res: Response) => {
  try {
    const instruments = await Instrument.find({}).lean();
    
    const enriched = await Promise.all(
      instruments.map(async (inst: any) => {
        const submissionCount = await ResponseModel.countDocuments({ instrumentSlug: inst.instrumentSlug });
        
        // Dynamically compute real item count from instrument data
        let realItemCount = 0;
        if (Array.isArray(inst.data?.items)) {
          realItemCount = inst.data.items.length;
        } else if (inst.data?.items && typeof inst.data.items === "object") {
          // E.g. CFI-BD with item groups A, B, C, D, E
          Object.values(inst.data.items).forEach((val: any) => {
            if (Array.isArray(val)) realItemCount += val.length;
          });
        } else if (inst.data?.forms?.M?.items) {
          realItemCount = inst.data.forms.M.items.length;
        }

        // Real estimated minutes
        const estMin = inst.estimatedMinutes || [
          Math.max(5, Math.round(realItemCount * 0.35)),
          Math.max(10, Math.round(realItemCount * 0.55)),
        ];

        return {
          ...inst,
          itemCount: realItemCount,
          estimatedMinutes: estMin,
          submissionCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      instruments: enriched,
    });
  } catch (error) {
    console.error("Admin instruments error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch instruments" });
  }
};

/**
 * PATCH /api/admin/dashboard/instruments/:slug
 * Update price or toggle active status
 */
export const updateInstrumentAdmin = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { price, isActive } = req.body;

    const updateFields: Record<string, any> = {};
    if (price !== undefined) updateFields.price = Number(price);
    if (isActive !== undefined) updateFields.isActive = Boolean(isActive);

    const updated = await Instrument.findOneAndUpdate(
      { instrumentSlug: slug },
      updateFields,
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Instrument not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Instrument updated successfully",
      instrument: updated,
    });
  } catch (error) {
    console.error("Update instrument error:", error);
    return res.status(500).json({ success: false, message: "Failed to update instrument" });
  }
};
