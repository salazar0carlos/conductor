# Template Marketplace

A comprehensive template marketplace similar to Notion/Webflow templates, allowing users to discover, install, create, and share templates for workflows, tasks, agents, projects, designs, and integrations.

## Overview

The marketplace provides a beautiful, social, and engaging experience for the community to share and discover pre-built templates. Users can browse templates, read reviews, favorite items, and install them with one click.

## Features

### 1. Template Browser
- **Grid and List Views**: Toggle between grid and list layouts
- **Advanced Search**: Full-text search across template names, descriptions, and tags
- **Filtering**: Filter by category, type, pricing, rating, and tags
- **Sorting**: Sort by popularity, recent, rating, trending, and price
- **Quick Filters**: Featured, trending, and 4+ stars buttons
- **Responsive Design**: Mobile-first approach that works on all devices

### 2. Template Types
- **Workflow Templates**: Pre-built automation workflows
- **Task Templates**: Common task configurations
- **Agent Templates**: Agent role definitions
- **Project Templates**: Complete project setups
- **Design Templates**: UI themes and styles
- **Integration Templates**: Common integration patterns

### 3. Template Details Page
- **Rich Media**: Screenshot carousel, video embeds, demo links
- **Comprehensive Info**: Full description, features, installation instructions
- **Reviews & Ratings**: 5-star rating system with written reviews
- **Author Information**: Profile with avatar and name
- **Metadata**: Version, license, publish date, tags
- **Social Features**: Favorite, share, report inappropriate
- **One-Click Install**: Quick installation or configuration wizard

### 4. Template Installation
- **One-Click Install**: Install with default settings
- **Configuration Wizard**: Step-by-step setup for complex templates
- **Field Validation**: Client and server-side validation
- **Progress Tracking**: Visual progress indicator
- **Entity Creation**: Automatically creates workflows, tasks, agents, etc.
- **Success/Failure Handling**: Clear feedback on installation status

### 5. Template Creation
- **Multi-Step Form**: 5-step wizard for creating templates
- **Basic Info**: Name, description, category, type
- **Media Upload**: Thumbnails, screenshots, videos, demos
- **Features & Tags**: Key features and searchable tags
- **Pricing Options**: Free, paid, or freemium
- **License Selection**: MIT, Apache, GPL, BSD, or proprietary
- **Draft Support**: Save as draft before publishing

### 6. User Dashboard
- **Created Templates**: Manage your published templates
- **Installed Templates**: View all installed templates
- **Favorites**: Quick access to favorited templates
- **Analytics**: Install counts, ratings, revenue tracking
- **Template Management**: Edit, delete, publish/unpublish

### 7. Community Features
- **Reviews & Ratings**: 1-5 star ratings with text reviews
- **Verified Purchase Badges**: Show verified installations
- **Review Voting**: Helpful/not helpful voting system
- **Report System**: Flag inappropriate content
- **Featured Templates**: Curated staff picks
- **Trending Section**: Popular templates this week

### 8. Monetization (Ready for Future)
- **Paid Templates**: One-time payment support
- **Freemium Model**: Free basic, paid premium features
- **Revenue Tracking**: Dashboard for template creators
- **Stripe Integration**: Payment processing (to be implemented)
- **Payout System**: Revenue sharing 80/20 (to be implemented)

## Database Schema

### Tables Created
1. **template_categories** - Template categories (Workflows, Tasks, Agents, etc.)
2. **marketplace_templates** - Template listings with metadata
3. **template_reviews** - User reviews and ratings
4. **template_installations** - Installation records
5. **template_collections** - Curated template collections
6. **collection_items** - Templates in collections
7. **template_favorites** - User favorites
8. **review_votes** - Helpful/not helpful votes
9. **template_reports** - Flagged content reports

### Key Features
- **Full-text search** using PostgreSQL GIN indexes
- **Automatic stat updates** via triggers (ratings, favorites, installs)
- **Cascading deletes** for data integrity
- **Version history** tracking
- **Flexible metadata** using JSONB columns

## API Endpoints

### Templates
- `GET /api/marketplace/templates` - List/search templates
- `POST /api/marketplace/templates` - Create template
- `GET /api/marketplace/templates/[id]` - Get template details
- `PATCH /api/marketplace/templates/[id]` - Update template
- `DELETE /api/marketplace/templates/[id]` - Delete template

### Installation
- `POST /api/marketplace/install` - Install a template
- `GET /api/marketplace/installations` - Get user installations

### Reviews
- `GET /api/marketplace/reviews` - Get template reviews
- `POST /api/marketplace/reviews` - Create review
- `POST /api/marketplace/reviews/vote` - Vote on review

### Favorites
- `POST /api/marketplace/favorites` - Toggle favorite
- `GET /api/marketplace/favorites` - Get user favorites

### Categories
- `GET /api/marketplace/categories` - List categories

## Pages

### Public Pages
- `/marketplace` - Main marketplace browser
- `/marketplace/[slug]` - Template details page

### User Pages
- `/marketplace/my-templates` - User dashboard
- `/marketplace/create` - Create new template
- `/marketplace/edit/[id]` - Edit template (coming soon)

## Components

### Core Components
- **TemplateCard** - Beautiful template card (grid/list views)
- **TemplateBrowser** - Search, filter, and browse interface
- **TemplateInstaller** - Installation wizard modal
- **TemplateCreator** - Multi-step template creation form
- **ReviewSection** - Reviews and ratings display
- **ReviewCard** - Individual review with voting

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + Custom CSS variables
- **Icons**: Lucide React
- **Date Formatting**: date-fns
- **Type Safety**: TypeScript with comprehensive types

## Installation

1. **Run the migration**:
   ```sql
   -- Execute /supabase/migrations/20250114_marketplace_system.sql
   ```

2. **Seed categories** (included in migration):
   - Workflows
   - Tasks
   - Agents
   - Projects
   - Designs
   - Integrations

3. **Access the marketplace**:
   - Browse: `/marketplace`
   - Create: `/marketplace/create`
   - Dashboard: `/marketplace/my-templates`

## Usage Examples

### Creating a Template

1. Click "Share Template" on the marketplace page
2. Fill in basic information (name, description, category)
3. Add media (thumbnails, screenshots, videos)
4. List key features and add tags
5. Set pricing and license
6. Review and publish

### Installing a Template

1. Browse or search for a template
2. Click on a template card to view details
3. Review features, screenshots, and reviews
4. Click "Install Template"
5. Complete configuration wizard (if required)
6. Template is installed and entity is created

### Managing Templates

1. Go to "My Templates" dashboard
2. View tabs: Created, Installed, Favorites
3. See analytics for created templates
4. Edit, delete, or manage visibility

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: Screen reader compatible
- **Contrast Ratios**: WCAG 2.1 AA compliant
- **Focus Indicators**: Clear focus states
- **Semantic HTML**: Proper heading hierarchy

## Performance

- **Lazy Loading**: Images loaded on demand
- **Pagination**: API endpoints support pagination
- **Indexes**: Optimized database queries
- **Caching**: Response caching ready
- **Bundle Optimization**: Code splitting

## Security

- **Authentication**: Required for creating, installing, favoriting
- **Authorization**: Users can only edit their own templates
- **Input Validation**: Client and server-side validation
- **SQL Injection**: Protected via Supabase
- **XSS Protection**: React auto-escaping

## Future Enhancements

### Short Term
- Template collections/bundles
- Template preview/sandbox mode
- Version control and updates
- Template forks/remixes
- Admin moderation panel

### Long Term
- Payment processing (Stripe)
- Payout system for creators
- Template analytics dashboard
- A/B testing for thumbnails
- AI-powered recommendations
- Template marketplace API

## File Structure

```
/home/user/conductor/
├── supabase/migrations/
│   └── 20250114_marketplace_system.sql
├── lib/marketplace/
│   └── types.ts
├── components/marketplace/
│   ├── template-card.tsx
│   ├── template-browser.tsx
│   ├── template-installer.tsx
│   ├── template-creator.tsx
│   └── review-section.tsx
├── app/marketplace/
│   ├── page.tsx
│   ├── [slug]/page.tsx
│   ├── my-templates/page.tsx
│   └── create/page.tsx
└── app/api/marketplace/
    ├── templates/route.ts
    ├── templates/[id]/route.ts
    ├── install/route.ts
    ├── reviews/route.ts
    ├── reviews/vote/route.ts
    ├── favorites/route.ts
    ├── categories/route.ts
    └── installations/route.ts
```

## Key Design Decisions

1. **Supabase Triggers**: Automatically update stats (ratings, favorites) to avoid manual calculations
2. **JSONB Columns**: Flexible template_data storage for different template types
3. **Slug-based URLs**: SEO-friendly URLs using template slugs
4. **Verified Purchase**: Track installations to show verified reviews
5. **Soft Deletes**: Could be added via status field instead of hard deletes
6. **Version History**: JSONB array for tracking template versions
7. **Multi-step Forms**: Better UX for complex template creation
8. **Configuration Wizard**: Flexible JSON schema-based configuration

## Contributing

When adding new template types:
1. Update the `TemplateType` in types.ts
2. Add handling in the install API endpoint
3. Create appropriate database tables/relations
4. Update the type selector in template creator

## Support

For issues or questions:
- Check the database migration logs
- Verify API endpoint responses
- Review Supabase logs for errors
- Check browser console for client errors

## License

This marketplace system is part of the Conductor platform and follows the project's license.
