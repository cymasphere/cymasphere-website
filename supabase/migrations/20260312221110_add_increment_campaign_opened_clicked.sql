-- RPCs to increment campaign open/click counts (used by SES webhook for Open/Click events)

CREATE OR REPLACE FUNCTION increment_campaign_opened(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE email_campaigns
  SET emails_opened = COALESCE(emails_opened, 0) + 1,
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_campaign_clicked(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE email_campaigns
  SET emails_clicked = COALESCE(emails_clicked, 0) + 1,
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
