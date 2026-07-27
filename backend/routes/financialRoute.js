import express from 'express';
import { initiateFeePayment, verifyFeePayment, getMyPaymentHistory, bulkInitializeFee, setIndividualStudentFee, getAllStudentPaymentStatuses } from '../controllers/paymentController.js';
import { logExpense, getMessFinancials, getAllExpenses } from '../controllers/expenseController.js';
import { isAuthenticated, isAuthorized } from '../middleware/isAuthenticated.js';

const router = express.Router();

// Student Razorpay Transactions
router.post('/fee/pay', isAuthenticated, initiateFeePayment);
router.post('/fee/bulkFee', isAuthenticated, bulkInitializeFee);
router.post('/fee/verify', isAuthenticated, verifyFeePayment);
router.get('/fee/history', isAuthenticated, getMyPaymentHistory);
router.post('/fee/individualAllocate', isAuthenticated, setIndividualStudentFee);
router.get('/fee/allStatuses', isAuthenticated, getAllStudentPaymentStatuses);

// Admin / Mess Manager Financial Ledger Trackers
router.post('/expense/log', isAuthenticated, isAuthorized(['admin', 'mess_manager']), logExpense);
router.get('/dashboard/analytics', isAuthenticated, isAuthorized(['admin', 'mess_manager', 'student']), getMessFinancials);
router.get('/expense/all', isAuthenticated, getAllExpenses);

export default router;