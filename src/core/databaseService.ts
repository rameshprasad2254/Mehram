/**
 * Database Service
 * Handles database operations and metadata storage
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { promisify } from 'util';

export interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  filePath: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DatabaseService {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor(dbPath: string = './mehram.db') {
    this.dbPath = dbPath;
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  /**
   * Initialize database tables
   */
  private initializeTables(): void {
    this.db.serialize(() => {
      // Videos table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS videos (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          filePath TEXT NOT NULL,
          size INTEGER,
          duration REAL,
          width INTEGER,
          height INTEGER,
          fps INTEGER,
          format TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Jobs table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          priority INTEGER,
          data TEXT,
          progress REAL,
          error TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          startedAt DATETIME,
          completedAt DATETIME
        )
      `);

      // Processing logs table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS processing_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          jobId TEXT NOT NULL,
          videoId TEXT,
          status TEXT NOT NULL,
          message TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (jobId) REFERENCES jobs(id),
          FOREIGN KEY (videoId) REFERENCES videos(id)
        )
      `);

      // Templates table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          config TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Database tables initialized');
    });
  }

  /**
   * Save video metadata
   */
  saveVideoMetadata(metadata: VideoMetadata): Promise<void> {
    return new Promise((resolve, reject) => {
      const { id, title, description, filePath, size, duration, width, height, fps, format } = metadata;

      this.db.run(
        `INSERT OR REPLACE INTO videos (id, title, description, filePath, size, duration, width, height, fps, format, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, title, description || '', filePath, size, duration, width, height, fps, format],
        (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`📝 Video metadata saved: ${id}`);
            resolve();
          }
        }
      );
    });
  }

  /**
   * Get video metadata
   */
  getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM videos WHERE id = ?', [videoId], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get all videos
   */
  getAllVideos(limit: number = 100, offset: number = 0): Promise<VideoMetadata[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM videos ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [limit, offset],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(
              rows.map((row) => ({
                ...row,
                createdAt: new Date(row.createdAt),
                updatedAt: new Date(row.updatedAt)
              }))
            );
          }
        }
      );
    });
  }

  /**
   * Delete video metadata
   */
  deleteVideoMetadata(videoId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM videos WHERE id = ?', [videoId], (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`🗑️ Video metadata deleted: ${videoId}`);
          resolve();
        }
      });
    });
  }

  /**
   * Save job record
   */
  saveJob(jobId: string, type: string, status: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO jobs (id, type, status, data) VALUES (?, ?, ?, ?)',
        [jobId, type, status, JSON.stringify(data)],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Add processing log
   */
  addProcessingLog(jobId: string, videoId: string | null, status: string, message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO processing_logs (jobId, videoId, status, message) VALUES (?, ?, ?, ?)',
        [jobId, videoId, status, message],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Get processing logs
   */
  getProcessingLogs(jobId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM processing_logs WHERE jobId = ? ORDER BY timestamp DESC', [jobId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Close database connection
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('🔌 Database connection closed');
          resolve();
        }
      });
    });
  }

  /**
   * Get database statistics
   */
  getStatistics(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT
          (SELECT COUNT(*) FROM videos) as totalVideos,
          (SELECT SUM(size) FROM videos) as totalSize,
          (SELECT COUNT(*) FROM jobs WHERE status = 'completed') as completedJobs,
          (SELECT COUNT(*) FROM jobs WHERE status = 'processing') as processingJobs,
          (SELECT COUNT(*) FROM jobs WHERE status = 'failed') as failedJobs
        `,
        [],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows?.[0] || {});
          }
        }
      );
    });
  }
}

export default DatabaseService;