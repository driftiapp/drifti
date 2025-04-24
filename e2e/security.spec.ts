import { test, expect, Page, BrowserContext } from '@playwright/test';

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
  // Ensure product page loads before clicking add to cart
  await page.waitForSelector('button:has-text("Add to Cart")');
  await page.click('button:has-text("Add to Cart")');
  await page.waitForSelector('button:has-text("View Cart")');
  await page.click('button:has-text("View Cart")');
  await expect(page).toHaveURL(/cart/i);
  await page.waitForSelector('button:has-text("Proceed to Checkout")'); // Ensure cart page loads
}

test.describe('Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('HTTPS Verification', async ({ page }) => {
    await loginAsCustomer(page);
    await addItemsToCart(page);

    // 1. Check Checkout Page
    await page.click('button:has-text("Proceed to Checkout")');
    await expect(page).toHaveURL(/checkout/i);
    expect(page.url()).toMatch(/^https:\/\//);

    // 2. Check Payment Methods Page (assuming it exists)
    await page.goto('/payment-methods');
    await expect(page).toHaveURL(/payment-methods/i);
    expect(page.url()).toMatch(/^https:\/\//);
  });

  test('Input Validation & Sanitization (Advanced XSS)', async ({ page }) => {
    await loginAsCustomer(page);
    await addItemsToCart(page);
    await page.click('button:has-text("Proceed to Checkout")');
    await expect(page).toHaveURL(/checkout/i);

    const xssPayloads = [
      '<script>alert("XSS1")</script>',
      '<img src=x onerror=alert("XSS2")>',
      '<svg/onload=alert("XSS3")>',
      // Add more payloads if needed
    ];

    const fieldsToTest = ['name', 'address', 'city', 'zip', 'phone']; // Add other relevant fields

    for (const field of fieldsToTest) {
      for (const payload of xssPayloads) {
        console.log(`Testing field '${field}' with payload: ${payload}`);
        // Fill required fields first to avoid unrelated validation errors
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="address"]', '123 Test St');
        await page.fill('input[name="city"]', 'Test City');
        await page.fill('input[name="zip"]', '12345');
        await page.fill('input[name="phone"]', '1234567890');
        await page.fill('input[name="cardNumber"]', '4242424242424242');
        await page.fill('input[name="expiry"]', '12/25');
        await page.fill('input[name="cvc"]', '123');

        // Inject payload into the current field
        await page.fill(`input[name="${field}"]`, payload);
        await page.click('button:has-text("Pay Now")');

        // Check if the payload was executed (e.g., by checking for alert or specific HTML)
        // This expectation is basic; a real test might need to check for DOM changes or lack thereof.
        await expect(page.locator('body')).not.toContainText('<script>');
        await expect(page.locator('body')).not.toContainText('<img'); 
        await expect(page.locator('body')).not.toContainText('<svg'); 

        // Important: Check if the application correctly handled the input
        // e.g., showed a validation error, or proceeded but sanitized the input.
        // If it proceeded to success page, XSS might still be stored.
        // Add specific checks based on expected application behavior.
        
        // Go back if needed or handle navigation after submission
        if (!page.url().includes('checkout')) {
            await page.goto('/checkout'); // Reset state if navigated away
        }
      }
    }
  });

  test('Secure Header Checks (Specific CSP)', async ({ page }) => {
    await page.goto('/checkout'); // Use a sensitive page like checkout
    const response = await page.request.head(page.url());
    const headers = response.headers();

    // 1. Check Strict-Transport-Security
    expect(headers['strict-transport-security']).toBeDefined();
    expect(headers['strict-transport-security']).toContain('max-age='); // Check for presence of max-age
    // Optionally check for includeSubDomains

    // 2. Check X-Content-Type-Options
    expect(headers['x-content-type-options']).toContain('nosniff');

    // 3. Check Content-Security-Policy
    const cspHeader = headers['content-security-policy'];
    expect(cspHeader).toBeDefined();

    // --- Specific CSP Directive Checks --- 
    // Note: These checks are examples and might need adjustment based on the actual policy.
    // Use a dedicated CSP parsing library for robust validation in real-world scenarios.

    // Check default-src
    expect(cspHeader).toMatch(/default-src\s+'self'/);

    // Check script-src (example assumes nonce-based or strict-dynamic)
    expect(cspHeader).toMatch(/script-src\s+('self'|\'nonce-[^\s]+'|\'strict-dynamic\')/);

    // Check object-src
    expect(cspHeader).toMatch(/object-src\s+'none'/);

    // Check base-uri
    expect(cspHeader).toMatch(/base-uri\s+'self'/);
    
    // Check frame-ancestors
    expect(cspHeader).toMatch(/frame-ancestors\s+('none'|\'self\')/);

    // Optional: Check X-Frame-Options as a fallback or additional layer
    // expect(headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
  });

  test('Authentication & Authorization', async ({ page, context }) => {
    // 1. Attempt access to checkout without login
    await page.goto('/checkout');
    // Expect redirection to login or an error message
    await expect(page).not.toHaveURL(/checkout/i);
    await expect(page).toHaveURL(/login/i);

    // 2. Login and attempt access to another user's data (IDOR Placeholder)
    await loginAsCustomer(page);
    // Example: Try accessing an order ID belonging to another user
    // Replace 'other_user_order_id' with a known or guessed ID pattern
    const targetOrderId = 'order_456'; // Placeholder ID
    try {
      const response = await page.request.get(`/api/orders/${targetOrderId}`);
      // Expecting 403 Forbidden or 404 Not Found for unauthorized access
      expect(response.status()).toBeGreaterThanOrEqual(400); 
    } catch (error) {
        // Handle network errors or other exceptions if necessary
        console.error("Error during IDOR test request:", error);
    }
    // Or navigate to a page and check for UI indication of failure
    // await page.goto(`/orders/${targetOrderId}`);
    // await expect(page.locator('text=Unauthorized').or(page.locator('text=Not Found'))).toBeVisible();
    
    // 3. Session check: Clear cookies and try accessing protected page
    await page.goto('/dashboard'); // Access a protected page
    await expect(page).toHaveURL(/dashboard/i); // Should be logged in
    await context.clearCookies();
    await page.reload();
    await expect(page).toHaveURL(/login/i); // Should be redirected to login
  });

  test('Token Handling - Storage', async ({ page, context }) => {
    await loginAsCustomer(page);

    // Check if token is stored insecurely in localStorage or sessionStorage
    const localStorageItems = await page.evaluate(() => window.localStorage);
    expect(localStorageItems['authToken']).toBeUndefined(); // Or similar token key

    const sessionStorageItems = await page.evaluate(() => window.sessionStorage);
    expect(sessionStorageItems['authToken']).toBeUndefined();

    // Ideally, tokens should be stored in HttpOnly cookies, which aren't directly accessible via JS.
    // We can check cookie attributes if needed.
    const cookies = await context.cookies();
    const authCookie = cookies.find(cookie => cookie.name === 'sessionToken'); // Adjust cookie name
    expect(authCookie).toBeDefined();
    expect(authCookie?.httpOnly).toBe(true);
    expect(authCookie?.secure).toBe(true); // Ensure secure attribute for HTTPS
  });

  test.describe('IDOR (Insecure Direct Object Reference) Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
    });

    test('Order Access Control', async ({ page }) => {
      // 1. Login as customer and get their order ID
      await loginAsCustomer(page);
      await page.goto('/orders');
      await page.waitForSelector('table tr'); // Wait for orders table to load
      
      // Get the first order ID from the table
      const firstOrderId = await page.locator('table tr').first().getAttribute('data-order-id');
      expect(firstOrderId).toBeDefined();
      
      // 2. Try to access another user's order (IDOR attempt)
      const otherOrderId = 'order_456'; // This should be a valid but unauthorized order ID
      
      // API-based check
      const response = await page.request.get(`/api/orders/${otherOrderId}`);
      expect(response.status()).toBeGreaterThanOrEqual(400); // Should be 403 or 404
      
      // UI-based check
      await page.goto(`/orders/${otherOrderId}`);
      await expect(page.locator('text=Unauthorized').or(page.locator('text=Not Found'))).toBeVisible();
    });

    test('Payment Method Access Control', async ({ page }) => {
      await loginAsCustomer(page);
      
      // 1. Get user's payment method ID
      await page.goto('/payment-methods');
      await page.waitForSelector('[data-payment-method-id]');
      const userPaymentMethodId = await page.locator('[data-payment-method-id]').first().getAttribute('data-payment-method-id');
      
      // 2. Try to access another user's payment method
      const otherPaymentMethodId = 'pm_456'; // Valid but unauthorized payment method ID
      
      // API-based check
      const response = await page.request.get(`/api/payment-methods/${otherPaymentMethodId}`);
      expect(response.status()).toBeGreaterThanOrEqual(400);
      
      // UI-based check
      await page.goto(`/payment-methods/${otherPaymentMethodId}`);
      await expect(page.locator('text=Unauthorized').or(page.locator('text=Not Found'))).toBeVisible();
    });

    test('User Profile Access Control', async ({ page }) => {
      await loginAsCustomer(page);
      
      // 1. Get current user's profile ID
      await page.goto('/profile');
      const userProfileId = await page.locator('[data-profile-id]').getAttribute('data-profile-id');
      
      // 2. Try to access another user's profile
      const otherProfileId = 'user_456'; // Valid but unauthorized profile ID
      
      // API-based check
      const response = await page.request.get(`/api/users/${otherProfileId}`);
      expect(response.status()).toBeGreaterThanOrEqual(400);
      
      // UI-based check
      await page.goto(`/users/${otherProfileId}`);
      await expect(page.locator('text=Unauthorized').or(page.locator('text=Not Found'))).toBeVisible();
    });

    test('Order Modification Control', async ({ page }) => {
      await loginAsCustomer(page);
      
      // 1. Get user's order ID
      await page.goto('/orders');
      await page.waitForSelector('table tr');
      const userOrderId = await page.locator('table tr').first().getAttribute('data-order-id');
      
      // 2. Try to modify another user's order
      const otherOrderId = 'order_456';
      
      // PUT request check
      const putResponse = await page.request.put(`/api/orders/${otherOrderId}`, {
        data: { status: 'cancelled' }
      });
      expect(putResponse.status()).toBeGreaterThanOrEqual(400);
      
      // DELETE request check
      const deleteResponse = await page.request.delete(`/api/orders/${otherOrderId}`);
      expect(deleteResponse.status()).toBeGreaterThanOrEqual(400);
    });

    test('Unauthenticated Resource Access', async ({ page }) => {
      // Try to access protected resources without authentication
      const protectedEndpoints = [
        '/api/orders/123',
        '/api/payment-methods/123',
        '/api/users/123',
        '/orders/123',
        '/payment-methods/123',
        '/users/123'
      ];
      
      for (const endpoint of protectedEndpoints) {
        // API-based check
        const response = await page.request.get(endpoint);
        expect(response.status()).toBe(401); // Should be Unauthorized
        
        // UI-based check
        await page.goto(endpoint);
        await expect(page).toHaveURL(/login/i); // Should redirect to login
      }
    });

    test('Resource Enumeration Prevention', async ({ page }) => {
      await loginAsCustomer(page);
      
      // Try to enumerate resources by incrementing IDs
      const baseIds = ['order_', 'pm_', 'user_'];
      const testIds = ['123', '124', '125']; // Test a few sequential IDs
      
      for (const baseId of baseIds) {
        for (const id of testIds) {
          const fullId = baseId + id;
          const response = await page.request.get(`/api/${baseId.replace('_', '')}s/${fullId}`);
          
          // Should not reveal whether the resource exists or not
          if (response.status() === 404) {
            // If 404, should not provide additional information
            const body = await response.text();
            expect(body).not.toContain('exists');
            expect(body).not.toContain('found');
          }
        }
      }
    });
  });
}); 