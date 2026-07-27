import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/dataUri.js";
import { Menu } from "../models/menuModel.js";
import { Attendance } from "../models/attendanceModel.js";

// 1. ADD MEAL SLOT TO MENU
export const addMeal = async (req, res) => {
    try {
        const { day, mealType, items, costPerPerson } = req.body;
        const userId = req.id;

        if (!day || !mealType || !items) {
            return res.status(400).json({
                "success": false,
                "message": "Day, mealType, and items array are required"
            });
        }

        // Check if this menu slot already exists (e.g. Monday Lunch)
        const existingSlot = await Menu.findOne({ day, mealType });
        if (existingSlot) {
            // Clean up old images from Cloudinary before deleting the record
            if (existingSlot.menuImg && existingSlot.menuImg.length > 0) {
                for (let img of existingSlot.menuImg) {
                    if (img.public_id) {
                        await cloudinary.uploader.destroy(img.public_id);
                    }
                }
            }
            await Menu.findByIdAndDelete(existingSlot._id);
        }

        // Parse items if sent as a stringified array from the frontend form
        const cleanItems = typeof items === 'string' ? JSON.parse(items) : items;

        // Handle meal image uploads (reusing your exact Cloudinary logic)
        let menuImg = [];
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                console.log("uploading file:", file && file.originalname);
                const fileUri = getDataUri(file);
                const result = await cloudinary.uploader.upload(fileUri, {
                    folder: "mess_menu" // New dedicated folder
                });
                menuImg.push({
                    url: result.secure_url,
                    public_id: result.public_id
                });
                console.log("uploaded successfully")
            }
        }

        const newMeal = await Menu.create({
            userId,
            day,
            mealType,
            items: cleanItems,
            menuImg,
            costPerPerson: costPerPerson || 0
        });

        return res.status(201).json({
            "success": true,
            "message": "Meal slot added to menu successfully",
            meal: newMeal
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": error.message + ". addMeal: Internal server error"
        });
    }
}

// 2. GET ENTIRE MENU SCHEDULE
export const getMenu = async (req, res) => {
    try {
        const menuSchedule = await Menu.find().sort({ day: 1 });
        if (!menuSchedule || menuSchedule.length === 0) {
            return res.status(200).json({
                "success": true,
                "message": "No menu schedule populated yet",
                menu: []
            });
        }
        return res.status(200).json({
            "success": true,
            "message": "Menu schedule fetched successfully",
            menu: menuSchedule
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

// 3. DELETE MEAL SLOT
export const deleteMeal = async (req, res) => {
    try {
        const { mealId } = req.params;
        const mealSlot = await Menu.findById(mealId);
        if (!mealSlot) {
            return res.status(404).json({
                "success": false,
                "message": "Meal slot not found"
            });
        }

        // Delete meal photos from Cloudinary
        if (mealSlot.menuImg && mealSlot.menuImg.length > 0) {
            for (let image of mealSlot.menuImg) {
                await cloudinary.uploader.destroy(image.public_id);
            }
        }

        await Menu.findByIdAndDelete(mealId);
        return res.status(200).json({
            "success": true,
            "message": "Meal slot removed from menu successfully"
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

// 4. UPDATE MEAL SLOT
export const updateMeal = async (req, res) => {
    try {
        const { mealId } = req.params;
        const { day, mealType, items, costPerPerson, existingImages } = req.body;

        const mealSlot = await Menu.findById(mealId);
        if (!mealSlot) {
            return res.status(404).json({
                "success": false,
                "message": "Meal slot not found"
            });
        }

        let updatedImg = [];
        // Keep selected old images
        if (existingImages && existingImages.length > 0) {
            const keepIds = JSON.parse(existingImages);
            updatedImg = mealSlot.menuImg.filter(img => keepIds.includes(img.public_id));

            // Clean up deleted layout assets
            const removedImg = mealSlot.menuImg.filter(img => !keepIds.includes(img.public_id));
            for (let img of removedImg) {
                await cloudinary.uploader.destroy(img.public_id);
            }
        } else {
            updatedImg = mealSlot.menuImg;
        }

        // Upload fresh replacement imagery
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                const fileUri = getDataUri(file);
                const result = await cloudinary.uploader.upload(fileUri, {
                    folder: "mess_menu"
                });
                updatedImg.push({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        }

        // Apply string array extraction safely
        if (items) {
            mealSlot.items = typeof items === 'string' ? JSON.parse(items) : items;
        }

        mealSlot.day = day || mealSlot.day;
        mealSlot.mealType = mealType || mealSlot.mealType;
        mealSlot.costPerPerson = costPerPerson !== undefined ? costPerPerson : mealSlot.costPerPerson;
        mealSlot.menuImg = updatedImg;

        await mealSlot.save();
        return res.status(200).json({
            "success": true,
            "message": "Menu slot updated successfully",
            meal: mealSlot
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "message": "Internal server error"
        });
    }
}

export const getWeeklyMenuWithRatings = async (req, res) => {
    try {
        const menuItems = await Menu.find({});
        
        // Loop through all database items asynchronously to compute aggregate rating fields
        const menuWithRatings = await Promise.all(menuItems.map(async (item) => {
            // Fetch records where this specific meal slot has a verified student numerical score
            const feedbackRecords = await Attendance.find({
                [`meals.${item.mealType.toLowerCase()}.rating`]: { $exists: true, $ne: null }
            });

            let totalRating = 0;
            let ratingCount = 0;

            feedbackRecords.forEach(record => {
                // Determine the semantic weekday name string from the saved date tag
                const dayNameOfRecord = new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' });
                
                // Aggregate score variables only if it maps to the current day row index block
                if (dayNameOfRecord === item.day) {
                    const mealRating = record.meals[item.mealType.toLowerCase()].rating;
                    if (mealRating) {
                        totalRating += mealRating;
                        ratingCount++;
                    }
                }
            });

            // Compute precision decimal average properties safely
            const averageRating = ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(1)) : 0;

            return {
                ...item._doc,
                averageRating,
                ratingCount
            };
        }));

        return res.status(200).json({
            success: true,
            menu: menuWithRatings
        });
    } catch (error) {
        console.error("getWeeklyMenuWithRatings error:", error);
        return res.status(500).json({
            success: false,
            message: error.message + " Internal Server Error."
        });
    }
};