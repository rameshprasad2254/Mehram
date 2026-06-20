/**
 * API Routes Configuration
 */

import { Express } from 'express';
import { VideoGenerator } from '../core/videoGenerator';
import { videoRoutes } from './videoRoutes';

export function configureRoutes(app: Express, videoGenerator: VideoGenerator): void {
  // Video generation routes
  app.use('/api/videos', videoRoutes(videoGenerator));

  // API documentation
  app.get('/api', (req, res) => {
    res.json({
      name: 'Mehram Video Generator API',
      version: '1.0.0',
      endpoints: {
        'POST /api/videos/generate': 'Generate a new video',
        'GET /api/videos/status/:id': 'Get video generation status',
        'GET /health': 'Health check'
      }
    });
  });
}