import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import financialRoute from './routes/financialRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());
app.use(cors());

// Mount Financial Domain Routes
app.use('/api/v1/finance', financialRoute);

app.get('/health', (req, res) => res.status(200).json({ service: 'Finance Service', status: 'UP' }));

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`💳 Finance Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start Finance Service:", error.message);
        process.exit(1);
    }
};

startServer();