import express from 'express';
import { register, verify, reVerify, login, logout, forgotPassword, verifyOTP, changePassword, allUsers, getUserById, updateUser, updateRole } from '../controllers/userController.js';
import { isAuthenticated, isAuthorized } from '../middleware/isAuthenticated.js'; // Swapped isAdmin for a flexible role-check helper
import { singleUpload } from '../middleware/multer.js';

const router = express.Router();

router.post('/register', register)
router.post('/verify', isAuthenticated, verify)
router.post('/reVerify', reVerify)
router.post('/login', login)
router.post('/logout', isAuthenticated, logout)
router.post('/forgotPassword', forgotPassword)
router.post('/verifyOTP/:email', verifyOTP)
router.post('/changePassword/:email', changePassword)
router.get('/allUsers', isAuthenticated, isAuthorized(['admin', 'mess_manager']), allUsers)
router.get('/getUser/:userId', getUserById)
router.put('/update-user/:id', isAuthenticated, singleUpload, updateUser)
router.put('/update-role', isAuthenticated, updateRole)

export default router;