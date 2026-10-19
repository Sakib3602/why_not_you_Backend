import mongoose, { Document, Schema } from "mongoose";



export type AmItemFormat = "likert_5" | "mcq_single_best";
export type AmForm = "A" | "B" | "C";

export interface AmOption {
  id: string;
  text_bn: string;
  text_en?: string;
}

export interface AmValidityRule {
  // raw response (1-5 likert হলে) এর ওপর প্রয়োগ হয়
  type: "fails_if_gte" | "fails_if_lte" | "fails_if_eq" | "fails_if_neq";
  value: number;
}

export interface AmItem {
  id: string; // unique, e.g. "COG-A-01"
  instrumentKey: string; // "cognitive" | "personality" | "ei" | "sjt" | "leadership" | "motivation" | "communication" | "honesty"
  form: AmForm;
  facet: string; // e.g. "SP", "NR", "DEP", "AST", "RES", "COM", "VAL"...
  format: AmItemFormat;
  text_bn: string;
  text_en?: string;
  reverse?: boolean; // শুধু likert_5 এর জন্য
  isValidityItem?: boolean;
  validityRule?: AmValidityRule;
  options?: AmOption[]; // mcq_single_best বা situational-judgment items এর জন্য আবশ্যক
  correctOptionId?: string; // mcq_single_best এর জন্য আবশ্যক — কুইজ কনফিগে কখনো ক্লায়েন্টে পাঠানো হবে না
}

export interface AmFacetMeta {
  key: string;
  name_bn: string;
  name_en?: string;
  itemsPerFacet: number;
}

export interface AmInstrumentMeta {
  key: string;
  name_bn: string;
  name_en?: string;
  format: AmItemFormat | "hybrid";
  facets: AmFacetMeta[];
  hasValidity: boolean;
  validityFacetKey?: string; // e.g. "VAL" — এই facet-এর item গুলো scoring-এ না গিয়ে validity check-এ যাবে
}

export interface AmDomain {
  key: string; // "D1".."D8"
  name_bn: string;
  name_en?: string;
  cluster: "capability" | "disposition" | "judgment_integrity";
  formula: { instrumentKey: string; facetKey: string }[]; // এই facet গুলোর scaled score গড় করে composite হবে
  inconclusiveIfValidityFailedOn?: string; // instrumentKey — সেই instrument-এর validity fail হলে এই ডোমেইন "Inconclusive"
}

export interface AmBand {
  rank: number;
  min: number;
  max: number;
  label_bn: string;
  label_en?: string;
}

const amBatterySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },

    name: { type: Schema.Types.Mixed, required: true }, // { bn, en }
    description: { type: Schema.Types.Mixed }, // { bn, en }
    coverImage: { type: String, default: "" },

    price: { type: Number, default: 0, min: 0 },

    // draft অবস্থায় থাকলে public-facing route-এ দেখা যাবে না, শুধু admin দেখবে
    status: { type: String, enum: ["draft", "published"], default: "draft" },

    version: { type: String, default: "1.0" },

    config: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export interface IAmBattery extends Document {
  slug: string;
  name: { bn: string; en?: string };
  description?: { bn: string; en?: string };
  coverImage?: string;
  price: number;
  status: "draft" | "published";
  version: string;
  config: {
    forms: AmForm[];
    instruments: AmInstrumentMeta[];
    domains: AmDomain[];
    items: AmItem[];
    bands: AmBand[];
    narrativeTemplates: Record<string, any>;
    convergenceCheck?: {
      instrumentA: { instrumentKey: string; facetKey: string };
      instrumentB: { instrumentKey: string; facetKey: string };
      maxBandDiff: number;
    };
    fitStatementRule?: {
      integrityDomainKey: string;
      judgmentDomainKey: string;
      downgradeIfBandEquals1: string[]; // domain keys
      thresholds: { wellSuited: number; suitedWithCoaching: number };
    };
    consent?: Record<string, any>;
    demographics?: any[];
  };
}

const AmBattery = mongoose.model<IAmBattery>("AmBattery", amBatterySchema);

export default AmBattery;