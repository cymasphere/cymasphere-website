-- Allow crash/bug feedback attachments (zip, logs, docs, audio) on support-attachments.
-- Bucket previously only allowed image/* and video/*, which rejected application/zip (HTTP 415).

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    -- images (existing)
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    -- video (existing)
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/x-ms-wmv',
    -- audio (web support UI)
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/x-m4a',
    -- documents (web support UI)
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    -- crash / bug feedback from native app
    'application/zip',
    'application/x-zip-compressed',
    'application/x-zip',
    -- fallback when client omits Content-Type (.db, .lz4, etc.)
    'application/octet-stream'
  ],
  -- Match feedback API MAX_FILE_SIZE_BYTES (25MB); was 10MB
  file_size_limit = 26214400
WHERE id = 'support-attachments';
