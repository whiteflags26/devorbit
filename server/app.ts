import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import connectDB from './config/db';
import router from './routes/index';
import errorHandler from './shared/middleware/error';
import { setupHealthMonitoring } from './modules/health-metrics/index';

connectDB();

const app = express();

const corsConfig = {
  origin: '*', // Allow all origins
  credentials: true, // If you need credentials (like cookies or tokens)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow common methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
};

app.use(express.json());

// Use the same corsOptions configuration consistently
app.use(cors(corsConfig));

app.use(cookieParser());
app.use(ExpressMongoSanitize());
app.use(helmet());

// Add pre-flight handling for all routes
app.options('*', cors(corsConfig));

// Health monitoring middleware
//setupHealthMonitoring(app);

app.use(router);
app.use(errorHandler);

export default app;
