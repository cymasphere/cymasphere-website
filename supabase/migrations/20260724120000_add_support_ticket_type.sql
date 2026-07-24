-- Add ticket_type to support tickets (bug / feature / crash / support)
CREATE TYPE public.ticket_type AS ENUM (
  'support',
  'bug',
  'feature',
  'crash'
);

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS ticket_type public.ticket_type NOT NULL DEFAULT 'support';

CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_type
  ON public.support_tickets (ticket_type);

COMMENT ON COLUMN public.support_tickets.ticket_type IS
  'support = general help; bug / feature from account or app; crash from app crash relaunch';
