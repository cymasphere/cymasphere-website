-- Fix RLS policies for email_audiences table to allow all admins to see all audiences
-- Currently admins can only see audiences they created, but they should see all audiences

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all audiences" ON email_audiences;
DROP POLICY IF EXISTS "Admins can insert audiences" ON email_audiences;
DROP POLICY IF EXISTS "Admins can update audiences" ON email_audiences;
DROP POLICY IF EXISTS "Admins can delete audiences" ON email_audiences;

-- Create new policies that allow all admins to access all audiences
CREATE POLICY "Admins can view all audiences" ON email_audiences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.user = auth.uid()
        )
    );

CREATE POLICY "Admins can insert audiences" ON email_audiences
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.user = auth.uid()
        )
    );

CREATE POLICY "Admins can update audiences" ON email_audiences
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.user = auth.uid()
        )
    );

CREATE POLICY "Admins can delete audiences" ON email_audiences
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.user = auth.uid()
        )
    ); 