import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoute.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/v1/user', userRoutes);

const PORT = process.env.PORT;
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`👤 User Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup aborted due to DB connection failure.");
    }
};

startServer();