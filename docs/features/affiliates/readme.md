# Affiliate Program

## Overview

The Affiliate Program allows users to earn 30% commission by referring new customers to purchase the Agentic Jumpstart course. The system now includes a GDPR-compliant discount system where affiliate codes provide customers with 10% discounts while maintaining affiliate tracking through Stripe metadata. This feature includes a complete affiliate management system with tracking, analytics, and payout management.

## Quick Links

- **User Registration**: [/affiliates](http://localhost:4000/affiliates)
- **Affiliate Dashboard**: [/affiliate-dashboard](http://localhost:4000/affiliate-dashboard)
- **Admin Management**: [/admin/affiliates](http://localhost:4000/admin/affiliates)

### 1. As a New Affiliate

#### Prerequisites

- You need a Google account for authentication
- The application should be running locally (`npm run dev`)
- Database is running and migrations applied (`npm run db:migrate`)

#### Registration Process

1. Navigate to [/affiliates](http://localhost:4000/affiliates)
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

1. Go to [/affiliate-dashboard](http://localhost:4000/affiliate-dashboard)
2. Your unique affiliate link is displayed prominently with enhanced styling
3. Click the copy button to copy it to clipboard (improved UX feedback)
4. Your 8-character affiliate code follows the format: `ABC12345`

#### Testing Discount & Referral Tracking

1. Open an incognito/private browser window
2. Visit your affiliate link (e.g., `http://localhost:4000/purchase?ref=ABC12345`)
3. The affiliate code is temporarily stored in memory (not browser storage for GDPR compliance)
4. Click "Get Instant Access" to start the purchase process
5. A discount dialog will appear with your affiliate code pre-filled
6. The dialog shows "Have a Discount Code?" with your code already entered
7. Click "Apply 10% Discount" to validate and apply the discount
8. Complete the checkout process - the customer gets 10% off
9. The commission will be automatically tracked via Stripe webhook processing
10. Both the affiliate code (for tracking) and discount code (for coupon) are passed to Stripe

#### Tracking System Tests

- **REQ-AF-005**: Test unique 8-character alphanumeric code generation
- **REQ-AF-008**: Verify tracking links follow format `/purchase?ref={code}`
- **REQ-AF-009**: Confirm affiliate codes are captured from URL parameters
- **REQ-AF-010**: Test memory-only storage (no cookies/localStorage)
- **REQ-AF-011**: Validate last-click attribution model
- **REQ-AF-012**: Check GDPR compliance (no persistent browser storage)

#### Discount System Tests

- **REQ-AF-048**: Test discount dialog appears during checkout process
- **REQ-AF-049**: Verify users can enter affiliate codes for 10% discount
- **REQ-AF-050**: Test real-time affiliate code validation
- **REQ-AF-051**: Confirm Stripe discount coupon application
- **REQ-AF-052**: Test pre-filling discount dialog with URL parameter code
- **REQ-AF-053**: Verify users can skip discount entry
- **REQ-AF-054**: Confirm codes stored in memory only during session

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

1. Navigate to [/admin/affiliates](http://localhost:4000/admin/affiliates)
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
  COMMISSION_RATE: 30, // 30% commission
  MINIMUM_PAYOUT: 5000, // $50 minimum
  AFFILIATE_CODE_LENGTH: 8, // Code length
  AFFILIATE_CODE_RETRY_ATTEMPTS: 10,
};
```

### Environment Variables

New environment variable for discount system:

```bash
# Stripe coupon ID for 10% affiliate discount
STRIPE_DISCOUNT_COUPON_ID=your_stripe_discount_coupon_id
```

This coupon must be created in your Stripe dashboard with 10% discount rate.

## Integration Points

### Stripe Integration

The affiliate system integrates with Stripe in multiple ways:

1. **Checkout Session**: Both affiliate code (for tracking) and discount code are passed as metadata
2. **Discount Application**: Valid affiliate codes trigger automatic 10% coupon application
3. **Webhook Processing**: On successful payment, webhook processes the referral
4. **Commission Calculation**: Commission is automatically calculated and recorded
5. **Self-referral Prevention**: System prevents affiliates from using their own codes

### Discount Dialog Flow

- **URL Parameter Capture**: Affiliate codes from `?ref={code}` are captured and stored in memory
- **Purchase Flow**: Purchase button triggers discount dialog instead of direct checkout
- **Code Validation**: Real-time validation against database of active affiliate codes
- **Memory Storage**: Codes stored in application memory only (no browser persistence)
- **GDPR Compliance**: No cookies or localStorage used for code storage

## Complete Test Suite

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

#### Code Attribution & Privacy (REQ-AF-009 to REQ-AF-012)

- URL parameter capture testing (`?ref={code}`)
- Memory-only storage validation (GDPR compliance)
- Last-click attribution model verification
- Browser storage absence verification (no cookies/localStorage)

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

#### Discount code validation fails

1. Check if affiliate code exists and is active in database
2. Verify `STRIPE_DISCOUNT_COUPON_ID` environment variable is set
3. Ensure Stripe coupon exists and is active
4. Check browser network logs for validation API errors
5. **Test Scenario**: REQ-AF-050 covers real-time code validation

#### Referral not tracked despite discount applied

1. Check if affiliate code exists and is active
2. Verify both affiliate and discount codes are passed to Stripe metadata
3. Check Stripe webhook logs for processing errors
4. Ensure it's not a self-referral (REQ-AF-030)
5. Verify affiliate code in Stripe checkout session metadata

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

To debug affiliate discount and tracking:

1. Open browser DevTools
2. Check Network tab during discount validation for API calls
3. Monitor Network tab during purchase for metadata
4. Check webhook logs: `npm run stripe:listen`
5. Verify database records in affiliate tables
6. Check DiscountStore state (only exists in memory during session)
7. Verify `STRIPE_DISCOUNT_COUPON_ID` environment variable
8. Confirm Stripe coupon exists and is active

## Security Considerations

- Authentication required for all affiliate functions
- Admin-only access for management features
- Self-referral prevention
- Duplicate transaction prevention
- URL validation for payment links
- SQL injection protection via parameterized queries
- GDPR compliance: No persistent browser storage of affiliate codes
- Memory-only code storage to avoid privacy concerns
- Real-time validation prevents invalid code submissions

## API Reference

### Server Functions

- `registerAffiliateFn` - Register as affiliate
- `getAffiliateDashboardFn` - Get dashboard data
- `checkIfUserIsAffiliateFn` - Check affiliate status
- `updateAffiliatePaymentLinkFn` - Update payment link
- `validateAffiliateCodeFn` - Validate affiliate code (used by discount dialog)
- `adminGetAllAffiliatesFn` - Get all affiliates (admin)
- `adminToggleAffiliateStatusFn` - Toggle status (admin)
- `adminRecordPayoutFn` - Record payout (admin)

### Components

- `DiscountDialog` - Modal for entering discount codes during checkout
- `DiscountStore` - In-memory store for managing discount codes during session

### Files Changed

- `/src/routes/purchase.tsx` - Updated checkout flow with discount dialog
- `/src/components/discount-dialog.tsx` - New discount code entry component
- `/src/stores/discount-store.ts` - New in-memory store for codes
- `/src/utils/env.ts` - Added STRIPE_DISCOUNT_COUPON_ID environment variable
- `/src/fn/affiliates.ts` - Contains validateAffiliateCodeFn for real-time validation

## Stripe Connect Integration

### Overview

Stripe Connect enables automatic payouts to affiliates who connect their Stripe account. Instead of manually tracking payment links and processing payouts, affiliates with connected Stripe accounts receive automatic transfers when their balance reaches the minimum threshold.

**How It Works:**
1. Affiliate connects their Stripe account via OAuth flow
2. System tracks their earnings as usual
3. When unpaid balance reaches $50, admin can trigger automatic payout
4. Funds are transferred directly to the affiliate's Stripe account
5. Affiliate receives funds according to their Stripe payout schedule

### Account Status Lifecycle

Affiliates can choose between two payment methods:
- **Payment Link**: Manual payouts via PayPal, Venmo, or other payment services
- **Stripe Connect**: Automatic payouts directly to connected Stripe account

#### Stripe Account Statuses

| Status | Description | Can Receive Payouts? |
|--------|-------------|---------------------|
| `not_started` | No Stripe account connected | No |
| `onboarding` | Account created but setup incomplete | No |
| `pending` | Details submitted, awaiting Stripe verification | No |
| `active` | Fully verified, charges and payouts enabled | Yes |
| `restricted` | Account has restrictions or compliance issues | No |

### Connecting a Stripe Account (Affiliate Guide)

#### Step-by-Step Process

1. **Navigate to Dashboard**: Go to [/affiliate-dashboard](http://localhost:4000/affiliate-dashboard)
2. **Select Payment Method**: Choose "Stripe Connect" as your payment method
3. **Initiate Connection**: Click "Connect with Stripe" button
4. **Complete Stripe Onboarding**: You'll be redirected to Stripe's secure onboarding flow
   - Provide business/personal information
   - Verify identity
   - Set up bank account for payouts
5. **Return to Dashboard**: After completing onboarding, you're redirected back
6. **Verify Status**: Your account status should show "Active" for automatic payouts

#### OAuth Flow Details

The Stripe Connect integration uses OAuth with Express accounts:

```
User clicks "Connect" → /api/connect/stripe (creates account, generates link)
                      ↓
User completes Stripe onboarding (hosted by Stripe)
                      ↓
Stripe redirects → /api/connect/stripe/callback (updates status)
                      ↓
User returns to affiliate dashboard with connected account
```

**Security Features:**
- CSRF protection via state tokens stored in HTTP-only cookies
- 10-minute expiration on onboarding sessions
- Double verification of affiliate ID on callback
- Secure cookie settings in production

### Automatic Payouts

#### Eligibility Requirements

For an affiliate to receive automatic payouts:
1. **Active affiliate account** - Account must not be deactivated
2. **Connected Stripe account** - Must have `stripeConnectAccountId` set
3. **Payouts enabled** - Stripe account status must be `active` with `stripePayoutsEnabled: true`
4. **Minimum balance** - Unpaid balance must be at least $50 (5000 cents)

#### Payout Process

**Single Affiliate Payout:**
1. Admin triggers payout for specific affiliate
2. System validates eligibility
3. Creates Stripe Transfer to connected account
4. Records payout in database
5. Updates affiliate balances

**Batch Payout Processing:**
1. Admin triggers "Process All Automatic Payouts"
2. System queries all eligible affiliates
3. Processes payouts in batches of 3 (respects Stripe rate limits)
4. 1-second delay between batches
5. Returns summary of successful/failed payouts

#### Rate Limiting

The batch payout system implements controlled concurrency:
- **Concurrent payouts**: 3 at a time
- **Batch delay**: 1 second between batches
- **Idempotency**: Duplicate transfer detection prevents double payouts

### Disconnecting Stripe Account

To switch back to manual payment links:
1. Go to affiliate dashboard
2. Change payment method from "Stripe Connect" to "Payment Link"
3. Enter your PayPal or other payment link
4. Save changes

**Note**: The Stripe account remains in the system but is no longer used for payouts. To fully disconnect the Stripe account, contact support.

### Admin Functions for Stripe Connect

#### Viewing Stripe Connect Status

The admin affiliate dashboard displays:
- Payment method (link vs stripe)
- Stripe account status
- Charges enabled flag
- Payouts enabled flag
- Last sync timestamp

#### Manual Status Sync

If an affiliate's status appears outdated:
1. The system automatically syncs when `account.updated` webhooks are received
2. Affiliates can manually refresh from their dashboard
3. Admins can view the `lastStripeSync` timestamp

#### Processing Automatic Payouts

**Individual Payout:**
```
Admin Dashboard → Select Affiliate → "Process Automatic Payout"
```

**Batch Processing:**
```
Admin Dashboard → "Process All Automatic Payouts" → Review Results
```

### Troubleshooting

#### "Stripe payouts not enabled for this affiliate"

**Cause**: The affiliate's Stripe account is not fully set up.

**Solutions**:
1. Check account status - should be `active`
2. Have affiliate complete Stripe onboarding
3. Verify identity documents if requested by Stripe
4. Check for any restrictions in Stripe dashboard

#### "Balance below minimum payout"

**Cause**: Affiliate's unpaid balance is less than $50.

**Solution**: Wait for more referral conversions until balance reaches $50.

#### "No affiliate found with this Stripe account ID"

**Cause**: Webhook received for unknown account.

**Solution**: This is normal for accounts not in your system. No action needed.

#### Affiliate stuck in "onboarding" status

**Cause**: User didn't complete Stripe onboarding flow.

**Solutions**:
1. Have affiliate click "Connect with Stripe" again
2. They'll be redirected to continue where they left off
3. Ensure they complete all required steps in Stripe

#### Payout failed with Stripe error

**Common causes**:
- Insufficient platform balance
- Connected account restricted
- Bank account issues on affiliate's side

**Solutions**:
1. Check Stripe dashboard for detailed error
2. Contact affiliate to resolve account issues
3. Retry payout after issue is resolved

### Environment Variables

Required environment variables for Stripe Connect:

```bash
# Core Stripe configuration (already required)
STRIPE_SECRET_KEY=sk_live_xxx  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_xxx  # Webhook signing secret

# Application URL (used for OAuth redirects)
HOST_NAME=https://yourdomain.com

# REQUIRED: System user ID for automatic payouts
# This MUST be set to a dedicated system/admin user ID in the database
# The application will fail to start if this is not set or is invalid
SYSTEM_USER_ID=123
```

**Important**: `SYSTEM_USER_ID` is a required environment variable. It must be set to a dedicated system/admin user ID that exists in your database. This user ID is recorded as the "processedBy" user when automatic affiliate payouts are triggered. Do not use a real user's ID - create a dedicated system account for this purpose.

**Note**: No additional Stripe Connect-specific environment variables are required. The integration uses your existing `STRIPE_SECRET_KEY` which must have Connect permissions.

### Webhook Configuration

The system handles the `account.updated` webhook event to sync Stripe account status changes. Ensure your Stripe webhook endpoint is configured to receive Connect events:

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `account.updated` (for Connect accounts)

### API Routes Reference

| Route | Method | Description |
|-------|--------|-------------|
| `/api/connect/stripe` | GET | Initiates Stripe Connect OAuth flow |
| `/api/connect/stripe/callback` | GET | Handles OAuth callback, updates status |
| `/api/connect/stripe/refresh` | GET | Regenerates onboarding link for incomplete setup |

### Database Fields for Stripe Connect

The `app_affiliate` table includes these Stripe Connect fields:

| Field | Type | Description |
|-------|------|-------------|
| `paymentMethod` | enum | `link` or `stripe` |
| `stripeConnectAccountId` | string | Stripe Express account ID (acct_xxx) |
| `stripeAccountStatus` | string | Account status (not_started, onboarding, pending, active, restricted) |
| `stripeChargesEnabled` | boolean | Whether account can receive charges |
| `stripePayoutsEnabled` | boolean | Whether account can receive payouts |
| `stripeDetailsSubmitted` | boolean | Whether onboarding details are submitted |
| `lastStripeSync` | timestamp | Last time status was synced from Stripe |

## Support

For issues or questions about the affiliate program, contact the development team or check the main project documentation.
