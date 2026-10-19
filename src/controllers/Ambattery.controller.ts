import { Request, Response } from "express";
import AmBattery, { AmForm } from "../models/Ambattery.model ";



const FORMS: AmForm[] = ["A", "B", "C"];

/* ================= PUBLIC ================= */

/**
 * GET /api/am-battery
 * লিস্ট পেজের জন্য হালকা তথ্য — শুধু published battery দেখাবে।
 */
export const listAmBatteries = async (req: Request, res: Response) => {
  try {
    const batteries = await AmBattery.find(
      { status: "published" },
      { slug: 1, name: 1, coverImage: 1, price: 1 }
    );
    return res.status(200).json({ batteries });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/am-battery/:slug/details
 * ডিটেইলস পেজ — item bank ছাড়া, শুধু নাম/দাম/বিবরণ/instrument তালিকা।
 */
export const getAmBatteryDetails = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const battery = await AmBattery.findOne(
      { slug, status: "published" },
      {
        slug: 1,
        name: 1,
        description: 1,
        coverImage: 1,
        price: 1,
        version: 1,
        "config.instruments": 1,
      }
    );
    if (!battery) return res.status(404).json({ message: "Battery not found" });
    return res.status(200).json({ battery });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/am-battery/:slug/quiz
 * "শুরু করুন" চাপার পর কল হবে — random form (A/B/C) assign করে সেই ফর্মের
 * প্রশ্নগুলো পাঠায়। correctOptionId ও validityRule কখনো client-এ পাঠানো হয় না।
 */
export const getAmBatteryQuizConfig = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const battery = await AmBattery.findOne({ slug, status: "published" });
    if (!battery) return res.status(404).json({ message: "Battery not found" });

    const allItems = battery.config.items || [];

    // যে ফর্মগুলোতে আসলেই কমপক্ষে ১টা প্রশ্ন আছে, শুধু সেগুলোর মধ্যে থেকেই random assign করি —
    // নাহলে অ্যাডমিন এখনো যেসব ফর্মে প্রশ্ন যোগ করেননি সেগুলো assign হয়ে গিয়ে খালি স্ক্রিন দেখাবে।
    const formsWithItems = FORMS.filter((f) => allItems.some((it: any) => it.form === f));

    if (formsWithItems.length === 0) {
      return res.status(400).json({
        message: "কোনো ফর্মেই এখনো প্রশ্ন যোগ করা হয়নি — অ্যাডমিন প্যানেল থেকে প্রশ্ন যোগ করুন।",
      });
    }

    const assignedForm = formsWithItems[Math.floor(Math.random() * formsWithItems.length)];

    const items = allItems
      .filter((it: any) => it.form === assignedForm)
      .map((it: any) => {
        const { correctOptionId, validityRule, ...safe } = it;
        return safe;
      });

    return res.status(200).json({
      slug: battery.slug,
      name: battery.name,
      version: battery.version,
      assignedForm,
      instruments: battery.config.instruments,
      items,
      consent: battery.config.consent || null,
      demographics: battery.config.demographics || [],
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= ADMIN ================= */

/**
 * GET /api/am-battery/admin
 * অ্যাডমিন প্যানেলের লিস্ট — draft + published সব দেখাবে।
 */
export const listAmBatteriesAdmin = async (req: Request, res: Response) => {
  try {
    const batteries = await AmBattery.find(
      {},
      { slug: 1, name: 1, price: 1, status: 1, version: 1, updatedAt: 1 }
    );
    return res.status(200).json({ batteries });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/am-battery/admin/:slug
 * অ্যাডমিন এডিটরে পুরো config সহ battery আনার জন্য।
 */
export const getAmBatteryAdmin = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const battery = await AmBattery.findOne({ slug });
    if (!battery) return res.status(404).json({ message: "Battery not found" });
    return res.status(200).json({ battery });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createAmBattery = async (req: Request, res: Response) => {
  try {
    const battery = await AmBattery.create(req.body);
    return res.status(201).json({ message: "Battery created", battery });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Invalid battery data" });
  }
};

export const updateAmBattery = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const updated = await AmBattery.findOneAndUpdate(
      { slug },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Battery not found" });
    return res.status(200).json({ message: "Battery updated", battery: updated });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/** PATCH /api/am-battery/admin/:slug/publish  body: { status: "draft" | "published" } */
export const setAmBatteryStatus = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { status } = req.body;
    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({ message: "status must be 'draft' or 'published'" });
    }
    const battery = await AmBattery.findOneAndUpdate(
      { slug },
      { $set: { status } },
      { new: true }
    );
    if (!battery) return res.status(404).json({ message: "Battery not found" });
    return res.status(200).json({ message: `Battery is now ${status}`, battery });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/** PATCH /api/am-battery/admin/:slug/price  body: { price: number } */
export const setAmBatteryPrice = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { price } = req.body;
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ message: "price must be a non-negative number" });
    }
    const battery = await AmBattery.findOneAndUpdate(
      { slug },
      { $set: { price } },
      { new: true }
    );
    if (!battery) return res.status(404).json({ message: "Battery not found" });
    return res.status(200).json({ message: "Price updated", battery });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteAmBattery = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const deleted = await AmBattery.findOneAndDelete({ slug });
    if (!deleted) return res.status(404).json({ message: "Battery not found" });
    return res.status(200).json({ message: "Battery deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===== Item-level admin helpers — একটা একটা প্রশ্ন add/edit/delete করার জন্য,
   পুরো config আবার resend করতে হবে না ===== */

/** POST /api/am-battery/admin/:slug/items  body: AmItem */
export const addAmBatteryItem = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const item = req.body;

    if (!item?.id || !item?.instrumentKey || !item?.form || !item?.facet || !item?.format) {
      return res.status(400).json({
        message: "id, instrumentKey, form, facet, format — এই ফিল্ডগুলো আবশ্যক",
      });
    }

    const battery = await AmBattery.findOne({ slug });
    if (!battery) return res.status(404).json({ message: "Battery not found" });

    battery.config.items = battery.config.items || [];
    const exists = battery.config.items.some((it: any) => it.id === item.id);
    if (exists) {
      return res.status(400).json({ message: `Item id "${item.id}" আগে থেকেই আছে` });
    }

    battery.config.items.push(item);
    battery.markModified("config");
    await battery.save();

    return res.status(201).json({ message: "Item added", item });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/** PUT /api/am-battery/admin/:slug/items/:itemId */
export const updateAmBatteryItem = async (req: Request, res: Response) => {
  try {
    const { slug, itemId } = req.params;
    const battery = await AmBattery.findOne({ slug });
    if (!battery) return res.status(404).json({ message: "Battery not found" });

    const items = battery.config.items || [];
    const idx = items.findIndex((it: any) => it.id === itemId);
    if (idx === -1) return res.status(404).json({ message: "Item not found" });

    items[idx] = { ...items[idx], ...req.body, id: itemId };
    battery.config.items = items;
    battery.markModified("config");
    await battery.save();

    return res.status(200).json({ message: "Item updated", item: items[idx] });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/** DELETE /api/am-battery/admin/:slug/items/:itemId */
export const deleteAmBatteryItem = async (req: Request, res: Response) => {
  try {
    const { slug, itemId } = req.params;
    const battery = await AmBattery.findOne({ slug });
    if (!battery) return res.status(404).json({ message: "Battery not found" });

    const items = battery.config.items || [];
    const filtered = items.filter((it: any) => it.id !== itemId);
    if (filtered.length === items.length) {
      return res.status(404).json({ message: "Item not found" });
    }

    battery.config.items = filtered;
    battery.markModified("config");
    await battery.save();

    return res.status(200).json({ message: "Item deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};