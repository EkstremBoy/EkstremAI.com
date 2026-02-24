-- ============================================================
--  RISE & REWARD — Schéma de base de données Supabase
--  Migration : 001_rise_and_reward_schema.sql
--  Généré le : 2026-02-24
-- ============================================================


-- ============================================================
--  EXTENSIONS
-- ============================================================

-- S'assurer que uuid_generate_v4() est disponible
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
--  TABLE : profiles
--  Liée à auth.users via l'id (même UUID)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username    TEXT        NOT NULL UNIQUE,
    color       TEXT        NOT NULL DEFAULT '#6366f1',  -- Couleur HEX choisie par l'utilisateur
    tokens      INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.profiles              IS 'Profils publics des utilisateurs, extension de auth.users.';
COMMENT ON COLUMN public.profiles.color        IS 'Couleur HEX choisie par l''utilisateur pour son avatar dans les défis.';
COMMENT ON COLUMN public.profiles.tokens       IS 'Solde de tokens de l''utilisateur (système de récompenses).';


-- ============================================================
--  TABLE : challenges
--  Les défis de groupe
-- ============================================================

CREATE TABLE IF NOT EXISTS public.challenges (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT        NOT NULL,
    challenge_type  TEXT        NOT NULL DEFAULT 'collective' CHECK (challenge_type IN ('collective', 'individual')),
    penalty_amount  DECIMAL(10, 2) NOT NULL DEFAULT 0.00,  -- Montant de la pénalité en cas d'échec
    goal_amount     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,  -- Montant cagnotte à atteindre pour la récompense
    max_members     INTEGER     NOT NULL DEFAULT 8,
    is_strict_mode  BOOLEAN     NOT NULL DEFAULT FALSE,    -- FALSE = période de grâce active
    created_by      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.challenges                    IS 'Défis de groupe avec paramètres financiers et de jeu.';
COMMENT ON COLUMN public.challenges.challenge_type     IS '''collective'' = tous relèvent le même défi. ''individual'' = chaque membre définit son propre objectif personnel.';
COMMENT ON COLUMN public.challenges.penalty_amount     IS 'Montant déduit des tokens ou facturé en cas de journée ratée.';
COMMENT ON COLUMN public.challenges.goal_amount        IS 'Montant de la cagnotte à atteindre pour déclencher la récompense (souper, activité, voyage...)';
COMMENT ON COLUMN public.challenges.max_members        IS 'Nombre maximum de membres autorisés dans le défi (défaut : 8).';
COMMENT ON COLUMN public.challenges.is_strict_mode     IS 'FALSE = période de grâce (soumission tardive tolérée). TRUE = stricte.';


-- ============================================================
--  TABLE : challenge_members
--  Table de liaison Utilisateurs ↔ Défis
-- ============================================================

CREATE TABLE IF NOT EXISTS public.challenge_members (
    challenge_id    UUID        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
    personal_goal   TEXT,                                                  -- Objectif personnel (requis si challenge_type = 'individual')
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (challenge_id, user_id)  -- Un utilisateur ne peut rejoindre le même défi qu'une seule fois
);

COMMENT ON TABLE  public.challenge_members                  IS 'Liaison many-to-many entre profiles et challenges.';
COMMENT ON COLUMN public.challenge_members.personal_goal    IS 'Objectif personnel du membre. NULL si défi collectif, obligatoire si défi individuel (validé côté app).';
COMMENT ON COLUMN public.challenge_members.joined_at        IS 'Date et heure à laquelle l''utilisateur a rejoint le défi.';


-- ============================================================
--  TABLE : daily_logs
--  Suivi quotidien (crucial pour le calendrier et l'ordre de complétion)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_logs (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id    UUID        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
    target_date     DATE        NOT NULL,  -- La date du défi (ex: 2026-02-24), indépendante du fuseau horaire
    completed_at    TIMESTAMPTZ,           -- Timestamp exact de complétion → détermine l'ordre (1er, 2ème, etc.)
    status          TEXT        NOT NULL CHECK (status IN ('success', 'failed')),

    UNIQUE (challenge_id, user_id, target_date)  -- Un seul log par utilisateur par jour par défi
);

COMMENT ON TABLE  public.daily_logs               IS 'Journal quotidien des participations. Permet le calendrier et le classement par ordre de complétion.';
COMMENT ON COLUMN public.daily_logs.target_date   IS 'Date calendaire du défi (DATE, pas TIMESTAMP) pour éviter les problèmes de fuseau horaire.';
COMMENT ON COLUMN public.daily_logs.completed_at  IS 'Timestamp exact de soumission. NULL si non encore soumis. Utilisé pour ordonner les couleurs sur le calendrier.';
COMMENT ON COLUMN public.daily_logs.status        IS 'Résultat du jour : ''success'' = défi réussi, ''failed'' = raté/pénalité appliquée.';


-- ============================================================
--  TABLE : chat_messages
--  Chat interne par défi
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id    UUID        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
    message         TEXT        NOT NULL CHECK (LENGTH(TRIM(message)) > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.chat_messages            IS 'Messages du chat interne, un canal unique par défi.';
COMMENT ON COLUMN public.chat_messages.message    IS 'Contenu du message, ne peut pas être vide.';


-- ============================================================
--  INDEXES
--  Pour optimiser les requêtes fréquentes
-- ============================================================

-- daily_logs : requêtes de calendrier (par défi + plage de dates)
CREATE INDEX IF NOT EXISTS idx_daily_logs_challenge_date
    ON public.daily_logs (challenge_id, target_date);

-- daily_logs : tableau de bord utilisateur (tous ses logs)
CREATE INDEX IF NOT EXISTS idx_daily_logs_user
    ON public.daily_logs (user_id);

-- challenge_members : lister les membres d'un défi
CREATE INDEX IF NOT EXISTS idx_challenge_members_challenge
    ON public.challenge_members (challenge_id);

-- challenge_members : lister les défis d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_challenge_members_user
    ON public.challenge_members (user_id);

-- chat_messages : récupérer les messages d'un défi par ordre chronologique
CREATE INDEX IF NOT EXISTS idx_chat_messages_challenge_created
    ON public.chat_messages (challenge_id, created_at ASC);


-- ============================================================
--  TRIGGER : mise à jour automatique de updated_at sur profiles
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================
--  TRIGGER : création automatique d'un profil à l'inscription
--  Un profil vide est créé dès qu'un utilisateur s'inscrit via auth.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Nécessaire pour pouvoir écrire dans public.profiles depuis le contexte auth
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, username, color)
    VALUES (
        NEW.id,
        -- Utilise l'email comme username par défaut (partie avant @), à mettre à jour plus tard
        SPLIT_PART(NEW.email, '@', 1),
        -- Couleur par défaut : indigo (peut être changée dans l'onboarding)
        '#6366f1'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
--  ROW LEVEL SECURITY (RLS)
--  Activer RLS sur toutes les tables et définir les politiques
-- ============================================================

-- --- profiles ---
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les profils (pour afficher les noms/couleurs dans les défis)
CREATE POLICY "profiles: lecture publique"
    ON public.profiles FOR SELECT
    USING (TRUE);

-- Un utilisateur ne peut modifier que son propre profil
CREATE POLICY "profiles: modification par le propriétaire"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- L'insertion est gérée par le trigger handle_new_user (SECURITY DEFINER)
-- Pas de politique INSERT nécessaire pour les utilisateurs normaux


-- --- challenges ---
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne peut voir que les défis dont il est membre OU qu'il a créés
CREATE POLICY "challenges: visibilité membres"
    ON public.challenges FOR SELECT
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.challenge_members cm
            WHERE cm.challenge_id = id
              AND cm.user_id = auth.uid()
        )
    );

-- N'importe quel utilisateur connecté peut créer un défi
CREATE POLICY "challenges: création par utilisateur connecté"
    ON public.challenges FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Seul le créateur peut modifier ou supprimer un défi
CREATE POLICY "challenges: modification par le créateur"
    ON public.challenges FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "challenges: suppression par le créateur"
    ON public.challenges FOR DELETE
    USING (auth.uid() = created_by);


-- --- challenge_members ---
ALTER TABLE public.challenge_members ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut voir les membres des défis auxquels il appartient
CREATE POLICY "challenge_members: visibilité co-membres"
    ON public.challenge_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.challenge_members cm
            WHERE cm.challenge_id = challenge_id
              AND cm.user_id = auth.uid()
        )
    );

-- Un utilisateur peut rejoindre un défi (s'inscrire lui-même uniquement)
CREATE POLICY "challenge_members: rejoindre un défi"
    ON public.challenge_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Un utilisateur peut quitter un défi (supprimer sa propre entrée)
CREATE POLICY "challenge_members: quitter un défi"
    ON public.challenge_members FOR DELETE
    USING (auth.uid() = user_id);


-- --- daily_logs ---
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut voir les logs de tous les membres des défis auxquels il appartient
-- (nécessaire pour afficher le calendrier de groupe avec les couleurs de chacun)
CREATE POLICY "daily_logs: visibilité par membres du défi"
    ON public.daily_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.challenge_members cm
            WHERE cm.challenge_id = daily_logs.challenge_id
              AND cm.user_id = auth.uid()
        )
    );

-- Un utilisateur peut uniquement insérer ses propres logs
CREATE POLICY "daily_logs: insertion par soi-même"
    ON public.daily_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Un utilisateur peut mettre à jour uniquement ses propres logs
CREATE POLICY "daily_logs: mise à jour par soi-même"
    ON public.daily_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- --- chat_messages ---
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut lire les messages des défis dont il est membre
CREATE POLICY "chat_messages: lecture par membres"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.challenge_members cm
            WHERE cm.challenge_id = chat_messages.challenge_id
              AND cm.user_id = auth.uid()
        )
    );

-- Un utilisateur peut envoyer des messages uniquement dans ses défis
CREATE POLICY "chat_messages: envoi par membres"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.challenge_members cm
            WHERE cm.challenge_id = chat_messages.challenge_id
              AND cm.user_id = auth.uid()
        )
    );

-- Un utilisateur ne peut supprimer que ses propres messages
CREATE POLICY "chat_messages: suppression par l'auteur"
    ON public.chat_messages FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================================
--  FIN DU SCRIPT
-- ============================================================
