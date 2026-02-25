-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. View messages: any member of the challenge can view
CREATE POLICY "chat_messages: members can view"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.challenge_members
            WHERE challenge_members.challenge_id = chat_messages.challenge_id
            AND challenge_members.user_id = auth.uid()
        )
    );

-- 2. Send messages: any member of the challenge can insert
CREATE POLICY "chat_messages: members can insert"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.challenge_members
            WHERE challenge_members.challenge_id = chat_messages.challenge_id
            AND challenge_members.user_id = auth.uid()
        )
        AND auth.uid() = user_id
    );

-- 3. Delete messages: only the sender can delete
CREATE POLICY "chat_messages: sender can delete"
    ON public.chat_messages FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster fetching
CREATE INDEX idx_chat_messages_challenge_id ON public.chat_messages(challenge_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable real-time for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
