/**
 * Processing Routes
 * API endpoints for video processing
 */

import { Router, Request, Response } from 'express';
import { ProcessingService } from '../core/processingService';

export function processingRoutes(processingService: ProcessingService): Router {
  const router = Router();

  /**
   * POST /process
   * Submit a video processing job
   */
  router.post('/process', async (req: Request, res: Response) => {
    try {
      const { templateId, inputPath, outputFileName, metadata, options } = req.body;

      if (!outputFileName) {
        return res.status(400).json({
          error: 'outputFileName is required'
        });
      }

      if (!metadata?.title) {
        return res.status(400).json({
          error: 'metadata.title is required'
        });
      }

      const job = await processingService.processVideo({
        templateId,
        inputPath,
        outputFileName,
        metadata,
        options
      });

      res.json({
        success: true,
        jobId: job.id,
        status: job.status,
        message: 'Processing job submitted'
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Processing failed'
      });
    }
  });

  /**
   * GET /status
   * Get overall processing status
   */
  router.get('/status', (req: Request, res: Response) => {
    try {
      const status = processingService.getStatus();
      res.json({
        success: true,
        status
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get status'
      });
    }
  });

  /**
   * GET /templates
   * Get all available templates
   */
  router.get('/templates', (req: Request, res: Response) => {
    try {
      const templates = processingService.getTemplates();
      res.json({
        success: true,
        templates,
        count: templates.length
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get templates'
      });
    }
  });

  /**
   * GET /storage
   * Get storage usage information
   */
  router.get('/storage', async (req: Request, res: Response) => {
    try {
      const usage = await processingService.getStorageUsage();
      res.json({
        success: true,
        storage: usage
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get storage info'
      });
    }
  });

  /**
   * GET /statistics
   * Get database statistics
   */
  router.get('/statistics', async (req: Request, res: Response) => {
    try {
      const stats = await processingService.getStatistics();
      res.json({
        success: true,
        statistics: stats
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get statistics'
      });
    }
  });

  return router;
}