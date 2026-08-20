import { Post } from "../models/postModel.js";
import axios from "axios";

// A. CREATE NEW BLOG/SUGGESTION POST
export const createPost = async (req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.id; // Extracted from JWT payload via isAuthenticated

        if (!title || !content) {
            return res.status(400).json({ 
                success: false, 
                message: "Title and content strings are required fields." 
            });
        }

        const newPost = await Post.create({
            userId,
            title,
            content
        });

        // MICROSERVICE PATTERN: Fetch author details from User Microservice if needed
        let authorDetails = { _id: userId };
        try {
            const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:5001';
            const userRes = await axios.get(`${userServiceUrl}/api/v1/user/${userId}`);
            if (userRes.data?.user) {
                const { firstName, lastName, role, hostelName } = userRes.data.user;
                authorDetails = { _id: userId, firstName, lastName, role, hostelName };
            }
        } catch (err) {
            console.error("Failed to hydrate post author details:", err.message);
        }

        const postResponse = newPost.toObject();
        postResponse.userId = authorDetails;

        return res.status(201).json({
            success: true,
            message: "Suggestion board voucher deployed successfully!",
            post: postResponse
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// B. READ ALL DISCUSSIONS CHRONOLOGICALLY
export const getAllPosts = async (req, res) => {
    try {
        // Fetch raw posts without cross-service .populate()
        const posts = await Post.find({}).sort({ createdAt: -1 });

        return res.status(200).json({ 
            success: true, 
            count: posts.length, 
            posts 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// C. INTERACTIVE UPVOTE TOGGLE ACTION
export const toggleLikePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post data array record missing." });
        }

        const hasLiked = post.likes.includes(userId);
        let updatedPost;
        
        if (hasLiked) {
            // Undo like
            updatedPost = await Post.findByIdAndUpdate(
                postId, 
                { $pull: { likes: userId } },
                { new: true }
            );
        } else {
            // Upvote: Add to likes and remove from dislikes
            updatedPost = await Post.findByIdAndUpdate(
                postId, 
                { 
                    $addToSet: { likes: userId },
                    $pull: { dislikes: userId } 
                },
                { new: true }
            );
        }

        return res.status(200).json({ 
            success: true, 
            likes: updatedPost.likes, 
            dislikes: updatedPost.dislikes 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// D. INTERACTIVE DOWNVOTE TOGGLE ACTION
export const toggleDislikePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post token matrix mismatch." });
        }

        const hasDisliked = post.dislikes.includes(userId);
        let updatedPost;

        if (hasDisliked) {
            // Undo dislike
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $pull: { dislikes: userId } },
                { new: true }
            );
        } else {
            // Downvote: Add to dislikes and remove from likes
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                {
                    $addToSet: { dislikes: userId },
                    $pull: { likes: userId }
                },
                { new: true }
            );
        }

        return res.status(200).json({ 
            success: true, 
            likes: updatedPost.likes, 
            dislikes: updatedPost.dislikes 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// E. COMMENT ATTACHMENT HUB
export const addCommentToPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;
        const userId = req.id;

        if (!text || !text.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Comment string body content cannot be empty." 
            });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post reference point dropped." });
        }

        const commentPayload = { userId, text: text.trim() };
        post.comments.push(commentPayload);
        await post.save();

        const newCommentInstance = post.comments[post.comments.length - 1];

        return res.status(201).json({
            success: true,
            message: "Comment appended to board token ledger.",
            comment: newCommentInstance
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};