import mongoose, { Document, Schema } from "mongoose";

export type ImageQuizStatus = "draft" | "published";

export interface ImageQuizItem {
  id: string; 
  imageUrl: string;
  imagePublicId?: string; 
  optionsCount: number; 
  correctOptionId: string;
  note_bn?: string; 
}

export type AgeGroup = "5-8" | "9-12" | "13-17" | "18-29" | "30+";

export interface IImageQuiz extends Document {
  slug: string;
  name: { bn: string; en?: string };
  description?: { bn: string; en?: string };
  coverImage?: string;
  price: number;
  status: ImageQuizStatus;
  ageGroup?: AgeGroup;
  items: ImageQuizItem[];
}

const imageQuizItemSchema = new Schema<ImageQuizItem>(
  {
    id: { type: String, required: true },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String },
    optionsCount: { type: Number, required: true, min: 2, max: 8 },
    correctOptionId: { type: String, required: true },
    note_bn: { type: String },
  },
  { _id: false }
);

const imageQuizSchema = new Schema<IImageQuiz>(
  {
    slug: { type: String, required: true, unique: true, trim: true },

    name: { type: Schema.Types.Mixed, required: true }, // { bn, en }
    description: { type: Schema.Types.Mixed }, // { bn, en }
    coverImage: { type: String, default: "" },

    price: { type: Number, default: 0, min: 0 },

    ageGroup: {
      type: String,
      default: null,
    },

    // draft অবস্থায় public route-এ দেখা যাবে না, শুধু admin দেখবে
    status: { type: String, enum: ["draft", "published"], default: "draft" },

    items: { type: [imageQuizItemSchema], default: [] },
  },
  { timestamps: true }
);

const ImageQuiz = mongoose.model<IImageQuiz>("ImageQuiz", imageQuizSchema);

export default ImageQuiz;
