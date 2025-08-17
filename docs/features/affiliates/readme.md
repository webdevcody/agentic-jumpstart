# Affiliate Program

## Overview
The Affiliate Program allows users to earn 30% commission by referring new customers to purchase the Agentic Jumpstart course. This feature includes a complete affiliate management system with tracking, analytics, and payout management.

## Quick Links
- **User Registration**: [/affiliates](http://localhost:3000/affiliates)
- **Affiliate Dashboard**: [/affiliate-dashboard](http://localhost:3000/affiliate-dashboard)
- **Admin Management**: [/admin/affiliates](http://localhost:3000/admin/affiliates)

## How to Test

### Comprehensive Testing Guide

The affiliate system includes 47 documented requirements with corresponding test scenarios in `/docs/features/affiliates/tests/`. Each requirement has detailed test steps, expected results, and validation procedures.

### 1. As a New Affiliate

#### Prerequisites
- You need a Google account for authentication
- The application should be running locally (`npm run dev`)
- Database is running and migrations applied (`npm run db:migrate`)

#### Registration Process
1. Navigate to [/affiliates](http://localhost:3000/affiliates)
2. If not logged in, you'll see the enhanced landing page with:
   - Modern gradient backgrounds and animations
   - Program benefits overview (30% commission, 30-day cookies, real-time tracking)
   - "How It Works" 4-step process visualization
3. Click "Login to Join Program" and authenticate with Google
4. Once logged in, you'll see the registration form with:
   - Payment link input field (validated URL)
   - Terms of Service checkbox with modal dialog
   - Enhanced UI with better error handling
5. Enter a valid payment link (e.g., `https://paypal.me/yourname`)
6. Click on "Terms of Service" to review the comprehensive terms
7. Check the "I agree to the Terms of Service" checkbox
8. Click "Join Affiliate Program"
9. You'll be redirected to your affiliate dashboard with welcome message

#### Registration Validation Tests
- **REQ-AF-001**: Test that any authenticated user can register
- **REQ-AF-002**: Verify Terms of Service agreement is required
- **REQ-AF-003**: Confirm valid payment link is required
- **REQ-AF-004**: Check that duplicate registrations are prevented

### 2. Using Your Affiliate Link

#### Getting Your Link
1. Go to [/affiliate-dashboard](http://localhost:3000/affiliate-dashboard)
2. Your unique affiliate link is displayed prominently with enhanced styling
3. Click the copy button to copy it to clipboard (improved UX feedback)
4. Your 8-character affiliate code follows the format: `ABC12345`

#### Testing Referral Tracking
1. Open an incognito/private browser window
2. Visit your affiliate link (e.g., `http://localhost:3000/purchase?ref=ABC12345`)
3. Verify the affiliate code is stored in both cookies AND localStorage (dual redundancy)
4. Cookie expires after exactly 30 days for proper attribution window
5. Create a new test account and make a purchase
6. The commission will be automatically tracked via Stripe webhook processing

#### Tracking System Tests
- **REQ-AF-005**: Test unique 8-character alphanumeric code generation  
- **REQ-AF-008**: Verify tracking links follow format `/purchase?ref={code}`
- **REQ-AF-009**: Confirm 30-day cookie duration
- **REQ-AF-010**: Test cookie persistence across browser sessions
- **REQ-AF-011**: Validate last-click attribution model
- **REQ-AF-012**: Check dual storage in localStorage and cookies

### 3. Viewing Analytics

The enhanced affiliate dashboard displays real-time statistics with improved visualizations:

#### Main Statistics Cards
- **Total Earnings**: Lifetime commission earned (30% of all referral sales)
- **Unpaid Balance**: Pending payment amount (minimum $50 payout threshold)
- **Total Referrals**: Number of successful conversions tracked
- **Paid Out**: Amount already paid via recorded payouts

#### Enhanced Features
- **Detailed referral history** with sortable columns (date, amount, commission, status)
- **Payout history** showing all recorded payments with transaction details
- **Monthly earnings chart** with interactive data visualization
- **Payment link update** functionality with URL validation
- **Copy affiliate link** with one-click clipboard functionality
- **Motion animations** for smoother user experience
- **Responsive design** optimized for all device sizes

#### Dashboard Analytics Tests
- **REQ-AF-022**: Test real-time statistics display accuracy
- **REQ-AF-023**: Verify detailed referral history functionality
- **REQ-AF-024**: Check payout history with transaction details
- **REQ-AF-025**: Validate monthly earnings breakdown chart

### 4. Admin Functions

#### Prerequisites
- Your user account must have `isAdmin: true` in the database

#### Admin Dashboard
1. Navigate to [/admin/affiliates](http://localhost:3000/admin/affiliates)
2. View all affiliates with their statistics
3. Search and filter affiliates
4. Click on any affiliate to see detailed information

#### Managing Affiliates
- **Activate/Deactivate**: Toggle affiliate status
- **Record Payout**: 
  1. Click "Record Payout" for an affiliate
  2. Enter amount (minimum $50)
  3. Select payment method
  4. Add transaction ID (optional)
  5. Add notes (optional)
  6. Submit to record the payout

## Database Setup

### Required Tables
The feature requires these database tables (automatically created by migrations):
- `app_affiliate` - Stores affiliate accounts
- `app_affiliate_referral` - Tracks individual referrals
- `app_affiliate_payout` - Records payout history

### Seeding Test Data
To create test affiliates:
```sql
-- Create a test affiliate
INSERT INTO app_affiliate (userId, affiliateCode, paymentLink, commissionRate)
VALUES (1, 'TEST1234', 'https://paypal.me/testuser', 30);

-- Add test referrals
INSERT INTO app_affiliate_referral (affiliateId, purchaserId, stripeSessionId, amount, commission)
VALUES (1, 2, 'cs_test_123', 20000, 6000);
```

## Configuration

Settings are defined in `/src/config.ts`:
```typescript
AFFILIATE_CONFIG = {
  COMMISSION_RATE: 30,          // 30% commission
  MINIMUM_PAYOUT: 5000,         // $50 minimum
  COOKIE_DURATION_DAYS: 30,     // 30-day tracking
  AFFILIATE_CODE_LENGTH: 8,     // Code length
  AFFILIATE_CODE_RETRY_ATTEMPTS: 10
}
```

## Integration Points

### Stripe Webhook
The affiliate system integrates with Stripe webhooks:
1. Affiliate code is passed as metadata in checkout session
2. On successful payment, webhook processes the referral
3. Commission is automatically calculated and recorded
4. Self-referrals are prevented

### Cookie Management
- Affiliate codes are stored in both localStorage and cookies
- 30-day expiration for attribution
- Last-click attribution model

## Complete Test Suite

### Automated Testing with Test Scenarios

Each of the 47 requirements has a dedicated test scenario file in `/docs/features/affiliates/tests/`:

#### User Registration & Eligibility (REQ-AF-001 to REQ-AF-004)
- User registration eligibility testing
- Terms of Service agreement validation
- Payment link validation and storage
- Duplicate registration prevention

#### Affiliate Code & Tracking (REQ-AF-005 to REQ-AF-008)
- Unique 8-character code generation with retry mechanism
- Case-insensitive and URL-safe code validation
- Tracking link format verification
- Code uniqueness stress testing

#### Cookie & Attribution (REQ-AF-009 to REQ-AF-012)
- 30-day cookie duration testing
- Cross-session persistence validation
- Last-click attribution model verification
- Dual storage redundancy (localStorage + cookies)

#### Commission System (REQ-AF-013 to REQ-AF-016)
- 30% commission rate calculation accuracy
- Net sale price commission calculation
- Cents-based storage to avoid floating point issues
- Self-referral prevention mechanism

#### Payment & Payouts (REQ-AF-017 to REQ-AF-021)
- $50 minimum payout threshold enforcement
- Monthly payout schedule management
- Payment link update functionality
- Admin payout recording with transaction details
- Paid vs unpaid balance tracking

#### Dashboard & Analytics (REQ-AF-022 to REQ-AF-025)
- Real-time statistics accuracy
- Detailed referral history presentation
- Payout history with transaction tracking
- Monthly earnings breakdown visualization

#### Admin Management (REQ-AF-026 to REQ-AF-029)
- Admin view of all affiliates with statistics
- Affiliate account activation/deactivation
- Payout recording with full audit trail
- Comprehensive admin analytics dashboard

#### Fraud Prevention (REQ-AF-030 to REQ-AF-033)
- Self-referral prevention (users cannot use own codes)
- Stripe session ID uniqueness enforcement
- Affiliate code validation before processing
- Active affiliate verification for commission eligibility

#### Integration Requirements (REQ-AF-034 to REQ-AF-037)
- Stripe webhook processing for successful payments
- Affiliate code metadata passage to Stripe
- Database transaction handling for race conditions
- Invalid/duplicate referral attempt logging

#### User Experience (REQ-AF-038 to REQ-AF-042)
- Landing page display for non-authenticated users
- Registration form for authenticated non-affiliates
- Existing affiliate dashboard redirection
- Copy-to-clipboard affiliate link functionality
- Terms of Service modal dialog presentation

#### Data Storage (REQ-AF-044 to REQ-AF-047)
- PostgreSQL storage with proper indexing
- Referential integrity with cascade deletes
- Creation/update timestamp audit trails
- Cents-based commission storage for precision

### Running Specific Tests

To run tests for specific requirements:

```bash
# Test affiliate registration
npm run test:affiliate:registration

# Test commission calculations
npm run test:affiliate:commission

# Test webhook integration
npm run test:affiliate:webhook

# Test admin functions
npm run test:affiliate:admin
```

## Troubleshooting

### Common Issues

#### "Already registered as affiliate"
- User is trying to register twice
- Check `app_affiliate` table for existing record
- **Test Scenario**: REQ-AF-004 covers duplicate registration prevention

#### Referral not tracked
1. Check if affiliate code exists and is active
2. Verify cookie is set in browser DevTools (Application > Cookies)
3. Check Stripe webhook logs for processing errors
4. Ensure it's not a self-referral (REQ-AF-030)
5. Verify affiliate code in Stripe metadata

#### Payment link update fails
- Ensure the URL is valid (must start with http:// or https://)
- Check browser console for validation errors
- **Test Scenario**: REQ-AF-019 covers payment link updates

#### Commission calculation errors
- Verify amounts are stored in cents (integers)
- Check commission rate is exactly 30%
- Ensure no floating point precision issues
- **Test Scenario**: REQ-AF-013 covers commission calculations

#### Webhook processing failures
- Check Stripe webhook endpoint configuration
- Verify webhook secret matches environment variable
- Monitor webhook listener logs for errors
- **Test Scenario**: REQ-AF-034 covers webhook processing

### Debug Mode
To debug affiliate tracking:
1. Open browser DevTools
2. Check Application > Cookies for `affiliateCode`
3. Check Application > Local Storage for `affiliateCode`
4. Monitor Network tab during purchase for metadata
5. Check webhook logs: `npm run stripe:listen`
6. Verify database records in affiliate tables

## Security Considerations

- Authentication required for all affiliate functions
- Admin-only access for management features
- Self-referral prevention
- Duplicate transaction prevention
- URL validation for payment links
- SQL injection protection via parameterized queries

## API Reference

### Server Functions
- `registerAffiliateFn` - Register as affiliate
- `getAffiliateDashboardFn` - Get dashboard data
- `checkIfUserIsAffiliateFn` - Check affiliate status
- `updateAffiliatePaymentLinkFn` - Update payment link
- `validateAffiliateCodeFn` - Validate affiliate code
- `adminGetAllAffiliatesFn` - Get all affiliates (admin)
- `adminToggleAffiliateStatusFn` - Toggle status (admin)
- `adminRecordPayoutFn` - Record payout (admin)

## Support
For issues or questions about the affiliate program, contact the development team or check the main project documentation.