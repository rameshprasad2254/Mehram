/**
 * Processing Service
 * Orchestrates video processing with all components
 */

import { VideoGenerator } from './videoGenerator';
import { VideoProcessor } from './videoProcessor';
import { TemplateManager } from './templateManager';
import { StorageService } from './storageService';
import { JobQueueManager, Job } from './jobQueueManager';
import { DatabaseService } from './databaseService';

export interface ProcessingRequest {
  templateId?: string;
  inputPath?: string;
  outputFileName: string;
  metadata: {
    title: string;
    description?: string;
  };
  options?: any;
}

export class ProcessingService {
  private generator: VideoGenerator;
  private processor: VideoProcessor;
  private templateManager: TemplateManager;
  private storageService: StorageService;
  private jobQueue: JobQueueManager;
  private database: DatabaseService;

  constructor() {
    this.generator = new VideoGenerator();
    this.processor = new VideoProcessor();
    this.templateManager = new TemplateManager();
    this.storageService = new StorageService();
    this.jobQueue = new JobQueueManager(2); // Max 2 concurrent jobs
    this.database = new DatabaseService();

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Job queue events
    this.jobQueue.on('job-started', (job: Job) => {
      console.log(`📍 Job ${job.id} started`);
      this.database.addProcessingLog(job.id, null, 'started', `Job started: ${job.type}`);
    });

    this.jobQueue.on('progress', ({ jobId, progress }: any) => {
      console.log(`📊 Job ${jobId} progress: ${progress}%`);
    });

    this.jobQueue.on('job-completed', (job: Job) => {
      console.log(`✅ Job ${job.id} completed`);
      this.database.addProcessingLog(job.id, null, 'completed', 'Job completed successfully');
    });

    this.jobQueue.on('job-failed', (job: Job) => {
      console.log(`❌ Job ${job.id} failed: ${job.error}`);
      this.database.addProcessingLog(job.id, null, 'failed', job.error || 'Unknown error');
    });

    // Video processor events
    this.processor.on('progress', (progress: any) => {
      console.log(`🎬 FFmpeg progress:`, progress);
    });
  }

  /**
   * Process video
   */
  async processVideo(request: ProcessingRequest): Promise<Job> {
    const job = this.jobQueue.addJob('process-video', request, 0);

    try {
      // Get template
      const templateId = request.templateId || 'default';
      const template = this.templateManager.getTemplate(templateId);

      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Update job status
      this.jobQueue.updateProgress(job.id, 10);
      await this.database.saveJob(job.id, 'process-video', 'processing', request);

      // Process video
      let outputPath: string;

      if (request.inputPath) {
        // Process existing video
        outputPath = await this.processExistingVideo(
          job.id,
          request.inputPath,
          request.outputFileName,
          template
        );
      } else {
        // Generate new video
        outputPath = await this.generateNewVideo(
          job.id,
          request.outputFileName,
          template,
          request.options
        );
      }

      // Save metadata
      await this.saveVideoMetadata(job.id, outputPath, request.metadata);

      this.jobQueue.updateProgress(job.id, 100);
      this.jobQueue.completeJob(job.id);

      return job;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.jobQueue.failJob(job.id, errorMessage);
      throw error;
    }
  }

  /**
   * Process existing video
   */
  private async processExistingVideo(
    jobId: string,
    inputPath: string,
    outputFileName: string,
    template: any
  ): Promise<string> {
    const outputPath = `${this.storageService.getPath('videos')}/${outputFileName}`;

    this.jobQueue.updateProgress(jobId, 20);
    await this.database.addProcessingLog(jobId, null, 'processing', 'Starting video processing');

    // Process video
    await this.processor.processVideo({
      inputPath,
      outputPath,
      quality: template.quality,
      fps: template.fps,
      scale: `${template.width}x${template.height}`
    });

    this.jobQueue.updateProgress(jobId, 80);
    return outputPath;
  }

  /**
   * Generate new video
   */
  private async generateNewVideo(
    jobId: string,
    outputFileName: string,
    template: any,
    options: any
  ): Promise<string> {
    const outputPath = `${this.storageService.getPath('videos')}/${outputFileName}`;

    this.jobQueue.updateProgress(jobId, 30);
    await this.database.addProcessingLog(jobId, null, 'generating', 'Starting video generation');

    // Generate video
    const path = await this.generator.generateVideo({
      ...options,
      template,
      outputPath
    });

    this.jobQueue.updateProgress(jobId, 80);
    return path;
  }

  /**
   * Save video metadata
   */
  private async saveVideoMetadata(jobId: string, filePath: string, metadata: any): Promise<void> {
    const stats = await this.storageService.getFileStats(filePath);

    await this.database.saveVideoMetadata({
      id: jobId,
      title: metadata.title,
      description: metadata.description,
      filePath,
      size: stats.size,
      duration: 0, // TODO: Extract from video
      width: 1920,
      height: 1080,
      fps: 30,
      format: 'mp4',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Get processing status
   */
  getStatus(): any {
    return this.jobQueue.getQueueStatus();
  }

  /**
   * Get all templates
   */
  getTemplates(): any[] {
    return this.templateManager.getAllTemplates();
  }

  /**
   * Get storage usage
   */
  async getStorageUsage(): Promise<any> {
    return this.storageService.getStorageUsage();
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<any> {
    return this.database.getStatistics();
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    await this.storageService.cleanTemp();
    await this.database.close();
    console.log('🧹 Cleanup completed');
  }
}

export default ProcessingService;