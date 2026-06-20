/**
 * Application Configuration
 * Centralized configuration management
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // Video Processing
  video: {
    outputDir: process.env.VIDEO_OUTPUT_DIR || './output',
    quality: process.env.VIDEO_QUALITY || '1080p',
    fps: parseInt(process.env.VIDEO_FPS || '30', 10),
    maxDuration: 3600, // 1 hour
    supportedFormats: ['mp4', 'avi', 'mov', 'mkv', 'webm']
  },

  // FFmpeg
  ffmpeg: {
    path: process.env.FFMPEG_PATH || 'ffmpeg',
    timeout: parseInt(process.env.FFMPEG_TIMEOUT || '300000', 10)
  },

  // Storage
  storage: {
    baseDir: process.env.VIDEO_OUTPUT_DIR || './output',
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    allowedFormats: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'jpg', 'png']
  },

  // Database
  database: {
    path: process.env.DB_PATH || './mehram.db',
    backupPath: process.env.DB_BACKUP_PATH || './backups'
  },

  // Job Queue
  queue: {
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10),
    maxRetries: 3,
    timeout: 300000 // 5 minutes
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxLogs: 10000
  },

  // API
  api: {
    prefix: '/api',
    version: 'v1',
    timeout: 30000 // 30 seconds
  }
};

/**
 * Validate configuration
 */
export function validateConfig(): boolean {
  const required = ['video.outputDir', 'ffmpeg.path', 'database.path'];
  let valid = true;

  for (const key of required) {
    const [section, field] = key.split('.');
    const value = (config as any)[section]?.[field];

    if (!value) {
      console.error(`❌ Missing required configuration: ${key}`);
      valid = false;
    }
  }

  if (valid) {
    console.log('✅ Configuration validated successfully');
  }

  return valid;
}

export default config;