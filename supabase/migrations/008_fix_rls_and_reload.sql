-- ============================================================
--  RISE & REWARD — ÉVOLUTION 008 : FIX RLS & SCHEMA RELOAD
--   Migration : 008_fix_rls_and_reload.sql
-- ============================================================

-- 1. Sécurité : Fonction pour éviter la récursion RLS
-- Cette fonction permet de vérifier l'appartenance à un défi sans déclencher RLS récursif.
CREATE OR REPLACE FUNCTION public.check_membership(c_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.challenge_members
    WHERE challenge_id = c_id AND user_id = u_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Mise à jour des politiques de challenge_members
DROP POLICY IF EXISTS "challenge_members: visibilité co-membres" ON public.challenge_members;

CREATE POLICY "challenge_members: visibilité sécurisée"
    ON public.challenge_members FOR SELECT
    USING (
        user_id = auth.uid() -- On voit sa propre ligne
        OR check_membership(challenge_id, auth.uid()) -- On voit les membres des défis dont on fait partie
    );

-- 3. Mise à jour de la politique de challenges pour utiliser la fonction (plus propre)
DROP POLICY IF EXISTS "challenges: visibilité membres" ON public.challenges;

CREATE POLICY "challenges: visibilité membres"
    ON public.challenges FOR SELECT
    USING (
        auth.uid() = created_by
        OR check_membership(id, auth.uid())
    );

-- 4. Assurer la présence de la colonne 'color' (au cas où la migration 004 a échoué)
ALTER TABLE public.challenge_members ADD COLUMN IF NOT EXISTS color TEXT;

-- 5. Force le rafraîchissement du cache de PostgREST
NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION public.check_membership IS 'Vérifie si un utilisateur est membre d''un défi (bypass RLS pour éviter la récursion).';
