import { Attendance } from "../../../models/attendanceModel.js";
import { Menu } from "../../../models/menuModel.js";

// Helper function to create a clean, timezone-neutral midnight local date object
const parseAsMidnightLocal = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
};

// 1. GET ATTENDANCE FOR A SPECIFIC DATE (For Student Dashboard)
export const getAttendanceByDate = async (req, res) => {
    try {
        const userId = req.id;
        const { date } = req.query; // Expecting string format YYYY-MM-DD

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date parameter is required"
            });
        }

        const targetDate = parseAsMidnightLocal(date);
        
        // Mongoose population occurs within the same service DB boundary (Menu model)
        let attendance = await Attendance.findOne({ userId, date: targetDate })
            .populate("meals.breakfast.menuId")
            .populate("meals.lunch.menuId")
            .populate("meals.snacks.menuId")
            .populate("meals.dinner.menuId");

        if (!attendance) {
            return res.status(200).json({
                success: true,
                message: "No specific changes saved. Standard defaults apply.",
                attendance: {
                    userId,
                    date: targetDate,
                    isOnLeave: false,
                    meals: {
                        breakfast: { status: "eating", rating: null },
                        lunch: { status: "eating", rating: null },
                        snacks: { status: "eating", rating: null },
                        dinner: { status: "eating", rating: null }
                    }
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Attendance record retrieved successfully",
            attendance
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "getAttendanceByDate: Internal server error"
        });
    }
};

// 2. TOGGLE OR REGISTER MEAL STATUS
export const updateMealStatus = async (req, res) => {
    try {
        const userId = req.id;
        const { date, mealType, status } = req.body;

        if (!date || !mealType || status == null) {
            return res.status(400).json({
                success: false,
                message: "Date, mealType, and eating status are required"
            });
        }

        const targetDate = parseAsMidnightLocal(date);
        let attendance = await Attendance.findOne({ userId, date: targetDate });

        if (!attendance) {
            attendance = new Attendance({
                userId,
                date: targetDate,
                meals: {}
            });
        }

        const mealKey = mealType.toLowerCase();
        if (attendance.meals[mealKey]) {
            attendance.meals[mealKey].status = status;
        }

        await attendance.save();
        return res.status(200).json({
            success: true,
            message: `${mealType} status updated to ${status} successfully`,
            attendance
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "updateMealStatus: Internal server error"
        });
    }
};

// 3. APPLY FULL-DAY LEAVE OVERRIDE
export const toggleDayLeave = async (req, res) => {
    try {
        const userId = req.id;
        const { date, isOnLeave } = req.body;

        if (!date || isOnLeave === undefined) {
            return res.status(400).json({
                success: false,
                message: "Date and leave status flag are required"
            });
        }

        const targetDate = parseAsMidnightLocal(date);
        let attendance = await Attendance.findOne({ userId, date: targetDate });

        if (!attendance) {
            attendance = new Attendance({
                userId,
                date: targetDate
            });
        }

        attendance.isOnLeave = isOnLeave;
        if (isOnLeave) {
            attendance.meals.breakfast.status = 'skipping';
            attendance.meals.breakfast.rating = null;
            attendance.meals.lunch.status = 'skipping';
            attendance.meals.lunch.rating = null;
            attendance.meals.snacks.status = 'skipping';
            attendance.meals.snacks.rating = null;
            attendance.meals.dinner.status = 'skipping';
            attendance.meals.dinner.rating = null;
        } else {
            attendance.meals.breakfast.status = 'eating';
            attendance.meals.lunch.status = 'eating';
            attendance.meals.snacks.status = 'eating';
            attendance.meals.dinner.status = 'eating';
        }

        await attendance.save();
        return res.status(200).json({
            success: true,
            message: isOnLeave ? "Full day marked as leave successfully" : "Leave cancelled",
            attendance
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "toggleDayLeave: Internal server error"
        });
    }
};

// 4. SUBMIT STAR RATING FEEDBACK FOR AN INDIVIDUAL MEAL SLOT
export const rateMealSlot = async (req, res) => {
    try {
        const userId = req.id;
        const { date, mealType, rating } = req.body;

        if (!date || !mealType || !rating) {
            return res.status(400).json({
                success: false,
                message: "Date, mealType, and star rating are required parameters"
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating value bounds must reside strictly between 1 and 5 stars"
            });
        }

        const mealKey = mealType.toLowerCase();
        const targetDate = parseAsMidnightLocal(date);

        const today = new Date();
        const currentHour = today.getHours();
        today.setHours(0, 0, 0, 0);

        if (targetDate > today) {
            return res.status(400).json({
                success: false,
                message: "Cannot submit meal feedback parameters for unserved future dates"
            });
        }

        const MEAL_CUTOFF_HOURS = { breakfast: 8, lunch: 12, snacks: 17, dinner: 20 };

        if (targetDate.getTime() === today.getTime() && currentHour < MEAL_CUTOFF_HOURS[mealKey]) {
            return res.status(400).json({
                success: false,
                message: `Feedback window hasn't opened yet! You can rate this meal after ${MEAL_CUTOFF_HOURS[mealKey]}:00.`
            });
        }

        let attendance = await Attendance.findOne({ userId, date: targetDate });

        if (!attendance) {
            attendance = new Attendance({
                userId,
                date: targetDate
            });
        }

        if (attendance.meals[mealKey].status === 'skipping' || attendance.isOnLeave) {
            return res.status(400).json({
                success: false,
                message: "Feedback authorization rejected. Ratings are restricted to opted-in consumed meals only"
            });
        }

        attendance.meals[mealKey].rating = rating;
        await attendance.save();

        return res.status(200).json({
            success: true,
            message: `Successfully registered a ${rating}-star feedback index for ${mealType}`,
            attendance
        });
    } catch (error) {
        console.error("rateMealSlot Error:", error);
        return res.status(500).json({
            success: false,
            message: "rateMealSlot: Internal server error"
        });
    }
};

// 5. GET HEADCOUNT PREDICTIONS (Exclusively for Mess Managers / Admins)
export const getHeadcount = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Target calculation date required"
            });
        }

        const targetDate = parseAsMidnightLocal(date);
        
        const breakfastEating = await Attendance.countDocuments({ date: targetDate, "meals.breakfast.status": "eating" });
        const lunchEating = await Attendance.countDocuments({ date: targetDate, "meals.lunch.status": "eating" });
        const snacksEating = await Attendance.countDocuments({ date: targetDate, "meals.snacks.status": "eating" });
        const dinnerEating = await Attendance.countDocuments({ date: targetDate, "meals.dinner.status": "eating" });
        
        const breakfastSkipping = await Attendance.countDocuments({ date: targetDate, "meals.breakfast.status": "skipping" });
        const lunchSkipping = await Attendance.countDocuments({ date: targetDate, "meals.lunch.status": "skipping" });
        const snacksSkipping = await Attendance.countDocuments({ date: targetDate, "meals.snacks.status": "skipping" });
        const dinnerSkipping = await Attendance.countDocuments({ date: targetDate, "meals.dinner.status": "skipping" });

        return res.status(200).json({
            success: true,
            date: date,
            headcounts: {
                Breakfast: { eating: breakfastEating, skipping: breakfastSkipping },
                Lunch: { eating: lunchEating, skipping: lunchSkipping },
                Snacks: { eating: snacksEating, skipping: snacksSkipping },
                Dinner: { eating: dinnerEating, skipping: dinnerSkipping }
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "getHeadcount: Internal server error"
        });
    }
};