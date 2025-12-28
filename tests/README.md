# Playwright Testing Guide

This directory contains end-to-end tests for the TanStack Start learning platform using Playwright.

## Setup

### Prerequisites

- Node.js and npm installed
- All project dependencies installed (`npm install`)

### Install Playwright Browsers

```bash
npm run test:install
```

## Running Tests

### Run All Tests

```bash
npm run test
```

### Run Tests with UI Mode (Interactive)

```bash
npm run test:ui
```

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:headed
```

### Debug Tests

```bash
npm run test:debug
```

### View Test Reports

```bash
npm run test:report
```

### Run Specific Test Files

```bash
# Run only home page tests
npx playwright test home.spec.ts

# Run only authentication tests
npx playwright test auth.spec.ts

# Run tests matching pattern
npx playwright test --grep "should load"
```

### Run Tests for Specific Browsers

```bash
# Run on Chrome only
npx playwright test --project=chromium

# Run on Firefox only
npx playwright test --project=firefox

# Run on mobile Safari
npx playwright test --project="Mobile Safari"
```

## Test Structure

### Test Files

- `home.spec.ts` - Tests for the homepage and main landing
- `auth.spec.ts` - Authentication flow tests
- `navigation.spec.ts` - Site navigation and routing tests
- `course.spec.ts` - Course-related functionality tests
- `payment.spec.ts` - Payment flow and Stripe integration tests
- `early-access.spec.ts` - Early access mode functionality with admin controls

### Test Organization

Each test file follows this pattern:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do something specific", async ({ page }) => {
    // Test implementation
  });
});
```

## Configuration

The Playwright configuration is in `playwright.config.ts` with the following key settings:

- **Base URL**: `http://localhost:3001`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Test Directory**: `./tests`
- **Parallel Execution**: Enabled
- **Retries**: 2 on CI, 0 locally
- **Web Server**: Automatically starts the app before tests

## Environment Requirements

For tests to run properly, you need:

1. **Database**: PostgreSQL running (handled by `npm run db:up`)
2. **Environment Variables**: All required env vars from `.env.sample`
3. **Application Build**: Tests use production build

## Writing New Tests

### Page Object Pattern (Recommended)

For complex tests, consider using page objects:

```typescript
// tests/pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async loginWithGoogle() {
    await this.page.click("text=Login with Google");
  }
}

// In test file
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.loginWithGoogle();
```

### Common Patterns

#### Testing Protected Routes

```typescript
test("should redirect to login for protected route", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/login/);
});
```

#### Testing Forms

```typescript
test("should submit form successfully", async ({ page }) => {
  await page.goto("/contact");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('textarea[name="message"]', "Test message");
  await page.click('button[type="submit"]');
  await expect(page.locator(".success-message")).toBeVisible();
});
```

#### Testing API Responses

```typescript
test("should handle API errors gracefully", async ({ page }) => {
  // Mock API response
  await page.route("/api/courses", (route) => {
    route.fulfill({ status: 500, body: "Server Error" });
  });

  await page.goto("/learn");
  await expect(page.locator(".error-message")).toBeVisible();
});
```

## CI/CD Integration

Tests run automatically on:

- Push to `main` branch
- Pull requests to `main` branch

The CI workflow:

1. Sets up PostgreSQL database
2. Installs dependencies and Playwright browsers
3. Runs database migrations
4. Builds the application
5. Runs all Playwright tests
6. Uploads test reports as artifacts

## Debugging Tests

### Local Debugging

1. Use `npm run test:debug` to run tests in debug mode
2. Use `page.pause()` in test code to pause execution
3. Use browser developer tools during headed runs

### CI Debugging

1. Download test artifacts from GitHub Actions
2. View HTML reports for failed tests
3. Check screenshots and traces for failed tests

## Early Access Testing

The `early-access.spec.ts` file contains comprehensive tests for the early access functionality:

### Test Scenarios

1. **Early access ENABLED + regular user** → redirected to home
2. **Early access ENABLED + admin user** → can access /learn
3. **Early access DISABLED + regular user** → can access /learn
4. **Early access DISABLED + no auth** → can access /learn
5. **Admin toggle via settings page** → toggle works and affects behavior
6. **Early access ENABLED + no auth** → redirected to home

### Test Helpers

- `tests/helpers/auth.ts` - Mock authentication sessions for admin and regular users
- `tests/helpers/early-access.ts` - Manage early access mode state in database

### Running Early Access Tests

```bash
# Run early access tests specifically
npx playwright test early-access

# Run with UI to see the browser interactions
npx playwright test early-access --ui
```

**Note**: Early access tests are configured to run sequentially to avoid conflicts with shared state.

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Test user journeys**, not just individual pages
3. **Mock external services** (Stripe, email, etc.) in tests
4. **Keep tests independent** - each test should work in isolation
5. **Use meaningful test descriptions** that explain the expected behavior
6. **Group related tests** using `test.describe()`
7. **Clean up state** between tests if needed

## Troubleshooting

### Common Issues

#### WebKit/Safari "Bus error: 10" on macOS

This is a known issue with Playwright's WebKit on certain macOS versions. Solutions:

1. **Use Chrome/Firefox only** (recommended for local development):

   ```bash
   npm run test:chrome     # Chrome only
   npm run test:firefox    # Firefox only
   npm run test:no-webkit  # All browsers except Safari
   ```

2. **Try reinstalling Playwright**:

   ```bash
   npm uninstall @playwright/test playwright
   npm install --save-dev @playwright/test playwright
   npx playwright install
   ```

3. **Update macOS** if possible, as newer versions may have better compatibility

4. **Use Docker** for consistent testing environment:
   ```bash
   docker run -it mcr.microsoft.com/playwright:v1.54.2-jammy /bin/bash
   ```

#### Tests failing on CI but passing locally

- Check environment variables in CI
- Ensure database is properly set up in CI
- Verify timing issues with `page.waitFor()` methods

#### Slow tests

- Use `page.waitForLoadState('networkidle')` for heavy pages
- Increase timeout for specific operations
- Consider mocking slow external services

#### Flaky tests

- Add explicit waits for dynamic content
- Use `toBeVisible()` instead of `toHaveText()` for loading states
- Retry failed tests with `test.retry()`
