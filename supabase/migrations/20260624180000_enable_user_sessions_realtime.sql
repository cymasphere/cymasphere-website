-- Enable realtime updates for Cymasphere app session changes on the dashboard.
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;
