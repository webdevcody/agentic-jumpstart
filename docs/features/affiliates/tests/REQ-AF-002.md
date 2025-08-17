# Test Scenario: REQ-AF-002 - Terms of Service Agreement

## Requirement
**REQ-AF-002**: Users must agree to the Terms of Service before becoming affiliates

## Test Scenario

### Prerequisites
- Application is running locally (`npm run dev`)
- Authenticated user on `/affiliates` page
- User is not already an affiliate

### Test Steps

1. **Access Registration Form**
   - Navigate to `/affiliates` and authenticate
   - Locate the Terms of Service checkbox in the registration form

2. **View Terms of Service**
   - Click on the "Terms of Service" link
   - Verify the modal dialog opens with complete terms content
   - Confirm the modal displays all required sections:
     - Commission Structure (30% commission)
     - Payment Terms ($50 minimum, monthly payouts)
     - Cookie Duration (30-day attribution)
     - Prohibited Activities (spam, false advertising, etc.)
     - Termination conditions
     - Modifications clause
     - Liability limitations

3. **Test Agreement Requirement**
   - Fill in payment link field with valid URL
   - **Do NOT check** the Terms checkbox
   - Click "Join Affiliate Program" button

4. **Test Successful Agreement**
   - Check the Terms of Service checkbox
   - Click "Join Affiliate Program" button

### Expected Results

#### Without Terms Agreement:
- ❌ Form submission fails
- ❌ Validation error displayed: "You must agree to the terms of service"
- ❌ No affiliate record created in database

#### With Terms Agreement:
- ✅ Form submission succeeds
- ✅ Registration completes successfully
- ✅ User redirected to affiliate dashboard

### Terms Content Verification

The modal should display these specific terms:

1. **Commission Structure**: 30% commission on net sale price
2. **Payment Terms**: Monthly payouts, $50 minimum threshold
3. **Cookie Duration**: 30-day attribution window
4. **Prohibited Activities**:
   - Spam or unsolicited emails
   - Misleading or false advertising
   - Self-referrals or fraudulent purchases
   - Trademark or brand misrepresentation
   - Paid search advertising on trademarked terms
5. **Termination**: Right to terminate for violations
6. **Modifications**: Terms may be modified at any time
7. **Liability**: Limited liability clause

### Validation

- Terms modal opens and closes properly
- All required terms sections are present
- Checkbox validation works correctly
- Form cannot be submitted without agreement

### Edge Cases

1. **Modal Interaction**
   - Open and close modal multiple times
   - Verify checkbox state persists when modal is closed
   - Confirm modal doesn't interfere with form submission

2. **Browser Refresh**
   - Refresh page after checking Terms checkbox
   - Verify checkbox state is reset (security feature)

### Accessibility Testing

- Verify modal is keyboard navigable
- Confirm screen readers can access terms content
- Test tab navigation through modal content