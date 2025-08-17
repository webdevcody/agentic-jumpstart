# Test Scenario: REQ-AF-013 - 30% Commission Rate

## Requirement
**REQ-AF-013**: 30% commission rate on all referred sales

## Test Scenario

### Prerequisites
- Application is running locally (`npm run dev`)
- Stripe webhook configured and functioning
- Test affiliate account exists
- Test purchaser account exists (different from affiliate)

### Test Steps

1. **Set Up Test Purchase**
   - Affiliate code: `TEST1234`
   - Course price: $200.00 ($20000 cents)
   - Expected commission: $60.00 ($6000 cents)

2. **Initiate Purchase with Affiliate Tracking**
   - Open incognito browser window
   - Visit affiliate link: `http://localhost:3000/purchase?ref=TEST1234`
   - Verify affiliate cookie is set
   - Log in as test purchaser (different user than affiliate)

3. **Complete Purchase Process**
   - Proceed through checkout flow
   - Complete Stripe payment (use test card: `4242424242424242`)
   - Wait for webhook processing to complete

4. **Verify Commission Calculation**
   - Check affiliate dashboard at `/affiliate-dashboard`
   - Verify commission was calculated correctly:
     - Sale amount: $200.00
     - Commission rate: 30%
     - Commission earned: $60.00

### Expected Results

- ✅ Commission calculated as exactly 30% of sale price
- ✅ Commission amount: $60.00 ($6000 cents)
- ✅ Affiliate dashboard shows updated earnings
- ✅ Database records accurate commission amount

### Database Verification

```sql
-- Check affiliate referral record
SELECT 
  ar.amount as sale_amount,
  ar.commission,
  (ar.commission * 100.0 / ar.amount) as commission_percentage,
  a.commissionRate as expected_rate
FROM app_affiliate_referral ar
JOIN app_affiliate a ON ar.affiliateId = a.id
WHERE a.affiliateCode = 'TEST1234'
ORDER BY ar.createdAt DESC
LIMIT 1;

-- Verify commission percentage is exactly 30%
-- commission should equal (amount * 30 / 100)
```

### Different Sale Amounts Testing

Test commission calculation with various purchase amounts:

1. **$100 Purchase**
   - Sale: $10000 cents
   - Expected commission: $3000 cents (30%)

2. **$50 Purchase**
   - Sale: $5000 cents  
   - Expected commission: $1500 cents (30%)

3. **$199.99 Purchase**
   - Sale: $19999 cents
   - Expected commission: $5999 cents (rounded down)

### Commission Rate Configuration

1. **Verify Configuration**
   - Check `AFFILIATE_CONFIG.COMMISSION_RATE` in `/src/config.ts`
   - Confirm value is set to `30`

2. **Database Consistency**
   - Verify new affiliates get 30% rate set in their profile
   - Check existing affiliates have correct commission rate

```sql
-- Verify all affiliates have 30% commission rate
SELECT affiliateCode, commissionRate 
FROM app_affiliate 
WHERE commissionRate != 30;

-- Should return no results
```

### Edge Cases

1. **Rounding Behavior**
   - Test with amounts that don't divide evenly
   - Verify consistent rounding (should round down)
   - Example: $199.99 → commission = $59.99 (not $60.00)

2. **Large Purchase Amounts**
   - Test with higher course prices
   - Verify commission calculation remains accurate
   - Example: $500 → commission = $150

3. **Minimum Purchase**
   - Test with smallest possible purchase amount
   - Verify commission still calculated correctly

### Commission Formula Verification

```javascript
// Commission calculation formula from use-cases/affiliates.ts
function calculateCommission(saleAmount, commissionRate) {
  return Math.floor((saleAmount * commissionRate) / 100);
}

// Test cases
console.assert(calculateCommission(20000, 30) === 6000, "200.00 commission test");
console.assert(calculateCommission(10000, 30) === 3000, "100.00 commission test");
console.assert(calculateCommission(19999, 30) === 5999, "199.99 commission test");
```

### Stripe Metadata Verification

1. **Webhook Payload**
   - Monitor Stripe webhook calls
   - Verify affiliate code passed in session metadata
   - Confirm amount matches commission calculation

2. **Test Different Payment Methods**
   - Credit card payments
   - Alternative payment methods (if configured)
   - Verify commission rate consistent across payment types

### Multiple Referrals Testing

1. **Same Affiliate, Multiple Sales**
   - Process multiple purchases for same affiliate
   - Verify each sale earns 30% commission
   - Check total earnings accumulate correctly

2. **Commission Rate Consistency**
   - Verify commission rate doesn't change between sales
   - Confirm historical referrals maintain original rate

### Performance Testing

- Process high volume of referrals
- Verify commission calculations remain accurate
- Check for any floating-point precision issues
- Confirm all amounts stored in cents (integers)