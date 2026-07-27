import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // The student making the payment
        required: true,
    },
    month: {
        type: String,
        required: true, // E.g., "January 2026" - helps track who paid for which month
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    status: {
        type: String,
        enum: ['Unpaid', 'Pending', 'Paid', 'Failed'],
        default: 'Pending',
    },
    razorpayOrderId: {
        type: String,
        required: true,
    },
    razorpayPaymentId: {
        type: String, // Filled after successful verification
        default: ""
    },
    razorpaySignature: {
        type: String, // Filled after successful verification
        default: ""
    }
}, { timestamps: true });

export const Payment = mongoose.model('Payment', paymentSchema);