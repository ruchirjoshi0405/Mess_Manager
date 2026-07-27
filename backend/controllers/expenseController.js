import { Expense } from "../models/expenseModel.js";
import { Payment } from "../models/paymentModel.js";
import { User } from "../models/userModel.js";

export const logExpense = async (req, res) => {
    try {
        const { supplierName, category, items, totalCost, paymentMethod, expenseDate } = req.body;
        const userId = req.id;

        if (!supplierName || !totalCost) {
            return res.status(400).json({
                success: false,
                message: "Supplier name and total cost details are required"
            });
        }

        // Parse items if they come in as a stringified JSON array from multi-part forms
        const cleanItems = typeof items === 'string' ? JSON.parse(items) : items;

        const newExpense = await Expense.create({
            userId,
            supplierName,
            category,
            items: cleanItems || [],
            totalCost: Number(totalCost),
            paymentMethod,
            expenseDate: expenseDate || new Date()
        });

        return res.status(201).json({
            success: true,
            message: "Expense voucher logged successfully",
            expense: newExpense
        });
    } catch (error) {
        console.error("logExpense error:", error);
        return res.status(500).json({
            success: false,
            message: error.message + ". logExpense: Internal server error."
        });
    }
};

// 2. FINANCIAL DASHBOARD ENGINE (Replaces getSalesData)
export const getMessFinancials = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: "student" });
        
        // Dynamic pipeline computing sum of successful student collections (Income In)
        const totalRevenueAggregate = await Payment.aggregate([
            { $match: { status: "Paid" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalIncome = totalRevenueAggregate[0]?.total || 0;

        // Dynamic pipeline computing sum of raw operational costs (Expenses Out)
        const totalExpenseAggregate = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: "$totalCost" } } }
        ]);
        const totalSpent = totalExpenseAggregate[0]?.total || 0;

        // Group expenses by category for frontend distribution tracking charts
        const structuralBreakdown = await Expense.aggregate([
            { $group: { _id: "$category", totalAllocated: { $sum: "$totalCost" } } }
        ]);

        return res.status(200).json({
            success: true,
            metrics: {
                totalRegisteredStudents: totalStudents,
                totalCollectionsFees: totalIncome,
                totalSpentOperations: totalSpent,
                netReserveBalance: totalIncome - totalSpent
            },
            breakdownByCategory: structuralBreakdown
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to compile system analytics balance maps."
        });
    }
};

export const getAllExpenses = async (req, res) => {
    try {
        // Fetch all recorded expense entries, sorting by execution date descending
        const expenses = await Expense.find({})
            .populate('userId', 'firstName lastName email') // Identify which manager logged it
            .sort({ expenseDate: -1 });

        return res.status(200).json({
            success: true,
            count: expenses.length,
            expenses
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message + ". getAllExpenses: Internal Server Error."
        });
    }
};