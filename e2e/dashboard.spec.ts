import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

// Helper function to login as specific role
async function loginAsRole(page: Page, role: 'admin' | 'business' | 'customer') {
  const credentials = {
    admin: { email: 'admin@example.com', password: 'Admin123!' },
    business: { email: 'business@example.com', password: 'Business123!' },
    customer: { email: 'customer@example.com', password: 'Customer123!' },
  };

  await page.goto('/auth/login');
  await page.fill('input[name="email"]', credentials[role].email);
  await page.fill('input[name="password"]', credentials[role].password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/i);
}

test.describe('Dashboard Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('admin dashboard data loading and display', async ({ page }) => {
    await loginAsRole(page, 'admin');

    // Verify admin-specific sections
    await expect(page.locator('text=Admin Controls')).toBeVisible();
    await expect(page.locator('text=System Settings')).toBeVisible();
    await expect(page.locator('text=User Management')).toBeVisible();

    // Verify data loading
    await expect(page.locator('text=Loading...')).toBeVisible();
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active Businesses')).toBeVisible();
    await expect(page.locator('text=System Health')).toBeVisible();
  });

  test('business owner dashboard data loading and display', async ({ page }) => {
    await loginAsRole(page, 'business');

    // Verify business-specific sections
    await expect(page.locator('text=Business Analytics')).toBeVisible();
    await expect(page.locator('text=Order Management')).toBeVisible();
    await expect(page.locator('text=Product Management')).toBeVisible();

    // Verify data loading
    await expect(page.locator('text=Loading...')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Revenue')).toBeVisible();
    await expect(page.locator('text=Active Customers')).toBeVisible();
  });

  test('customer dashboard data loading and display', async ({ page }) => {
    await loginAsRole(page, 'customer');

    // Verify customer-specific sections
    await expect(page.locator('text=My Orders')).toBeVisible();
    await expect(page.locator('text=Saved Items')).toBeVisible();
    await expect(page.locator('text=Payment Methods')).toBeVisible();

    // Verify data loading
    await expect(page.locator('text=Loading...')).toBeVisible();
    await expect(page.locator('text=Recent Orders')).toBeVisible();
    await expect(page.locator('text=Order History')).toBeVisible();
  });

  test('data filtering and sorting', async ({ page }) => {
    await loginAsRole(page, 'business');

    // Test order filtering
    await page.click('text=Orders');
    await page.fill('input[placeholder="Filter orders"]', 'completed');
    await expect(page.locator('text=Order #1')).toBeVisible();
    await expect(page.locator('text=Order #2')).not.toBeVisible();

    // Test sorting
    await page.click('button:has-text("Sort by Date")');
    const orders = await page.locator('.order-item').all();
    expect(orders.length).toBeGreaterThan(1);
  });

  test('data refresh functionality', async ({ page }) => {
    await loginAsRole(page, 'business');

    // Initial data load
    await expect(page.locator('text=Total Orders')).toBeVisible();
    const initialCount = await page.locator('text=Total Orders').textContent();

    // Refresh data
    await page.click('button:has-text("Refresh")');
    await expect(page.locator('text=Refreshing...')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();

    // Verify data was refreshed
    const newCount = await page.locator('text=Total Orders').textContent();
    expect(newCount).not.toBe(initialCount);
  });

  test('role-specific actions', async ({ page }) => {
    // Test admin actions
    await loginAsRole(page, 'admin');
    await page.click('button:has-text("Add User")');
    await expect(page.locator('text=Create New User')).toBeVisible();
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="role"]', 'customer');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=User created successfully')).toBeVisible();

    // Test business owner actions
    await loginAsRole(page, 'business');
    await page.click('button:has-text("Add Product")');
    await expect(page.locator('text=Create New Product')).toBeVisible();
    await page.fill('input[name="name"]', 'Test Product');
    await page.fill('input[name="price"]', '99.99');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Product created successfully')).toBeVisible();
  });

  test('error handling and recovery', async ({ page }) => {
    await loginAsRole(page, 'business');

    // Simulate API error
    await page.route('**/api/dashboard/**', route => route.abort('failed'));

    // Trigger data refresh
    await page.click('button:has-text("Refresh")');

    // Verify error handling
    await expect(page.locator('text=Failed to load dashboard data')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();

    // Restore API and retry
    await page.route('**/api/dashboard/**', route => route.continue());
    await page.click('button:has-text("Retry")');

    // Verify recovery
    await expect(page.locator('text=Total Orders')).toBeVisible();
  });

  test('real-time updates', async ({ page }) => {
    await loginAsRole(page, 'business');

    // Get initial order count
    const initialCount = await page.locator('text=Total Orders').textContent();

    // Simulate new order
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('newOrder', {
        detail: { orderId: '123', amount: 100 }
      }));
    });

    // Verify real-time update
    await expect(page.locator('text=New order received')).toBeVisible();
    const newCount = await page.locator('text=Total Orders').textContent();
    expect(newCount).not.toBe(initialCount);
  });

  test('notification handling', async ({ page }) => {
    await loginAsRole(page, 'business');

    // Test success notification
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Changes saved successfully')).toBeVisible();
    await expect(page.locator('text=Changes saved successfully')).not.toBeVisible({ timeout: 5000 });

    // Test error notification
    await page.route('**/api/dashboard/**', route => route.abort('failed'));
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Failed to save changes')).toBeVisible();
  });

  test('responsive design', async ({ page }) => {
    await loginAsRole(page, 'business');

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('nav')).toHaveCSS('display', 'none');
    await page.click('button:has-text("Menu")');
    await expect(page.locator('nav')).toHaveCSS('display', 'block');

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('nav')).toHaveCSS('display', 'block');
    await expect(page.locator('.dashboard-grid')).toHaveCSS('grid-template-columns', 'repeat(2, 1fr)');

    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.dashboard-grid')).toHaveCSS('grid-template-columns', 'repeat(3, 1fr)');
  });
}); 