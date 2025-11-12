/**
 * Design Template Registry
 *
 * Central registry of all available design templates
 */

import { DesignTemplate } from './types';
import { minimalTemplate } from './templates/minimal';
import { boldTemplate } from './templates/bold';
import { glassmorphicTemplate } from './templates/glassmorphic';
import { landingTemplate } from './templates/landing';
import { enterpriseTemplate } from './templates/enterprise';

export class DesignTemplateRegistry {
  private static templates: Map<string, DesignTemplate> = new Map();

  /**
   * Initialize the registry with default templates
   */
  static initialize(): void {
    this.register(minimalTemplate);
    this.register(boldTemplate);
    this.register(glassmorphicTemplate);
    this.register(landingTemplate);
    this.register(enterpriseTemplate);
  }

  /**
   * Register a design template
   */
  static register(template: DesignTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a template by ID
   */
  static getTemplate(id: string): DesignTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  static getAllTemplates(): DesignTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: DesignTemplate['category']): DesignTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.category === category);
  }

  /**
   * Get most popular templates
   */
  static getPopularTemplates(limit: number = 5): DesignTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => (b.metadata.popularityScore || 0) - (a.metadata.popularityScore || 0))
      .slice(0, limit);
  }

  /**
   * Search templates by tags
   */
  static searchByTags(tags: string[]): DesignTemplate[] {
    return Array.from(this.templates.values()).filter((template) =>
      tags.some((tag) => template.metadata.tags.includes(tag.toLowerCase()))
    );
  }

  /**
   * Get template recommendations based on app type
   */
  static getRecommendations(appType: string): DesignTemplate[] {
    const recommendations: Record<string, string[]> = {
      saas: ['minimal', 'glassmorphic', 'enterprise'],
      marketing: ['landing', 'bold'],
      dashboard: ['minimal', 'enterprise'],
      ecommerce: ['bold', 'glassmorphic', 'landing'],
      portfolio: ['minimal', 'glassmorphic'],
      corporate: ['enterprise', 'minimal'],
    };

    const templateIds = recommendations[appType.toLowerCase()] || ['minimal'];
    return templateIds
      .map((id) => this.getTemplate(id))
      .filter((t): t is DesignTemplate => t !== undefined);
  }
}

// Initialize on module load
DesignTemplateRegistry.initialize();

// Export convenience functions
export function getTemplate(id: string): DesignTemplate | undefined {
  return DesignTemplateRegistry.getTemplate(id);
}

export function getAllTemplates(): DesignTemplate[] {
  return DesignTemplateRegistry.getAllTemplates();
}

export function getPopularTemplates(limit?: number): DesignTemplate[] {
  return DesignTemplateRegistry.getPopularTemplates(limit);
}

export function getTemplateRecommendations(appType: string): DesignTemplate[] {
  return DesignTemplateRegistry.getRecommendations(appType);
}
