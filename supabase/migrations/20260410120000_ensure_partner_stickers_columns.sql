-- Repair / bootstrap: safe to run if `42703 column partners.stickers_total does not exist`
-- happened because the full sticker migration was never applied on this database.

ALTER TABLE public.partners
    ADD COLUMN IF NOT EXISTS stickers_total INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.inquiry_items
    ADD COLUMN IF NOT EXISTS sticker_used BOOLEAN NOT NULL DEFAULT false;
