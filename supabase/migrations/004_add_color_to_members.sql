-- ============================================================
--  RISE & REWARD — ÉVOLUTION 004 : COULEUR DES MEMBRES
--   Migration : 004_add_color_to_members.sql
-- ============================================================

-- 1. Ajout de la colonne color à challenge_members
ALTER TABLE public.challenge_members 
ADD COLUMN IF NOT EXISTS color TEXT;

COMMENT ON COLUMN public.challenge_members.color IS 'Couleur HEX spécifique à l''utilisateur pour ce défi (choisie parmi les 8 de la charte).';
