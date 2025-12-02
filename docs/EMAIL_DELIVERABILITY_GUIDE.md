# Email Deliverability Guide - Preventing Spam

## The Problem
Emails are going to spam because they're not properly authenticated. Gmail and other providers require SPF, DKIM, and DMARC records.

## Solution: Domain Verification in AWS SES

### Step 1: Verify Your Domain in AWS SES

1. **Go to AWS SES Console**: https://console.aws.amazon.com/ses/
2. **Click "Verified identities"** in the left sidebar
3. **Click "Create identity"**
4. **Select "Domain"** (not Email address)
5. **Enter your domain**: `cymasphere.com`
6. **Click "Create identity"**

### Step 2: Add DNS Records

AWS will provide you with DNS records to add. You need to add these to your domain's DNS:

#### SPF Record (Sender Policy Framework)
```
Type: TXT
Name: @ (or cymasphere.com)
Value: v=spf1 include:amazonses.com ~all
```

#### DKIM Records (DomainKeys Identified Mail)
AWS will give you 3 CNAME records like:
```
Type: CNAME
Name: [random-string]._domainkey
Value: [random-string].dkim.amazonses.com
```

Add all 3 DKIM records.

#### DMARC Record (Domain-based Message Authentication)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@cymasphere.com
```

**Note**: Start with `p=quarantine` (sends to spam), then move to `p=reject` (rejects) after confirming everything works.

### Step 3: Request Production Access (If in Sandbox)

If you're in SES sandbox mode:
1. Go to **AWS SES Console** → **Account dashboard**
2. Click **"Request production access"**
3. Fill out the form:
   - **Mail Type**: Transactional
   - **Website URL**: https://www.cymasphere.com
   - **Use case**: Support ticket notifications
   - **Expected volume**: Your estimated monthly emails
4. Submit and wait for approval (usually 24-48 hours)

### Step 4: Verify DNS Records

After adding DNS records, wait 24-48 hours, then verify:

```bash
# Check SPF
dig TXT cymasphere.com | grep spf

# Check DKIM (replace with your actual DKIM selector)
dig CNAME [your-dkim-selector]._domainkey.cymasphere.com

# Check DMARC
dig TXT _dmarc.cymasphere.com | grep DMARC
```

Or use online tools:
- https://mxtoolbox.com/spf.aspx
- https://mxtoolbox.com/dmarc.aspx
- https://www.dmarcanalyzer.com/

### Step 5: Update Email Configuration

Once domain is verified, update your email sending to use the verified domain:

```typescript
from: "support@cymasphere.com" // Must match verified domain
```

## Additional Best Practices

### 1. Use Proper Email Headers

The code now includes:
- `Message-ID` header
- `List-Unsubscribe` header (for transactional emails)
- Proper `From` and `Reply-To` headers

### 2. Avoid Spam Triggers

✅ **DO:**
- Use clear, descriptive subject lines
- Include plain text version
- Use proper HTML structure
- Keep images minimal
- Use real sender name

❌ **DON'T:**
- Use ALL CAPS in subject
- Use excessive exclamation marks!!!
- Use spam trigger words ("FREE", "CLICK NOW", etc.)
- Send from "noreply@" addresses
- Use URL shorteners

### 3. Warm Up Your Domain

If this is a new domain:
- Start with low volume (10-20 emails/day)
- Gradually increase over 2-4 weeks
- Monitor bounce rates and spam complaints

### 4. Monitor Reputation

Check your sending reputation:
- **AWS SES Console** → **Reputation dashboard**
- **Google Postmaster Tools**: https://postmaster.google.com/
- **Microsoft SNDS**: https://sendersupport.olc.protection.outlook.com/snds/

### 5. Handle Bounces and Complaints

Set up bounce and complaint handling:
- **AWS SES Console** → **Configuration sets**
- Create a configuration set with bounce/complaint topics
- Set up SNS topics to handle bounces
- Remove bounced emails from your list immediately

## Testing Deliverability

### Test Your Email

1. **Send a test email** to yourself
2. **Check headers** in Gmail:
   - Click the three dots → "Show original"
   - Look for:
     - `SPF: PASS`
     - `DKIM: PASS`
     - `DMARC: PASS`

### Use Testing Tools

- **Mail Tester**: https://www.mail-tester.com/
  - Send email to the address they provide
  - Get a spam score (aim for 10/10)
  
- **MXToolbox**: https://mxtoolbox.com/emailhealth/
  - Check domain reputation
  - Verify DNS records

## Current Status

✅ **What's Already Done:**
- Email sending via AWS SES
- HTML and plain text versions
- Proper email structure
- Reply-To header

❌ **What Needs to Be Done:**
- [ ] Verify domain in AWS SES
- [ ] Add SPF record to DNS
- [ ] Add DKIM records to DNS
- [ ] Add DMARC record to DNS
- [ ] Request production access (if in sandbox)
- [ ] Wait 24-48 hours for DNS propagation
- [ ] Test email deliverability

## Quick Checklist

- [ ] Domain verified in AWS SES
- [ ] SPF record added to DNS
- [ ] DKIM records (3) added to DNS
- [ ] DMARC record added to DNS
- [ ] DNS records verified (24-48 hours)
- [ ] Production access requested (if needed)
- [ ] Test email sent and checked
- [ ] Email headers verified (SPF/DKIM/DMARC PASS)
- [ ] Mail-tester.com score checked (aim for 10/10)

## Support

If emails still go to spam after setting up authentication:
1. Check AWS SES reputation dashboard
2. Check Google Postmaster Tools
3. Verify all DNS records are correct
4. Wait 24-48 hours after DNS changes
5. Check email headers in Gmail "Show original"

