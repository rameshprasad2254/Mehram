/**
 * Storage Service
 * Handles file management and storage operations
 */

import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

export interface StorageConfig {
  baseDir: string;
  maxFileSize: number; // in bytes
  allowedFormats: string[];
}

export class StorageService {
  private config: StorageConfig;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      baseDir: config.baseDir || process.env.VIDEO_OUTPUT_DIR || './output',
      maxFileSize: config.maxFileSize || 5 * 1024 * 1024 * 1024, // 5GB
      allowedFormats: config.allowedFormats || ['mp4', 'avi', 'mov', 'mkv', 'webm'],
      ...config
    };

    this.initializeDirectories();
  }

  /**
   * Initialize storage directories
   */
  private async initializeDirectories(): Promise<void> {
    try {
      const dirs = ['videos', 'thumbnails', 'temp', 'uploads'];

      for (const dir of dirs) {
        const dirPath = path.join(this.config.baseDir, dir);
        await fs.mkdir(dirPath, { recursive: true });
      }

      console.log('📁 Storage directories initialized');
    } catch (error) {
      console.error('Error initializing storage directories:', error);
    }
  }

  /**
   * Save file to storage
   */
  async saveFile(sourceStream: any, fileName: string, subDir: string = 'videos'): Promise<string> {
    const filePath = path.join(this.config.baseDir, subDir, fileName);

    // Validate file format
    const ext = path.extname(fileName).slice(1);
    if (!this.config.allowedFormats.includes(ext)) {
      throw new Error(`File format .${ext} is not allowed`);
    }

    try {
      const writeStream = createWriteStream(filePath);
      await pipeline(sourceStream, writeStream);
      console.log(`📁 File saved: ${filePath}`);
      return filePath;
    } catch (error) {
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Read file from storage
   */
  async readFile(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ File deleted: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Copy file
   */
  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      await fs.copyFile(sourcePath, destPath);
      console.log(`📋 File copied: ${sourcePath} -> ${destPath}`);
    } catch (error) {
      throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath: string): Promise<any> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      };
    } catch (error) {
      throw new Error(`Failed to get file stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files in directory
   */
  async listFiles(subDir: string = 'videos'): Promise<string[]> {
    try {
      const dirPath = path.join(this.config.baseDir, subDir);
      return await fs.readdir(dirPath);
    } catch (error) {
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage usage
   */
  async getStorageUsage(): Promise<{ total: number; used: number; available: number }> {
    try {
      let total = 0;
      const dirPath = this.config.baseDir;

      const files = await fs.readdir(dirPath, { recursive: true });

      for (const file of files) {
        const filePath = path.join(dirPath, file as string);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          total += stats.size;
        }
      }

      return {
        total,
        used: total,
        available: this.config.maxFileSize - total
      };
    } catch (error) {
      throw new Error(`Failed to get storage usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean temporary files
   */
  async cleanTemp(): Promise<number> {
    try {
      const tempDir = path.join(this.config.baseDir, 'temp');
      const files = await fs.readdir(tempDir);
      let cleaned = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        await fs.unlink(filePath);
        cleaned++;
      }

      console.log(`🧹 Cleaned ${cleaned} temporary files`);
      return cleaned;
    } catch (error) {
      console.error('Error cleaning temp files:', error);
      return 0;
    }
  }

  /**
   * Get base directory path
   */
  getBasePath(): string {
    return this.config.baseDir;
  }

  /**
   * Get full path for subdirectory
   */
  getPath(subDir: string): string {
    return path.join(this.config.baseDir, subDir);
  }
}

export default StorageService;