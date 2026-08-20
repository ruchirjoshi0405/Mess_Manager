import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import postRoute from './routes/postRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());
app.use(cors());

// Mount Community Domain Routes
app.use('/api/v1/community', postRoute);

app.get('/health', (req, res) => res.status(200).json({ service: 'Community Service', status: 'UP' }));

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`💬 Community Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start Community Service:", error.message);
        process.exit(1);
    }
};

startServer();