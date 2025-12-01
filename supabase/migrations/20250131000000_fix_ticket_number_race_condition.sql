-- Fix ticket number generation race condition
-- This migration replaces the MAX-based approach with a sequence for thread-safe ticket number generation

-- Create a sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS public.support_ticket_number_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Set the sequence to start from the highest existing ticket number + 1
DO $$
DECLARE
  max_number integer;
BEGIN
  -- Get the maximum ticket number from existing tickets
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 3) AS integer)), 0)
  INTO max_number
  FROM public.support_tickets
  WHERE ticket_number ~ '^T-[0-9]+$';
  
  -- Set the sequence to start from max_number + 1
  IF max_number > 0 THEN
    PERFORM setval('public.support_ticket_number_seq', max_number, true);
  END IF;
END $$;

-- Replace the generate_ticket_number function to use the sequence
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  ticket_number text;
BEGIN
  -- Get the next number from the sequence (atomic operation)
  next_number := nextval('public.support_ticket_number_seq');
  
  -- Format as T-XXX with zero padding
  ticket_number := 'T-' || LPAD(next_number::text, 3, '0');
  
  RETURN ticket_number;
END;
$$ LANGUAGE plpgsql;

