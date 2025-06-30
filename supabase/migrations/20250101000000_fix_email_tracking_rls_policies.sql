-- Fix missing RLS policies for email tracking tables
-- These tables had RLS enabled but no policies, causing all access to be denied

-- Email sends table policies
CREATE POLICY "Admins can manage email sends" ON email_sends
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

-- Email opens table policies  
CREATE POLICY "Admins can manage email opens" ON email_opens
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

-- Email clicks table policies
CREATE POLICY "Admins can manage email clicks" ON email_clicks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

-- Email audience subscribers table policies (if missing)
DROP POLICY IF EXISTS "Admins can manage audience subscribers" ON email_audience_subscribers;
CREATE POLICY "Admins can manage audience subscribers" ON email_audience_subscribers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

-- Also add service role access for cron jobs and system operations
CREATE POLICY "Service role can manage email sends" ON email_sends
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email opens" ON email_opens
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email clicks" ON email_clicks
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage audience subscribers" ON email_audience_subscribers
FOR ALL USING (auth.role() = 'service_role'); 