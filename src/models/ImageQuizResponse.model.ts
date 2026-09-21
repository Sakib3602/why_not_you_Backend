import mongoose, { Document, Schema } from "mongoose";

export type ImageQuizPaymentStatus = "free" | "pending" | "paid";

export interface ImageQuizResultDetail {
  itemId: string;
  correctOptionId: string;
  selected?: string;
  isCorrect: boolean;
}

export interface ImageQuizComputedResult {
  score: number;
  total: number;
  percentage: number;
  details: ImageQuizResultDetail[];
}

export interface IImageQuizResponse extends Document {
  quizSlug: string;
  answers: Record<string, string>; // itemId -> selected option letter
  candidateInfo?: Record<string, any>;
  computedResult?: ImageQuizComputedResult;
  paymentStatus: ImageQuizPaymentStatus;
  submittedAt?: Date;
}

const imageQuizResponseSchema = new Schema<IImageQuizResponse>(
  {
    quizSlug: {
      type: String,
      required: true,
    },

    answers: {
      type: Schema.Types.Mixed,
      required: true,
    },

    candidateInfo: {
      type: Schema.Types.Mixed,
    },

    computedResult: {
      type: Schema.Types.Mixed,
    },

    paymentStatus: {
      type: String,
      enum: ["free", "pending", "paid"],
      default: "pending",
    },

    submittedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

imageQuizResponseSchema.index({ quizSlug: 1 });

const ImageQuizResponse = mongoose.model<IImageQuizResponse>(
  "ImageQuizResponse",
  imageQuizResponseSchema
);

export default ImageQuizResponse;
