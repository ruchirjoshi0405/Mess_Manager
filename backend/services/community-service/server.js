import express from 'express';
import 'dotenv/config';
import connectDB from './database/db.js';
import postRoute from './routes/postRoute.js';

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());

// Mount Community Domain Routes
app.use('/api/v1/community', postRoute);

app.get('/health', (req, res) => res.status(200).json({ service: 'Community Service', status: 'UP' }));

app.listen(PORT, () => {
    connectDB();
    console.log(`💬 Community Service running on port ${PORT}`);
});