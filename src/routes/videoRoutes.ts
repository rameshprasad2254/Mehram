/**
 * Video Generation Routes
 */

import { Router, Request, Response } from 'express';
import { VideoGenerator } from '../core/videoGenerator';

export function videoRoutes(videoGenerator: VideoGenerator): Router {
  const router = Router();

  /**
   * POST /generate
   * Generate a new video
   */
  router.post('/generate', async (req: Request, res: Response) => {
    try {
      const { config, data } = req.body;

      if (!data) {
        return res.status(400).json({
          error: 'Video data is required'
        });
      }

      // Update configuration if provided
      if (config) {
        videoGenerator.setConfig(config);
      }

      // Start video generation
      const videoPath = await videoGenerator.generateVideo(data);

      res.json({
        success: true,
        message: 'Video generated successfully',
        path: videoPath,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Video generation failed'
      });
    }
  });

  /**
   * GET /config
   * Get current video generator configuration
   */
  router.get('/config', (req: Request, res: Response) => {
    try {
      const config = videoGenerator.getConfig();
      res.json({
        success: true,
        config
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get configuration'
      });
    }
  });

  /**
   * POST /config
   * Update video generator configuration
   */
  router.post('/config', (req: Request, res: Response) => {
    try {
      const newConfig = req.body;
      videoGenerator.setConfig(newConfig);

      res.json({
        success: true,
        message: 'Configuration updated',
        config: videoGenerator.getConfig()
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to update configuration'
      });
    }
  });

  return router;
}