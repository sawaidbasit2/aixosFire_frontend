-- Site assessments & inspection reports linked to inquiries (UUID id).
-- Run in Supabase SQL Editor or via CLI. Tighten RLS for production.

-- ---------------------------------------------------------------------------
-- site_assessments: one row per inquiry (unique inquiry_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID NOT NULL REFERENCES public.inquiries (id) ON DELETE CASCADE,
    observations TEXT NOT NULL DEFAULT '',
    required_services TEXT NOT NULL DEFAULT '',
    estimated_cost NUMERIC(12, 2),
    additional_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT site_assessments_inquiry_id_key UNIQUE (inquiry_id)
);

CREATE INDEX IF NOT EXISTS idx_site_assessments_inquiry_id ON public.site_assessments (inquiry_id);

-- ---------------------------------------------------------------------------
-- inspection_reports: multiple files per inquiry allowed
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inspection_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID NOT NULL REFERENCES public.inquiries (id) ON DELETE CASCADE,
    report_title TEXT NOT NULL,
    inspection_date DATE NOT NULL,
    notes TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT,
    mime_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspection_reports_inquiry_id ON public.inspection_reports (inquiry_id);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_site_assessments_updated ON public.site_assessments;
CREATE TRIGGER trg_site_assessments_updated
    BEFORE UPDATE ON public.site_assessments
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_inspection_reports_updated ON public.inspection_reports;
CREATE TRIGGER trg_inspection_reports_updated
    BEFORE UPDATE ON public.inspection_reports
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage bucket for PDF / XLSX (create if missing)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-reports', 'inspection-reports', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS — permissive defaults for app JWT via anon key (DEV).
-- Replace with policies tied to auth.uid() / partner claims for production.
-- ---------------------------------------------------------------------------
ALTER TABLE public.site_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_assessments_select_all" ON public.site_assessments;
DROP POLICY IF EXISTS "site_assessments_insert_all" ON public.site_assessments;
DROP POLICY IF EXISTS "site_assessments_update_all" ON public.site_assessments;
DROP POLICY IF EXISTS "site_assessments_delete_all" ON public.site_assessments;

CREATE POLICY "site_assessments_select_all" ON public.site_assessments FOR SELECT USING (true);
CREATE POLICY "site_assessments_insert_all" ON public.site_assessments FOR INSERT WITH CHECK (true);
CREATE POLICY "site_assessments_update_all" ON public.site_assessments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "site_assessments_delete_all" ON public.site_assessments FOR DELETE USING (true);

DROP POLICY IF EXISTS "inspection_reports_select_all" ON public.inspection_reports;
DROP POLICY IF EXISTS "inspection_reports_insert_all" ON public.inspection_reports;
DROP POLICY IF EXISTS "inspection_reports_update_all" ON public.inspection_reports;
DROP POLICY IF EXISTS "inspection_reports_delete_all" ON public.inspection_reports;

CREATE POLICY "inspection_reports_select_all" ON public.inspection_reports FOR SELECT USING (true);
CREATE POLICY "inspection_reports_insert_all" ON public.inspection_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "inspection_reports_update_all" ON public.inspection_reports FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "inspection_reports_delete_all" ON public.inspection_reports FOR DELETE USING (true);

-- Storage: allow read/write on bucket (tighten in production)
DROP POLICY IF EXISTS "inspection_reports_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "inspection_reports_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "inspection_reports_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "inspection_reports_storage_delete" ON storage.objects;

CREATE POLICY "inspection_reports_storage_read"
    ON storage.objects FOR SELECT USING (bucket_id = 'inspection-reports');

CREATE POLICY "inspection_reports_storage_insert"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'inspection-reports');

CREATE POLICY "inspection_reports_storage_update"
    ON storage.objects FOR UPDATE USING (bucket_id = 'inspection-reports');

CREATE POLICY "inspection_reports_storage_delete"
    ON storage.objects FOR DELETE USING (bucket_id = 'inspection-reports');
