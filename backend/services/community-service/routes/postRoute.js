import express from 'express';
import { isAuthenticated } from '../middleware/isAuthenticated.js';
import { 
    createPost, 
    getAllPosts, 
    toggleLikePost, 
    toggleDislikePost, 
    addCommentToPost 
} from '../controllers/postController.js';

const router = express.Router();

// ==================== COMMUNITY POST ROUTES ====================
router.post('/create', isAuthenticated, createPost);
router.get('/all', getAllPosts);
router.put('/:postId/like', isAuthenticated, toggleLikePost);
router.put('/:postId/dislike', isAuthenticated, toggleDislikePost);
router.post('/:postId/comment', isAuthenticated, addCommentToPost);

export default router;