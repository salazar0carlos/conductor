// Marketplace Types
// Type definitions for the template marketplace system

export type TemplateType = 'workflow' | 'task' | 'agent' | 'project' | 'design' | 'integration'
export type PricingType = 'free' | 'paid' | 'freemium'
export type TemplateVisibility = 'public' | 'private' | 'team' | 'unlisted'
export type TemplateStatus = 'draft' | 'published' | 'archived' | 'rejected'
export type ReviewStatus = 'pending' | 'published' | 'flagged' | 'removed'
export type InstallationStatus = 'active' | 'inactive' | 'failed'
export type ReportReason = 'spam' | 'inappropriate' | 'copyright' | 'broken' | 'other'
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'
export type SortOption = 'popular' | 'recent' | 'rating' | 'price-low' | 'price-high' | 'trending'
export type ViewMode = 'grid' | 'list'

export interface TemplateCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  display_order: number
  created_at: string
}

export interface MarketplaceTemplate {
  id: string
  name: string
  slug: string
  description: string
  long_description?: string
  category_id: string
  type: TemplateType

  // Author
  author_id: string
  author_name: string
  author_avatar?: string

  // Pricing
  pricing_type: PricingType
  price: number
  currency: string

  // Visibility
  visibility: TemplateVisibility
  status: TemplateStatus

  // Media
  thumbnail_url?: string
  screenshots: string[]
  video_url?: string
  demo_url?: string

  // Metadata
  template_data: Record<string, any>
  version: string
  version_history: VersionHistoryItem[]

  // Features
  features: string[]
  requirements: Record<string, any>
  tags: string[]

  // Installation
  installation_instructions?: string
  config_schema?: Record<string, any>

  // License
  license: string
  license_url?: string

  // Stats
  install_count: number
  view_count: number
  favorite_count: number
  average_rating: number
  review_count: number

  // SEO
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]

  // Flags
  is_featured: boolean
  is_staff_pick: boolean
  is_trending: boolean

  created_at: string
  updated_at: string
  published_at?: string

  // Populated fields
  category?: TemplateCategory
  is_favorited?: boolean
  user_installation?: TemplateInstallation
}

export interface VersionHistoryItem {
  version: string
  changes: string[]
  released_at: string
}

export interface TemplateReview {
  id: string
  template_id: string
  user_id: string
  user_name: string
  user_avatar?: string

  rating: number
  title?: string
  content: string

  helpful_count: number
  not_helpful_count: number

  is_verified_purchase: boolean
  status: ReviewStatus

  created_at: string
  updated_at: string

  // Populated
  user_vote?: 'helpful' | 'not_helpful'
}

export interface TemplateInstallation {
  id: string
  template_id: string
  user_id: string

  installed_version: string
  configuration: Record<string, any>
  status: InstallationStatus

  entity_type?: string
  entity_id?: string

  installed_at: string
  last_used_at?: string
  uninstalled_at?: string

  // Populated
  template?: MarketplaceTemplate
}

export interface TemplateCollection {
  id: string
  name: string
  slug: string
  description?: string
  cover_image_url?: string

  curator_id: string
  curator_name: string
  is_official: boolean

  visibility: TemplateVisibility

  created_at: string
  updated_at: string

  // Populated
  template_count?: number
  templates?: MarketplaceTemplate[]
}

export interface CollectionItem {
  id: string
  collection_id: string
  template_id: string
  display_order: number
  added_at: string
}

export interface TemplateFavorite {
  id: string
  template_id: string
  user_id: string
  created_at: string
}

export interface ReviewVote {
  id: string
  review_id: string
  user_id: string
  vote_type: 'helpful' | 'not_helpful'
  created_at: string
}

export interface TemplateReport {
  id: string
  template_id?: string
  review_id?: string
  reporter_id: string
  reason: ReportReason
  description?: string
  status: ReportStatus
  created_at: string
  resolved_at?: string
}

// API Request/Response types
export interface MarketplaceFilters {
  category?: string
  type?: TemplateType
  pricing?: PricingType
  minRating?: number
  tags?: string[]
  search?: string
  featured?: boolean
  trending?: boolean
  sort?: SortOption
  page?: number
  limit?: number
}

export interface TemplateSearchResult {
  templates: MarketplaceTemplate[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface CreateTemplateInput {
  name: string
  description: string
  long_description?: string
  category_id: string
  type: TemplateType
  pricing_type?: PricingType
  price?: number
  template_data: Record<string, any>
  features?: string[]
  requirements?: Record<string, any>
  tags?: string[]
  installation_instructions?: string
  config_schema?: Record<string, any>
  thumbnail_url?: string
  screenshots?: string[]
  video_url?: string
  demo_url?: string
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  status?: TemplateStatus
  visibility?: TemplateVisibility
}

export interface CreateReviewInput {
  rating: number
  title?: string
  content: string
}

export interface InstallTemplateInput {
  template_id: string
  configuration?: Record<string, any>
}

export interface InstallationResult {
  installation: TemplateInstallation
  entity_id?: string
  entity_type?: string
  success: boolean
  message?: string
}

// Template configuration wizard types
export interface ConfigField {
  name: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea'
  required?: boolean
  default?: any
  options?: Array<{ label: string; value: any }>
  placeholder?: string
  help_text?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface ConfigStep {
  title: string
  description?: string
  fields: ConfigField[]
}

export interface TemplateConfigSchema {
  steps: ConfigStep[]
}

// Analytics types
export interface TemplateAnalytics {
  template_id: string
  views_today: number
  views_week: number
  views_month: number
  installs_today: number
  installs_week: number
  installs_month: number
  revenue_today: number
  revenue_week: number
  revenue_month: number
  average_rating: number
  review_count: number
  favorite_count: number
}

export interface UserTemplateStats {
  created_count: number
  published_count: number
  total_installs: number
  total_revenue: number
  average_rating: number
  total_reviews: number
}
