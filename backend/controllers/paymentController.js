import crypto from "crypto";
import razorpayInstance from "../config/razorpay.js";
import { Payment } from "../models/paymentModel.js";
import { User } from "../models/userModel.js";

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

        // 1. Look for the pre-existing allocation record created by the admin's bulk push
        let paymentRecord = await Payment.findOne({ month });

        // Fallback: if no record exists yet (e.g., student joined late), create a baseline record
        if (!paymentRecord) {
            paymentRecord = new Payment({
                userId,
                month,
                amount: Number(amount),
                status: "Pending"
            });
        }

        // 2. Generate the Razorpay transactional order parameters
        const options = {
            amount: Math.round(Number(amount) * 100), // Convert rupees to paise
            receipt: `receipt_fee_${Date.now()}`,
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        // 3. Update the existing record with the new order ID instead of saving duplicates
        paymentRecord.razorpayOrderId = razorpayOrder.id;
        paymentRecord.amount = Number(amount); // Keep amount synchronized
        paymentRecord.status = "Pending";
        await paymentRecord.save();

        // 4. Return matching destructured variables directly at the response root level
        return res.status(201).json({
            success: true,
            message: "Fee order initiated successfully",
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            razorpayKey: process.env.RAZORPAY_KEY_ID // Send key down securely from server configuration environment variables
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "initiateFeePayment: Internal Server Error."
        });
    }
};

// Add this to your paymentController.js file:

export const bulkInitializeFee = async (req, res) => {
    try {
        const { amount, sessionOrMonth } = req.body; // e.g., { amount: 25000, sessionOrMonth: "Semester-1 (July-Dec)" }

        if (!amount || !sessionOrMonth) {
            return res.status(400).json({
                success: false,
                message: "Amount and target allocation window are required fields."
            });
        }

        // 1. Fetch all registered user profiles with student authorization clearances
        const students = await User.find({ role: 'student' });

        console.log('students, ', students);

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No registered student accounts found to assign fees to."
            });
        }

        // 2. Map existing profiles directly over to write allocations
        const bulkData = students.map(student => ({
            userId: student._id,
            month: sessionOrMonth, // Storing semantic grouping string directly into your month parameter
            amount: Number(amount),
            currency: "INR",
            status: "Unpaid", 
            razorpayOrderId: "BULK_INITIATED_BY_ADMIN" // Distinguishes it from single checkout intents
        }));

        // 3. Clear older pending intents for this slot to prevent data corruption
        await Payment.deleteMany({ month: sessionOrMonth });

        // 4. Batch-insert records cleanly
        const records = await Payment.insertMany(bulkData);

        return res.status(201).json({
            success: true,
            message: `Successfully generated semester allocations of ₹${amount} for ${records.length} hostellers.`,
            count: records.length
        });
    } catch (error) {
        console.error("bulkInitializeFee error:", error);
        return res.status(500).json({
            success: false,
            message: "bulkInitializeFee: Internal Server Error."
        });
    }
};

// 2. CRYPTOGRAPHIC VERIFICATION OF PAYMENT SIGNATURES
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

        if (razorpay_signature === expectedSignature) {
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
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "verifyFeePayment: Internal Server Error."
        });
    }
};

// 3. STUDENT PERSONAL TRANSACTIONS LEDGER
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

export const setIndividualStudentFee = async (req, res) => {
    try {
        const { userId, amount, sessionOrMonth, status } = req.body;

        if (!userId || !amount || !sessionOrMonth || !status) {
            return res.status(400).json({
                success: false,
                message: "User ID, amount, session block, and target action status are required"
            });
        }

        // 🟢 FIXED: Converts incoming UI actions to exact matching Model Enum keys ('Paid' / 'Pending')
        const modelTargetStatus = status;

        const updatedPayment = await Payment.findOneAndUpdate(
            { userId, month: sessionOrMonth },
            {
                userId,
                month: sessionOrMonth,
                amount: Number(amount),
                status: modelTargetStatus,
                razorpayOrderId: modelTargetStatus === "Paid" ? "OFFLINE_MANUAL_CLEARANCE" : "MANUAL_PENDING_RESET"
            },
            { new: true, upsert: true }
        );

        return res.status(200).json({
            success: true,
            message: "Student payment ledger record updated independently!",
            payment: updatedPayment
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "setIndividualStudentFee: Internal Server Error."
        });
    }
};

// 3. ROSTER UTILITY: COMPILE FULL FINANCIAL LEDGER DICTIONARY MAP
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
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "getAllStudentPaymentStatuses: Internal Server Error."
        });
    }
};