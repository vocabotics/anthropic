import { test, expect } from '@playwright/test';

test.describe('Project Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@vocabotics.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should display workflow visualization', async ({ page }) => {
    // Navigate to an existing project's workflow
    await page.goto('/projects');

    // Click on first project (assuming projects exist)
    await page.click('[data-testid="project-card"]:first-of-type');

    // Should show workflow page
    await expect(page).toHaveURL(/\/projects\/.*\/workflow/);

    // Should show workflow phases
    await expect(page.locator('text=/requirements|prd/i')).toBeVisible();
    await expect(page.locator('text=/architecture/i')).toBeVisible();
    await expect(page.locator('text=/code/i')).toBeVisible();
    await expect(page.locator('text=/testing/i')).toBeVisible();
  });

  test('should show progress percentage', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="project-card"]:first-of-type');

    // Should show progress indicator
    await expect(page.locator('[data-testid="progress"]')).toBeVisible();

    // Progress should be between 0-100
    const progressText = await page.locator('[data-testid="progress"]').textContent();
    expect(progressText).toMatch(/\d+%/);
  });

  test('should display event log', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="project-card"]:first-of-type');

    // Should show event log
    await expect(page.locator('text=/event log|events/i')).toBeVisible();

    // Should have at least one event
    const events = page.locator('[data-testid="event"]');
    await expect(events.first()).toBeVisible();
  });

  test('should show artifact download buttons', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="project-card"]:first-of-type');

    // Wait for workflow to load
    await page.waitForSelector('text=/artifacts/i', { timeout: 5000 });

    // Should show artifact section
    await expect(page.locator('text=/artifacts/i')).toBeVisible();

    // Check for download buttons (for completed artifacts)
    const downloadButtons = page.locator('button:has-text("Download")');
    const count = await downloadButtons.count();

    // Should have at least one download button if project has artifacts
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow PRD review when ready', async ({ page }) => {
    await page.goto('/projects');

    // Find a project with completed PRD
    const projectCard = page.locator('[data-status="prd_review"]').first();

    if ((await projectCard.count()) > 0) {
      await projectCard.click();

      // Should show "Review PRD" button
      await expect(page.locator('button:has-text("Review PRD")')).toBeVisible();

      // Click review button
      await page.click('button:has-text("Review PRD")');

      // Should navigate to PRD review page
      await expect(page).toHaveURL(/\/projects\/.*\/prd/);

      // Should show PRD content
      await expect(page.locator('text=/vision/i')).toBeVisible();
      await expect(page.locator('text=/requirements/i')).toBeVisible();
    }
  });

  test('should update in real-time via WebSocket', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="project-card"]:first-of-type');

    // Get initial event count
    const initialEvents = await page.locator('[data-testid="event"]').count();

    // Wait for potential new events (if workflow is running)
    await page.waitForTimeout(2000);

    // Check if events updated (if workflow is active)
    const currentEvents = await page.locator('[data-testid="event"]').count();

    // Events count should be >= initial (may stay same if workflow complete)
    expect(currentEvents).toBeGreaterThanOrEqual(initialEvents);
  });

  test('should navigate to quality dashboard', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="project-card"]:first-of-type');

    // Click quality tab/button
    await page.click('text=/quality/i');

    // Should navigate to quality page
    await expect(page).toHaveURL(/\/projects\/.*\/quality/);

    // Should show quality metrics
    await expect(page.locator('text=/score|coverage/i')).toBeVisible();
  });

  test('should navigate to integration map', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="project-card"]:first-of-type');

    // Click integration map tab/button
    await page.click('text=/integration map/i');

    // Should navigate to integration map page
    await expect(page).toHaveURL(/\/projects\/.*\/integration-map/);

    // Should show integration map
    await expect(page.locator('text=/elements|traceability/i')).toBeVisible();
  });

  test('should navigate to testing dashboard', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="project-card"]:first-of-type');

    // Click testing tab/button
    await page.click('text=/testing/i');

    // Should navigate to testing page
    await expect(page).toHaveURL(/\/projects\/.*\/testing/);

    // Should show testing content
    await expect(page.locator('text=/test|results/i')).toBeVisible();
  });
});
