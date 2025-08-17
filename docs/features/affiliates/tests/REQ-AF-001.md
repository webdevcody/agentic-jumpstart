# Test Scenario: REQ-AF-001 - User Registration Eligibility

## Requirement
**REQ-AF-001**: Any authenticated user can register as an affiliate

## Test Scenario

### Prerequisites
- Application is running locally (`npm run dev`)
- Test user account exists in the database
- User is not already registered as an affiliate

### Test Steps

1. **Navigate to Affiliate Registration**
   - Open browser and go to `http://localhost:3000/affiliates`
   - Verify the landing page displays affiliate program benefits

2. **Authenticate as User**
   - Click "Login to Join Program" button
   - Complete Google OAuth authentication flow
   - Verify redirect back to `/affiliates` page

3. **Access Registration Form**
   - After authentication, verify the registration form is displayed
   - Confirm the form contains:
     - Payment link input field
     - Terms of Service checkbox
     - "Join Affiliate Program" submit button

4. **Complete Registration**
   - Enter a valid payment link (e.g., `https://paypal.me/testuser`)
   - Check the "I agree to the Terms of Service" checkbox
   - Click "Join Affiliate Program" button

### Expected Results

- ✅ Registration completes successfully
- ✅ Success toast notification appears: "Welcome to the Affiliate Program!"
- ✅ User is redirected to `/affiliate-dashboard`
- ✅ New affiliate record created in `app_affiliate` table with:
  - Valid `userId` reference
  - Unique 8-character `affiliateCode`
  - Provided `paymentLink`
  - `commissionRate` set to 30
  - `isActive` set to true
  - Initial balances set to 0

### Validation Queries

```sql
-- Verify affiliate was created
SELECT * FROM app_affiliate WHERE userId = [TEST_USER_ID];

-- Check affiliate code format (8 characters, alphanumeric)
SELECT affiliateCode FROM app_affiliate WHERE userId = [TEST_USER_ID];
```

### Edge Cases to Test

1. **Already Registered User**
   - Attempt to register same user again
   - Should display error: "You are already registered as an affiliate"

2. **Invalid Payment Link**
   - Try registration with invalid URL
   - Should display validation error

3. **Terms Not Accepted**
   - Submit form without checking Terms checkbox
   - Should display validation error

### Cleanup

```sql
-- Remove test affiliate after testing
DELETE FROM app_affiliate WHERE userId = [TEST_USER_ID];
```