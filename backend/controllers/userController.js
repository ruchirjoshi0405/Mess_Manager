import { User } from "../models/userModel.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyEmail } from "../emailVerify/verifyEmail.js";
import { sendOTPMail } from "../emailVerify/sendOTPMail.js";
import { Session } from "../models/sessionModel.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
    try {
        // Updated to include hostel details instead of retail addresses
        const { firstName, lastName, email, password, rollNumber, hostelName, roomNumber, phoneNo } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                "success": false,
                "message": "All fields are required"
            });
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ // Added return here to prevent executing further on match
                "success": false,
                "message": "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);
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
        if(!newUser) {
            console.log("newUser is null");
            return res.status(500).json({
                "success": false,
                "message": " error"
            });
        }
        console.log(newUser);
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET1, { expiresIn: '10m' });
        verifyEmail(token, email); 
        newUser.token = token;
        await newUser.save();
        
        return res.status(201).json({
            "success": true,
            "message": "User registered successfully",
            "user": newUser
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error in register controller"
        });
    }
}

export const verify = async (req, res) => {
    try {
        const user = await User.findById(req.id);
        user.isVerified = true;
        user.token = null;
        await user.save();
        return res.status(200).json({
            "success": true,
            "message": "Email verified successfully"
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

export const reVerify = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                "success": false,
                "message": "User not found"
            });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET1, { expiresIn: '10m' });
        verifyEmail(token, email); 
        user.token = token;
        await user.save();
        return res.status(200).json({
            "success": true,
            "message": "Verification email sent successfully",
            token: token
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                "success": false,
                "message": "All fields are required"
            });
        }
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User doesnt exist"
            });
        }
        
        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password)
        if(!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials"
            })
        }
  
        if(existingUser.isVerified === false) {
            return res.status(400).json({
                status: false,
                message: "Verify your account then login"
            })
        }

        const accessToken = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET1, { expiresIn: '10d' });
        const refreshToken = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET2, { expiresIn: '30d' });
        existingUser.isLoggedIn = true
        await existingUser.save();
        
        const existingSession = await Session.findOne({ userId: existingUser._id });
        if (existingSession) {
            console.log("Existing Session Found. Deleting old session. Creating new.");
            await Session.deleteOne({ userId: existingUser._id });
        }
        
        await Session.create({
            userId: existingUser._id
        });
        console.log(accessToken);
        return res.status(200).json({
            success: true,
            message: "Welcome back " + existingUser.firstName,
            user: existingUser,
            accessToken: accessToken,
            refreshToken: refreshToken
        })
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

export const logout = async (req, res) => {
    try {
        const userId = req.id;
        await Session.deleteMany({ userId: userId });
        await User.findByIdAndUpdate(userId, { isLoggedIn: false });
        return res.status(200).json({
            "success": true,
            "message": "Logged out successfully"
        });
    }
    catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const {email} = req.body;
        const user = await User.findOne({email});
        if(!user) {
            return res.status(404).json({
                "success": false,
                "message": "User not found"
            });
        } 
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date().getTime() + 10*60*1000;
        user.otp = otp;
        user.otpExpiry = otpExpiry;

        await user.save();
        await sendOTPMail(otp, email);
        console.log(otp);
        return res.status(200).json({
            "success": true,
            "message": "OTP sent successfully"
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

export const verifyOTP = async (req, res) => {
    try {
        const {otp} = req.body;
        const {email} = req.params;
        if(!otp) {
            return res.status(400).json({
                "success": false,
                "message": "OTP is required"
            });
        }
        console.log(req.params)
        const user = await User.findOne({email});
        if(!user) {
            return res.status(404).json({
                "success": false,
                "message": "User not found"
            });
        }
        if(!user.otp || !user.otpExpiry) { 
            return res.status(400).json({
                "success": false,
                "message": "OTP is not generated or already verified"
            });
        }

        if(user.otpExpiry < new Date().getTime()) {
            return res.status(400).json({
                "success": false,
                "message": "OTP is expired"
            });
        }
        if(otp !== user.otp) {
            return res.status(400).json({
                "success": false,
                "message": "OTP is incorrect"
            });
        }
        user.otp = null;
        user.otpExpiry = null;
        await user.save();
        return res.status(200).json({
            "success": true,
            "message": "OTP verified successfully"
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

export const changePassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const {email} = req.params;
        const user = await User.findOne({email});
        if(!user) {
            return res.status(404).json({
                "success": false,
                "message": "User not found"
            });
        }
        if(!newPassword || !confirmPassword) {
            return res.status(400).json({
                "success": false,
                "message": "All Fields are necessary"
            });
        }
        if(newPassword !== confirmPassword) {
            return res.status(400).json({
                "success": false,
                "message": "Passwords do not match"
            });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        return res.status(200).json({
            "success": true,
            "message": "Password changed successfully"
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

export const allUsers = async (req, res) => {
    try {
        const user = await User.find({role: 'student'});
        return res.status(200).json({
            "success": true,
            "message": "All users fetched successfully",
            users: user
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

export const getUserById = async (req, res) => {
    try {
        const {userId} = req.params;
        const user = await User.findById(userId).select("-password -otp -otpExpiry -token");
        if(!user) {
            return res.status(404).json({
                "success": false,
                "message": "User not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            user: user
        })
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

export const updateUser = async (req, res) => {
    try {
        const userIDtoUpdate = req.params.id;
        const loggedInUser = req.user; 
        
        // Replaced old e-commerce parameters with new profile fields
        const { firstName, lastName, rollNumber, hostelName, roomNumber, phoneNo, role } = req.body;

        if(loggedInUser._id.toString() !== userIDtoUpdate && loggedInUser.role !== "admin") {
            return res.status(401).json({
                "success": false,
                "message": "You are not authorized to update this profile"
            });
        }

        let user = await User.findById(userIDtoUpdate);
        if(!user) {
            return res.status(404).json({
                "success": false,
                "message": "User not found"
            });
        }
        let profilePicUrl = user.profilePic;
        let profilePicPublicId = user.profilePicPublicId;
        if(req.file) {
            if(profilePicPublicId) {
                await cloudinary.uploader.destroy(profilePicPublicId);
            }
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {folder: "profiles"},
                    (error, result) => {
                        if(error) reject(error)
                        else resolve(result)
                    }
                )
                stream.end(req.file.buffer);
            });
            profilePicUrl = uploadResult.secure_url;
            profilePicPublicId = uploadResult.public_id;
        }
        
        // Morphing variable bindings safely
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.rollNumber = rollNumber || user.rollNumber;
        user.hostelName = hostelName || user.hostelName;
        user.roomNumber = roomNumber || user.roomNumber;
        user.phoneNo = phoneNo || user.phoneNo;
        user.profilePic = profilePicUrl;
        user.profilePicPublicId = profilePicPublicId;
        user.role = role || user.role;
        
        const updatedUser = await user.save();
        return res.status(200).json({
            "success": true,
            "message": "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

export const updateRole = async (req, res) => {
    try {
        const {userId, role} = req.body;
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({
                "success": false,
                "message": "User not found"
            });
        }
        user.role = role;
        await user.save();
        return res.status(200).json({
            "success": true,
            "message": "User role updated successfully",
            user: user
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}   