# Test Scenario: REQ-AF-034 - Stripe Webhook Processing

## Requirement
**REQ-AF-034**: Process referrals via Stripe webhook on successful payment

## Test Scenario

### Prerequisites
- Application is running locally (`npm run dev`)
- Stripe webhook endpoint configured: `http://localhost:3000/api/stripe/webhook`
- Stripe CLI installed and configured for webhook forwarding
- Test affiliate account exists
- Test purchaser account exists (different from affiliate)

### Test Steps

1. **Start Stripe Webhook Listener**
   ```bash
   npm run stripe:listen
   ```
   - Verify webhook endpoint is listening on port 3000
   - Confirm webhook secret is properly configured

2. **Set Up Affiliate Tracking**
   - Create test affiliate with code `WEBHOOK01`
   - Open incognito browser window
   - Visit: `http://localhost:3000/purchase?ref=WEBHOOK01`
   - Verify affiliate cookie is set

3. **Initiate Purchase**
   - Log in as test purchaser (different user than affiliate)
   - Proceed to checkout
   - Complete Stripe payment with test card: `4242424242424242`
   - Note the Stripe session ID from checkout

4. **Monitor Webhook Processing**
   - Watch webhook listener console output
   - Verify `checkout.session.completed` event received
   - Check application logs for affiliate processing messages

5. **Verify Referral Processing**
   - Check affiliate dashboard for new referral
   - Verify commission was calculated and credited
   - Confirm referral appears in referral history

### Expected Results

-  Stripe webhook event received successfully
-  Affiliate code extracted from session metadata
-  Referral record created in database
-  Commission calculated and credited to affiliate
-  Affiliate balances updated (totalEarnings, unpaidBalance)
-  Success logged: "Successfully processed affiliate referral for code WEBHOOK01"

### Webhook Event Structure

The webhook should receive this event structure:
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "amount_total": 20000,
      "metadata": {
        "affiliateCode": "WEBHOOK01",
        "userId": "123"
      },
      "customer_details": {
        "email": "test@example.com"
      }
    }
  }
}
```

### Database Verification

```sql
-- Verify referral was created
SELECT 
  ar.*,
  a.affiliateCode,
  u.email as affiliate_email
FROM app_affiliate_referral ar
JOIN app_affiliate a ON ar.affiliateId = a.id
JOIN app_user u ON a.userId = u.id
WHERE ar.stripeSessionId = '[SESSION_ID]';

-- Verify affiliate balances updated
SELECT 
  affiliateCode,
  totalEarnings,
  unpaidBalance,
  paidAmount
FROM app_affiliate
WHERE affiliateCode = 'WEBHOOK01';
```

### Error Handling Tests

1. **Invalid Affiliate Code**
   - Create purchase with invalid affiliate code in metadata
   - Verify warning logged: "Invalid affiliate code: INVALID"
   - Confirm no referral record created
   - Ensure purchase still completes successfully

2. **Self-Referral Prevention**
   - Have affiliate use their own affiliate code for purchase
   - Verify warning logged: "Self-referral attempted by user [ID]"
   - Confirm no referral record created
   - Ensure purchase completes normally

3. **Duplicate Session Prevention**
   - Send same webhook event twice
   - Verify warning logged: "Duplicate Stripe session: [ID] already processed"
   - Confirm only one referral record exists
   - Verify commission not double-credited

### Webhook Security

1. **Signature Verification**
   - Test with invalid webhook signature
   - Verify webhook is rejected
   - Confirm no affiliate processing occurs

2. **Event Type Filtering**
   - Send non-checkout webhook events
   - Verify they are ignored for affiliate processing
   - Confirm only `checkout.session.completed` triggers affiliate logic

### Race Condition Testing

1. **Concurrent Webhooks**
   - Send multiple webhook events simultaneously
   - Verify database transactions prevent duplicate processing
   - Confirm referral counts remain accurate

2. **Rapid Fire Purchases**
   - Process multiple purchases quickly from same affiliate
   - Verify all referrals processed correctly
   - Check for any missed or duplicate commissions

### Integration Points

1. **User Account Upgrade**
   - Verify purchase creates/upgrades user account
   - Confirm affiliate processing doesn't interfere with account creation
   - Check that both affiliate and account operations complete

2. **Email Notifications** (if implemented)
   - Verify purchase confirmation emails sent
   - Check that affiliate processing doesn't block email sending

### Performance Testing

1. **High Volume Webhooks**
   - Process many webhook events in sequence
   - Monitor processing time for each event
   - Verify no timeouts or failures occur

2. **Large Purchase Amounts**
   - Test with various purchase amounts
   - Verify commission calculations remain accurate
   - Check for integer overflow issues

### Monitoring and Logging

Expected log messages:
- Success: `"Successfully processed affiliate referral for code WEBHOOK01, session cs_test_..., commission: $60.00"`
- Invalid code: `"Invalid affiliate code: INVALID for purchase cs_test_..."`
- Self-referral: `"Self-referral attempted by user 123 for session cs_test_..."`
- Duplicate: `"Duplicate Stripe session: cs_test_... already processed"`

### Cleanup

```sql
-- Remove test data
DELETE FROM app_affiliate_referral WHERE stripeSessionId LIKE 'cs_test_%';
DELETE FROM app_affiliate WHERE affiliateCode = 'WEBHOOK01';
```

### Troubleshooting

Common issues and solutions:
1. **Webhook not received**: Check Stripe CLI connection and endpoint URL
2. **No affiliate processing**: Verify metadata contains affiliateCode
3. **Database errors**: Check for missing foreign key relationships
4. **Commission miscalculation**: Verify amount is in cents, not dollars