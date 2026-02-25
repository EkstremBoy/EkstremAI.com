-- ============================================================
--  RISE & REWARD — ÉVOLUTION 007 : BUCKET DE STOCKAGE POUR AVATARS
--   Migration : 007_create_avatars_bucket.sql
-- ============================================================

-- 1. Création du bucket 'avatars' s'il n'existe pas
-- Note : Cette opération utilise l'API storage de Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Politiques RLS pour le bucket 'avatars'

-- Accès public en lecture pour tout le monde
CREATE POLICY "Avatar: lecture publique pour tous"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Autoriser les utilisateurs connectés à téléverser leurs propres fichiers
-- Le chemin du fichier doit commencer par l'ID de l'utilisateur (auth.uid())
CREATE POLICY "Avatar: téléversement par propriétaire"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Autoriser la mise à jour (remplacement) par le propriétaire
CREATE POLICY "Avatar: mise à jour par propriétaire"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Autoriser la suppression par le propriétaire
CREATE POLICY "Avatar: suppression par propriétaire"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
