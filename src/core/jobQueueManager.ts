/**
 * Job Queue Manager
 * Handles video processing job queuing and management
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  priority: number;
  data: any;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export class JobQueueManager extends EventEmitter {
  private queue: Job[] = [];
  private processingJob: Job | null = null;
  private maxConcurrent: number;
  private activeJobs: number = 0;

  constructor(maxConcurrent: number = 1) {
    super();
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add job to queue
   */
  addJob(type: string, data: any, priority: number = 0): Job {
    const job: Job = {
      id: uuidv4(),
      type,
      status: 'pending',
      priority,
      data,
      progress: 0,
      createdAt: new Date()
    };

    this.queue.push(job);
    this.sortQueue();
    this.emit('job-added', job);
    this.processNext();

    console.log(`📋 Job added: ${job.id} (${type})`);
    return job;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.queue.find((j) => j.id === jobId) || (this.processingJob?.id === jobId ? this.processingJob : undefined);
  }

  /**
   * Update job progress
   */
  updateProgress(jobId: string, progress: number): void {
    const job = this.getJob(jobId);
    if (job) {
      job.progress = Math.min(100, progress);
      this.emit('progress', { jobId, progress: job.progress });
    }
  }

  /**
   * Complete job
   */
  completeJob(jobId: string): void {
    const job = this.getJob(jobId);
    if (job) {
      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;
      this.emit('job-completed', job);
      console.log(`✅ Job completed: ${jobId}`);

      if (this.processingJob?.id === jobId) {
        this.processingJob = null;
        this.activeJobs--;
        this.processNext();
      }
    }
  }

  /**
   * Fail job
   */
  failJob(jobId: string, error: string): void {
    const job = this.getJob(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error;
      job.completedAt = new Date();
      this.emit('job-failed', job);
      console.log(`❌ Job failed: ${jobId} - ${error}`);

      if (this.processingJob?.id === jobId) {
        this.processingJob = null;
        this.activeJobs--;
        this.processNext();
      }
    }
  }

  /**
   * Cancel job
   */
  cancelJob(jobId: string): boolean {
    const index = this.queue.findIndex((j) => j.id === jobId);
    if (index >= 0) {
      const job = this.queue.splice(index, 1)[0];
      this.emit('job-cancelled', job);
      console.log(`🚫 Job cancelled: ${jobId}`);
      return true;
    }
    return false;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    activeJobs: number;
  } {
    const allJobs = [...this.queue, ...(this.processingJob ? [this.processingJob] : [])];

    return {
      total: allJobs.length,
      pending: allJobs.filter((j) => j.status === 'pending').length,
      processing: allJobs.filter((j) => j.status === 'processing').length,
      completed: allJobs.filter((j) => j.status === 'completed').length,
      failed: allJobs.filter((j) => j.status === 'failed').length,
      activeJobs: this.activeJobs
    };
  }

  /**
   * Get all jobs
   */
  getAllJobs(status?: JobStatus): Job[] {
    const allJobs = [...this.queue, ...(this.processingJob ? [this.processingJob] : [])];
    if (status) {
      return allJobs.filter((j) => j.status === status);
    }
    return allJobs;
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): number {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter((j) => j.status !== 'completed');
    const removed = initialLength - this.queue.length;
    console.log(`🧹 Cleared ${removed} completed jobs`);
    return removed;
  }

  /**
   * Sort queue by priority (higher priority first)
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process next job in queue
   */
  private async processNext(): Promise<void> {
    if (this.activeJobs >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) {
      return;
    }

    this.processingJob = job;
    job.status = 'processing';
    job.startedAt = new Date();
    this.activeJobs++;

    this.emit('job-started', job);
    console.log(`⚙️ Job started: ${job.id} (${job.type})`);
  }

  /**
   * Wait for job completion
   */
  async waitForJob(jobId: string, timeout: number = 300000): Promise<Job> {
    return new Promise((resolve, reject) => {
      const job = this.getJob(jobId);
      if (!job) {
        reject(new Error(`Job ${jobId} not found`));
        return;
      }

      if (job.status === 'completed') {
        resolve(job);
        return;
      }

      if (job.status === 'failed') {
        reject(new Error(job.error || 'Job failed'));
        return;
      }

      const timer = setTimeout(() => {
        this.removeAllListeners('job-completed');
        this.removeAllListeners('job-failed');
        reject(new Error(`Job ${jobId} timeout`));
      }, timeout);

      const onCompleted = (completedJob: Job) => {
        if (completedJob.id === jobId) {
          clearTimeout(timer);
          this.removeAllListeners('job-completed');
          this.removeAllListeners('job-failed');
          resolve(completedJob);
        }
      };

      const onFailed = (failedJob: Job) => {
        if (failedJob.id === jobId) {
          clearTimeout(timer);
          this.removeAllListeners('job-completed');
          this.removeAllListeners('job-failed');
          reject(new Error(failedJob.error || 'Job failed'));
        }
      };

      this.on('job-completed', onCompleted);
      this.on('job-failed', onFailed);
    });
  }
}

export default JobQueueManager;