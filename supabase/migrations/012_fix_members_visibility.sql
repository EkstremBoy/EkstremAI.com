-- ============================================================
--  RISE & REWARD — ÉVOLUTION 012 : FIX VISIBILITY RLS
--   Migration : 012_fix_members_visibility.sql
-- ============================================================

-- 1. Autoriser les créateurs de défis à voir tous les membres de leurs défis
-- (Utile si check_membership a un souci ou si le créateur veut voir les membres même s'il n'a pas encore de log)
CREATE POLICY "challenge_members: visibilité par le créateur"
    ON public.challenge_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = challenge_members.challenge_id
            AND c.created_by = auth.uid()
        )
    );

-- 2. Autoriser les créateurs de défis à voir tous les journaux (logs)
CREATE POLICY "daily_logs: visibilité par le créateur"
    ON public.daily_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = daily_logs.challenge_id
            AND c.created_by = auth.uid()
        )
    );

-- 3. S'assurer que les profiles sont toujours lisibles publiquement
-- (Écrase si nécessaire pour être sûr)
DROP POLICY IF EXISTS "profiles: lecture publique" ON public.profiles;
CREATE POLICY "profiles: lecture publique"
    ON public.profiles FOR SELECT
    USING (TRUE);

-- 4. Recharger le schéma PostgREST
NOTIFY pgrst, 'reload schema';
