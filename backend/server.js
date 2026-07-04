import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { securityHeaders, rateLimiter } from './src/middleware/security.js';
import apiRoutes from './src/routes/api.js';

const PORT = process.env.PORT || 4000;

const app = express();

// Middleware
app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Apply rate limiting to all API routes
app.use('/api', rateLimiter(200, 60000)); // 200 requests per minute

// Routes
app.use('/api', apiRoutes);

// Start server
app.listen(PORT, () => console.log(`MMMS API on http://localhost:${PORT}`));
