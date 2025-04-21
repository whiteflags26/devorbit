// src/modules/health/health.controller.ts
import { Request, Response } from 'express';
import asyncHandler from '../../shared/middleware/async';
import HealthService from '../health-metrics/health-metrics.service';

export default class HealthController {
  private readonly healthService: HealthService;

  constructor() {
    this.healthService = new HealthService();
  }

  /**
   * @route   HEAD /health
   * @desc    Basic health check for uptime monitoring
   * @access  Public
   */
  public basicHealthCheck = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // Check MongoDB connection
      const isDbConnected = req.app.get('mongoDbConnected') || false;
      
      if (isDbConnected) {
        res.status(200).end();
      } else {
        res.status(503).end();
      }
    }
  );

  /**
   * @route   GET /health
   * @desc    Detailed health information
   * @access  Public
   */
  public detailedHealthCheck = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const healthData = await this.healthService.getHealthData();
      res.status(healthData.status === 'ok' ? 200 : 503).json(healthData);
    }
  );

  /**
   * @route   GET /metrics
   * @desc    Prometheus metrics endpoint
   * @access  Public
   */
  public getPrometheusMetrics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const metrics = await this.healthService.getPrometheusMetrics();
      res.set('Content-Type', this.healthService.getPrometheusContentType());
      res.end(metrics);
    }
  );

  /**
   * @route   GET /api/v1/metrics/latest
   * @desc    Get the most recent metrics
   * @access  Public
   */
  public getLatestMetrics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const latestMetrics = await this.healthService.getLatestMetrics();
      
      res.status(200).json({
        success: true,
        metrics: latestMetrics
      });
    }
  );

  /**
   * @route   GET /api/v1/metrics/history
   * @desc    Get historical metrics
   * @access  Public
   */
  public getMetricsHistory = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
      const interval = (req.query.interval as 'minute' | 'hour' | 'day') || 'hour';
      
      const metrics = await this.healthService.getMetricsHistory({
        hours,
        interval
      });
      
      res.status(200).json({
        success: true,
        metrics
      });
    }
  );
}