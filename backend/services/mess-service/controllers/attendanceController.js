import axios from "axios";
import { Attendance } from "../models/attendanceModel.js";

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

// 1. UPDATE MEAL STATUS (Only persists 'skipping')
export const updateMealStatus = async (req, res) => {
    try {
        const userId = req.id;
        const { date, mealType, status } = req.body;

        if (!date || !mealType || !status) {
            return res.status(400).json({
                success: false,
                message: "Date, mealType, and status ('eating' or 'skipping') are required"
            });
        }

        const targetDate = parseAsMidnightLocal(date);
        const mealKey = mealType.toLowerCase();

        let attendance = await Attendance.findOne({ userId, date: targetDate });

        if (status === 'skipping') {
            // Create record if it doesn't exist
            if (!attendance) {
                attendance = new Attendance({
                    userId,
                    date: targetDate,
                    meals: {}
                });
            }
            // Mark as skipping
            attendance.meals[mealKey] = {
                ...attendance.meals[mealKey],
                status: 'skipping'
            };
            await attendance.save();
        } else if (status === 'eating') {
            // If setting back to 'eating', clear the skipping status
            if (attendance) {
                // Reset meal status
                if (attendance.meals && attendance.meals[mealKey]) {
                    attendance.meals[mealKey].status = 'eating'; // or set to null/default
                }

                // Check if user has any remaining skipping meals or is on leave
                const hasSkippingMeals = Object.values(attendance.meals || {}).some(
                    (m) => m && m.status === 'skipping'
                );

                if (!hasSkippingMeals && !attendance.isOnLeave) {
                    // Delete the document if there are no reasons left to store an absentee record
                    await Attendance.deleteOne({ _id: attendance._id });
                    attendance = null;
                } else {
                    await attendance.save();
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: `${mealType} status updated to ${status} successfully`,
            attendance: attendance || { userId, date: targetDate, isDefaultEating: true }
        });
    } catch (error) {
        console.error("updateMealStatus error:", error.message);
        return res.status(500).json({
            success: false,
            message: "updateMealStatus: Internal server error"
        });
    }
};

// 2. APPLY FULL-DAY LEAVE OVERRIDE
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

        if (isOnLeave) {
            // Mark full day as leave and mark all meal slots as skipping
            let attendance = await Attendance.findOne({ userId, date: targetDate });
            if (!attendance) {
                attendance = new Attendance({
                    userId,
                    date: targetDate
                });
            }

            attendance.isOnLeave = true;
            attendance.meals = {
                breakfast: { status: 'skipping', rating: null },
                lunch: { status: 'skipping', rating: null },
                snacks: { status: 'skipping', rating: null },
                dinner: { status: 'skipping', rating: null }
            };

            await attendance.save();

            return res.status(200).json({
                success: true,
                message: "Full day marked as leave successfully",
                attendance
            });
        } else {
            // Cancelling leave: If the user cancels leave, delete the attendance record 
            // so they revert to the default state (present/eating)
            await Attendance.deleteOne({ userId, date: targetDate });

            return res.status(200).json({
                success: true,
                message: "Leave cancelled, reverted to default eating status",
                attendance: null
            });
        }
    } catch (error) {
        console.error("toggleDayLeave error:", error.message);
        return res.status(500).json({
            success: false,
            message: "toggleDayLeave: Internal server error"
        });
    }
};

// 4. SUBMIT STAR RATING FEEDBACK FOR AN INDIVIDUAL MEAL SLOT
export const rateMealSlot = async (req, res) => {
    try {
        console.log(req.body);
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

        // 1. Fetch total registered student count from user-service
        const baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:5000/api/v1/user';
        const userServiceUrl = `${baseUrl.replace(/\/$/, '')}/countUsers`;

        let totalRegisteredUsers = 0;
        try {
            console.log("Fetching user count from user-service:", userServiceUrl);
            const userResponse = await axios.get(userServiceUrl, {
                headers: {
                    Authorization: req.headers.authorization
                }
            });
            totalRegisteredUsers = userResponse.data.count || 0;
        } catch (err) {
            console.error("Failed to fetch user count from user-service:", err.message);
            // Non-blocking fallback: default to 0 or handle according to requirement
        }

        // 2. Query skipping counts for each meal in parallel
        const [breakfastSkipping, lunchSkipping, snacksSkipping, dinnerSkipping] = await Promise.all([
            Attendance.countDocuments({ date: targetDate, "meals.breakfast.status": "skipping" }),
            Attendance.countDocuments({ date: targetDate, "meals.lunch.status": "skipping" }),
            Attendance.countDocuments({ date: targetDate, "meals.snacks.status": "skipping" }),
            Attendance.countDocuments({ date: targetDate, "meals.dinner.status": "skipping" })
        ]);

        // 3. Derived calculation: Everyone not explicitly skipping is eating
        const breakfastEating = Math.max(0, totalRegisteredUsers - breakfastSkipping);
        const lunchEating = Math.max(0, totalRegisteredUsers - lunchSkipping);
        const snacksEating = Math.max(0, totalRegisteredUsers - snacksSkipping);
        const dinnerEating = Math.max(0, totalRegisteredUsers - dinnerSkipping);

        return res.status(200).json({
            success: true,
            date: date,
            totalRegisteredUsers,
            headcounts: {
                Breakfast: { eating: breakfastEating, skipping: breakfastSkipping },
                Lunch: { eating: lunchEating, skipping: lunchSkipping },
                Snacks: { eating: snacksEating, skipping: snacksSkipping },
                Dinner: { eating: dinnerEating, skipping: dinnerSkipping }
            }
        });
    } catch (error) {
        console.error("getHeadcount error:", error.message);
        return res.status(500).json({
            success: false,
            message: "getHeadcount: Internal server error"
        });
    }
};