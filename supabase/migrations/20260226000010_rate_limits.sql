-- Migration: create rate_limits table for per-user API rate limiting
-- Story 4.4 — SEC-02

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint      text NOT NULL,          -- e.g. 'tts', 'process-ppt'
  window_start  timestamptz NOT NULL,   -- start of the current window
  request_count integer NOT NULL DEFAULT 1,
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, endpoint)            -- one row per user per endpoint
);

-- RLS: users can only see/update their own rows
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rate limits"
  ON public.rate_limits
  FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS rate_limits_user_endpoint_idx
  ON public.rate_limits (user_id, endpoint);
