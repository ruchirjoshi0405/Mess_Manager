import express from 'express';
import 'dotenv/config';
import connectDB from './database/db.js';
import menuRoute from './routes/menuRoute.js';
import attendanceRoute from './routes/attendanceRoute.js';

const app = express();
const PORT = process.env.PORT || 5004;

app.use(express.json());

// Mount Mess Operations Routes
app.use('/api/v1/menu', menuRoute);
app.use('/api/v1/attendance', attendanceRoute);

app.get('/health', (req, res) => res.status(200).json({ service: 'Mess Operations Service', status: 'UP' }));

app.listen(PORT, () => {
    connectDB();
    console.log(`🍱 Mess Operations Service running on port ${PORT}`);
});  