import express from 'express';
import 'dotenv/config';
import connectDB from './database/db.js';
import userRoute from './routes/userRoute.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// Mount User Domain Routes
app.use('/api/v1/user', userRoute);

app.get('/health', (req, res) => res.status(200).json({ service: 'User Service', status: 'UP' }));

app.listen(PORT, () => {
    connectDB();
    console.log(`👤 User Service running on port ${PORT}`);
});