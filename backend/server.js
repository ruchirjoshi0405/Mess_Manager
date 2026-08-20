import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import proxy from 'express-http-proxy';

const app = express();
const PORT = process.env.GATEWAY_PORT || 5000;

// Global Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Service Ports Configuration
const SERVICES = {
    USER: process.env.USER_SERVICE_URL || 'http://localhost:5001',
    COMMUNITY: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:5002',
    FINANCE: process.env.FINANCE_SERVICE_URL || 'http://localhost:5003',
    MESS_OPS: process.env.MESS_OPS_SERVICE_URL || 'http://localhost:5004'
};

// ==================== API GATEWAY ROUTING ====================

// 1. Auth & User Service Proxy
app.use('/api/v1/user', proxy(SERVICES.USER, {
    proxyReqPathResolver: (req) => `/api/v1/user${req.url}`
}));

// 2. Community & Media Service Proxy
app.use('/api/v1/community', proxy(SERVICES.COMMUNITY, {
    proxyReqPathResolver: (req) => `/api/v1/community${req.url}`
}));

// 3. Finance & Ledger Service Proxy
app.use('/api/v1/finance', proxy(SERVICES.FINANCE, {
    proxyReqPathResolver: (req) => `/api/v1/finance${req.url}`
}));

// 4. Mess Operations Service Proxy (Menu + Attendance)
app.use('/api/v1/menu', proxy(SERVICES.MESS_OPS, {
    proxyReqPathResolver: (req) => `/api/v1/menu${req.url}`
}));

app.use('/api/v1/attendance', proxy(SERVICES.MESS_OPS, {
    proxyReqPathResolver: (req) => `/api/v1/attendance${req.url}`
}));

// Gateway Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'API Gateway operational.' });
});

app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
});