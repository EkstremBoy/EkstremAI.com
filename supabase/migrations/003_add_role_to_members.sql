-- ============================================================
--  RISE & REWARD — ÉVOLUTION 003 : RÔLES DES MEMBRES
--   Migration : 003_add_role_to_members.sql
-- ============================================================

-- 1. Ajout de la colonne role à challenge_members
ALTER TABLE public.challenge_members 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- 2. Contrainte pour s'assurer que seuls des rôles valides sont utilisés
-- ALTER TABLE public.challenge_members ADD CONSTRAINT role_check CHECK (role IN ('admin', 'member'));

COMMENT ON COLUMN public.challenge_members.role IS 'Rôle du membre dans le défi : admin (créateur) ou member.';
