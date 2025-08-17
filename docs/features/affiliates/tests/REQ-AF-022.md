# Test Scenario: REQ-AF-022 - Affiliate Dashboard Statistics

## Requirement
**REQ-AF-022**: Affiliates can view real-time statistics: Total lifetime earnings, Unpaid balance, Total referrals count, Amount already paid out

## Test Scenario

### Prerequisites
- Application is running locally (`npm run dev`)
- Test affiliate account exists with known referrals and payouts
- Sample data in database for testing

### Test Setup Data

Create test affiliate with known statistics:
```sql
-- Create test affiliate
INSERT INTO app_affiliate (userId, affiliateCode, paymentLink, commissionRate, totalEarnings, unpaidBalance, paidAmount, isActive)
VALUES (1, 'DASH1234', 'https://paypal.me/testuser', 30, 18000, 12000, 6000, true);

-- Create test referrals
INSERT INTO app_affiliate_referral (affiliateId, purchaserId, stripeSessionId, amount, commission, isPaid, createdAt)
VALUES 
  (1, 2, 'cs_test_001', 20000, 6000, false, '2024-01-15'),
  (1, 3, 'cs_test_002', 20000, 6000, false, '2024-01-20'),
  (1, 4, 'cs_test_003', 20000, 6000, true, '2024-01-10');

-- Create test payout
INSERT INTO app_affiliate_payout (affiliateId, amount, paymentMethod, paidBy, paidAt, createdAt)
VALUES (1, 6000, 'PayPal', 1, '2024-01-12', '2024-01-12');
```

### Expected Statistics
- **Total Lifetime Earnings**: $180.00 (18000 cents)
- **Unpaid Balance**: $120.00 (12000 cents)  
- **Total Referrals**: 3 referrals
- **Amount Already Paid**: $60.00 (6000 cents)

### Test Steps

1. **Access Affiliate Dashboard**
   - Navigate to `/affiliate-dashboard`
   - Verify user is authenticated as the test affiliate
   - Confirm dashboard loads without errors

2. **Verify Statistics Cards**
   - Locate the four main statistics cards
   - Check each card displays correct values:

   **Total Earnings Card:**
   - Icon: DollarSign or similar
   - Value: "$180.00"
   - Label: "Total Earnings" or "Lifetime Earnings"

   **Unpaid Balance Card:**
   - Icon: TrendingUp or similar  
   - Value: "$120.00"
   - Label: "Unpaid Balance"

   **Total Referrals Card:**
   - Icon: Users or similar
   - Value: "3"
   - Label: "Total Referrals"

   **Paid Out Card:**
   - Icon: CreditCard or similar
   - Value: "$60.00" 
   - Label: "Paid Out" or "Amount Paid"

3. **Test Real-Time Updates**
   - Process a new referral through webhook
   - Refresh dashboard or wait for automatic refresh
   - Verify statistics update immediately:
     - Total Earnings increases
     - Unpaid Balance increases
     - Total Referrals count increases

4. **Test Payout Impact**
   - Record a payout via admin interface
   - Refresh affiliate dashboard
   - Verify statistics reflect payout:
     - Unpaid Balance decreases
     - Amount Paid increases
     - Total Earnings remains same

### Expected Results

- ✅ All four statistics display correctly
- ✅ Values match database calculations
- ✅ Currency formatting is proper ($XX.XX)
- ✅ Statistics update in real-time after changes
- ✅ Visual design is consistent and professional

### Data Accuracy Verification

```sql
-- Verify total earnings calculation
SELECT 
  a.totalEarnings as stored_total,
  COALESCE(SUM(ar.commission), 0) as calculated_total
FROM app_affiliate a
LEFT JOIN app_affiliate_referral ar ON a.id = ar.affiliateId
WHERE a.affiliateCode = 'DASH1234'
GROUP BY a.id, a.totalEarnings;

-- Verify unpaid balance
SELECT 
  a.unpaidBalance as stored_unpaid,
  COALESCE(SUM(CASE WHEN ar.isPaid = false THEN ar.commission ELSE 0 END), 0) as calculated_unpaid
FROM app_affiliate a
LEFT JOIN app_affiliate_referral ar ON a.id = ar.affiliateId
WHERE a.affiliateCode = 'DASH1234'
GROUP BY a.id, a.unpaidBalance;

-- Verify referral count
SELECT 
  COUNT(ar.id) as total_referrals
FROM app_affiliate a
LEFT JOIN app_affiliate_referral ar ON a.id = ar.affiliateId
WHERE a.affiliateCode = 'DASH1234';

-- Verify paid amount
SELECT 
  a.paidAmount as stored_paid,
  COALESCE(SUM(ap.amount), 0) as calculated_paid
FROM app_affiliate a
LEFT JOIN app_affiliate_payout ap ON a.id = ap.affiliateId
WHERE a.affiliateCode = 'DASH1234'
GROUP BY a.id, a.paidAmount;
```

### Edge Cases

1. **New Affiliate (No Data)**
   - Test with affiliate that has no referrals or payouts
   - All statistics should show $0.00 or 0
   - Dashboard should display gracefully

2. **Large Numbers**
   - Test with affiliate having significant earnings
   - Verify number formatting (commas, etc.)
   - Example: $1,234.56 should display correctly

3. **Decimal Handling**
   - Verify cents are handled properly
   - Test odd cent amounts (e.g., $123.47)
   - Confirm rounding is consistent

### Visual Design Testing

1. **Responsive Design**
   - Test dashboard on mobile devices
   - Verify statistics cards stack properly
   - Confirm all text remains readable

2. **Dark/Light Mode**
   - Test statistics in both themes
   - Verify contrast and readability
   - Check icon colors and backgrounds

3. **Loading States**
   - Test dashboard with slow network
   - Verify loading indicators appear
   - Confirm graceful error handling

### Performance Testing

1. **Large Dataset**
   - Test affiliate with hundreds of referrals
   - Verify statistics calculation performance
   - Check dashboard load time

2. **Concurrent Users**
   - Multiple affiliates accessing dashboards
   - Verify no data leakage between users
   - Confirm proper authentication

### Accessibility Testing

- Screen reader compatibility
- Keyboard navigation
- Color contrast compliance
- Alt text for icons and graphics

### Cleanup

```sql
-- Remove test data
DELETE FROM app_affiliate_payout WHERE affiliateId = 1;
DELETE FROM app_affiliate_referral WHERE affiliateId = 1;
DELETE FROM app_affiliate WHERE affiliateCode = 'DASH1234';
```