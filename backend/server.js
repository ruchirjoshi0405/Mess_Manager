import express from 'express'
import 'dotenv/config'
import connectDB from './database/db.js';
import userRoute from './routes/userRoute.js';
import menuRoute from './routes/menuRoute.js';           
import attendanceRoute from './routes/attendanceRoute.js';  
import financialRoute from './routes/financialRoute.js';    
import postRoute from './routes/postRoute.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Route Mounting Architecture
app.use('/api/v1/user', userRoute);
app.use('/api/v1/menu', menuRoute);             
app.use('/api/v1/attendance', attendanceRoute); 
app.use('/api/v1/finance', financialRoute);   
app.use('/api/v1/community', postRoute);

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});