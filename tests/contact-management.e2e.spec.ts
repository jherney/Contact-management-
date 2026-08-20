import { test, expect } from '@playwright/test';

test.describe('Contact Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for the app shell to finish its entrance animations / auth check.
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load the Contacts app successfully', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Contacts');
    await expect(page.locator('#directory-content')).toBeVisible();
  });

  test('should always render the dark theme', async ({ page }) => {
    const appShell = page.locator('div.bg-\\[\\#0a0a0a\\]').first();
    await expect(appShell).toBeVisible();
    const classAttr = (await appShell.getAttribute('class')) ?? '';
    expect(classAttr).toContain('bg-[#0a0a0a]');
  });

  test('should display all directory navigation items', async ({ page }) => {
    const navItems = ['directory', 'tasks', 'deals', 'companies', 'reminders', 'reports'];
    for (const id of navItems) {
      await expect(page.locator(`#nav-${id}`)).toBeVisible();
    }
  });

  test('should display a Sign In button when unauthenticated', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should display the global search input', async ({ page }) => {
    await expect(page.locator('#global-search-input')).toBeVisible();
  });

  test('should show the unauthenticated prompt in the directory', async ({ page }) => {
    await expect(page.getByText('Sign in to manage contacts')).toBeVisible();
  });

  test('should navigate between directory views', async ({ page }) => {
    const views = ['tasks', 'deals', 'companies', 'reminders', 'reports'];
    for (const view of views) {
      await page.locator(`#nav-${view}`).click();
      await expect(page.locator('#crm-view-content')).toBeVisible();
      await expect(page.locator(`#nav-${view}`)).toHaveClass(/bg-\[#ff4d00\]/);
    }
  });
});
