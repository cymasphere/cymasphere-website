/**
 * @fileoverview Shared types for email campaigns, automations, and SES webhooks
 * @module types/email-campaigns
 */

/** Common styling props shared by multiple element types */
export interface EmailElementStyle {
  fontSize?: string;
  textColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: string;
  textAlign?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  fullWidth?: boolean;
}

/** Social link item in footer */
export interface SocialLinkItem {
  platform?: string;
  url: string;
}

/** Base for all email content elements */
interface EmailElementBase extends EmailElementStyle {
  id?: string;
  type: string;
  content?: string;
}

export interface EmailElementHeader extends EmailElementBase {
  type: "header";
  content: string;
}

export interface EmailElementText extends EmailElementBase {
  type: "text";
  content: string;
}

export interface EmailElementButton extends EmailElementBase {
  type: "button";
  content: string;
  url?: string;
  gradient?: string;
}

export interface EmailElementImage extends EmailElementBase {
  type: "image";
  src: string;
}

export interface EmailElementDivider extends EmailElementBase {
  type: "divider";
}

export interface EmailElementSpacer extends EmailElementBase {
  type: "spacer";
  height?: string;
}

export interface EmailElementFooter extends EmailElementBase {
  type: "footer";
  footerText?: string;
  socialLinks?: SocialLinkItem[];
  unsubscribeUrl?: string;
  unsubscribeText?: string;
  privacyUrl?: string;
  privacyText?: string;
  termsUrl?: string;
  termsText?: string;
}

export interface EmailElementBrandHeader extends EmailElementBase {
  type: "brand-header";
}

/**
 * Union of all email builder element types
 */
export type EmailElement =
  | EmailElementHeader
  | EmailElementText
  | EmailElementButton
  | EmailElementImage
  | EmailElementDivider
  | EmailElementSpacer
  | EmailElementFooter
  | EmailElementBrandHeader;

/** SES mail object in event payloads */
export interface SESMail {
  messageId?: string;
  timestamp?: string;
  source?: string;
  destination?: string[];
  tags?: Record<string, string>;
}

/** SES bounce event detail */
export interface SESBounce {
  bounceType?: string;
  bounceSubType?: string;
  timestamp?: string;
  bouncedRecipients?: Array<{ emailAddress?: string; action?: string; status?: string; diagnosticCode?: string }>;
}

/** SES complaint event detail */
export interface SESComplaint {
  complainedRecipients?: Array<{ emailAddress?: string }>;
  complaintFeedbackType?: string;
  timestamp?: string;
}

/** SES reject event detail */
export interface SESReject {
  reason?: string;
}

/** SES delivery event detail */
export interface SESDelivery {
  timestamp?: string;
  processingTimeMillis?: number;
  recipients?: string[];
  smtpResponse?: string;
}

/** SES open event detail */
export interface SESOpen {
  timestamp?: string;
  ipAddress?: string;
  userAgent?: string;
}

/** SES click event detail */
export interface SESClick {
  timestamp?: string;
  ipAddress?: string;
  userAgent?: string;
  link?: string;
}

/**
 * SES event payload (after parsing SNS Notification Message)
 */
export interface SESEventPayload {
  eventType?: string;
  mail?: SESMail;
  bounce?: SESBounce;
  complaint?: SESComplaint;
  delivery?: SESDelivery;
  open?: SESOpen;
  click?: SESClick;
  reject?: SESReject;
}

/** Single rule in an audience filter */
export interface AudienceFilterRule {
  type?: string;
  field?: string;
  operator?: string;
  value?: string | number | boolean | string[];
}

/** Audience filter with array of rules */
export interface AudienceFilter {
  type?: string;
  audience_type?: "static" | "dynamic";
  rules?: AudienceFilterRule[];
}

/** Subscriber record as used in send/process-scheduled */
export interface SubscriberRecord {
  id: string;
  email: string;
  status?: string;
  metadata?: Record<string, unknown>;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  user_id?: string | null;
}

/** Campaign row as returned from DB (minimal for send/process) */
export interface CampaignRecord {
  id: string;
  name?: string | null;
  subject?: string | null;
  html_content?: string | null;
  text_content?: string | null;
  sender_name?: string | null;
  sender_email?: string | null;
  reply_to_email?: string | null;
  status?: string | null;
  [key: string]: unknown;
}
