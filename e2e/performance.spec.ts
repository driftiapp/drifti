import { test, expect, Page, Browser, Response } from '@playwright/test';

// Helper function to measure performance metrics
async function measurePerformance(page: Page, action: () => Promise<void>) {
  const metrics = await page.evaluate(async () => {
    const performance = window.performance;
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resourceTiming = performance.getEntriesByType('resource');
    
    return {
      loadTime: navigationTiming.loadEventEnd - navigationTiming.startTime,
      domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.startTime,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      resourceCount: resourceTiming.length,
      apiCalls: resourceTiming.filter(r => r.name.includes('/api/')).length,
    };
  });

  const startTime = Date.now();
  await action();
  const endTime = Date.now();

  return {
    ...metrics,
    actionDuration: endTime - startTime,
  };
}

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.context().clearCookies();
  });

  test('checkout page load performance', async ({ page }: { page: Page }) => {
    const metrics = await measurePerformance(page, async () => {
      await page.goto('/checkout');
      await page.waitForLoadState('networkidle');
    });

    // Assert performance thresholds
    expect(metrics.loadTime).toBeLessThan(3000); // 3 seconds max load time
    expect(metrics.domContentLoaded).toBeLessThan(2000); // 2 seconds max DOM content loaded
    expect(metrics.firstContentfulPaint).toBeLessThan(1500); // 1.5 seconds max FCP
    expect(metrics.resourceCount).toBeLessThan(50); // Max 50 resources
  });

  test('payment processing performance', async ({ page }: { page: Page }) => {
    // Login and add items to cart
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'Customer123!');
    await page.click('button[type="submit"]');
    await page.goto('/products');
    await page.click('button:has-text("Add to Cart")');
    await page.click('button:has-text("View Cart")');

    // Measure checkout performance
    const metrics = await measurePerformance(page, async () => {
      await page.click('button:has-text("Proceed to Checkout")');
      await page.fill('input[name="cardNumber"]', '4242424242424242');
      await page.fill('input[name="expiry"]', '12/25');
      await page.fill('input[name="cvc"]', '123');
      await page.click('button:has-text("Pay Now")');
      await page.waitForURL(/success/i);
    });

    // Assert performance thresholds
    expect(metrics.actionDuration).toBeLessThan(5000); // 5 seconds max for payment processing
    expect(metrics.apiCalls).toBeLessThan(10); // Max 10 API calls during payment
  });

  test('concurrent user load', async ({ browser }: { browser: Browser }) => {
    const numUsers = 10;
    const pages = await Promise.all(
      Array(numUsers).fill(null).map(() => browser.newPage())
    );

    // Simulate concurrent users browsing products
    const metrics = await Promise.all(pages.map(async (page) => {
      return measurePerformance(page, async () => {
        await page.goto('/products');
        await page.waitForLoadState('networkidle');
        await page.click('button:has-text("Add to Cart")');
      });
    }));

    // Calculate average metrics
    const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / numUsers;
    const avgActionDuration = metrics.reduce((sum, m) => sum + m.actionDuration, 0) / numUsers;

    // Assert performance thresholds under load
    expect(avgLoadTime).toBeLessThan(4000); // 4 seconds max average load time
    expect(avgActionDuration).toBeLessThan(2000); // 2 seconds max average action duration
  });

  test('dashboard data loading performance', async ({ page }: { page: Page }) => {
    // Login as business owner
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'business@example.com');
    await page.fill('input[name="password"]', 'Business123!');
    await page.click('button[type="submit"]');

    // Measure dashboard load performance
    const metrics = await measurePerformance(page, async () => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('text=Total Orders');
    });

    // Assert performance thresholds
    expect(metrics.loadTime).toBeLessThan(3000); // 3 seconds max load time
    expect(metrics.apiCalls).toBeLessThan(5); // Max 5 API calls for dashboard data
  });

  test('search and filter performance', async ({ page }: { page: Page }) => {
    await page.goto('/products');

    // Measure search performance
    const searchMetrics = await measurePerformance(page, async () => {
      await page.fill('input[placeholder="Search products"]', 'test');
      await page.waitForResponse((response: Response) => response.url().includes('/api/products/search'));
    });

    // Measure filter performance
    const filterMetrics = await measurePerformance(page, async () => {
      await page.click('button:has-text("Filter")');
      await page.click('text=Price: Low to High');
      await page.waitForResponse((response: Response) => response.url().includes('/api/products/filter'));
    });

    // Assert performance thresholds
    expect(searchMetrics.actionDuration).toBeLessThan(1000); // 1 second max for search
    expect(filterMetrics.actionDuration).toBeLessThan(1000); // 1 second max for filtering
  });

  test('memory usage under load', async ({ page }: { page: Page }) => {
    const metrics = await page.evaluate(async () => {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory?.usedJSHeapSize,
        totalJSHeapSize: memory?.totalJSHeapSize,
      };
    });

    // Assert memory usage thresholds
    expect(metrics.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // Max 100MB heap usage
    expect(metrics.totalJSHeapSize).toBeLessThan(200 * 1024 * 1024); // Max 200MB total heap
  });

  test('API response time under load', async ({ page }: { page: Page }) => {
    const responseTimes: number[] = [];
    const startTimes = new Map<string, number>();

    // Monitor API response times
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        startTimes.set(request.url(), Date.now());
      }
    });

    page.on('response', (response: Response) => {
      if (response.url().includes('/api/')) {
        const startTime = startTimes.get(response.url());
        if (startTime) {
          responseTimes.push(Date.now() - startTime);
          startTimes.delete(response.url());
        }
      }
    });

    // Perform multiple actions
    await page.goto('/products');
    await page.fill('input[placeholder="Search products"]', 'test');
    await page.click('button:has-text("Filter")');
    await page.click('text=Price: Low to High');

    // Calculate average response time
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

    // Assert response time threshold
    expect(avgResponseTime).toBeLessThan(500); // Max 500ms average response time
  });
}); 