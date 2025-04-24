import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

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
  await page.click('button:has-text("Add to Cart")');
  await page.click('button:has-text("View Cart")');
  await expect(page).toHaveURL(/cart/i);
}

test.describe('Payment Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAsCustomer(page);
    await addItemsToCart(page);
  });

  test('successful checkout flow', async ({ page }) => {
    // 1. Proceed to checkout
    await page.click('button:has-text("Proceed to Checkout")');
    await expect(page).toHaveURL(/checkout/i);

    // 2. Fill shipping information
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="address"]', '123 Test St');
    await page.fill('input[name="city"]', 'Test City');
    await page.fill('input[name="zip"]', '12345');
    await page.fill('input[name="phone"]', '1234567890');

    // 3. Fill payment information
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');

    // 4. Submit payment
    await page.click('button:has-text("Pay Now")');

    // 5. Verify success
    await expect(page).toHaveURL(/success/i);
    await expect(page.locator('text=Payment successful')).toBeVisible();
    await expect(page.locator('text=Order confirmed')).toBeVisible();
  });

  test('payment webhook handling', async ({ page }) => {
    // 1. Start checkout process
    await page.click('button:has-text("Proceed to Checkout")');
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');

    // 2. Mock successful webhook
    await page.route('**/api/payment/webhook', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test',
              status: 'succeeded',
              metadata: {
                transactionId: 'tx_123',
              },
            },
          },
        }),
      });
    });

    // 3. Submit payment
    await page.click('button:has-text("Pay Now")');

    // 4. Verify webhook handling
    await expect(page.locator('text=Payment processed')).toBeVisible();
    await expect(page).toHaveURL(/success/i);
  });

  test('payment failure handling', async ({ page }) => {
    // 1. Start checkout process
    await page.click('button:has-text("Proceed to Checkout")');
    await page.fill('input[name="cardNumber"]', '4000000000000002'); // Card that will be declined
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');

    // 2. Mock failed payment
    await page.route('**/api/payment/webhook', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          type: 'payment_intent.payment_failed',
          data: {
            object: {
              id: 'pi_test',
              status: 'failed',
              last_payment_error: {
                message: 'Your card was declined',
              },
            },
          },
        }),
      });
    });

    // 3. Submit payment
    await page.click('button:has-text("Pay Now")');

    // 4. Verify error handling
    await expect(page.locator('text=Payment failed')).toBeVisible();
    await expect(page.locator('text=Your card was declined')).toBeVisible();
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test('refund flow', async ({ page }) => {
    // 1. Complete a successful payment first
    await page.click('button:has-text("Proceed to Checkout")');
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');
    await page.click('button:has-text("Pay Now")');
    await expect(page).toHaveURL(/success/i);

    // 2. Navigate to order history
    await page.goto('/orders');
    await page.click('text=View Details');

    // 3. Initiate refund
    await page.click('button:has-text("Request Refund")');
    await page.fill('textarea[name="reason"]', 'Test refund reason');
    await page.click('button:has-text("Submit Refund Request")');

    // 4. Mock refund webhook
    await page.route('**/api/payment/webhook', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          type: 'charge.refunded',
          data: {
            object: {
              id: 'ch_test',
              amount_refunded: 1000,
              refunds: {
                data: [
                  {
                    id: 're_test',
                  },
                ],
              },
            },
          },
        }),
      });
    });

    // 5. Verify refund status
    await expect(page.locator('text=Refund processed')).toBeVisible();
    await expect(page.locator('text=Refund completed')).toBeVisible();
  });

  test('network error handling', async ({ page }) => {
    // 1. Start checkout process
    await page.click('button:has-text("Proceed to Checkout")');
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');

    // 2. Simulate network error
    await page.route('**/api/payment/**', route => route.abort('failed'));

    // 3. Submit payment
    await page.click('button:has-text("Pay Now")');

    // 4. Verify error handling
    await expect(page.locator('text=Network error')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();

    // 5. Restore network and retry
    await page.route('**/api/payment/**', route => route.continue());
    await page.click('button:has-text("Retry")');

    // 6. Verify successful retry
    await expect(page).toHaveURL(/success/i);
  });

  test('form validation', async ({ page }) => {
    // 1. Start checkout process
    await page.click('button:has-text("Proceed to Checkout")');

    // 2. Submit without filling required fields
    await page.click('button:has-text("Pay Now")');

    // 3. Verify validation messages
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Address is required')).toBeVisible();
    await expect(page.locator('text=Card number is required')).toBeVisible();

    // 4. Fill invalid card number
    await page.fill('input[name="cardNumber"]', '1234');
    await page.click('button:has-text("Pay Now")');
    await expect(page.locator('text=Invalid card number')).toBeVisible();

    // 5. Fill invalid expiry date
    await page.fill('input[name="expiry"]', '13/25');
    await page.click('button:has-text("Pay Now")');
    await expect(page.locator('text=Invalid expiry date')).toBeVisible();
  });

  test('save payment method', async ({ page }) => {
    // 1. Start checkout process
    await page.click('button:has-text("Proceed to Checkout")');
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');

    // 2. Check save payment method
    await page.check('input[name="savePaymentMethod"]');

    // 3. Complete payment
    await page.click('button:has-text("Pay Now")');
    await expect(page).toHaveURL(/success/i);

    // 4. Verify saved payment method
    await page.goto('/payment-methods');
    await expect(page.locator('text=****4242')).toBeVisible();
  });
}); 