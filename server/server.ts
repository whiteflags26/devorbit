import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request, Response } from 'express';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import connectDB from './config/db';
import errorHandler from './shared/middleware/error';
import authRouter from './modules/auth/auth.route';
import organizationRouter from "./modules/organization/organization.route";
import turfRoutes from './modules/turf/turf.route';
import turfReviewRoutes from './modules/turf-review/turf-review.route';
import timeslotRoutes from './modules/timeslot/timeslot.route';
import bookingRoutes from './modules/booking/booking.route'
import { setupHealthMonitoring } from './modules/health-metrics';


const app = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(ExpressMongoSanitize());
app.use(helmet());

const corsConfig = {
  origin: '*', // Allow all origins
  credentials: true, // If you need credentials (like cookies or tokens)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow common methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
};

app.use(
  cors(corsConfig)
);

setupHealthMonitoring(app);

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running");
});

app.use('/api/v1/auth', authRouter);
app.use("/api/v1/organizations", organizationRouter);
app.use('/api/v1/turf', turfRoutes);
app.use('/api/v1/turf-review', turfReviewRoutes);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/timeslot', timeslotRoutes);
app.use('/api/v1/booking',bookingRoutes)
app.use(errorHandler);
app.listen(port, () => console.log(`Server app listening on port ${port}!`));
