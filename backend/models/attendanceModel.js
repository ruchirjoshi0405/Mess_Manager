import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
        // Removed unique: true because a user will have multiple attendance records (one for each day)
    },
    date: {
        type: Date,
        required: true 
    },
    meals: {
        breakfast: {
            status: { type: String, enum: ['eating', 'skipping'], default: 'eating' },
            menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
            rating: { type: Number, min: 1, max: 5, default: null } // NEW FIELD
        },
        lunch: {
            status: { type: String, enum: ['eating', 'skipping'], default: 'eating' },
            menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
            rating: { type: Number, min: 1, max: 5, default: null } // NEW FIELD
        },
        snacks: {
            status: { type: String, enum: ['eating', 'skipping'], default: 'eating' },
            menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
            rating: { type: Number, min: 1, max: 5, default: null } // NEW FIELD
        },
        dinner: {
            status: { type: String, enum: ['eating', 'skipping'], default: 'eating' },
            menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
            rating: { type: Number, min: 1, max: 5, default: null } // NEW FIELD
        }
    },
    isOnLeave: {
        type: Boolean,
        default: false // Quick flag if a student marks a whole vacation/leave day
    }
}, { timestamps: true });

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);