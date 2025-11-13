# File Manager Deployment Checklist

Use this checklist to ensure your file manager is properly set up and ready for use.

## Pre-Deployment

### Database Setup
- [ ] Run the migration script in Supabase SQL editor
  - File: `/supabase/migrations/file_manager_schema.sql`
  - Verify all 7 tables are created
  - Check that indexes are created
  - Confirm RLS policies are enabled

- [ ] Verify tables exist in Supabase Dashboard:
  - [ ] `files`
  - [ ] `folders`
  - [ ] `file_versions`
  - [ ] `file_comments`
  - [ ] `file_activities`
  - [ ] `asset_collections`
  - [ ] `asset_items`

### Storage Setup
- [ ] Create storage bucket named `files` in Supabase
- [ ] Configure bucket as public or set RLS policies
- [ ] Add storage policies for:
  - [ ] INSERT (users can upload)
  - [ ] SELECT (users can view)
  - [ ] UPDATE (users can modify)
  - [ ] DELETE (users can remove)

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `NEXT_PUBLIC_APP_URL` is set (for share links)

### Dependencies
- [ ] All npm packages installed (`npm install`)
- [ ] `@monaco-editor/react` installed
- [ ] `lucide-react` installed
- [ ] `sonner` installed
- [ ] `uuid` installed

## Testing

### Basic Functionality
- [ ] Navigate to `/files` page loads without errors
- [ ] Can see file browser interface
- [ ] Storage stats display (even if 0)
- [ ] View mode tabs work (Files, Asset Library, Analytics)

### Upload
- [ ] Click "Upload" button opens upload modal
- [ ] Can select files from file picker
- [ ] Drag-and-drop works
- [ ] Upload progress shows
- [ ] Files appear in file list after upload
- [ ] Thumbnails generate for images
- [ ] Files appear in Supabase storage bucket

### File Operations
- [ ] Can select files (checkbox)
- [ ] Can rename files (F2 or right-click)
- [ ] Can move files to folders
- [ ] Can copy files
- [ ] Can delete files
- [ ] Can add to favorites (star icon)
- [ ] Can add tags
- [ ] Bulk operations work (select multiple)

### Viewing
- [ ] Click file opens preview
- [ ] Images display correctly
- [ ] Videos play
- [ ] PDFs render
- [ ] Code files show with syntax highlighting
- [ ] Can zoom in/out on images
- [ ] Next/previous navigation works
- [ ] ESC closes preview

### Gallery
- [ ] Click image opens lightbox
- [ ] Can navigate with arrow keys
- [ ] Slideshow mode works
- [ ] Thumbnail strip displays
- [ ] Zoom controls work

### Folders
- [ ] Can create new folders
- [ ] Can navigate into folders
- [ ] Breadcrumb navigation works
- [ ] Can move files between folders
- [ ] Empty folder validation works

### Search & Filter
- [ ] Search box filters files by name
- [ ] Can filter by file type
- [ ] Can filter by favorites
- [ ] Sort options work (name, date, size, type)
- [ ] Grid/list view toggle works

### Sharing
- [ ] Can generate share links
- [ ] Can set expiry date
- [ ] Share URL is copied to clipboard
- [ ] Share icon appears on shared files

### Asset Library
- [ ] Can switch to Asset Library tab
- [ ] Can create collections
- [ ] Can add assets to collections
- [ ] Can delete assets
- [ ] Can delete collections
- [ ] Color picker works for color assets

### Analytics
- [ ] Analytics tab shows storage stats
- [ ] Storage by type displays
- [ ] Recent files show
- [ ] Usage percentages calculate correctly

## Performance

- [ ] Page loads in under 2 seconds
- [ ] File upload is responsive
- [ ] Large images load quickly (thumbnails)
- [ ] Scrolling is smooth in list view
- [ ] No console errors in browser
- [ ] No memory leaks (check DevTools)

## Security

- [ ] Users can only see their own files
- [ ] Cannot access other users' files via API
- [ ] Upload requires authentication
- [ ] Delete requires authentication
- [ ] Storage policies prevent unauthorized access
- [ ] Share links work for anyone (if intended)

## Mobile

- [ ] Page is responsive on mobile
- [ ] Touch interactions work
- [ ] Upload works on mobile
- [ ] Gallery swipe works
- [ ] Buttons are appropriately sized

## Browser Compatibility

- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome

## Error Handling

- [ ] Upload errors show helpful messages
- [ ] Delete confirmation works
- [ ] Network errors are handled gracefully
- [ ] Empty states display correctly
- [ ] Loading states show during operations

## Accessibility

- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] Screen reader compatibility (test with NVDA/VoiceOver)
- [ ] Color contrast meets WCAG AA
- [ ] Alt text on images

## Production Readiness

### Configuration
- [ ] File size limits configured
- [ ] Upload limits set
- [ ] Share expiry defaults set
- [ ] Error messages customized
- [ ] Success messages customized

### Monitoring
- [ ] Error logging set up (Sentry?)
- [ ] Analytics tracking added (optional)
- [ ] Performance monitoring configured
- [ ] Backup strategy defined

### Documentation
- [ ] Team trained on using file manager
- [ ] User documentation created
- [ ] Admin documentation created
- [ ] API documentation reviewed

### Optional Enhancements
- [ ] CDN configured for file delivery
- [ ] Image optimization service integrated
- [ ] AI services connected (auto-tagging, etc.)
- [ ] Email notifications set up
- [ ] Webhook integrations added

## Launch

- [ ] Staging environment tested
- [ ] Production environment tested
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Support team notified
- [ ] Users notified of new feature

## Post-Launch

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Review usage analytics
- [ ] Plan feature enhancements

---

## Quick Verification Script

Run this in your browser console at `/files`:

```javascript
// Quick verification
console.log('File Manager Health Check:');
console.log('1. Page loaded:', window.location.pathname === '/files');
console.log('2. React mounted:', !!document.querySelector('[data-testid="file-browser"]'));
console.log('3. API accessible:', fetch('/api/files').then(r => r.ok).catch(() => false));
console.log('4. Storage configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('✅ Basic checks complete!');
```

## Need Help?

- Review `/docs/FILE_MANAGER.md` for detailed documentation
- Check `/docs/FILE_MANAGER_SETUP.md` for setup instructions
- Review `/FILE_MANAGER_SUMMARY.md` for implementation details
- Check browser console for errors
- Review Supabase logs for backend errors
- Check Network tab for API failures

---

**Remember**: Test thoroughly in a development environment before deploying to production!
