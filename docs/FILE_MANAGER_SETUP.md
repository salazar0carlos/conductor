# File Manager Quick Setup Guide

## Step 1: Database Setup

Run the migration script in your Supabase SQL editor:

```bash
# Location: supabase/migrations/file_manager_schema.sql
```

This will create all necessary tables:
- `files` - File records
- `folders` - Folder hierarchy
- `file_versions` - Version history
- `file_comments` - Collaboration
- `file_activities` - Audit log
- `asset_collections` - Design asset collections
- `asset_items` - Individual assets

## Step 2: Storage Bucket Setup

In Supabase Dashboard > Storage, create a new bucket:

1. Create bucket named `files`
2. Make it public or configure RLS policies
3. Add the following policies in SQL editor:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their files
CREATE POLICY "Users can view their files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their files
CREATE POLICY "Users can update their files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their files
CREATE POLICY "Users can delete their files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 3: Environment Variables

Ensure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Test the Setup

1. Start your development server:
```bash
npm run dev
```

2. Navigate to `/files` in your browser

3. You should see the file manager interface

4. Try uploading a file to test the complete flow

## Troubleshooting

### Upload Fails
- Check Supabase storage bucket exists
- Verify storage policies are set
- Check browser console for errors
- Verify user is authenticated

### Files Not Showing
- Check database tables exist
- Verify RLS policies are enabled
- Check user authentication
- Look at API response in Network tab

### Preview Not Working
- Ensure file URLs are public
- Check CORS settings in Supabase
- Verify file type is supported

## Quick Test

Create a test file to verify everything works:

```bash
# In your browser console at /files
// Upload a test image
// Then check Supabase dashboard:
// - Storage > files bucket (file should be there)
// - Database > files table (record should exist)
```

## Next Steps

1. Customize the UI to match your brand
2. Add AI integrations for auto-tagging
3. Set up CDN for better performance
4. Configure file size limits
5. Add team collaboration features

## Support

Refer to the main [FILE_MANAGER.md](./FILE_MANAGER.md) documentation for detailed information on all features and customization options.
