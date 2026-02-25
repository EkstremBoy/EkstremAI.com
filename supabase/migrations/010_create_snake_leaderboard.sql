-- ============================================================
--  RISE & REWARD — ÉVOLUTION 010 : LEADERBOARD SNAKE
--   Migration : 010_create_snake_leaderboard.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.snake_leaderboard (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username    TEXT        NOT NULL,
    score       INTEGER     NOT NULL DEFAULT 0,
    mode        TEXT        NOT NULL, -- 'retro' or 'ekstremai'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.snake_leaderboard IS 'Table des records pour le jeu Snake.';

-- RLS
ALTER TABLE public.snake_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snake_leaderboard: voir les records"
    ON public.snake_leaderboard FOR SELECT
    USING (true);

CREATE POLICY "snake_leaderboard: insérer son record"
    ON public.snake_leaderboard FOR INSERT
    WITH CHECK (auth.uid() = user_id);
