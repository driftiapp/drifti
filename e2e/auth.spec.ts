import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('complete registration flow', async ({ page }) => {
    // 1. Navigate to registration
    await page.goto('/auth/register');
    await expect(page).toHaveTitle(/register/i);

    // 2. Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    // 3. Submit form
    await page.click('button[type="submit"]');

    // 4. Verify email verification page
    await expect(page).toHaveURL(/verify-email/i);
    await expect(page.locator('text=Verification email sent')).toBeVisible();

    // 5. Mock email verification
    await page.goto('/auth/verify-email?token=mock-verification-token');

    // 6. Verify successful verification
    await expect(page).toHaveURL(/login/i);
    await expect(page.locator('text=Email verified successfully')).toBeVisible();
  });

  test('login flow with token refresh', async ({ page }) => {
    // 1. Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 2. Verify dashboard access
    await expect(page).toHaveURL(/dashboard/i);
    await expect(page.locator('text=Welcome')).toBeVisible();

    // 3. Simulate token expiration
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'expired-token');
    });

    // 4. Trigger a protected API call
    await page.click('text=Refresh Data');

    // 5. Verify token refresh
    await expect(page.locator('text=Data refreshed')).toBeVisible();
    await expect(page).toHaveURL(/dashboard/i);
  });

  test('role-based access control', async ({ page }) => {
    // 1. Login as business owner
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'business@example.com');
    await page.fill('input[name="password"]', 'Business123!');
    await page.click('button[type="submit"]');

    // 2. Verify business owner dashboard
    await expect(page).toHaveURL(/dashboard/i);
    await expect(page.locator('text=Business Analytics')).toBeVisible();
    await expect(page.locator('text=Order Management')).toBeVisible();

    // 3. Try to access admin route
    await page.goto('/admin');
    await expect(page).toHaveURL(/unauthorized/i);

    // 4. Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // 5. Verify admin dashboard
    await expect(page).toHaveURL(/admin/i);
    await expect(page.locator('text=Admin Controls')).toBeVisible();
    await expect(page.locator('text=System Settings')).toBeVisible();
  });

  test('error handling and recovery', async ({ page }) => {
    // 1. Simulate network error
    await page.route('**/api/**', route => route.abort('failed'));

    // 2. Try to login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 3. Verify error handling
    await expect(page.locator('text=Network error')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();

    // 4. Restore network and retry
    await page.route('**/api/**', route => route.continue());
    await page.click('button:has-text("Retry")');

    // 5. Verify successful login
    await expect(page).toHaveURL(/dashboard/i);
  });

  test('session management', async ({ page }) => {
    // 1. Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 2. Verify session persistence
    await page.reload();
    await expect(page).toHaveURL(/dashboard/i);

    // 3. Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/login/i);

    // 4. Verify session cleared
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/i);
  });

  test('responsive design', async ({ page }) => {
    // 1. Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/login');
    await expect(page.locator('form')).toHaveCSS('max-width', '100%');

    // 2. Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('form')).toHaveCSS('max-width', '500px');

    // 3. Test desktop view
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('form')).toHaveCSS('max-width', '500px');
  });

  test('accessibility', async ({ page }) => {
    // 1. Check login form accessibility
    await page.goto('/auth/login');
    
    // Verify form labels
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();

    // Verify ARIA attributes
    await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-required', 'true');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-required', 'true');

    // Verify keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();
  });
}); 