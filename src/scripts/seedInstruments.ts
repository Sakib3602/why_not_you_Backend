import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Instrument from "../models/instrument.model";



/**
 * রান করার কমান্ড (package.json-এ script যোগ করে):
 *   npx tsx src/scripts/seedInstruments.ts
 */

async function seed() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("Connected to MongoDB");

  const files = [
    { file: "cfi-bd.config.json", slug: "cfi-bd", scoringType: "vector_matching", price: 199 },
    { file: "fadss.config.json", slug: "fadss", scoringType: "sum_and_band", price: 149 },
  ];

  for (const f of files) {
    const filePath = path.join(__dirname, "..", "data", f.file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const fullJson = JSON.parse(raw);

    await Instrument.findOneAndUpdate(
      { instrumentSlug: f.slug },
      {
        instrumentSlug: f.slug,
        instrumentName: fullJson.instrumentName,
        scoringType: f.scoringType,
        version: fullJson.version || "1.0",
        price: f.price,
        isActive: true,
        data: fullJson,
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Seeded: ${f.slug}`);
  }

  await mongoose.disconnect();
  console.log("Done. Disconnected.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});