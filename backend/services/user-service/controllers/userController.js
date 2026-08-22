import { User } from "../models/userModel.js";
import { Session } from "../models/sessionModel.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyEmail } from "../utils/verifyEmail.js";
import { sendOTPMail } from "../utils/sendOTPMail.js";
import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/dataUri.js";
import streamifier from 'streamifier';


export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, rollNumber, hostelName, roomNumber, phoneNo } = req.body;
        console.log(req.body);
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }
        console.log("Creating new user...");

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed successfully");
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            rollNumber: rollNumber || "",
            hostelName: hostelName || "",
            roomNumber: roomNumber || "",
            phoneNo: phoneNo || ""
        });
        console.log("New user created:", newUser);

        if (!newUser) {
            return res.status(500).json({
                success: false,
                message: "Error creating user"
            });
        }

        // Include role in registration token
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_SECRET1,
            { expiresIn: '10m' }
        );

        verifyEmail(token, email);
        newUser.token = token;
        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: newUser
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error in register controller"
        });
    }
};

export const verify = async (req, res) => {
    try {
        const user = await User.findById(req.id);
        user.isVerified = true;
        user.token = null;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const reVerify = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Include role in re-verification token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET1,
            { expiresIn: '10m' }
        );

        verifyEmail(token, email);
        user.token = token;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Verification email sent successfully",
            token: token
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials"
            });
        }

        if (existingUser.isVerified === false) {
            return res.status(400).json({
                success: false,
                message: "Verify your account then login"
            });
        }

        // CRITICAL UPDATE: Embedding role in both Access and Refresh Tokens
        const accessToken = jwt.sign(
            { id: existingUser._id, role: existingUser.role },
            process.env.JWT_SECRET1,
            { expiresIn: '10d' }
        );
        const refreshToken = jwt.sign(
            { id: existingUser._id, role: existingUser.role },
            process.env.JWT_SECRET2,
            { expiresIn: '30d' }
        );

        existingUser.isLoggedIn = true;
        await existingUser.save();

        const existingSession = await Session.findOne({ userId: existingUser._id });
        if (existingSession) {
            await Session.deleteOne({ userId: existingUser._id });
        }

        await Session.create({
            userId: existingUser._id
        });

        return res.status(200).json({
            success: true,
            message: "Welcome back " + existingUser.firstName,
            user: existingUser,
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server erro"
        });
    }
};

export const logout = async (req, res) => {
    try {
        const userId = req.id;
        await Session.deleteMany({ userId: userId });
        await User.findByIdAndUpdate(userId, { isLoggedIn: false });
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date().getTime() + 10 * 60 * 1000;
        user.otp = otp;
        user.otpExpiry = otpExpiry;

        await user.save();
        await sendOTPMail(otp, email);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const { email } = req.params;
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required"
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "OTP is not generated or already verified"
            });
        }

        if (user.otpExpiry < new Date().getTime()) {
            return res.status(400).json({
                success: false,
                message: "OTP is expired"
            });
        }
        if (otp !== user.otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is incorrect"
            });
        }
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const { email } = req.params;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are necessary"
            });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const allUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'student' }).select("-password -otp -otpExpiry -token");
        return res.status(200).json({
            success: true,
            message: "All users fetched successfully",
            users: users
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select("-password -otp -otpExpiry -token");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            user: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const userIDtoUpdate = req.params.id;
        const loggedInUser = req.user;

        const { firstName, lastName, phoneNo, address, city, zipcode, role } = req.body;

        if (loggedInUser._id.toString() !== userIDtoUpdate && loggedInUser.role !== "admin") {
            return res.status(401).json({
                success: false,
                message: "You are not authorized to update this profile"
            });
        }

        let user = await User.findById(userIDtoUpdate);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        let profilePicUrl = user.profilePic;
        let profilePicPublicId = user.profilePicPublicId;

        // Upload via streamifier
        if (req.file) {
            if (profilePicPublicId) {
                await cloudinary.uploader.destroy(profilePicPublicId);
            }

            const streamUpload = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "profiles" },
                        (error, result) => {
                            if (result) resolve(result);
                            else reject(error);
                        }
                    );
                    streamifier.createReadStream(fileBuffer).pipe(stream);
                });
            };

            try {
                const cloudResponse = await streamUpload(req.file.buffer);
                profilePicUrl = cloudResponse.secure_url;
                profilePicPublicId = cloudResponse.public_id;
            } catch (uploadErr) {
                console.error("Cloudinary Stream Error:", uploadErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload profile picture"
                });
            }
        }

        // Update fields
        user.firstName = firstName ?? user.firstName;
        user.lastName = lastName ?? user.lastName;
        user.phoneNo = phoneNo ?? user.phoneNo;
        user.address = address ?? user.address;
        user.city = city ?? user.city;
        user.zipcode = zipcode ?? user.zipcode;
        user.profilePic = profilePicUrl;
        user.profilePicPublicId = profilePicPublicId;

        if (role && loggedInUser.role === 'admin') {
            user.role = role;
        }

        const updatedUser = await user.save();
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: userResponse
        });
    } catch (error) {
        console.error("Update User Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const updateRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        user.role = role;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "User role updated successfully",
            user: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getUserCount = async (req, res) => {
    try {
        // Filter by role if admins/teachers share the same collection
        // const count = await User.countDocuments({ role: 'student' });
        const count = await User.countDocuments({ role: { $in: ['student', 'mess_manager'] }});
        console.log("count:", count);
        return res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error("getUserCount error:", error.message);
        return res.status(500).json({
            success: false,
            message: "getUserCount: Internal server error"
        });
    }
};