// src/models/Payment.ts
import { Schema, model, models } from "mongoose";

const PaymentSchema = new Schema(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount:    { type: Number, required: true },
    type:      {
      type: String,
      enum: [
        "premium_monthly",
        "premium_quarterly",
        "premium_annual",
        "premium_pro",
        "coins_500",
        "coins_1000",
        "quiz_pack",
      ],
      required: true,
    },
    /**
     * pending            — created, waiting for user action
     * waiting_verification — receipt uploaded, waiting admin review
     * processing         — atomic lock (QPay/KhanBank concurrent fulfillment guard)
     * success            — confirmed paid, premium activated
     * failed             — QPay/KhanBank verification failed
     * rejected           — admin rejected manual receipt
     */
    status: {
      type: String,
      enum: ["pending", "waiting_verification", "processing", "success", "failed", "rejected"],
      default: "pending",
      index: true,
    },
    method: {
      type: String,
      enum: ["qpay", "khan_bank", "bank_transfer"],
      required: true,
    },

    // ── QPay / KhanBank fields ────────────────────────────────
    invoiceId: { type: String },
    qrData:    { type: String },

    // ── Manual bank transfer fields ───────────────────────────
    /** Unique human-readable code shown to user, e.g. CP-A7K93X */
    paymentCode:  { type: String, unique: true, sparse: true, index: true },
    /** Cloudinary URL of the uploaded receipt image */
    receiptImage: { type: String },
    /** Admin who approved/rejected, for audit trail */
    reviewedBy:   { type: String },
    reviewedAt:   { type: Date },
    rejectedReason: { type: String },

    paidAt: { type: Date },
    note:   { type: String },
  },
  { timestamps: true }
);

export const Payment = models.Payment ?? model("Payment", PaymentSchema);
