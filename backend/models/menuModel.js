import mongoose from "mongoose";

const menuSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true
    },
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    mealType: {
        type: String,
        required: true,
        enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner']
    },
    items: [
        {
            type: String,
            required: true 
        }
    ],
    menuImg: [
        {
            url: {
                type: String,
                required: true
            },
            public_id: {
                type: String,
                required: true
            }
        }
    ],
    costPerPerson: {
        type: Number,
        default: 0 
    }
},
{ timestamps: true }
);

menuSchema.index({ day: 1, mealType: 1 }, { unique: true });

export const Menu = mongoose.model("Menu", menuSchema);