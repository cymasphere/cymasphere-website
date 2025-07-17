# GitHub Secrets Check Guide

## Method 1: GitHub Web Interface (Recommended)

1. **Go to your repository**: https://github.com/cymasphere/cymasphere-website
2. **Navigate to Settings**: Click on "Settings" tab
3. **Go to Secrets and variables**: Click on "Secrets and variables" → "Actions"
4. **Check Repository secrets**: You'll see all configured secrets

## Method 2: GitHub CLI (if authenticated)

```bash
# List all secrets (names only)
gh secret list

# Get a specific secret value (requires proper permissions)
gh secret view SECRET_NAME
```

## Required GitHub Secrets (from deploy.yml)

### Core Application
- `NEXT_PUBLIC_SITE_URL` - Should be `https://cymasphere.com` (not localhost)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Stripe Configuration
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Should be live key (pk_live_...)
- `STRIPE_SECRET_KEY` - Should be live key (sk_live_...)
- `STRIPE_WEBHOOK_SECRET` - Webhook secret
- `STRIPE_PRICE_ID_MONTHLY` - Live monthly price ID
- `STRIPE_PRICE_ID_ANNUAL` - Live annual price ID
- `STRIPE_PRICE_ID_LIFETIME` - Live lifetime price ID

### AWS Configuration
- `AWS_ACCESS_KEY_ID` - Production AWS access key
- `AWS_SECRET_ACCESS_KEY` - Production AWS secret key
- `AWS_REGION` - AWS region (us-east-1)

### Deployment Configuration
- `LIGHTSAIL_SSH_KEY` - SSH private key for Lightsail
- `LIGHTSAIL_HOST` - Lightsail instance hostname/IP
- `LIGHTSAIL_USER` - Lightsail username
- `CRON_SECRET` - Secret for cron job authentication

## Missing Secrets (referenced in code but not in deploy.yml)

These should be added to GitHub secrets:
- `EMAIL_TEST_MODE` - Set to `false` for production
- `LIFETIME_PRICE_ID_2` - Second lifetime price ID
- `NEXT_PUBLIC_API_URL` - Set to `https://cymasphere.com`

## Comparison with Local Environment

### Local (.env.local) vs Production Differences:

1. **URLs**: Local uses `localhost:3000`, production should use `cymasphere.com`
2. **Stripe Keys**: Local uses test keys (pk_test_...), production should use live keys (pk_live_...)
3. **AWS Credentials**: Should use production AWS SES credentials
4. **Missing Variables**: Local has some variables not in GitHub secrets

## Action Items

1. **Add missing secrets** to GitHub repository settings
2. **Update deploy.yml** to include missing environment variables
3. **Verify all secrets** have correct production values
4. **Test deployment** to ensure all variables are properly set

## Quick Check Commands

```bash
# Check if GitHub CLI is working
gh auth status

# List repository secrets (if authenticated)
gh secret list

# Check local environment variables
cat .env.local

# Compare with what's expected in production
grep -E "NEXT_PUBLIC_|STRIPE_|AWS_|CRON_" .env.local
``` 