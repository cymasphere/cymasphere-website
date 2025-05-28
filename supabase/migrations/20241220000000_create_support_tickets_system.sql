-- Create support ticket system tables
-- This migration creates the complete support ticket infrastructure

-- Create enums for ticket status and priority
CREATE TYPE public.ticket_status AS ENUM (
  'open',
  'in_progress', 
  'resolved',
  'closed'
);

CREATE TYPE public.ticket_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE public.message_type AS ENUM (
  'text',
  'system'
);

CREATE TYPE public.attachment_type AS ENUM (
  'image',
  'video',
  'document',
  'audio',
  'other'
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number text NOT NULL UNIQUE, -- Human readable ticket ID like "T-001"
  subject text NOT NULL,
  description text,
  status public.ticket_status DEFAULT 'open' NOT NULL,
  priority public.ticket_priority DEFAULT 'medium' NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin user assigned to ticket
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at timestamp with time zone,
  closed_at timestamp with time zone
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type public.message_type DEFAULT 'text' NOT NULL,
  is_admin boolean DEFAULT false NOT NULL, -- True if message is from admin/support
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  edited_at timestamp with time zone
);

-- Create support_attachments table
CREATE TABLE IF NOT EXISTS public.support_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.support_messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL, -- Size in bytes
  file_type text NOT NULL, -- MIME type
  attachment_type public.attachment_type NOT NULL,
  storage_path text NOT NULL, -- Path in Supabase storage
  url text, -- Public URL if applicable
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at);
CREATE INDEX idx_support_tickets_ticket_number ON public.support_tickets(ticket_number);

CREATE INDEX idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX idx_support_messages_created_at ON public.support_messages(created_at);

CREATE INDEX idx_support_attachments_message_id ON public.support_attachments(message_id);

-- Enable RLS on all tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for support_tickets
-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND subscription = 'admin'
    )
  );

-- Users can create their own tickets
CREATE POLICY "Users can create their own tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets (limited fields)
CREATE POLICY "Users can update their own tickets" ON public.support_tickets
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any ticket
CREATE POLICY "Admins can update any ticket" ON public.support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND subscription = 'admin'
    )
  );

-- Admins can delete tickets
CREATE POLICY "Admins can delete tickets" ON public.support_tickets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND subscription = 'admin'
    )
  );

-- Create RLS policies for support_messages
-- Users can view messages for their own tickets or if they're admin
CREATE POLICY "Users can view messages for their tickets" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE id = ticket_id AND (
        user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND subscription = 'admin'
        )
      )
    )
  );

-- Users can create messages for their own tickets or if they're admin
CREATE POLICY "Users can create messages for their tickets" ON public.support_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE id = ticket_id AND user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND subscription = 'admin'
      )
    )
  );

-- Users can update their own messages (within time limit)
CREATE POLICY "Users can update their own messages" ON public.support_messages
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    created_at > (now() - interval '15 minutes')
  );

-- Admins can update any message
CREATE POLICY "Admins can update any message" ON public.support_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND subscription = 'admin'
    )
  );

-- Create RLS policies for support_attachments
-- Users can view attachments for messages they can see
CREATE POLICY "Users can view attachments for accessible messages" ON public.support_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_messages sm
      JOIN public.support_tickets st ON sm.ticket_id = st.id
      WHERE sm.id = message_id AND (
        st.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND subscription = 'admin'
        )
      )
    )
  );

-- Users can create attachments for their own messages
CREATE POLICY "Users can create attachments for their messages" ON public.support_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_messages sm
      JOIN public.support_tickets st ON sm.ticket_id = st.id
      WHERE sm.id = message_id AND sm.user_id = auth.uid() AND (
        st.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND subscription = 'admin'
        )
      )
    )
  );

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  ticket_number text;
BEGIN
  -- Get the next ticket number by counting existing tickets
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 3) AS integer)), 0) + 1
  INTO next_number
  FROM public.support_tickets
  WHERE ticket_number ~ '^T-[0-9]+$';
  
  -- Format as T-XXX with zero padding
  ticket_number := 'T-' || LPAD(next_number::text, 3, '0');
  
  RETURN ticket_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Create updated_at triggers
CREATE TRIGGER handle_updated_at_support_tickets 
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW 
  EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_support_messages 
  BEFORE UPDATE ON public.support_messages
  FOR EACH ROW 
  EXECUTE PROCEDURE moddatetime(updated_at);

-- Create function to update ticket timestamp when messages are added
CREATE OR REPLACE FUNCTION update_ticket_on_message()
RETURNS trigger AS $$
BEGIN
  -- Update the ticket's updated_at timestamp
  UPDATE public.support_tickets 
  SET updated_at = now()
  WHERE id = NEW.ticket_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_on_message
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_on_message();

-- Create function to auto-set resolved_at and closed_at timestamps
CREATE OR REPLACE FUNCTION update_ticket_status_timestamps()
RETURNS trigger AS $$
BEGIN
  -- Set resolved_at when status changes to resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at := now();
  END IF;
  
  -- Set closed_at when status changes to closed
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at := now();
  END IF;
  
  -- Clear timestamps if status changes back
  IF NEW.status != 'resolved' AND OLD.status = 'resolved' THEN
    NEW.resolved_at := NULL;
  END IF;
  
  IF NEW.status != 'closed' AND OLD.status = 'closed' THEN
    NEW.closed_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_status_timestamps
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_status_timestamps(); 