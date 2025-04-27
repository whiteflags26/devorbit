// src/modules/health/health.routes.ts
import express from 'express';
import HealthController from '../health-metrics/health-metrics.controller';

const router = express.Router();
const healthController = new HealthController();

// Health check routes
router.head('/', healthController.basicHealthCheck);
router.get('/', healthController.detailedHealthCheck);

// Prometheus metrics endpoint
const metricsRouter = express.Router();
metricsRouter.get('/', healthController.getPrometheusMetrics);

// Metrics API endpoints
const metricsApiRouter = express.Router();
metricsApiRouter.get('/latest', healthController.getLatestMetrics);
metricsApiRouter.get('/history', healthController.getMetricsHistory);

export { router as healthRouter, metricsRouter, metricsApiRouter };