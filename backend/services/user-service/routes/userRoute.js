import express from 'express';
import { 
    register, 
    verify, 
    reVerify, 
    login, 
    logout, 
    forgotPassword, 
    verifyOTP, 
    changePassword, 
    allUsers, 
    getUserById, 
    updateUser, 
    updateRole 
} from '../controllers/userController.js';
import { isAuthenticated, isAuthorized } from '../middleware/isAuthenticated.js';
import { singleUpload } from '../middleware/multer.js';

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/reVerify', reVerify);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.post('/verifyOTP/:email', verifyOTP);
router.post('/changePassword/:email', changePassword);
router.get('/getUser/:userId', getUserById);

// Protected Authentication & Verification Endpoints
router.post('/verify', isAuthenticated, verify);
router.post('/logout', isAuthenticated, logout);

// Profile & Role Management Endpoints
router.put('/update/:id', isAuthenticated, singleUpload, updateUser);
router.put('/update-role', isAuthenticated, updateRole);

// RBAC Protected Admin Endpoints
router.get('/allUsers', isAuthenticated, isAuthorized(['admin', 'mess_manager']), allUsers);

export default router;