-- Migration: atomic rate limiter via PostgreSQL RPC
-- Story 6.2 — Fix 3: replaces SELECT → UPDATE race condition with a single atomic statement

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id        uuid,
  p_endpoint       text,
  p_max_requests   integer,
  p_window_minutes integer
) RETURNS TABLE (allowed boolean, remaining integer)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_window_cutoff  timestamptz := now() - (p_window_minutes * interval '1 minute');
  v_count          integer;
BEGIN
  -- Single atomic statement:
  --   INSERT new row (count = 1)
  --   ON CONFLICT:
  --     · Window expired  → reset window_start + count to 1
  --     · Count < max     → increment count
  --   WHERE clause prevents ANY update when window is current AND count >= max
  --   RETURNING is NULL when the WHERE blocked the update → request denied
  INSERT INTO public.rate_limits AS rl
    (user_id, endpoint, window_start, request_count, updated_at)
  VALUES
    (p_user_id, p_endpoint, now(), 1, now())
  ON CONFLICT (user_id, endpoint) DO UPDATE SET
    window_start  = CASE
                      WHEN rl.window_start < v_window_cutoff THEN now()
                      ELSE rl.window_start
                    END,
    request_count = CASE
                      WHEN rl.window_start < v_window_cutoff THEN 1
                      ELSE rl.request_count + 1
                    END,
    updated_at    = now()
  WHERE rl.window_start < v_window_cutoff        -- window expired → always allow (reset)
     OR rl.request_count < p_max_requests        -- within limit → allow (increment)
  RETURNING request_count
  INTO v_count;

  IF v_count IS NULL THEN
    -- WHERE was false: window is current AND count >= max → blocked
    RETURN QUERY SELECT false, 0;
  ELSE
    -- Allowed: return how many slots remain after this request
    RETURN QUERY SELECT true, GREATEST(0, p_max_requests - v_count);
  END IF;
END;
$$;

-- Grant execution to authenticated users (function uses SECURITY DEFINER, runs as owner)
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, text, integer, integer)
  TO authenticated;
