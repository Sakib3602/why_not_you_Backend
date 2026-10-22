
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

import Instrument from "../models/instrument.model";

dotenv.config();

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const files = [
      {
        file: "cfi-bd.config.json",
        slug: "cfi-bd",
        scoringType: "vector_matching",
        price: 0,
      },
      {
        file: "Fadss.config.json",
        slug: "fadss",
        scoringType: "sum_and_band",
        price: 0,
      },
      {
        file: "pcs-bd.config.json",
        slug: "pcs-bd",
        scoringType: "domain_pomp_composite",
        price: 0,
      },
      {
        file: "rrs-24.config.json",
        slug: "rrs-24",
        scoringType: "domain_mean_average",
        price: 0,
      },
      {
        file: "mcrrs-bd.config.json",
        slug: "mcrrs-bd",
        scoringType: "mcrrs_triage",
        price: 0,
      },
    ];

    for (const f of files) {
      const filePath = path.resolve(
        __dirname,
        "..",
        "data",
        f.file
      );

      if (!fs.existsSync(filePath)) {
        throw new Error(`Config file not found: ${filePath}`);
      }

      const raw = fs.readFileSync(filePath, "utf-8");
      const fullJson = JSON.parse(raw);

      await Instrument.findOneAndUpdate(
        { instrumentSlug: f.slug },
        {
          $set: {
            instrumentSlug: f.slug,
            instrumentName: fullJson.instrumentName,
            scoringType: f.scoringType,
            version: fullJson.version || "1.0",
            price: f.price,
            isActive: true,
            data: fullJson,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
        }
      );

      console.log(`✅ Seeded: ${f.slug}`);
    }

    console.log("✅ All instruments seeded successfully.");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seed();
