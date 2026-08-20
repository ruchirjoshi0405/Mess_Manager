import crypto from "crypto";
import axios from "axios";
import razorpayInstance from "../../../config/razorpay.js";
import { Payment } from "../../../models/paymentModel.js";

// 1. INITIALIZE RAZORPAY TRANSACTION FOR MESS FEES
export const initiateFeePayment = async (req, res) => {
    try {
        const { amount, month } = req.body;
        const userId = req.id;

        if (!amount || !month) {
            return res.status(400).json({
                success: false,
                message: "Amount and target billing month are required parameters."
            });
        }

        let paymentRecord = await Payment.findOne({ month, userId });

        if (!paymentRecord) {
            paymentRecord = new Payment({
                userId,
                month,
                amount: Number(amount),
                status: "Pending"
            });
        }

        const options = {
            amount: Math.round(Number(amount) * 100),
            receipt: `receipt_fee_${Date.now()}`,
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        paymentRecord.razorpayOrderId = razorpayOrder.id;
        paymentRecord.amount = Number(amount);
        paymentRecord.status = "Pending";
        await paymentRecord.save();

        return res.status(201).json({
            success: true,
            message: "Fee order initiated successfully",
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            razorpayKey: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error("initiateFeePayment error:", error);
        return res.status(500).json({
            success: false,
            message: "initiateFeePayment: Internal Server Error."
        });
    }
};

// 2. BULK INITIALIZE FEE (MICROSERVICE INTER-SERVICE CALL)
export const bulkInitializeFee = async (req, res) => {
    try {
        const { amount, sessionOrMonth } = req.body;

        if (!amount || !sessionOrMonth) {
            return res.status(400).json({
                success: false,
                message: "Amount and target allocation window are required fields."
            });
        }

        // =========================================================================
        // MICROSERVICE PATTERN: Inter-Service HTTP Call
        // Fetch student accounts from User Microservice instead of direct DB query
        // =========================================================================
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:5001';
        const userRes = await axios.get(`${userServiceUrl}/api/v1/user/allUsers`, {
            headers: { Authorization: req.headers.authorization } // Pass incoming JWT
        });

        const students = userRes.data.users || [];

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No registered student accounts found to assign fees to."
            });
        }

        const bulkData = students.map(student => ({
            userId: student._id,
            month: sessionOrMonth,
            amount: Number(amount),
            currency: "INR",
            status: "Unpaid",
            razorpayOrderId: "BULK_INITIATED_BY_ADMIN"
        }));

        await Payment.deleteMany({ month: sessionOrMonth });
        const records = await Payment.insertMany(bulkData);

        return res.status(201).json({
            success: true,
            message: `Successfully generated semester allocations of ₹${amount} for ${records.length} hostellers.`,
            count: records.length
        });
    } catch (error) {
        console.error("bulkInitializeFee error:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "bulkInitializeFee: Internal Server Error."
        });
    }
};

// 3. CRYPTOGRAPHIC VERIFICATION OF PAYMENT SIGNATURES
export const verifyFeePayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentFailed } = req.body;

        if (paymentFailed) {
            await Payment.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: "Failed" }
            );
            return res.status(200).json({
                success: false,
                message: "Payment failed or cancelled by user"
            });
        }

        const secretKey = process.env.RAZORPAY_SECRET_KEY;
        if (!secretKey) {
            await Payment.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: "Failed" }
            );
            return res.status(500).json({ success: false, message: "Server gateway configuration missing." });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", secretKey)
            .update(sign.toString())
            .digest("hex");

        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const receivedBuffer = Buffer.from(razorpay_signature, 'hex');

        let isAuthentic = false;
        if (expectedBuffer.length === receivedBuffer.length) {
            isAuthentic = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
        }

        if (isAuthentic) {
            const paymentRecord = await Payment.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                {
                    status: "Paid",
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                },
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: "Fee payment processed and verified successfully",
                payment: paymentRecord
            });
        } else {
            await Payment.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: "Failed" }
            );

            return res.status(400).json({
                success: false,
                message: "Security verification failed: Invalid Signature"
            });
        }
    } catch (error) {
        console.error("verifyFeePayment error:", error);
        return res.status(500).json({
            success: false,
            message: "verifyFeePayment: Internal Server Error."
        });
    }
};

// 4. STUDENT PERSONAL TRANSACTIONS LEDGER
export const getMyPaymentHistory = async (req, res) => {
    try {
        const userId = req.id;
        const history = await Payment.find({ userId })
            .select("userId amount month razorpayOrderId razorpayPaymentId razorpaySignature status")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: history.length,
            history
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });
    }
};

// 5. INDIVIDUAL STUDENT MANUAL ALLOCATION
export const setIndividualStudentFee = async (req, res) => {
    try {
        const { userId, amount, sessionOrMonth, status } = req.body;

        if (!userId || !amount || !sessionOrMonth || !status) {
            return res.status(400).json({
                success: false,
                message: "User ID, amount, session block, and target action status are required"
            });
        }

        const updatedPayment = await Payment.findOneAndUpdate(
            { userId, month: sessionOrMonth },
            {
                userId,
                month: sessionOrMonth,
                amount: Number(amount),
                status: status,
                razorpayOrderId: status === "Paid" ? "OFFLINE_MANUAL_CLEARANCE" : "MANUAL_PENDING_RESET"
            },
            { new: true, upsert: true }
        );

        return res.status(200).json({
            success: true,
            message: "Student payment ledger record updated independently!",
            payment: updatedPayment
        });
    } catch (error) {
        console.error("setIndividualStudentFee error:", error);
        return res.status(500).json({
            success: false,
            message: "setIndividualStudentFee: Internal Server Error."
        });
    }
};

// 6. ROSTER UTILITY: FULL LEDGER FETCH
export const getAllStudentPaymentStatuses = async (req, res) => {
    try {
        const { sessionOrMonth } = req.query;

        if (!sessionOrMonth) {
            return res.status(400).json({
                success: false,
                message: "Session query identifier parameter is required"
            });
        }

        const payments = await Payment.find({ month: sessionOrMonth });

        return res.status(200).json({
            success: true,
            payments
        });
    } catch (error) {
        console.error("getAllStudentPaymentStatuses error:", error);
        return res.status(500).json({
            success: false,
            message: "getAllStudentPaymentStatuses: Internal Server Error."
        });
    }
};