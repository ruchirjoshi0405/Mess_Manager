import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: "" // cloudinary URL of the profile picture
    },
    profilePicPublicId: {
        type: String,
        default: "" // cloudinary public ID for the profile picture for deletion
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'mess_manager', 'admin'],
        default: 'student'
    },
    // Hostel specific fields replacing e-commerce address details
    rollNumber: {
        type: String,
        default: "" // Highly useful for student verification/records
    },
    hostelName: {
        type: String,
        default: "", // E.g., "Hostel A" to group batches/groups
        enum: ['Tondon', 'Tilak', 'Malaviya', 'Patel'],
    },
    roomNumber: {
        type: String,
        default: ""
    },
    phoneNo: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    token: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    city: {
        type: String,
        default: ""
    },
    zipcode: {
        type: String,
        default: ""
    },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
