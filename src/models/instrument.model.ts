import mongoose, { Document, Schema } from "mongoose";

export type ScoringType = "vector_matching" | "sum_and_band" | "domain_pomp_composite" | "domain_mean_average" | "mcrrs_triage";

export interface IInstrument extends Document {
  instrumentSlug: string;
  instrumentName: { bn: string; en?: string };
  description: { bn: string; en?: string };
  coverImage: string;
  scoringType: ScoringType;
  version: string;
  price: number;
  estimatedMinutes?: [number, number];
  itemCount?: number;
  isActive: boolean;
  data: Record<string, any>;
}

const instrumentSchema = new Schema<IInstrument>(
  {
    instrumentSlug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    instrumentName: {
      type: Schema.Types.Mixed,
      required: true,
    },

    description: {
      type: Schema.Types.Mixed,
      default: { bn: "" },
    },

    coverImage: {
      type: String,
      default: "",
    },

    scoringType: {
      type: String,
      enum: ["vector_matching", "sum_and_band", "domain_pomp_composite", "domain_mean_average", "mcrrs_triage"],
      required: true,
    },

    version: {
      type: String,
      default: "1.0",
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    estimatedMinutes: {
      type: [Number],
      default: undefined,
    },

    itemCount: {
      type: Number,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Instrument = mongoose.model<IInstrument>("Instrument", instrumentSchema);

export default Instrument;