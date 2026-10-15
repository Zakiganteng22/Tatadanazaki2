-- ============================================================================
-- TATADANA STORAGE BUCKETS SETUP
-- Private bucket for exports (PDF/XLSX), receipt photos, payment proofs
-- ============================================================================

-- Create buckets if not exists (using storage API)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('tatadana-exports', 'tatadana-exports', FALSE, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
    ('tatadana-receipts', 'tatadana-receipts', FALSE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('tatadana-proofs', 'tatadana-proofs', FALSE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies:
-- 1. Users can only read/write their own folder in tatadana-exports (folder = auth.uid())
CREATE POLICY "User export access policy" ON storage.objects
    FOR ALL USING (
        bucket_id = 'tatadana-exports' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 2. Users can only upload and view their own receipts
CREATE POLICY "User receipts access policy" ON storage.objects
    FOR ALL USING (
        bucket_id = 'tatadana-receipts' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 3. Users can upload payment proof; Admin can view all
CREATE POLICY "User payment proof policy" ON storage.objects
    FOR ALL USING (
        bucket_id = 'tatadana-proofs' AND 
        (
            (storage.foldername(name))[1] = auth.uid()::text OR 
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
        )
    );
