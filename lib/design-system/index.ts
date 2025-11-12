/**
 * Design System - Conductor's centralized design template library
 *
 * Provides curated design templates for every type of application
 */

// Types
export * from './types';

// Templates
export { minimalTemplate } from './templates/minimal';
export { boldTemplate } from './templates/bold';
export { glassmorphicTemplate } from './templates/glassmorphic';
export { landingTemplate } from './templates/landing';
export { enterpriseTemplate } from './templates/enterprise';

// Registry
export {
  DesignTemplateRegistry,
  getTemplate,
  getAllTemplates,
  getPopularTemplates,
  getTemplateRecommendations,
} from './registry';

// Template Application
export {
  DesignTemplateApplicator,
  generateTemplateFiles,
  getInstallationInstructions,
} from './apply-template';
