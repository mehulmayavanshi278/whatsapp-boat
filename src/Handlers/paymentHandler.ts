import axios from "axios";
import User from "../models/User.model";
import { PaymentTransactions } from "../models/PaymentTransactions.model";

async function generateUPILink(
    phone_number: string,
    amount: number
): Promise<UPIResponse> {
    try {
        // const response = await axios.post(
        //   "https://api.whatsease.in/generate-paymentLink",
        //   { 
        //     phone_number,
        //     amount,
        //     paymentFor: "TWS",
        //   }
        // );

        const currency = "INR"; // Currency code (e.g., INR for Indian Rupee)

        // Your auth token (should be stored securely, not hardcoded)
        const AUTH_TOKEN = 'whatsease-payment-auth-123';

        const response = await axios.post(
            'https://payment-v2.whatsease.in/generate-paymentLink',
            {
                phone_number,
                amount,
                currency,
                paymentFor: "CII",
            },
            {
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );


        // Save transaction to database
        const newTransaction = new PaymentTransactions({
            merchantId: process.env.MERCHANT_ID || "DEFAULT_MERCHANT",
            merchantTranId: response.data.bank_rrn,// Use bank_rrn as transaction ID
            success: false, // Initially false, will be updated on webhook callback
            TxnStatus: "PENDING",
            PayerMobile: phone_number,
            payment_for: "CII",
            PayerAmount: amount.toString(),
            TxnInitDate: new Date().toISOString(),
            paymentType: "UPI",
        });

        await newTransaction.save();
        console.log(
            `Transaction saved to database with ID: ${response.data.bank_rrn}`
        );

        await User.findOneAndUpdate(
            { phone_number: phone_number },
            {
                $set: {
                    paymentStatus: "PENDING",
                    paymentType: "GPAY"
                }
            },
            { new: true }
        );


        const data = response.data;

        console.log(data, "data from upi link");
        if (data && data.bank_rrn && data.upi_link) {
            return {
                success: true,
                ref_id: data.bank_rrn,
                upiLink: data.upi_link,
            };
        } else {
            return {
                success: false,
                error: "Invalid API response format",
            };
        }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        console.log("Failed to generate UPI link", { error });
        return {
            success: false,
            error: errorMessage,
        };
    }
}
