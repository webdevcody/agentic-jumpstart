# Test Scenario: REQ-AF-009 - 30-Day Cookie Duration

## Requirement
**REQ-AF-009**: 30-day cookie duration for affiliate tracking

## Test Scenario

### Prerequisites
- Application is running locally (`npm run dev`)
- Test affiliate account exists with code (e.g., `TEST1234`)
- Browser DevTools available for cookie inspection

### Test Steps

1. **Access Affiliate Link**
   - Open browser in incognito/private mode
   - Navigate to affiliate tracking URL: `http://localhost:3000/purchase?ref=TEST1234`
   - Verify page loads successfully

2. **Inspect Cookie Creation**
   - Open browser DevTools
   - Navigate to Application > Cookies > localhost:3000
   - Verify `affiliateCode` cookie is present with value `TEST1234`

3. **Check Cookie Properties**
   - Examine cookie attributes:
     - **Name**: `affiliateCode`
     - **Value**: `TEST1234`
     - **Domain**: `localhost` or application domain
     - **Path**: `/`
     - **Expires**: 30 days from creation time
     - **HttpOnly**: Should be false (accessible to JavaScript)
     - **Secure**: Should match HTTPS setting
     - **SameSite**: Should be configured appropriately

4. **Verify LocalStorage Backup**
   - Check Application > Local Storage > localhost:3000
   - Confirm `affiliateCode` is also stored with same value
   - Verify expiration timestamp is set for 30 days

5. **Test Cookie Persistence**
   - Close and reopen browser tab
   - Verify cookie persists across sessions
   - Navigate to different pages within the application
   - Confirm cookie remains accessible

### Expected Results

- ✅ Cookie created with correct affiliate code value
- ✅ Cookie expires exactly 30 days from creation
- ✅ Cookie persists across browser sessions
- ✅ LocalStorage backup contains same value
- ✅ Cookie accessible on all application pages

### Cookie Duration Verification

```javascript
// Check cookie expiration in DevTools Console
const cookies = document.cookie.split(';');
const affiliateCookie = cookies.find(c => c.trim().startsWith('affiliateCode='));

if (affiliateCookie) {
  console.log('Affiliate cookie found:', affiliateCookie);
  
  // Check if expires attribute is set to 30 days
  // Note: JavaScript document.cookie doesn't show expires,
  // so this needs to be verified in DevTools Application tab
}
```

### Time-Based Testing

1. **Immediate Verification**
   - Set affiliate cookie
   - Immediately verify expiration is set to 30 days future

2. **Mid-Duration Test** (if possible)
   - Set system clock forward 15 days
   - Verify cookie still exists and functions

3. **Expiration Test** (if possible)
   - Set system clock forward 31 days
   - Verify cookie has expired and been removed

### Different Affiliate Codes

1. **Multiple Code Test**
   - Visit `?ref=CODE1`, verify cookie set to `CODE1`
   - Visit `?ref=CODE2`, verify cookie updated to `CODE2`
   - Confirm last-click attribution (newer code overwrites older)

2. **Invalid Code Test**
   - Visit `?ref=INVALID`
   - Verify cookie is still set (validation happens at purchase time)

### Cross-Browser Testing

Test cookie behavior across different browsers:
- Chrome/Chromium
- Firefox
- Safari (if on macOS)
- Edge

### Purchase Flow Integration

1. **Complete Purchase Flow**
   - Set affiliate cookie via link
   - Navigate to purchase page
   - Complete checkout process
   - Verify affiliate code passed to Stripe metadata

2. **Cookie Persistence During Purchase**
   - Start with affiliate cookie set
   - Go through multi-step purchase process
   - Confirm cookie remains throughout entire flow

### Edge Cases

1. **Cookie Disabled**
   - Disable cookies in browser
   - Verify localStorage fallback works

2. **Private/Incognito Mode**
   - Test cookie behavior in private browsing
   - Verify cookies work but don't persist beyond session

3. **Clear Browser Data**
   - Set affiliate cookie
   - Clear browser cookies
   - Verify cookie is removed

### Validation Scripts

```javascript
// Cookie validation helper
function validateAffiliateCookie(expectedCode) {
  // Check cookie
  const cookieValue = getCookie('affiliateCode');
  console.assert(cookieValue === expectedCode, `Cookie mismatch: ${cookieValue} vs ${expectedCode}`);
  
  // Check localStorage
  const storageValue = localStorage.getItem('affiliateCode');
  console.assert(storageValue === expectedCode, `Storage mismatch: ${storageValue} vs ${expectedCode}`);
  
  return cookieValue === expectedCode && storageValue === expectedCode;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
```