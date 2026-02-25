-- Add generous_amount to challenge_members table
-- This column tracks extra contributions made by members to the success pool.

ALTER TABLE public.challenge_members 
ADD COLUMN IF NOT EXISTS generous_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN public.challenge_members.generous_amount IS 'Montant offert généreusement par le membre pour alimenter la cagnotte, en plus des pénalités.';

-- Ensure profiles has first_name or we can extract it easily
-- We'll try to sync metadata.first_name into username if it's cleaner, 
-- but for now adding first_name column to profiles is safer for the requested UI.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT;

COMMENT ON COLUMN public.profiles.first_name IS 'Prénom de l''utilisateur pour l''affichage dans les défis.';

-- Update RLS for profiles to allow users to update their own first_name
-- (Existing update policy should cover this, but being explicit is better if needed)
