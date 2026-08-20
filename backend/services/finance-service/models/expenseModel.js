import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    supplierName: {
        type: String,
        required: true, 
        default: "Generic Vendor"
    },
    category: {
        type: String,
        required: true,
        // Aligned with the management categories
        enum: ['Groceries', 'Salaries', 'Utilities', 'Gas', 'Maintenance', 'Other'],
        default: 'Groceries'
    },
    items: [
        {
            itemName: {
                type: String, 
                required: true,
            },
            quantity: {
                type: Number, 
                required: true,
            },
            unit: {
                type: String, 
                required: true,
                default: "kg"
            }
        },
    ],
    totalCost: {
        type: Number,
        required: true, 
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'],
        default: 'Cash'
    },
    invoiceImg: {
        url: { type: String, default: "" }, 
        public_id: { type: String, default: "" }
    },
    expenseDate: {
        type: Date,
        required: true,
        default: Date.now 
    }
}, { timestamps: true });

export const Expense = mongoose.model('Expense', expenseSchema);