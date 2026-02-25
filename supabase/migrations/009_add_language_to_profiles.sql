-- ============================================================
--  RISE & REWARD — ÉVOLUTION 009 : PERSISTENT LANGUAGE
--   Migration : 009_add_language_to_profiles.sql
-- ============================================================

-- 1. Ajouter la colonne 'language' à la table profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'fr';

-- 2. Force le rafraîchissement du cache de PostgREST
NOTIFY pgrst, 'reload schema';

COMMENT ON COLUMN public.profiles.language IS 'Langue préférée de l''utilisateur (fr ou en).';
