import { User } from "../models/userModel.js";
import jwt from 'jsonwebtoken';

export const isAuthenticated = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(400).json({
                "success": false,
                "message": "Authorization token is missing or invalid"
            });
        }
        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET1);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    "success": false,
                    "message": "Registration Token has expired"
                });
            } else {
                return res.status(400).json({
                    "success": false,
                    "message": "token verification failed"
                });
            }
        }
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(400).json({
                "success": false,
                "message": "User not found"
            });
        }
        req.user = user;
        req.id = user._id;
        next();
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "'isAuthenticated': Internal server error."
        });
    }
}

export const isAuthorized = (allowedRoles) => {
    return (req, res, next) => {
        if (req.user && allowedRoles.includes(req.user.role)) {
            next();
        } else {
            return res.status(403).json({
                "success": false,
                "message": `Access Denied: Required permissions missing.`
            });
        }
    };
};