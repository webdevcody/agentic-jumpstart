# Affiliate Program Requirements

## Overview
The affiliate program enables users to earn commissions by referring new customers to purchase the Agentic Jumpstart course. Affiliates receive a unique tracking link and earn 30% commission on all referred sales.

## Business Requirements

### 1. User Registration & Eligibility
- **REQ-AF-001**: Any authenticated user can register as an affiliate
- **REQ-AF-002**: Users must agree to the Terms of Service before becoming affiliates
- **REQ-AF-003**: Users must provide a valid payment link (PayPal, Venmo, etc.) for receiving payouts
- **REQ-AF-004**: One affiliate account per user (no duplicate registrations)

### 2. Affiliate Code & Tracking
- **REQ-AF-005**: Each affiliate receives a unique 8-character alphanumeric code
- **REQ-AF-006**: Affiliate codes must be case-insensitive and URL-safe
- **REQ-AF-007**: System must generate unique codes with retry mechanism (up to 10 attempts)
- **REQ-AF-008**: Tracking links follow format: `/purchase?ref={affiliateCode}`

### 3. Cookie & Attribution
- **REQ-AF-009**: 30-day cookie duration for affiliate tracking
- **REQ-AF-010**: Cookie persists across browser sessions
- **REQ-AF-011**: Last-click attribution model (last affiliate link clicked gets credit)
- **REQ-AF-012**: Store affiliate code in both localStorage and cookies for redundancy

### 4. Commission Structure
- **REQ-AF-013**: 30% commission rate on all referred sales
- **REQ-AF-014**: Commission calculated on net sale price (after any discounts)
- **REQ-AF-015**: Commissions tracked in cents to avoid floating point issues
- **REQ-AF-016**: No commission on self-referrals (affiliate cannot use own code)

### 5. Payment & Payouts
- **REQ-AF-017**: $50 minimum payout threshold
- **REQ-AF-018**: Monthly payout schedule
- **REQ-AF-019**: Affiliates can update payment link at any time
- **REQ-AF-020**: Admin must manually process payouts and record transaction details
- **REQ-AF-021**: Track paid vs unpaid balances separately

### 6. Dashboard & Analytics
- **REQ-AF-022**: Affiliates can view real-time statistics:
  - Total lifetime earnings
  - Unpaid balance
  - Total referrals count
  - Amount already paid out
- **REQ-AF-023**: Detailed referral history with dates and amounts
- **REQ-AF-024**: Payout history with transaction details
- **REQ-AF-025**: Monthly earnings breakdown chart

### 7. Admin Management
- **REQ-AF-026**: Admin can view all affiliates with statistics
- **REQ-AF-027**: Admin can activate/deactivate affiliate accounts
- **REQ-AF-028**: Admin can record payouts with transaction details
- **REQ-AF-029**: Admin can view detailed analytics for all affiliates

### 8. Fraud Prevention
- **REQ-AF-030**: Prevent self-referrals (user cannot use own affiliate code)
- **REQ-AF-031**: Unique constraint on Stripe session IDs to prevent duplicate processing
- **REQ-AF-032**: Validate affiliate codes before processing referrals
- **REQ-AF-033**: Only active affiliates can earn commissions

### 9. Integration Requirements
- **REQ-AF-034**: Process referrals via Stripe webhook on successful payment
- **REQ-AF-035**: Pass affiliate code as metadata in Stripe checkout session
- **REQ-AF-036**: Handle race conditions with database transactions
- **REQ-AF-037**: Log warnings for invalid/duplicate referral attempts

### 10. User Experience
- **REQ-AF-038**: Non-authenticated users see landing page with program benefits
- **REQ-AF-039**: Authenticated non-affiliates see registration form
- **REQ-AF-040**: Existing affiliates redirect to dashboard
- **REQ-AF-041**: Copy-to-clipboard functionality for affiliate link
- **REQ-AF-042**: Terms of Service displayed in modal dialog

### 11. Prohibited Activities (Terms Enforcement)
- **REQ-AF-043**: System must support deactivation for violations:
  - Spam or unsolicited emails
  - Misleading or false advertising
  - Self-referrals or fraudulent purchases
  - Trademark or brand misrepresentation
  - Paid search advertising on trademarked terms

### 12. Data Storage Requirements
- **REQ-AF-044**: Store affiliate data in PostgreSQL with proper indexes
- **REQ-AF-045**: Maintain referential integrity with cascade deletes
- **REQ-AF-046**: Track creation and update timestamps for audit trail
- **REQ-AF-047**: Store commission amounts in cents (integer) to avoid precision issues

## Technical Requirements

### Database Schema
- `affiliates` table with user relationship
- `affiliate_referrals` table for tracking individual sales
- `affiliate_payouts` table for payment history
- Proper indexes on frequently queried fields (userId, affiliateCode)

### API Endpoints (Server Functions)
- `registerAffiliateFn` - Register new affiliate
- `getAffiliateDashboardFn` - Get affiliate analytics
- `checkIfUserIsAffiliateFn` - Check affiliate status
- `updateAffiliatePaymentLinkFn` - Update payment details
- `validateAffiliateCodeFn` - Validate affiliate code
- `adminGetAllAffiliatesFn` - Admin view all affiliates
- `adminToggleAffiliateStatusFn` - Admin activate/deactivate
- `adminRecordPayoutFn` - Admin record payout

### Security Requirements
- Authentication required for affiliate registration and dashboard
- Admin authentication for management functions
- URL validation for payment links
- Protection against SQL injection via parameterized queries
- CSRF protection on state-changing operations

## Success Metrics
- Affiliate conversion rate (visitors to affiliates)
- Average earnings per affiliate
- Referral conversion rate
- Time to first referral
- Payout processing time
- Affiliate retention rate