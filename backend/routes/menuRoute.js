import express from 'express';
import { addMeal, deleteMeal, getMenu, getWeeklyMenuWithRatings, updateMeal } from '../controllers/menuController.js';
import { isAuthenticated, isAuthorized } from '../middleware/isAuthenticated.js';
import { multipleUpload } from '../middleware/multer.js';

const router = express.Router();

// Only admin and mess managers can populate or adjust the food schedule
router.post('/add', isAuthenticated, isAuthorized(['admin', 'mess_manager']), multipleUpload, addMeal);
router.delete('/delete/:mealId', isAuthenticated, isAuthorized(['admin', 'mess_manager']), deleteMeal);
router.put('/update/:mealId', isAuthenticated, isAuthorized(['admin', 'mess_manager']), multipleUpload, updateMeal);
router.get('/getWeeklyMenuWithRatings', isAuthenticated, getWeeklyMenuWithRatings);

// Everyone (including students) can fetch the current menu schedule
router.get('/getMenu', getMenu);

export default router;