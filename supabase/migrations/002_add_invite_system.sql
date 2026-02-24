-- ============================================================
--  RISE & REWARD — ÉVOLUTION 002 : SYSTÈME D'INVITATION
--   Migration : 002_add_invite_system.sql
-- ============================================================

-- 1. Ajout des colonnes à la table challenges
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'Amis',
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS reward TEXT;

-- 2. Index sur le code d'invitation pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_challenges_invite_code ON public.challenges(invite_code);

-- 3. Mise à jour des politiques RLS pour permettre la lecture publique via invite_code

-- On supprime l'ancienne politique de SELECT pour la remplacer par une plus permissive
DROP POLICY IF EXISTS "challenges: visibilité membres" ON public.challenges;

CREATE POLICY "challenges: visibilité membres et invités"
    ON public.challenges FOR SELECT
    USING (
        -- Soit l'utilisateur est membre/créateur
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.challenge_members cm
            WHERE cm.challenge_id = id
              AND cm.user_id = auth.uid()
        )
        -- Soit c'est un accès public via invite_code (utilisé pour la preview join)
        OR (invite_code IS NOT NULL)
    );

COMMENT ON COLUMN public.challenges.group_type IS 'Catégorie du groupe : Famille, Amis, Collègues, Autre.';
COMMENT ON COLUMN public.challenges.invite_code IS 'Code unique de 8 caractères pour inviter des membres.';
COMMENT ON COLUMN public.challenges.reward      IS 'Description de la récompense finale.';
