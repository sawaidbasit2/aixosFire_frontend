-- Remove any DATABASE default on estimated_cost (e.g. if added manually).
-- Application should persist NULL when site assessment has no cost; do not rely on a numeric default.
ALTER TABLE public.site_assessments
    ALTER COLUMN estimated_cost DROP DEFAULT;
