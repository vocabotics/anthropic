import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Vocabotics/);
    await expect(page.locator('h1')).toContainText(/Sign In|Login/i);
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=/email/i')).toBeVisible();
    await expect(page.locator('text=/password/i')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[type="email"]', 'test@vocabotics.com');
    await page.fill('input[type="password"]', 'testpassword123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Should show dashboard content
    await expect(page.locator('text=/dashboard/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/invalid/i')).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=/sign up|register/i');

    // Should navigate to register page
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('h1')).toContainText(/sign up|register/i);
  });

  test('should register new user', async ({ page }) => {
    await page.goto('/register');

    // Generate unique email
    const timestamp = Date.now();
    const email = `test${timestamp}@vocabotics.com`;

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or login
    await page.waitForURL(/\/(dashboard|login)/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'test@vocabotics.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/\/dashboard/);

    // Click logout button (assuming it's in a menu)
    await page.click('[aria-label="User menu"]');
    await page.click('text=/logout|sign out/i');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'test@vocabotics.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/\/dashboard/);

    // Reload page
    await page.reload();

    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
