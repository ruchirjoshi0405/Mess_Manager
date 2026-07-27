import express from 'express';
import { 
    getAttendanceByDate, 
    updateMealStatus, 
    toggleDayLeave, 
    rateMealSlot,
    getHeadcount
} from '../controllers/attendanceController.js';
import { isAuthenticated, isAuthorized } from '../middleware/isAuthenticated.js';

const router = express.Router();

// 1. Fetch current preference records for a single calendar day (Student view)
router.get('/view', isAuthenticated, getAttendanceByDate);

// 2. Opt-in or Opt-out of an individual meal slot (Breakfast, Lunch, Snacks, Dinner)
router.put('/update-meal', isAuthenticated, updateMealStatus);

// 3. Batch toggle full-day leave (Flips all slots for that date at once)
router.put('/toggle-leave', isAuthenticated, toggleDayLeave);

// 4. Extract total cooking portions needed (Restricted exclusively to kitchen management)
router.get('/headcount', isAuthenticated, isAuthorized(['admin', 'mess_manager']), getHeadcount);

router.put('/rate-meal', isAuthenticated, rateMealSlot);

export default router;