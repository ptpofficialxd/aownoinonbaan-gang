ALTER TABLE media_items
ADD COLUMN IF NOT EXISTS thumbnail_drive_file_id text,
ADD COLUMN IF NOT EXISTS thumbnail_mime_type text;
