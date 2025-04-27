// src/modules/health/index.ts
import express, { Request, Response, NextFunction } from 'express';
import HealthService from '../health-metrics/health-metrics.service';
import { healthRouter, metricsRouter, metricsApiRouter } from '../health-metrics/health-metrics.routes';

/**
 * Sets up health monitoring middleware and routes
 * @param app Express application instance
 */
export function setupHealthMonitoring(app: express.Application): void {
  const healthService = new HealthService();
  
  // Middleware to track request duration and active connections
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();
    healthService.incrementActiveConnections();
    
    res.on('finish', () => {
      healthService.decrementActiveConnections();
      
      const duration = process.hrtime(start);
      const durationInSeconds = duration[0] + duration[1] / 1e9;
      
      // Don't measure health and metrics endpoints
      if (req.path !== '/health' && req.path !== '/metrics') {
        healthService.observeHttpRequestDuration(
          req.method, 
          req.path, 
          res.statusCode.toString(), 
          durationInSeconds
        );
      }
    });
    
    next();
  });

  // Register the routes
  app.use('/health', healthRouter);
  app.use('/metrics', metricsRouter);
  app.use('/api/v1/metrics', metricsApiRouter);

  // Start periodic metrics collection
  startPeriodicMetricsCollection(healthService);
}

/**
 * Starts periodic collection of system metrics
 * @param healthService Health service instance
 */
function startPeriodicMetricsCollection(healthService: HealthService): void {
  // Collect metrics immediately when server starts
  healthService.collectAndStoreMetrics()
    .catch(error => console.error('Initial metrics collection failed:', error));
  
  // Then collect every 10 minutes
  setInterval(() => {
    healthService.collectAndStoreMetrics()
      .catch(error => console.error('Periodic metrics collection failed:', error));
  }, 10 * 60 * 1000);
}

// Export controllers, services, models
export { default as HealthController } from '../health-metrics/health-metrics.controller';
export { default as HealthService } from './health-metrics.service';
export { HealthMetrics } from './health-metrics.model';