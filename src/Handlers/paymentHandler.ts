import axios from "axios";
import User from "../models/User.model";
import { PaymentTransactions } from "../models/PaymentTransactions.model";
import nodemailer from "nodemailer";



interface tripDetails {
    name: string;
    email: string;
    onBoardThrough: string;
    totalAmount: number;
    phone_number: string;
}

interface UPIResponse {
    success: boolean;
    ref_id?: string;
    upiLink?: string;
    error?: string;
}


const url = `https://backend.aisensy.com/direct-apis/t1/messages`;
const ADMIN_EMAIL = "mehulmayavanshi953@gmail.com";

export async function generateUPILink(
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
                    paymentType: "GPAY",
                    merchantTranId: response.data.bank_rrn,
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


const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
    },
});

// Send confirmation emails to student and admin
async function sendConfirmationEmails(
    tripData: tripDetails,
): Promise<void> {
    try {
        const currentDate = new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        // Student email with course registration confirmation
        const studentMailOptions: any = {
            from: process.env.SMTP_USER,
            to: tripData.email,
            subject: `Your Trip Registration is Confirmed!`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Your Trip Registration is Confirmed for ${tripData.onBoardThrough}!</h2>
            <p>Hello ${tripData.name},</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Start Date:</strong> ${currentDate}</p>
              <p><strong>Amount Paid:</strong> ₹${tripData.totalAmount}</p>
            </div>

            
            <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
            
            <p style="margin-top: 30px;">Best regards,<br>The WhatsEase Team</p>
          </div>
        `,
        };

        // Add attachment if PDF URL is provided


        // Admin notification email
        const adminMailOptions = {
            from: process.env.SMTP_USER,
            to: ADMIN_EMAIL,
            subject: `New Trip Registration:`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Booking Confirmed</h2>
            <p>A new user has purchased for a trip:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Student Name:</strong> ${tripData.name}</p>
              <p><strong>Student Email:</strong> ${tripData.email}</p>
              <p><strong>Phone:</strong> ${tripData.phone_number}</p>
              <p><strong>Date:</strong> ${currentDate}</p>
              <p><strong>Amount:</strong> ₹${tripData.totalAmount}</p>
            </div>
          </div>
        `,
        };

        // Send emails in parallel
        const [studentResult, adminResult] = await Promise.all([
            transporter.sendMail(studentMailOptions),
            transporter.sendMail(adminMailOptions),
        ]);

        console.log(
            `Registration email sent to ${tripData.email}: ${studentResult.messageId}`
        );
        console.log(`Admin notification sent: ${adminResult.messageId}`);

        // Send a WhatsApp confirmation message
    }
    catch (error) {
        console.error("Error sending confirmation emails:", error);
        throw error;
    }
}

export async function handleBookingConfirm(jsonResult: any) {
    try {
        const merchantTranId = jsonResult.merchantTranId;
        const amount = jsonResult.PayerAmount;

        let success = false;
        const TxnStatus = jsonResult.TxnStatus;
        const subMerchantId = jsonResult.subMerchantId;
        const TxnCompletionDate = jsonResult.TxnCompletionDate;
        const PayerName = jsonResult.PayerName;
        const PayerVA = jsonResult.PayerVA;
        const BankRRN = jsonResult.BankRRN;
        const PayerAccountType = jsonResult.PayerAccountType;
        const TxnInitDate = jsonResult.TxnInitDate;

        if (jsonResult.TxnStatus === "SUCCESS") {
            success = true;
        }

        const transactions = await PaymentTransactions.findOne({
            merchantTranId: merchantTranId,
        });

        if (!transactions) {
            throw new Error("Transaction not found");
        }

        transactions.success = success || false;
        transactions.merchantId = jsonResult.merchantId || "DEFAULT_MERCHANT";
        transactions.TxnStatus = TxnStatus || "UNKNOWN";
        transactions.response = jsonResult.response || "";
        transactions.subMerchantId = subMerchantId || "";
        transactions.PayerName = PayerName || "";
        transactions.TxnCompletionDate = TxnCompletionDate || new Date().toISOString();
        transactions.BankRRN = BankRRN || "";
        transactions.PayerAccountType = PayerAccountType || "";
        transactions.PayerVA = PayerVA || "";
        transactions.TxnInitDate = TxnInitDate || new Date().toISOString();
        transactions.merchantTranId = merchantTranId || "";

        transactions.save();

        const usrData = await User.findOne({ merchantTranId: merchantTranId });
        const email = usrData?.email;

        if (!usrData) {
            throw new Error("User data not found");
        }

        const phoneNo = usrData.number;
        const userName = usrData.name;
        const onBoardThrough = usrData.onBoardThrough || "WhatsApp";

        if (transactions.TxnStatus === "SUCCESS") {
            usrData.paymentStatus = "success";
        }
        else {
            usrData.paymentStatus = "failed";
        }

        usrData.save();

        const tripData: tripDetails = {
            name: userName,
            email: email || "",
            onBoardThrough: onBoardThrough,
            totalAmount: amount,
            phone_number: phoneNo || '',
        };

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNo,
            type: "interactive",
            interactive: {
                type: "button",
                header: {
                    type: "text",
                    text: "✅ Payment Confirmation",
                },
                body: {
                    text: `Dear ${userName || "Attendee"},\n\nYour payment of ₹${amount} has been successfully processed.\n\n*Transaction Details:*\n• Reference ID: ${BankRRN || merchantTranId}\n• Date: ${new Date().toLocaleDateString()}\n• Status: Confirmed\n\nThank you for booking!`,
                },
                footer: {
                    text: "Powered by WhatsEase",
                },
                action: {
                    buttons: [
                        {
                            type: "reply",
                            reply: {
                                id: "feedback_excellent",
                                title: "Excellent!",
                            },
                        },
                        {
                            type: "reply",
                            reply: {
                                id: "feedback_good",
                                title: "Good ",
                            },
                        },
                        {
                            type: "reply",
                            reply: {
                                id: "feedback_needsimprovement",
                                title: "Needs Improvement",
                            },
                        },
                    ],
                },
            },
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed to send message: ${await response.text()}`);
        }

        await sendConfirmationEmails(tripData);
    }
    catch (error) {
        console.error("Error handling course purchase:", error);
        throw error;
    }
}