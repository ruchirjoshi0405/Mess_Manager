import express from 'express';
import { 
    initiateFeePayment, 
    verifyFeePayment, 
    getMyPaymentHistory, 
    bulkInitializeFee, 
    setIndividualStudentFee, 
    getAllStudentPaymentStatuses 
} from '../controllers/paymentController.js';
import { 
    logExpense, 
    getMessFinancials, 
    getAllExpenses 
} from '../controllers/expenseController.js';
import { isAuthenticated, isAuthorized } from '../middleware/isAuthenticated.js';

const router = express.Router();

// ==================== STUDENT RAZORPAY TRANSACTIONS ====================
router.post('/fee/pay', isAuthenticated, initiateFeePayment);
router.post('/fee/bulkFee', isAuthenticated, isAuthorized(['admin', 'mess_manager']), bulkInitializeFee);
router.post('/fee/verify', isAuthenticated, verifyFeePayment);
router.get('/fee/history', isAuthenticated, getMyPaymentHistory);
router.post('/fee/individualAllocate', isAuthenticated, isAuthorized(['admin', 'mess_manager']), setIndividualStudentFee);
router.get('/fee/allStatuses', isAuthenticated, isAuthorized(['admin', 'mess_manager']), getAllStudentPaymentStatuses);

// ==================== FINANCIAL LEDGER TRACKERS ====================
router.post('/expense/log', isAuthenticated, isAuthorized(['admin', 'mess_manager']), logExpense);
router.get('/dashboard/analytics', isAuthenticated, isAuthorized(['admin', 'mess_manager', 'student']), getMessFinancials);
router.get('/expense/all', isAuthenticated, isAuthorized(['admin', 'mess_manager']), getAllExpenses);

export default router;