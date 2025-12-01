-- Fix support tickets RLS policies to use admins table instead of profiles.subscription
-- This ensures consistency with the application-level checkAdmin() function

-- Drop existing admin policies that check profiles.subscription
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update any ticket" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can delete tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON public.support_messages;
DROP POLICY IF EXISTS "Users can create messages for their tickets" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can update any message" ON public.support_messages;
DROP POLICY IF EXISTS "Users can view attachments for accessible messages" ON public.support_attachments;
DROP POLICY IF EXISTS "Users can create attachments for their messages" ON public.support_attachments;

-- Recreate policies using is_admin() function (which checks admins table)
-- Users can view their own tickets OR if they're admin
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

-- Admins can update any ticket
CREATE POLICY "Admins can update any ticket" ON public.support_tickets
  FOR UPDATE USING (is_admin(auth.uid()));

-- Admins can delete tickets
CREATE POLICY "Admins can delete tickets" ON public.support_tickets
  FOR DELETE USING (is_admin(auth.uid()));

-- Users can view messages for their own tickets OR if they're admin
CREATE POLICY "Users can view messages for their tickets" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE id = ticket_id AND (
        user_id = auth.uid() OR 
        is_admin(auth.uid())
      )
    )
  );

-- Users can create messages for their own tickets OR if they're admin
CREATE POLICY "Users can create messages for their tickets" ON public.support_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE id = ticket_id AND user_id = auth.uid()
      ) OR
      is_admin(auth.uid())
    )
  );

-- Admins can update any message
CREATE POLICY "Admins can update any message" ON public.support_messages
  FOR UPDATE USING (is_admin(auth.uid()));

-- Users can view attachments for messages they can see (their own tickets OR if admin)
CREATE POLICY "Users can view attachments for accessible messages" ON public.support_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_messages sm
      JOIN public.support_tickets st ON sm.ticket_id = st.id
      WHERE sm.id = message_id AND (
        st.user_id = auth.uid() OR 
        is_admin(auth.uid())
      )
    )
  );

-- Users can create attachments for their own messages OR if they're admin
CREATE POLICY "Users can create attachments for their messages" ON public.support_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_messages sm
      JOIN public.support_tickets st ON sm.ticket_id = st.id
      WHERE sm.id = message_id AND sm.user_id = auth.uid() AND (
        st.user_id = auth.uid() OR 
        is_admin(auth.uid())
      )
    )
  );

