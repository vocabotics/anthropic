import { test, expect } from '@playwright/test';

test.describe('Project Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@vocabotics.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should navigate to new project page', async ({ page }) => {
    // Click new project button
    await page.click('text=/new project|create project/i');

    // Should navigate to new project page
    await expect(page).toHaveURL(/\/projects\/new/);

    // Should show wizard step 1 (Vision)
    await expect(page.locator('text=/project vision|vision/i')).toBeVisible();
  });

  test('should complete project creation wizard', async ({ page }) => {
    await page.goto('/projects/new');

    // Step 1: Vision
    await page.fill('input[name="name"]', 'Task Manager Pro');
    await page.fill(
      'textarea[name="description"]',
      'A modern task management application for remote teams with real-time collaboration.'
    );
    await page.fill(
      'input[name="targetAudience"]',
      'Remote teams of 5-50 people, project managers'
    );

    // Go to next step
    await page.click('button:has-text("Next")');

    // Step 2: Features
    await expect(page.locator('text=/key features|features/i')).toBeVisible();

    // Add features
    await page.fill('input[placeholder*="feature"]', 'User authentication');
    await page.click('button:has-text("Add")');

    await page.fill('input[placeholder*="feature"]', 'Task management');
    await page.click('button:has-text("Add")');

    await page.fill('input[placeholder*="feature"]', 'Real-time notifications');
    await page.click('button:has-text("Add")');

    // Go to next step
    await page.click('button:has-text("Next")');

    // Step 3: Tech Stack
    await expect(page.locator('text=/tech stack|technology/i')).toBeVisible();

    // Select tech stack (default selections should be fine)
    await page.click('button:has-text("Next")');

    // Step 4: Review
    await expect(page.locator('text=/review|confirm/i')).toBeVisible();

    // Verify project details are shown
    await expect(page.locator('text=Task Manager Pro')).toBeVisible();
    await expect(page.locator('text=User authentication')).toBeVisible();

    // Create project
    await page.click('button:has-text("Create Project")');

    // Should redirect to workflow page
    await page.waitForURL(/\/projects\/.*\/workflow/, { timeout: 10000 });

    // Should show workflow visualization
    await expect(page.locator('text=/workflow|progress/i')).toBeVisible();
  });

  test('should validate required fields in vision step', async ({ page }) => {
    await page.goto('/projects/new');

    // Try to go to next step without filling fields
    await page.click('button:has-text("Next")');

    // Should show validation errors
    await expect(page.locator('text=/required|name/i')).toBeVisible();
  });

  test('should allow navigation between wizard steps', async ({ page }) => {
    await page.goto('/projects/new');

    // Fill step 1
    await page.fill('input[name="name"]', 'Test Project');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.fill('input[name="targetAudience"]', 'Test audience');
    await page.click('button:has-text("Next")');

    // Step 2
    await page.fill('input[placeholder*="feature"]', 'Feature 1');
    await page.click('button:has-text("Add")');
    await page.click('button:has-text("Next")');

    // Step 3
    await page.click('button:has-text("Next")');

    // Step 4 (Review)
    await expect(page.locator('text=/review/i')).toBeVisible();

    // Go back
    await page.click('button:has-text("Back")');
    await expect(page.locator('text=/tech stack/i')).toBeVisible();

    // Go back again
    await page.click('button:has-text("Back")');
    await expect(page.locator('text=/features/i')).toBeVisible();
  });

  test('should allow removing features', async ({ page }) => {
    await page.goto('/projects/new');

    // Fill step 1
    await page.fill('input[name="name"]', 'Test Project');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.fill('input[name="targetAudience"]', 'Test audience');
    await page.click('button:has-text("Next")');

    // Add features
    await page.fill('input[placeholder*="feature"]', 'Feature 1');
    await page.click('button:has-text("Add")');

    await page.fill('input[placeholder*="feature"]', 'Feature 2');
    await page.click('button:has-text("Add")');

    // Should show 2 features
    await expect(page.locator('text=Feature 1')).toBeVisible();
    await expect(page.locator('text=Feature 2')).toBeVisible();

    // Remove first feature
    await page.click('button[aria-label="Remove"]:first-of-type');

    // Should only show Feature 2
    await expect(page.locator('text=Feature 1')).not.toBeVisible();
    await expect(page.locator('text=Feature 2')).toBeVisible();
  });

  test('should show error if project creation fails', async ({ page }) => {
    await page.goto('/projects/new');

    // Fill minimal data (might fail backend validation)
    await page.fill('input[name="name"]', 'x'); // Too short
    await page.fill('textarea[name="description"]', 'x');
    await page.fill('input[name="targetAudience"]', 'x');
    await page.click('button:has-text("Next")');

    // Skip features
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // Try to create
    await page.click('button:has-text("Create Project")');

    // Should show error message
    await expect(
      page.locator('text=/error|failed|invalid/i')
    ).toBeVisible({ timeout: 5000 });
  });
});
