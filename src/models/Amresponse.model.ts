import mongoose, { Document, Schema } from "mongoose";
import { AmForm } from "./Ambattery.model ";


export type AmPaymentStatus = "free" | "pending" | "paid";

export interface IAmResponse extends Document {
  batterySlug: string;
  assignedForm: AmForm;
  answers: Record<string, any>; // itemId -> raw response (likert value বা selected optionId)
  candidateInfo?: Record<string, any>; // name, applicantId, position, organisation, testDate ইত্যাদি
  computedResult?: Record<string, any>;
  consentAck: boolean;
  paymentStatus: AmPaymentStatus;
  submittedAt?: Date;
}

const amResponseSchema = new Schema<IAmResponse>(
  {
    batterySlug: {
      type: String,
      required: true,
    },

    assignedForm: {
      type: String,
      enum: ["A", "B", "C"],
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

    consentAck: {
      type: Boolean,
      default: false,
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

amResponseSchema.index({ batterySlug: 1 });

const AmResponse = mongoose.model<IAmResponse>("AmResponse", amResponseSchema);

export default AmResponse;