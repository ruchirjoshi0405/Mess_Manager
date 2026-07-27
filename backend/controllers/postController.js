import { Post } from "../models/postModel.js";

// A. CREATE NEW BLOG/SUGGESTION POST
export const createPost = async (req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.id; // Pulled from isAuthenticated token hook

        if (!title || !content) {
            return res.status(400).json({ success: false, message: "Title and content strings are required fields." });
        }

        const newPost = await Post.create({
            userId,
            title,
            content
        });

        // Populate details before pushing down to UI array structures
        const populatedPost = await newPost.populate('userId', 'firstName lastName role hostelName');

        return res.status(201).json({
            success: true,
            message: "Suggestion board voucher deployed successfully!",
            post: populatedPost
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// B. READ ALL DISCUSSIONS CHRONOLOGICALLY
export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find({})
            .populate('userId', 'firstName lastName role hostelName')
            .populate('comments.userId', 'firstName lastName role hostelName')
            .sort({ createdAt: -1 }); // Newest suggestions flash at the top

        return res.status(200).json({ success: true, count: posts.length, posts });
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
        if (!post) return res.status(404).json({ success: false, message: "Post data array record missing." });

        const hasLiked = post.likes.includes(userId);
        
        if (hasLiked) {
            // Undo like
            post.likes = post.likes.filter(id => id.toString() !== userId);
        } else {
            // Upvote and wipe any conflicting downvotes
            post.likes.push(userId);
            post.dislikes = post.dislikes.filter(id => id.toString() !== userId);
        }

        await post.save();
        return res.status(200).json({ success: true, likes: post.likes, dislikes: post.dislikes });
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
        if (!post) return res.status(404).json({ success: false, message: "Post token matrix mismatch." });

        const hasDisliked = post.dislikes.includes(userId);

        if (hasDisliked) {
            // Undo dislike
            post.dislikes = post.dislikes.filter(id => id.toString() !== userId);
        } else {
            // Downvote and clear out existing upvotes
            post.dislikes.push(userId);
            post.likes = post.likes.filter(id => id.toString() !== userId);
        }

        await post.save();
        return res.status(200).json({ success: true, likes: post.likes, dislikes: post.dislikes });
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
            return res.status(400).json({ success: false, message: "Comment string body content cannot be empty." });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ success: false, message: "Post reference point dropped." });

        const commentPayload = { userId, text: text.trim() };
        post.comments.push(commentPayload);
        
        await post.save();

        // Pull full document reference to populate nested target objects right before returning
        const refreshedPost = await Post.findById(postId).populate('comments.userId', 'firstName lastName role hostelName');
        const newCommentInstance = refreshedPost.comments[refreshedPost.comments.length - 1];

        return res.status(201).json({
            success: true,
            message: "Comment appended to board token ledger.",
            comment: newCommentInstance
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};