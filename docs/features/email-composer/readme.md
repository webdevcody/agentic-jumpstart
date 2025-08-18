# Email Composer Feature

## Overview

The Email Composer feature provides a comprehensive email marketing solution for course administrators, enabling them to send professional bulk emails to course participants with advanced segmentation, progress tracking, and user preference management.

## Quick Start

### For Administrators

1. **Access the Email Composer**
   - Navigate to `/admin/emails` (admin access required)
   - Click "Emails" in the admin navigation menu

2. **Compose Your Email**
   - Enter a subject line (max 200 characters)
   - Select your target audience (All Users, Premium Only, or Free Only)
   - Write your email content in the text area
   - Use the preview feature to review formatting

3. **Test Before Sending**
   - Click "Send Test" to send a test email to yourself
   - Enter your email address in the test dialog
   - Verify content and formatting

4. **Send Your Campaign**
   - Click "Send Email" to start the bulk email process
   - Monitor progress in the "Recent Email Batches" section
   - Track delivery status and metrics

### For Users

1. **Manage Email Preferences**
   - Go to `/settings` or click "Settings" in your account dropdown
   - Toggle your preferences for course updates and promotional emails
   - Click "Save Preferences" to apply changes

## Features

### Admin Email Composer Interface
- **Professional composition UI** with subject and content fields
- **Recipient targeting** with real-time count display
- **Live email preview** with formatted content display
- **Test email functionality** for content verification
- **Bulk email sending** with background processing
- **Progress tracking** with visual indicators
- **Email batch history** with status and metrics

### User Email Preferences
- **Granular control** over email types (course updates vs promotional)
- **Persistent preferences** stored securely in database
- **Default opt-in** behavior for new users
- **Immediate feedback** when saving preferences

### Professional Email Templates
- **Responsive design** compatible with all email clients
- **Consistent branding** with course platform styling
- **Professional typography** and spacing
- **Automatic formatting** for text content

### Advanced Email Processing
- **Background processing** prevents UI blocking
- **Rate limiting** at 5 emails/second (AWS SES compliance)
- **Automatic retry logic** for failed deliveries
- **Comprehensive error handling** and logging

## Technical Architecture

### Database Schema

#### Email Batches Table
```sql
emailBatches:
- id (serial, primary key)
- subject (text, not null)
- htmlContent (text, not null)  
- recipientCount (integer, not null)
- sentCount (integer, default 0)
- failedCount (integer, default 0)
- status (text, not null) -- pending, processing, completed, failed
- adminId (integer, foreign key to users)
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### User Email Preferences Table
```sql
userEmailPreferences:
- id (serial, primary key)
- userId (integer, foreign key to users, unique)
- allowCourseUpdates (boolean, default true)
- allowPromotional (boolean, default true)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### API Endpoints

#### Admin Email Functions
- `POST /admin/emails/create` - Create and send email batch
- `POST /admin/emails/test` - Send test email
- `GET /admin/emails/batches` - Get email batch history
- `GET /admin/emails/users` - Get recipient statistics

#### User Settings Functions
- `GET /settings/preferences` - Get user email preferences
- `POST /settings/preferences` - Update user email preferences

### File Structure

```
src/
├── routes/
│   ├── admin/emails.tsx         # Admin email composer UI
│   └── settings.tsx             # User settings page
├── fn/
│   ├── emails.ts               # Email server functions
│   └── user-settings.ts        # User settings server functions
├── data-access/
│   └── emails.ts               # Email data access layer
├── components/
│   └── emails/
│       └── course-update-email.tsx  # React Email template
├── utils/
│   └── email.ts                # AWS SES integration
└── db/
    └── schema.ts               # Database schema definitions
```

## Setup Instructions

### Prerequisites

1. **AWS Account** with SES access
2. **Domain ownership** for email sending
3. **DNS management** access for domain verification
4. **Node.js environment** with all project dependencies

### 1. AWS SES Configuration

#### Step 1: Run Infrastructure Setup
```bash
cd infra
chmod +x *.sh

# Set up SES domain verification and DKIM
./setup-ses.sh

# Create IAM user with minimal SES permissions  
./setup-iam.sh

# Verify domain setup
./verify-domain.sh yourdomain.com
```

#### Step 2: Configure DNS Records

Add the following DNS records provided by the setup script:

**Domain Verification (TXT Record)**
```
Name: _amazonses.yourdomain.com
Type: TXT
Value: [verification_token_from_setup]
```

**DKIM Authentication (3 CNAME Records)**
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

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# AWS SES Configuration
AWS_SES_ACCESS_KEY_ID=your_access_key_id
AWS_SES_SECRET_ACCESS_KEY=your_secret_access_key
AWS_SES_REGION=us-east-1
FROM_EMAIL_ADDRESS=noreply@yourdomain.com
```

### 3. Database Migration

Apply the database schema changes:

```bash
# Generate migration for new tables
npm run db:generate

# Apply migration to database
npm run db:migrate
```

### 4. Verification

Test your setup:

```bash
# Verify domain status
cd infra
./verify-domain.sh yourdomain.com

# Test email sending via AWS CLI
aws ses send-email \
  --source noreply@yourdomain.com \
  --destination ToAddresses=test@example.com \
  --message "Subject={Data='Test'},Body={Text={Data='Test email'}}" \
  --region us-east-1
```

## Usage Examples

### Admin: Send Course Update Email

1. Navigate to `/admin/emails`
2. Fill in email details:
   ```
   Subject: New Course Module Released - Advanced AI Agents
   Recipients: Premium Users Only
   Content: We've just released a new module covering advanced AI agent architectures. This module includes hands-on examples with LangChain and AutoGPT implementations.
   ```
3. Click "Preview" to review formatting
4. Click "Send Test" and enter your email to test
5. Click "Send Email" to start the campaign

### User: Update Email Preferences

1. Navigate to `/settings`
2. In the "Email Preferences" section:
   - Toggle "Course Updates" (for new content notifications)
   - Toggle "Promotional Emails" (for offers and announcements)
3. Click "Save Preferences"

### Admin: Monitor Email Campaign

1. In the "Recent Email Batches" section, view:
   - Campaign subject and creation date
   - Status badge (processing, completed, failed)
   - Progress bar showing sent/total ratio
   - Failed delivery count (if any)

## Troubleshooting

### Common Issues

#### Domain Verification Fails
```bash
# Check verification status
cd infra
./verify-domain.sh yourdomain.com

# Common causes:
# - DNS propagation delay (up to 72 hours)
# - Incorrect DNS record format
# - DNS caching issues
```

#### Email Sending Fails
```bash
# Check SES status
aws ses get-send-quota --region us-east-1

# Common error codes:
# - MessageRejected: Domain not verified or sandbox mode
# - SendingPausedException: Account sending disabled
# - MailFromDomainNotVerifiedException: FROM domain not verified
```

#### Rate Limiting Issues
- Verify AWS SES limits in console
- Check for sandbox mode restrictions (200 emails/day)
- Request production access for higher limits

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=email:*
```

Check logs for detailed error information:
```bash
# View email processing logs
tail -f logs/email.log

# Check database email batch status
npm run db:studio
```

## Performance Considerations

### Rate Limiting
- **Sandbox Mode**: 1 email/second, 200 emails/24 hours
- **Production Mode**: Configurable, typically starts at 14 emails/second
- **Current Implementation**: 5 emails/second to ensure compliance

### Batch Processing
- Emails are processed in batches of 5
- 1-second delay between batches
- Background processing prevents UI blocking
- Progress updates every batch

### Database Optimization
- Email batches are limited to 10 most recent in UI
- User preference queries are optimized with indexes
- Foreign key relationships ensure data integrity

## Security Features

### Access Control
- Admin middleware protects all email endpoints
- Input validation prevents XSS and injection attacks
- Rate limiting prevents abuse

### Data Protection
- AWS credentials stored securely in environment variables
- User email preferences encrypted in database
- GDPR-compliant opt-out mechanisms

### Email Authentication
- DKIM signatures for improved deliverability
- SPF record support for sender verification
- Bounce and complaint handling infrastructure

## Integration Points

### TanStack Start Integration
- Server functions for email processing
- React Query for data fetching and caching
- File-based routing for admin and user pages

### Database Integration
- Drizzle ORM for type-safe database operations
- PostgreSQL for reliable data storage
- Migrations for schema versioning

### UI Component Integration
- shadcn/ui components for consistent styling
- React Hook Form for form validation
- Tailwind CSS for responsive design

## Monitoring and Analytics

### Available Metrics
- Email batch status and progress
- Send success and failure rates
- User preference adoption rates
- Campaign delivery times

### Logging
- Comprehensive error logging for troubleshooting
- Email send attempt tracking
- AWS SES API interaction logs

### Future Analytics
- Email open rates (planned)
- Click-through tracking (planned)
- User engagement metrics (planned)

## Support and Documentation

### Additional Resources
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [React Email Documentation](https://react.email/)
- [Infrastructure Setup Guide](/docs/features/email-composer/infra/README.md)

### Getting Help
1. Check the troubleshooting section above
2. Review AWS SES console for service-specific errors
3. Verify DNS configuration using the verification script
4. Check application logs for detailed error information

### Feature Requests
Submit feature requests for enhancements like:
- Advanced email templates
- Automated drip campaigns  
- A/B testing capabilities
- Enhanced analytics and reporting