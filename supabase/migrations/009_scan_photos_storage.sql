-- ============================================================
-- SCAN PHOTOS — Storage bucket for wrong-parking report proof photos.
-- Uploaded by unauthenticated scanners (same trust model as ss_scans
-- public insert), publicly readable so owners/emails can display them.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('scan-photos', 'scan-photos', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "scan_photos_public_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'scan-photos');

CREATE POLICY "scan_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'scan-photos');
