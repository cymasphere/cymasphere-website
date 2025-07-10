-- Make template audiences policy match campaign audiences policy exactly

DROP POLICY IF EXISTS "Admins can manage template audiences" ON email_template_audiences;

-- Create policy identical to campaign audiences policy
CREATE POLICY "Admins can manage template audiences" ON email_template_audiences
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
); 