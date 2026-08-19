import mongoose, { Document, Schema, Types } from "mongoose";

export type PaymentStatus = "free" | "pending" | "paid";

export interface IResponse extends Document {
  instrumentSlug: string;
  userId?: Types.ObjectId;
  answers: Record<string, any>;
  computedResult?: Record<string, any>;
  consentAck: boolean;
  consentVersion?: string;
  paymentStatus: PaymentStatus;
  submittedAt?: Date;
}

const responseSchema = new Schema<IResponse>(
  {
    instrumentSlug: {
      type: String,
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // আপনার existing User মডেলের সাথে লিংক
    },

    answers: {
      type: Schema.Types.Mixed,
      required: true,
    },

    computedResult: {
      type: Schema.Types.Mixed,
    },

    consentAck: {
      type: Boolean,
      default: false,
    },

    consentVersion: {
      type: String,
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
  {
    timestamps: true,
  }
);

responseSchema.index({ instrumentSlug: 1, userId: 1 });

const Response = mongoose.model<IResponse>("Response", responseSchema);

export default Response;