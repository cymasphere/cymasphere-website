-- Create public user_sessions table mirroring auth.sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  factor_id UUID,
  aal TEXT,
  not_after TIMESTAMPTZ,
  refreshed_at TIMESTAMPTZ,
  user_agent TEXT,
  ip INET,
  tag TEXT,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);

-- Grant access to the table
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" 
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Insert trigger function
CREATE OR REPLACE FUNCTION public.handle_auth_session_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.user_sessions (
      id, user_id, created_at, updated_at, factor_id, aal, 
      not_after, refreshed_at, user_agent, ip, tag
    )
    VALUES (
      NEW.id, NEW.user_id, NEW.created_at, NEW.updated_at, NEW.factor_id, NEW.aal, 
      NEW.not_after, NEW.refreshed_at, NEW.user_agent, NEW.ip, NEW.tag
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE public.user_sessions
    SET 
      user_id = NEW.user_id,
      created_at = NEW.created_at,
      updated_at = NEW.updated_at,
      factor_id = NEW.factor_id,
      aal = NEW.aal,
      not_after = NEW.not_after,
      refreshed_at = NEW.refreshed_at,
      user_agent = NEW.user_agent,
      ip = NEW.ip,
      tag = NEW.tag
    WHERE id = NEW.id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    DELETE FROM public.user_sessions WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_sessions_insert ON auth.sessions;
CREATE TRIGGER on_auth_sessions_insert
  AFTER INSERT ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_session_changes();

DROP TRIGGER IF EXISTS on_auth_sessions_update ON auth.sessions;
CREATE TRIGGER on_auth_sessions_update
  AFTER UPDATE ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_session_changes();

DROP TRIGGER IF EXISTS on_auth_sessions_delete ON auth.sessions;
CREATE TRIGGER on_auth_sessions_delete
  AFTER DELETE ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_session_changes();

-- Initial data population from existing sessions
INSERT INTO public.user_sessions
SELECT id, user_id, created_at, updated_at, factor_id, aal, 
       not_after, refreshed_at, user_agent, ip, tag
FROM auth.sessions
ON CONFLICT (id) DO NOTHING; 