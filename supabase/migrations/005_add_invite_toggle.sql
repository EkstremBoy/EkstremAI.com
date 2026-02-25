-- ============================================================
--  RISE & REWARD — ÉVOLUTION 005 : TOGGLE D'INVITATION
--   Migration : 005_add_invite_toggle.sql
-- ============================================================

ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS allow_member_invites BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.challenges.allow_member_invites IS 'TRUE = Tout le monde peut inviter. FALSE = Seuls les admins peuvent inviter.';
