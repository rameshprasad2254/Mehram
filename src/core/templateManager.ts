/**
 * Video Template Manager
 * Manages video templates and presets
 */

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  bitrate: string;
  scale?: string;
}

export interface TemplatePreset {
  name: string;
  quality: 'low' | 'medium' | 'high' | '4k';
  width: number;
  height: number;
  bitrate: string;
}

export class TemplateManager {
  private templates: Map<string, TemplateConfig>;
  private presets: Map<string, TemplatePreset>;

  constructor() {
    this.templates = new Map();
    this.presets = new Map();
    this.initializePresets();
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize quality presets
   */
  private initializePresets(): void {
    this.presets.set('low', {
      name: 'Low Quality',
      quality: 'low',
      width: 640,
      height: 480,
      bitrate: '500k'
    });

    this.presets.set('medium', {
      name: 'Medium Quality',
      quality: 'medium',
      width: 1280,
      height: 720,
      bitrate: '2500k'
    });

    this.presets.set('high', {
      name: 'High Quality',
      quality: 'high',
      width: 1920,
      height: 1080,
      bitrate: '5000k'
    });

    this.presets.set('4k', {
      name: '4K Quality',
      quality: '4k',
      width: 3840,
      height: 2160,
      bitrate: '20000k'
    });
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const preset = this.presets.get('medium')!;

    this.templates.set('default', {
      id: 'default',
      name: 'Default Template',
      description: 'Basic video template',
      width: preset.width,
      height: preset.height,
      fps: 30,
      duration: 60,
      bitrate: preset.bitrate
    });

    this.templates.set('short', {
      id: 'short',
      name: 'Short Video',
      description: 'Template for short videos (15 seconds)',
      width: 1280,
      height: 720,
      fps: 30,
      duration: 15,
      bitrate: '2000k'
    });

    this.templates.set('intro', {
      id: 'intro',
      name: 'Intro Template',
      description: 'Template for video intros (5 seconds)',
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5,
      bitrate: '5000k'
    });

    this.templates.set('social', {
      id: 'social',
      name: 'Social Media',
      description: 'Template optimized for social media (Instagram, TikTok)',
      width: 1080,
      height: 1920,
      fps: 30,
      duration: 30,
      bitrate: '3000k'
    });
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): TemplateConfig | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Create custom template
   */
  createTemplate(config: TemplateConfig): void {
    this.templates.set(config.id, config);
    console.log(`📋 Template created: ${config.name}`);
  }

  /**
   * Update template
   */
  updateTemplate(templateId: string, updates: Partial<TemplateConfig>): void {
    const existing = this.templates.get(templateId);
    if (!existing) {
      throw new Error(`Template ${templateId} not found`);
    }

    const updated = { ...existing, ...updates };
    this.templates.set(templateId, updated);
    console.log(`✏️ Template updated: ${templateId}`);
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): void {
    if (templateId === 'default') {
      throw new Error('Cannot delete default template');
    }

    this.templates.delete(templateId);
    console.log(`🗑️ Template deleted: ${templateId}`);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): TemplateConfig[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get preset
   */
  getPreset(presetName: string): TemplatePreset | undefined {
    return this.presets.get(presetName);
  }

  /**
   * Get all presets
   */
  getAllPresets(): TemplatePreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Apply preset to template
   */
  applyPreset(templateId: string, presetName: string): void {
    const template = this.templates.get(templateId);
    const preset = this.presets.get(presetName);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    if (!preset) {
      throw new Error(`Preset ${presetName} not found`);
    }

    template.width = preset.width;
    template.height = preset.height;
    template.bitrate = preset.bitrate;

    console.log(`🎨 Preset ${presetName} applied to template ${templateId}`);
  }

  /**
   * Clone template
   */
  cloneTemplate(sourceId: string, newId: string, newName: string): void {
    const source = this.templates.get(sourceId);
    if (!source) {
      throw new Error(`Template ${sourceId} not found`);
    }

    const cloned: TemplateConfig = {
      ...source,
      id: newId,
      name: newName
    };

    this.templates.set(newId, cloned);
    console.log(`📋 Template cloned: ${sourceId} -> ${newId}`);
  }
}

export default TemplateManager;