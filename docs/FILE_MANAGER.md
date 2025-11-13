# Comprehensive File Manager & Asset Library

A professional-grade file management system like Dropbox meets Figma, built with Next.js, React, and Supabase.

## Features

### 1. File Browser
- **Grid and List Views**: Toggle between visual grid and detailed list layouts
- **Unlimited Folder Nesting**: Organize files in hierarchical folder structures
- **Drag-and-Drop Upload**: Drop files anywhere to upload instantly
- **Drag-and-Drop File Management**: Move files between folders
- **Breadcrumb Navigation**: Easy navigation through folder hierarchy
- **Advanced Search**: Search by name, tags, type, size, and date
- **Multiple Sort Options**: Sort by name, date, size, or type
- **Quick Preview**: Instant preview for images, PDFs, videos, and text files
- **Bulk Operations**: Select and manage multiple files at once

### 2. Upload System
- **Multi-File Upload**: Upload multiple files simultaneously
- **Progress Tracking**: Real-time upload progress with percentage
- **Drag-and-Drop**: Drop files or folders anywhere
- **Paste to Upload**: Ctrl+V to upload from clipboard
- **URL Upload**: Upload files directly from URLs
- **Background Processing**: Automatic thumbnail generation and metadata extraction
- **Duplicate Detection**: Warns about potential duplicate files
- **Error Handling**: Retry failed uploads with one click

### 3. File Management
- **Rename**: Change file names easily
- **Move/Copy**: Organize files across folders
- **Delete**: Safe deletion with confirmation
- **Bulk Operations**: Perform actions on multiple files
- **Share Files**: Generate public links with expiry dates
- **Favorites**: Star important files for quick access
- **Tags**: Add custom tags for better organization
- **Activity Timeline**: Track all file operations
- **Comments**: Collaborate with file comments

### 4. Media Gallery
- **Beautiful Lightbox**: Full-screen image and video viewing
- **Slideshow Mode**: Automatic slideshow with 3-second intervals
- **Keyboard Navigation**: Arrow keys, zoom controls, ESC to close
- **Zoom Controls**: Zoom in/out on images (25% to 400%)
- **Thumbnail Strip**: Navigate between media files visually
- **Video Player**: Built-in video player with controls
- **Audio Player**: Audio playback with controls

### 5. File Preview
- **Multiple File Types**: Preview images, videos, audio, PDFs, and code
- **Code Syntax Highlighting**: Monaco Editor for code files
- **PDF Viewer**: Embedded PDF viewing
- **Details Tab**: View file metadata, size, dates, dimensions
- **Comments Tab**: Add and view file comments
- **Activity Tab**: See complete file history
- **Next/Previous**: Navigate between files without closing preview
- **Download & Share**: Quick actions in preview

### 6. Asset Library for Design
- **Color Palettes**: Organize brand colors with hex values
- **Icon Library**: Store and organize design icons
- **Image Collections**: Curate image sets
- **Font Library**: Manage typography assets
- **Logo Variations**: Store different logo versions
- **Brand Assets**: Centralized brand asset management

### 7. AI Features (Ready for Integration)
- **Auto-Tagging**: Automatically suggest tags based on content
- **Smart Search**: Describe what you're looking for
- **Duplicate Detection**: Find similar files automatically
- **Background Removal**: Remove backgrounds from images
- **Image Enhancement**: AI-powered quality improvements
- **OCR**: Extract text from images and PDFs
- **File Compression**: Optimize file sizes

### 8. Advanced Features
- **Storage Analytics**: Visual breakdown of storage usage
- **File Preview Thumbnails**: Automatic thumbnail generation
- **CDN Ready**: Designed for CDN integration
- **Image Transformations**: Resize, crop, format conversion
- **Metadata Management**: Edit and view file metadata
- **Version History**: Track file versions over time
- **Team Sharing**: Share with permissions control
- **Activity Logging**: Complete audit trail

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes, Supabase
- **Storage**: Supabase Storage
- **Database**: PostgreSQL (Supabase)
- **UI Components**: Custom components with CSS variables
- **Code Editor**: Monaco Editor
- **Icons**: Lucide React

## File Structure

```
/home/user/conductor/
├── app/
│   ├── files/
│   │   └── page.tsx                 # Main file manager page
│   └── api/
│       └── files/
│           ├── route.ts             # File CRUD operations
│           ├── upload/route.ts      # File upload handler
│           ├── operations/route.ts  # Batch operations
│           ├── folders/route.ts     # Folder management
│           ├── transform/route.ts   # AI transformations
│           └── stats/route.ts       # Storage analytics
├── components/
│   └── file-manager/
│       ├── file-browser.tsx         # Main browser interface
│       ├── upload-zone.tsx          # Upload component
│       ├── file-preview.tsx         # Preview modal
│       ├── media-gallery.tsx        # Lightbox gallery
│       ├── file-operations.tsx      # Operations modal
│       └── asset-library.tsx        # Asset management
├── lib/
│   └── utils/
│       └── file-utils.ts            # File utility functions
├── types/
│   └── file-manager.ts              # TypeScript definitions
└── supabase/
    └── migrations/
        └── file_manager_schema.sql  # Database schema
```

## Database Schema

### Tables

1. **files** - Main file records
   - Stores file metadata, URLs, tags, sharing info
   - Supports favorites, sharing, and metadata

2. **folders** - Folder hierarchy
   - Unlimited nesting with parent_id references
   - Automatic stat tracking (file count, total size)

3. **file_versions** - Version history
   - Track file changes over time
   - Restore previous versions

4. **file_comments** - Collaboration
   - Add comments to files
   - Track comment history

5. **file_activities** - Audit log
   - Complete activity tracking
   - Who did what, when

6. **asset_collections** - Design assets
   - Organize colors, icons, fonts, etc.
   - Type-based collections

7. **asset_items** - Asset details
   - Individual assets in collections
   - Metadata and preview URLs

### Key Features
- Row Level Security (RLS) enabled
- Automatic timestamp updates
- Folder statistics triggers
- Indexes for performance
- Foreign key relationships

## API Endpoints

### Files
- `GET /api/files` - List files with filters
- `DELETE /api/files?id=xxx` - Delete a file
- `POST /api/files/upload` - Upload files
- `POST /api/files/operations` - Batch operations
- `GET /api/files/stats` - Storage statistics
- `POST /api/files/transform` - AI transformations

### Folders
- `GET /api/files/folders` - List all folders
- `POST /api/files/folders` - Create folder
- `DELETE /api/files/folders?id=xxx` - Delete folder

### Operations Supported
- `rename` - Rename files
- `move` - Move to folder
- `copy` - Duplicate files
- `share` - Generate share links
- `tag` - Add/update tags
- `favorite` - Toggle favorite status

## Usage

### Basic Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Set Up Database**
```bash
# Run the migration script in Supabase SQL editor
# File: supabase/migrations/file_manager_schema.sql
```

3. **Configure Supabase Storage**
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true);

-- Set up storage policies
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their files"
ON storage.objects FOR SELECT
USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

4. **Access the File Manager**
Navigate to `/files` in your application.

### Component Usage

#### File Browser
```tsx
import { FileBrowser } from '@/components/file-manager/file-browser'

<FileBrowser
  files={files}
  folders={folders}
  currentFolder={currentFolderId}
  onFileSelect={(file) => console.log('Selected:', file)}
  onFolderNavigate={(folderId) => setCurrentFolder(folderId)}
  onFileAction={(action, file) => handleAction(action, file)}
  onBulkAction={(action, fileIds) => handleBulkAction(action, fileIds)}
  onUploadClick={() => setShowUpload(true)}
/>
```

#### Upload Zone
```tsx
import { UploadZone } from '@/components/file-manager/upload-zone'

<UploadZone
  isOpen={showUpload}
  onClose={() => setShowUpload(false)}
  folderId={currentFolder}
  onUploadComplete={(files) => console.log('Uploaded:', files)}
/>
```

#### File Preview
```tsx
import { FilePreview } from '@/components/file-manager/file-preview'

<FilePreview
  file={selectedFile}
  isOpen={showPreview}
  onClose={() => setShowPreview(false)}
  onAction={(action, file) => handleAction(action, file)}
  onNext={() => selectNextFile()}
  onPrevious={() => selectPreviousFile()}
/>
```

#### Media Gallery
```tsx
import { MediaGallery } from '@/components/file-manager/media-gallery'

<MediaGallery
  files={mediaFiles}
  initialIndex={0}
  onClose={() => setShowGallery(false)}
  onFileAction={(action, file) => handleAction(action, file)}
/>
```

## Customization

### Styling
The file manager uses CSS variables for theming:

```css
--conductor-bg
--conductor-body-color
--conductor-primary
--conductor-button-primary-bg
--conductor-button-primary-text
--conductor-button-secondary-bg
--conductor-button-secondary-border
--conductor-danger
```

### File Type Support
Add new file types in `lib/utils/file-utils.ts`:

```typescript
export function getFileType(mimeType: string): FileType {
  // Add custom type detection
  if (mimeType === 'application/custom') return 'custom'
  // ...
}
```

### AI Integration
Implement AI features in `app/api/files/transform/route.ts`:

```typescript
async function handleAutoTag(supabase: any, file: any, userId: string) {
  // Call your AI service
  const tags = await aiService.generateTags(file.url)
  // Update file
}
```

## Performance Optimization

1. **Lazy Loading**: Images load on demand
2. **Thumbnail Generation**: Automatic thumbnails for faster loading
3. **Pagination**: Large file lists are paginated
4. **Database Indexes**: Optimized queries
5. **CDN Ready**: Files served via public URLs

## Security

1. **Row Level Security**: Users can only access their files
2. **Authenticated Uploads**: Must be logged in to upload
3. **Share Link Expiry**: Time-limited sharing
4. **File Size Limits**: Configurable upload limits
5. **MIME Type Validation**: Prevent malicious uploads

## Future Enhancements

- [ ] Real-time collaboration
- [ ] File encryption at rest
- [ ] Advanced search with filters
- [ ] Folder sharing with permissions
- [ ] File compression before upload
- [ ] Image editing tools
- [ ] Integration with cloud services
- [ ] Mobile app support
- [ ] Team workspaces
- [ ] Activity notifications

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.

## License

Part of the Conductor project.
