import { test, expect, Page } from '@playwright/test';

// Helper function to login as customer
async function loginAsCustomer(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'customer@example.com');
  await page.fill('input[name="password"]', 'Customer123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/i);
}

// Helper function to add items to cart
async function addItemsToCart(page: Page) {
  await page.goto('/products');
  await page.waitForSelector('button:has-text("Add to Cart")');
  await page.click('button:has-text("Add to Cart")');
  await page.waitForSelector('button:has-text("View Cart")');
  await page.click('button:has-text("View Cart")');
  await expect(page).toHaveURL(/cart/i);
}

test.describe('Load Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('API Endpoint Load Test', async ({ page }) => {
    const endpoints = [
      '/api/products',
      '/api/orders',
      '/api/payment-methods',
      '/api/users/profile'
    ];

    const responseTimes: { [key: string]: number[] } = {};
    const concurrentRequests = 10;

    for (const endpoint of endpoints) {
      responseTimes[endpoint] = [];
      
      // Make concurrent requests to each endpoint
      const requests = Array(concurrentRequests).fill(null).map(async () => {
        const startTime = Date.now();
        const response = await page.request.get(endpoint);
        const endTime = Date.now();
        
        expect(response.status()).toBe(200);
        responseTimes[endpoint].push(endTime - startTime);
      });

      await Promise.all(requests);

      // Calculate and assert performance metrics
      const avgResponseTime = responseTimes[endpoint].reduce((a, b) => a + b, 0) / concurrentRequests;
      const maxResponseTime = Math.max(...responseTimes[endpoint]);
      
      console.log(`Endpoint: ${endpoint}`);
      console.log(`Average Response Time: ${avgResponseTime}ms`);
      console.log(`Max Response Time: ${maxResponseTime}ms`);
      
      // Assert performance thresholds
      expect(avgResponseTime).toBeLessThan(500); // 500ms average
      expect(maxResponseTime).toBeLessThan(1000); // 1s maximum
    }
  });

  test('Checkout Process Load Test', async ({ page }) => {
    await loginAsCustomer(page);
    await addItemsToCart(page);

    const startTime = Date.now();
    
    // Simulate multiple concurrent checkout processes
    const concurrentCheckouts = 5;
    const checkouts = Array(concurrentCheckouts).fill(null).map(async () => {
      const checkoutPage = await page.context().newPage();
      await checkoutPage.goto('/cart');
      await checkoutPage.click('button:has-text("Proceed to Checkout")');
      
      // Fill checkout form
      await checkoutPage.fill('input[name="name"]', 'Test User');
      await checkoutPage.fill('input[name="address"]', '123 Test St');
      await checkoutPage.fill('input[name="city"]', 'Test City');
      await checkoutPage.fill('input[name="zip"]', '12345');
      await checkoutPage.fill('input[name="phone"]', '1234567890');
      
      // Fill payment details
      await checkoutPage.fill('input[name="cardNumber"]', '4242424242424242');
      await checkoutPage.fill('input[name="expiry"]', '12/25');
      await checkoutPage.fill('input[name="cvc"]', '123');
      
      // Submit payment
      await checkoutPage.click('button:has-text("Pay Now")');
      await checkoutPage.waitForURL(/success/i);
      
      await checkoutPage.close();
    });

    await Promise.all(checkouts);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Assert performance thresholds
    expect(totalTime).toBeLessThan(30000); // 30 seconds for all checkouts
    console.log(`Total time for ${concurrentCheckouts} checkouts: ${totalTime}ms`);
  });

  test('Search and Filter Load Test', async ({ page }) => {
    const searchTerms = ['test', 'product', 'item', 'new', 'sale'];
    const responseTimes: number[] = [];

    for (const term of searchTerms) {
      const startTime = Date.now();
      
      // Perform search
      await page.goto('/products');
      await page.fill('input[placeholder="Search products"]', term);
      await page.waitForResponse(response => response.url().includes('/api/products/search'));
      
      // Apply filters
      await page.click('button:has-text("Filter")');
      await page.click('text=Price: Low to High');
      await page.waitForResponse(response => response.url().includes('/api/products/filter'));
      
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
    }

    // Calculate and assert performance metrics
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / searchTerms.length;
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log(`Average Search/Filter Response Time: ${avgResponseTime}ms`);
    console.log(`Max Search/Filter Response Time: ${maxResponseTime}ms`);
    
    // Assert performance thresholds
    expect(avgResponseTime).toBeLessThan(1000); // 1s average
    expect(maxResponseTime).toBeLessThan(2000); // 2s maximum
  });

  test('Dashboard Data Load Test', async ({ page }) => {
    await loginAsCustomer(page);
    
    const responseTimes: number[] = [];
    const iterations = 5;

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      // Load dashboard data
      await page.goto('/dashboard');
      await page.waitForSelector('text=Total Orders');
      await page.waitForSelector('text=Recent Activity');
      await page.waitForSelector('text=Sales Overview');
      
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
      
      // Wait a bit between iterations
      await page.waitForTimeout(1000);
    }

    // Calculate and assert performance metrics
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log(`Average Dashboard Load Time: ${avgResponseTime}ms`);
    console.log(`Max Dashboard Load Time: ${maxResponseTime}ms`);
    
    // Assert performance thresholds
    expect(avgResponseTime).toBeLessThan(2000); // 2s average
    expect(maxResponseTime).toBeLessThan(3000); // 3s maximum
  });

  test('Peak Traffic Simulation', async ({ page }) => {
    const concurrentUsers = 20;
    const pages = await Promise.all(
      Array(concurrentUsers).fill(null).map(() => page.context().newPage())
    );

    const responseTimes: number[] = [];

    // Simulate concurrent users browsing products
    const userActions = pages.map(async (userPage) => {
      const startTime = Date.now();
      
      // Browse products
      await userPage.goto('/products');
      await userPage.waitForLoadState('networkidle');
      
      // Search for products
      await userPage.fill('input[placeholder="Search products"]', 'test');
      await userPage.waitForResponse(response => response.url().includes('/api/products/search'));
      
      // View product details
      await userPage.click('text=View Details');
      await userPage.waitForLoadState('networkidle');
      
      // Add to cart
      await userPage.click('button:has-text("Add to Cart")');
      await userPage.waitForResponse(response => response.url().includes('/api/cart'));
      
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
      
      await userPage.close();
    });

    await Promise.all(userActions);

    // Calculate and assert performance metrics
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / concurrentUsers;
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log(`Average Response Time (${concurrentUsers} users): ${avgResponseTime}ms`);
    console.log(`Max Response Time: ${maxResponseTime}ms`);
    
    // Assert performance thresholds
    expect(avgResponseTime).toBeLessThan(3000); // 3s average
    expect(maxResponseTime).toBeLessThan(5000); // 5s maximum
  });
}); 