import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import menuRoute from './routes/menuRoute.js';
import attendanceRoute from './routes/attendanceRoute.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Mount Microservice Routes
app.use('/api/v1/mess/menu', menuRoute);
app.use('/api/v1/mess/attendance', attendanceRoute);

const PORT = process.env.PORT || 5004;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🍱 Mess Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start Mess Service:", error.message);
        process.exit(1);
    }
};

startServer();