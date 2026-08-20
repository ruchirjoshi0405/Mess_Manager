import express from 'express';
import 'dotenv/config';
import connectDB from './database/db.js';
import financialRoute from './routes/financialRoute.js';

const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());

// Mount Financial Domain Routes
app.use('/api/v1/finance', financialRoute);

app.get('/health', (req, res) => res.status(200).json({ service: 'Finance Service', status: 'UP' }));

app.listen(PORT, () => {
    connectDB();
    console.log(`💳 Finance Service running on port ${PORT}`);
});