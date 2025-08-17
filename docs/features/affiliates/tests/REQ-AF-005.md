# Test Scenario: REQ-AF-005 - Unique Affiliate Code Generation

## Requirement
**REQ-AF-005**: Each affiliate receives a unique 8-character alphanumeric code

## Test Scenario

### Prerequisites
- Application is running locally (`npm run dev`)
- Database is accessible for verification
- Clean test environment

### Test Steps

1. **Register Multiple Affiliates**
   - Create 5 test user accounts
   - Register each user as an affiliate
   - Record the generated affiliate codes

2. **Verify Code Format**
   - Check each generated code meets specifications:
     - Exactly 8 characters long
     - Contains only alphanumeric characters (A-Z, a-z, 0-9)
     - No special characters or spaces

3. **Verify Uniqueness**
   - Compare all generated codes
   - Confirm no duplicates exist
   - Check against existing codes in database

4. **Test Code Generation Function**
   - Access the code generation logic in `use-cases/affiliates.ts`
   - Verify the `generateUniqueAffiliateCode()` function
   - Confirm it uses proper randomization

### Expected Results

- ✅ All codes are exactly 8 characters
- ✅ All codes contain only alphanumeric characters
- ✅ All codes are unique across all affiliates
- ✅ Codes are URL-safe (no special encoding needed)
- ✅ Database constraint prevents duplicate codes

### Code Format Validation

```javascript
// Regex pattern for valid affiliate code
const codePattern = /^[A-Za-z0-9]{8}$/;

// Test each generated code
affiliateCodes.forEach(code => {
  console.assert(codePattern.test(code), `Invalid code format: ${code}`);
  console.assert(code.length === 8, `Invalid code length: ${code}`);
});
```

### Database Verification

```sql
-- Check all affiliate codes in database
SELECT affiliateCode, COUNT(*) as count 
FROM app_affiliate 
GROUP BY affiliateCode 
HAVING COUNT(*) > 1;

-- Should return no results (no duplicates)

-- Verify code format in database
SELECT affiliateCode FROM app_affiliate 
WHERE LENGTH(affiliateCode) != 8 
   OR affiliateCode ~ '[^A-Za-z0-9]';

-- Should return no results (all codes valid)
```

### Uniqueness Stress Test

1. **Mass Registration Test**
   - Attempt to register 100 affiliates rapidly
   - Verify all codes remain unique
   - Check for any race condition issues

2. **Code Collision Test**
   - Monitor for retry attempts during generation
   - Verify the system handles collisions gracefully
   - Confirm maximum retry limit (10 attempts) is respected

### Edge Cases

1. **Maximum Retry Scenario**
   - Simulate scenario where code generation reaches retry limit
   - Verify appropriate error handling

2. **Concurrent Registration**
   - Register multiple affiliates simultaneously
   - Ensure unique codes even with concurrent requests

### Performance Testing

- Measure code generation time
- Verify generation completes within reasonable time (<100ms)
- Test with existing database of many affiliate codes

### Cleanup

```sql
-- Remove test affiliates
DELETE FROM app_affiliate WHERE userId IN ([TEST_USER_IDS]);
```