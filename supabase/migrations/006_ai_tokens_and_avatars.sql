-- ============================================================
--  RISE & REWARD — ÉVOLUTION 006 : SYSTÈME DE TOKENS & AVATARS AI
--   Migration : 006_ai_tokens_and_avatars.sql
-- ============================================================

-- 1. Table des jetons AI
CREATE TABLE IF NOT EXISTS public.user_tokens (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    balance     INTEGER     NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.user_tokens IS 'Solde de jetons AI pour la génération d''avatars.';

-- 2. Ajout de avatar_url à profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL de l''avatar (généré par AI ou téléversé).';

-- 3. RLS pour user_tokens
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_tokens: voir son propre solde"
    ON public.user_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "user_tokens: mise à jour par le propriétaire"
    ON public.user_tokens FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND balance >= 0);

-- Seul le système (trigger ou service role) peut insérer
-- Mais pour faciliter le premier pas via API, on peut autoriser l'insert si unique
-- Cependant, on va utiliser une fonction pour le cadeau de bienvenue
