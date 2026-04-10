-- Partner sticker pool + per-item usage logging.
-- When an inquiry item is inserted for a Validation / Refilled inquiry with a partner,
-- sticker_used is set on the row and a sticker_usage_logs entry is created (idempotent per item).

BEGIN;

ALTER TABLE public.partners
    ADD COLUMN IF NOT EXISTS stickers_total INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.inquiry_items
    ADD COLUMN IF NOT EXISTS sticker_used BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.sticker_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.partners (id) ON DELETE CASCADE,
    inquiry_item_id UUID NOT NULL REFERENCES public.inquiry_items (id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
    service_type TEXT NOT NULL CHECK (
        service_type IN ('validation', 'refilled')
    ),
    used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT sticker_usage_logs_inquiry_item_id_key UNIQUE (inquiry_item_id)
);

CREATE INDEX IF NOT EXISTS idx_sticker_usage_logs_partner_id ON public.sticker_usage_logs (partner_id);

CREATE INDEX IF NOT EXISTS idx_sticker_usage_logs_used_at ON public.sticker_usage_logs (used_at DESC);

-- Normalize inquiry.type for matching (handles "Validation", "Refilled", legacy spellings).
CREATE OR REPLACE FUNCTION public._inquiry_type_normalized(inv_type TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
SELECT
    CASE lower(trim(coalesce(inv_type, '')))
        WHEN 'validation' THEN 'validation'
        WHEN 'refilled' THEN 'refilled'
        WHEN 'refill' THEN 'refilled'
        ELSE lower(trim(coalesce(inv_type, '')))
    END;

$$;

CREATE OR REPLACE FUNCTION public.trg_log_sticker_usage_after_inquiry_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    inv RECORD;
    norm_type TEXT;
    stype TEXT;
BEGIN
    SELECT
        i.type,
        i.partner_id,
        i.customer_id INTO inv
    FROM
        public.inquiries i
    WHERE
        i.id = NEW.inquiry_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    IF inv.partner_id IS NULL THEN
        RETURN NEW;
    END IF;

    norm_type := public._inquiry_type_normalized(inv.type::TEXT);

    IF norm_type NOT IN ('validation', 'refilled') THEN
        RETURN NEW;
    END IF;

    stype := norm_type;

    UPDATE
        public.inquiry_items
    SET
        sticker_used = TRUE
    WHERE
        id = NEW.id;

    INSERT INTO public.sticker_usage_logs (partner_id, inquiry_item_id, customer_id, service_type, used_at)
    VALUES (inv.partner_id, NEW.id, inv.customer_id, stype, now())
    ON CONFLICT (inquiry_item_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_sticker_usage_after_inquiry_item ON public.inquiry_items;

CREATE TRIGGER trg_log_sticker_usage_after_inquiry_item
    AFTER INSERT ON public.inquiry_items
    FOR EACH ROW
    EXECUTE PROCEDURE public.trg_log_sticker_usage_after_inquiry_item();

ALTER TABLE public.sticker_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sticker_usage_logs_select_all" ON public.sticker_usage_logs;

DROP POLICY IF EXISTS "sticker_usage_logs_insert_all" ON public.sticker_usage_logs;

DROP POLICY IF EXISTS "sticker_usage_logs_update_all" ON public.sticker_usage_logs;

DROP POLICY IF EXISTS "sticker_usage_logs_delete_all" ON public.sticker_usage_logs;

-- DEV / anon-key pattern: tighten for production (e.g. partner_id = current setting).
CREATE POLICY "sticker_usage_logs_select_all" ON public.sticker_usage_logs FOR SELECT
    USING (TRUE);

CREATE POLICY "sticker_usage_logs_insert_all" ON public.sticker_usage_logs FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "sticker_usage_logs_update_all" ON public.sticker_usage_logs FOR UPDATE
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "sticker_usage_logs_delete_all" ON public.sticker_usage_logs FOR DELETE
    USING (TRUE);

COMMIT;
