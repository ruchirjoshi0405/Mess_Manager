import axios from "axios";
import { Expense } from "../../../models/expenseModel.js";
import { Payment } from "../../../models/paymentModel.js";

// 1. LOG OPERATIONAL EXPENSE VOUCHER
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

// 2. FINANCIAL DASHBOARD ENGINE
export const getMessFinancials = async (req, res) => {
    try {
        // MICROSERVICE PATTERN: Fetch student count via HTTP call to User Microservice
        let totalStudents = 0;
        try {
            const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:5001';
            const userRes = await axios.get(`${userServiceUrl}/api/v1/user/allUsers`, {
                headers: { Authorization: req.headers.authorization }
            });
            totalStudents = userRes.data.users ? userRes.data.users.length : 0;
        } catch (err) {
            console.error("Error fetching student count from User Service:", err.message);
        }

        // Sum of successful student collections (Income In)
        const totalRevenueAggregate = await Payment.aggregate([
            { $match: { status: "Paid" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalIncome = totalRevenueAggregate[0]?.total || 0;

        // Sum of raw operational costs (Expenses Out)
        const totalExpenseAggregate = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: "$totalCost" } } }
        ]);
        const totalSpent = totalExpenseAggregate[0]?.total || 0;

        // Expense distribution by category
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
        console.error("getMessFinancials error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to compile system analytics balance maps."
        });
    }
};

// 3. FETCH ALL LOGGED EXPENSES
export const getAllExpenses = async (req, res) => {
    try {
        // MICROSERVICE PATTERN: Avoid Mongoose .populate() across service DB boundaries
        const expenses = await Expense.find({})
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