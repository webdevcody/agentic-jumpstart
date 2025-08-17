# Test Scenario: REQ-AF-030 - Self-Referral Prevention

## Requirement
**REQ-AF-030**: Prevent self-referrals (user cannot use own affiliate code)

## Test Scenario

### Prerequisites
- Application running locally (`npm run dev`)
- Test affiliate account exists with code `SELF1234`
- Stripe webhook configured and functioning

### Test Steps

1. **Set Up Self-Referral Attempt**
   - Affiliate user ID: 123
   - Affiliate code: `SELF1234`
   - Same user will attempt to purchase using their own code

2. **Initiate Self-Referral Purchase**
   - Log in as the affiliate user (ID: 123)
   - Visit affiliate link: `http://localhost:3000/purchase?ref=SELF1234`
   - Verify affiliate cookie is set in browser
   - Proceed to checkout as the same user

3. **Complete Purchase Process**
   - Complete Stripe payment with test card
   - Monitor webhook processing
   - Check application logs for self-referral detection

4. **Verify Prevention Mechanism**
   - Check affiliate dashboard - no new referral should appear
   - Verify no commission was credited
   - Confirm purchase completed successfully (user upgraded)

### Expected Results

- ❌ No referral record created in database
- ❌ No commission credited to affiliate
- ❌ Warning logged: "Self-referral attempted by user 123 for session [SESSION_ID]"
- ✅ Purchase completes successfully
- ✅ User account upgraded normally
- ✅ No affiliate statistics updated

### Database Verification

```sql
-- Verify no self-referral record exists
SELECT * FROM app_affiliate_referral ar
JOIN app_affiliate a ON ar.affiliateId = a.id
WHERE a.userId = ar.purchaserId
AND a.affiliateCode = 'SELF1234';

-- Should return no results

-- Verify affiliate balances unchanged
SELECT totalEarnings, unpaidBalance 
FROM app_affiliate 
WHERE affiliateCode = 'SELF1234';

-- Values should remain at previous levels
```

### Use Case Function Testing

The prevention logic is in `processAffiliateReferralUseCase`:

```javascript
// Test the self-referral check
if (affiliate.userId === purchaserId) {
  console.warn(`Self-referral attempted by user ${purchaserId} for session ${stripeSessionId}`);
  return null;
}
```

### Multiple Self-Referral Attempts

1. **Repeat Attempts**
   - Try self-referral multiple times
   - Verify consistent prevention
   - Confirm no referrals ever created

2. **Different Purchase Amounts**
   - Attempt self-referral with various purchase amounts
   - Verify prevention regardless of purchase value

### Edge Cases

1. **Shared Account Scenarios**
   - Test with family members sharing payment methods
   - Verify system checks user ID, not payment method
   - Confirm different users can legitimately refer each other

2. **Account Switching**
   - Set affiliate cookie while logged out
   - Log in as affiliate user after cookie set
   - Verify self-referral still prevented

3. **Multiple Browser Sessions**
   - Affiliate sets cookie in one browser
   - Logs into different browser as same user
   - Attempts purchase - should still be prevented

### Fraud Prevention Testing

1. **Cookie Manipulation**
   - Affiliate attempts to modify affiliate cookie
   - Tries to use different affiliate code
   - Verify system uses actual user ID for validation

2. **Session Sharing**
   - Affiliate shares session/cookies with others
   - Verify prevention based on logged-in user ID
   - Confirm cookie sharing doesn't bypass prevention

### Integration Testing

1. **Purchase Flow Completion**
   - Verify self-referral prevention doesn't break purchase
   - Confirm user account upgraded properly
   - Check payment processing completed normally

2. **Webhook Processing**
   - Verify webhook processes successfully
   - Confirm affiliate logic executes but returns null
   - Ensure no database transaction rollback

### Logging and Monitoring

Expected log entries:
- Warning: `"Self-referral attempted by user [ID] for session [SESSION_ID]"`
- No error logs should appear
- Purchase completion should still log success

### Business Logic Validation

1. **Commission Prevention**
   - Verify no commission calculated
   - Confirm affiliate earnings unchanged
   - Check referral count remains same

2. **Fair Usage**
   - Confirm legitimate referrals still work
   - Verify affiliate can refer other users normally
   - Test referrals from different users to same affiliate

### Performance Impact

- Verify self-referral check doesn't slow purchase process
- Confirm database queries optimized
- Test with high volume of transactions

### Cleanup

```sql
-- Verify no test self-referrals created (should be empty)
DELETE FROM app_affiliate_referral 
WHERE stripeSessionId LIKE 'cs_test_%'
AND affiliateId IN (
  SELECT id FROM app_affiliate WHERE affiliateCode = 'SELF1234'
);
```