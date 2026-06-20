/**
 * Video Processor
 * Handles video processing with FFmpeg
 */

import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';

export interface ProcessingOptions {
  inputPath: string;
  outputPath: string;
  duration?: number;
  quality?: string;
  fps?: number;
  scale?: string;
  bitrate?: string;
}

export class VideoProcessor extends EventEmitter {
  private ffmpegPath: string;

  constructor() {
    super();
    this.ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    ffmpeg.setFfmpegPath(this.ffmpegPath);
  }

  /**
   * Process video with specified options
   */
  async processVideo(options: ProcessingOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const { inputPath, outputPath, duration, quality, fps, scale, bitrate } = options;

      let command = ffmpeg(inputPath)
        .on('start', (cmd) => {
          this.emit('start', { command: cmd });
          console.log('🎬 FFmpeg command:', cmd);
        })
        .on('progress', (progress) => {
          this.emit('progress', progress);
          console.log(`📊 Processing: ${progress.percent}% done`);
        })
        .on('error', (err) => {
          this.emit('error', err);
          reject(err);
        })
        .on('end', () => {
          this.emit('complete');
          console.log('✅ Processing completed');
          resolve();
        });

      // Apply video filters and options
      if (scale) {
        command = command.videoFilter(`scale=${scale}`);
      }

      if (fps) {
        command = command.fps(fps);
      }

      if (duration) {
        command = command.duration(duration);
      }

      if (bitrate) {
        command = command.videoBitrate(bitrate);
      }

      // Output settings
      command
        .audioCodec('aac')
        .audioChannels(2)
        .audioFrequency(44100)
        .format('mp4')
        .output(outputPath);

      command.run();
    });
  }

  /**
   * Get video information
   */
  async getVideoInfo(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }

  /**
   * Trim video
   */
  async trimVideo(
    inputPath: string,
    outputPath: string,
    startTime: number,
    endTime: number
  ): Promise<void> {
    const duration = endTime - startTime;
    return this.processVideo({
      inputPath,
      outputPath,
      duration
    });
  }

  /**
   * Merge videos
   */
  async mergeVideos(inputPaths: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg();

      inputPaths.forEach((path) => {
        command = command.input(path);
      });

      command
        .on('error', (err) => reject(err))
        .on('end', () => {
          console.log('✅ Videos merged successfully');
          resolve();
        })
        .mergeToFile(outputPath, './tmp');
    });
  }

  /**
   * Convert video format
   */
  async convertFormat(inputPath: string, outputPath: string, format: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .format(format)
        .on('error', reject)
        .on('end', () => {
          console.log(`✅ Video converted to ${format}`);
          resolve();
        })
        .save(outputPath);
    });
  }

  /**
   * Add watermark to video
   */
  async addWatermark(
    inputPath: string,
    outputPath: string,
    watermarkPath: string,
    position: string = 'TR'
  ): Promise<void> {
    const filterComplex = `overlay=${this.getWatermarkPosition(position)}`;

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .input(watermarkPath)
        .complexFilter(filterComplex)
        .on('error', reject)
        .on('end', () => {
          console.log('✅ Watermark added');
          resolve();
        })
        .save(outputPath);
    });
  }

  /**
   * Get watermark position coordinates
   */
  private getWatermarkPosition(position: string): string {
    const positions: { [key: string]: string } = {
      TL: '10:10',        // Top Left
      TR: 'main_w-overlay_w-10:10', // Top Right
      BL: '10:main_h-overlay_h-10', // Bottom Left
      BR: 'main_w-overlay_w-10:main_h-overlay_h-10', // Bottom Right
      CENTER: '(main_w-overlay_w)/2:(main_h-overlay_h)/2' // Center
    };

    return positions[position] || positions['TR'];
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(inputPath: string, outputPath: string, timestamp: string = '00:00:01'): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .on('error', reject)
        .on('end', () => {
          console.log('✅ Thumbnail generated');
          resolve();
        })
        .screenshot({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '320x240'
        });
    });
  }
}

export default VideoProcessor;