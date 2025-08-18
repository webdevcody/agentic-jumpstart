# AWS SES Infrastructure Setup

This directory contains scripts to set up AWS Simple Email Service (SES) for your email composer feature.

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   # Install AWS CLI
   # Follow: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
   
   # Configure AWS CLI
   aws configure
   ```

2. **Domain ownership** - You need to own a domain for email sending

3. **DNS access** - Ability to add TXT and CNAME records to your domain

## Scripts Overview

### 1. `setup-ses.sh`
Sets up AWS SES for your domain with verification and DKIM.

```bash
./setup-ses.sh
```

**What it does:**
- Initiates domain verification in SES
- Sets up DKIM for better email deliverability
- Provides DNS records you need to add
- Configures bounce/complaint notifications (optional)

### 2. `setup-iam.sh`
Creates an IAM user with SES-only permissions for your application.

```bash
./setup-iam.sh
```

**What it does:**
- Creates an IAM user (default: `ses-email-service`)
- Creates a policy with minimal SES permissions
- Generates access keys for your application
- Saves credentials to a secure file

### 3. `setup-dkim.sh`
Specifically enables DKIM for your domain and provides DNS records.

```bash
./setup-dkim.sh [domain]
```

**What it does:**
- Enables DKIM signing for your domain
- Retrieves DKIM tokens from AWS
- Provides exact DNS records to add
- Checks current DKIM status

### 4. `verify-domain.sh`
Checks the status of your domain verification and provides troubleshooting info.

```bash
./verify-domain.sh [domain]
```

**What it does:**
- Checks domain verification status
- Shows required DNS records
- Validates DKIM configuration
- Tests email sending capability
- Shows account limits and status

### 5. `permissions.json`
Contains the minimal IAM permissions required for SES email sending.

## Setup Process

### Step 1: Domain Setup
```bash
# Make scripts executable
chmod +x *.sh

# Set up your domain in SES
./setup-ses.sh
```

Follow the prompts and add the provided DNS records to your domain.

### Step 1.5: DKIM Setup (if needed)
If DKIM setup failed during domain setup, run the dedicated DKIM script:

```bash
# Enable DKIM for your domain
./setup-dkim.sh yourdomain.com
```

This will provide you with the 3 CNAME records needed for DKIM verification.

### Step 2: Create IAM User
```bash
# Create IAM user with SES permissions
./setup-iam.sh
```

Save the generated access keys securely.

### Step 3: Verify Setup
```bash
# Check domain verification status
./verify-domain.sh yourdomain.com
```

### Step 4: Configure Environment
Add the generated environment variables to your application:

```env
AWS_SES_ACCESS_KEY_ID=your_access_key_id
AWS_SES_SECRET_ACCESS_KEY=your_secret_access_key
AWS_SES_REGION=us-east-1
FROM_EMAIL_ADDRESS=noreply@yourdomain.com
```

## DNS Records Required

### Domain Verification (TXT Record)
```
Name: _amazonses.yourdomain.com
Type: TXT
Value: [verification_token_from_setup]
```

### DKIM (CNAME Records)
Add 3 CNAME records (tokens provided by setup script):
```
Name: [token1]._domainkey.yourdomain.com
Type: CNAME
Value: [token1].dkim.amazonses.com

Name: [token2]._domainkey.yourdomain.com
Type: CNAME
Value: [token2].dkim.amazonses.com

Name: [token3]._domainkey.yourdomain.com
Type: CNAME
Value: [token3].dkim.amazonses.com
```

## Important Notes

### Sandbox vs Production
- **Sandbox Mode**: Can only send to verified email addresses
- **Production Mode**: Can send to any email address
- Request production access through AWS Console or support ticket

### Rate Limits
- **Sandbox**: 200 emails/24 hours, 1 email/second
- **Production**: Varies by account, typically starts at 200/day

### Security
- Keep your access keys secure
- Use environment variables, not hardcoded values
- Regularly rotate access keys
- Monitor usage through CloudWatch

## Troubleshooting

### Domain Verification Issues
```bash
# Check verification status
./verify-domain.sh yourdomain.com

# Common issues:
# 1. DNS propagation delay (up to 72 hours)
# 2. Incorrect DNS record format
# 3. DNS caching
```

### Email Sending Issues
```bash
# Test email sending
aws ses send-email \
  --source noreply@yourdomain.com \
  --destination ToAddresses=test@example.com \
  --message "Subject={Data='Test'},Body={Text={Data='Test email'}}" \
  --region us-east-1
```

### Common Error Codes
- `MessageRejected`: Domain not verified or in sandbox mode
- `SendingPausedException`: Account sending disabled
- `MailFromDomainNotVerifiedException`: FROM domain not verified

## Additional Resources

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [SES Console](https://console.aws.amazon.com/ses/)
- [SES Sending Statistics](https://console.aws.amazon.com/ses/home#reputation-dashboard:)

## Support

For issues with these scripts:
1. Check the AWS SES console for error details
2. Verify DNS records are correctly configured
3. Ensure AWS CLI is properly configured
4. Check AWS account limits and permissions