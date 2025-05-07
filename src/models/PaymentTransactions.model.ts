import mongoose from "mongoose";

const PaymentTransactionsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    merchantId: { type: String, required: true },
    email: { type: String },
    terminalId: { type: String },
    merchantTranId: { type: String, required: true },
    success: { type: Boolean },
    TxnStatus: { type: String },
    response: { type: String },
    message: { type: String },
    paymentfor: { type: String },
    refId: { type: String },
    subMerchantId: { type: String },
    PayerMobile: { type: String },
    TxnCompletionDate: { type: String },
    PayerName: { type: String },
    PayerAmount: { type: String },
    PayerVA: { type: String },
    BankRRN: { type: String },
    PayerAccountType: { type: String },
    TxnInitDate: { type: String },
    paymentType: { type: String },
  },
  { timestamps: true }
);

export const PaymentTransactions = mongoose.model(
  "PaymentTransactions",
  PaymentTransactionsSchema
);