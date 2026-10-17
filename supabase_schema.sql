-- ==========================================================
-- TouchGrass: Joy Radar - Supabase Schema Migration (Phase 2)
-- Run this in the Supabase Dashboard -> SQL Editor
-- ==========================================================

-- 1. Create the `joy_moments` table
CREATE TABLE IF NOT EXISTS public.joy_moments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    caption TEXT NOT NULL,
    narration TEXT NOT NULL,
    image_url TEXT NOT NULL,
    joy_category TEXT NOT NULL DEFAULT 'small-wins',
    persona_name TEXT NOT NULL DEFAULT 'Warm Joy Radar',
    is_cheat BOOLEAN NOT NULL DEFAULT false,
    cheat_reason TEXT,
    latitude DOUBLE PRECISION DEFAULT 28.6139 NOT NULL,
    longitude DOUBLE PRECISION DEFAULT 77.2090 NOT NULL,
    speech_audio_url TEXT,
    sfx_audio_url TEXT
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.joy_moments ENABLE ROW LEVEL SECURITY;

-- 3. Create Public Access Policies (Allow anyone to read and insert moments)
CREATE POLICY "Public moments are readable by anyone"
ON public.joy_moments
FOR SELECT
USING (true);

CREATE POLICY "Anyone can submit a joy moment"
ON public.joy_moments
FOR INSERT
WITH CHECK (true);

-- 4. Enable Supabase Realtime for instant pin updates on the Joy Map
ALTER PUBLICATION supabase_realtime ADD TABLE public.joy_moments;

-- 5. Insert Starter Demo Data (so the map immediately looks vibrant)
INSERT INTO public.joy_moments (
    caption, narration, image_url, joy_category, persona_name, is_cheat, cheat_reason, latitude, longitude
) VALUES 
(
    'Golden Sunlight on Gulmohar Leaf',
    'Behold! The fragile chlorophyll marvel dancing gently in the northern breeze. Quite extraordinary.',
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80',
    'nature',
    'Sir David (Nature Doc)',
    false,
    NULL,
    28.6139,
    77.2090
),
(
    'Steaming Kulhad Masala Chai',
    'Kya baat hai! Last ball pe boundary jaisa swaad, full energy double century moment!',
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
    'food',
    'IPL Hinglish Commentator',
    false,
    NULL,
    28.6280,
    77.2180
),
(
    'Office Doggo Afternoon Nap',
    'Look at this peaceful bundle of fur finding complete bliss on the grass rug. Pure unconditional validation.',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80',
    'people',
    'Warm Joy Radar',
    false,
    NULL,
    28.6010,
    77.2250
);
