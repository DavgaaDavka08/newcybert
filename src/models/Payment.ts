// src/models/Payment.ts
import { Schema, model, models } from "mongoose";

const PaymentSchema = new Schema(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount:    { type: Number, required: true },
    type:      {
      type: String,
      enum: ["premium_monthly", "premium_pro", "coins_500", "coins_1000", "quiz_pack"],
      required: true,
    },
    status:    { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    method:    { type: String, enum: ["qpay", "khan_bank"], required: true },
    invoiceId: { type: String },
    qrData:    { type: String },
    paidAt:    { type: Date },
    note:      { type: String },
  },
  { timestamps: true }
);

export const Payment = models.Payment ?? model("Payment", PaymentSchema);
