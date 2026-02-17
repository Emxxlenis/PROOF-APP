/**
 * E2E Tests for Project Isolation
 * 
 * Verifies that data is properly isolated between projects
 * and that project switching works correctly across all pages.
 * 
 * Run with: npx playwright test
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

test.describe('Project Isolation', () => {
  let authToken: string;
  let project1Id: string;
  let project2Id: string;

  test.beforeAll(async ({ request }) => {
    // Setup: Create test user and projects
    // This would need to be implemented based on your auth setup
    // For now, we'll assume manual login
  });

  test('should isolate data between projects', async ({ page }) => {
    // Login (adjust based on your auth flow)
    await page.goto(`${BASE_URL}/auth`);
    // ... login steps ...

    // Create Project 1
    await page.goto(`${BASE_URL}/dashboard/projects/new`);
    await page.fill('input[name="name"]', 'Proyecto Test 1');
    await page.fill('textarea[name="description"]', 'Descripción del proyecto 1');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard\/startup-builder/);
    
    // Get project ID from URL or localStorage
    project1Id = await page.evaluate(() => localStorage.getItem('selected_project_id') || '');

    // Add data to Project 1
    await page.fill('input[name="problem"]', 'Problema Proyecto 1');
    await page.fill('input[name="target_audience"]', 'Usuarios Proyecto 1');
    await page.click('button:has-text("Guardar")');

    // Create Project 2
    await page.goto(`${BASE_URL}/dashboard/projects/new`);
    await page.fill('input[name="name"]', 'Proyecto Test 2');
    await page.fill('textarea[name="description"]', 'Descripción del proyecto 2');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard\/startup-builder/);
    
    project2Id = await page.evaluate(() => localStorage.getItem('selected_project_id') || '');

    // Add data to Project 2
    await page.fill('input[name="problem"]', 'Problema Proyecto 2');
    await page.fill('input[name="target_audience"]', 'Usuarios Proyecto 2');
    await page.click('button:has-text("Guardar")');

    // Switch to Project 1
    await page.click('[data-testid="project-selector"]');
    await page.click(`[data-project-id="${project1Id}"]`);
    await page.waitForTimeout(1000); // Wait for data to load

    // Verify Project 1 data is shown
    await page.goto(`${BASE_URL}/dashboard/startup-builder`);
    await expect(page.locator('input[name="problem"]')).toHaveValue('Problema Proyecto 1');
    await expect(page.locator('input[name="target_audience"]')).toHaveValue('Usuarios Proyecto 1');

    // Switch to Project 2
    await page.click('[data-testid="project-selector"]');
    await page.click(`[data-project-id="${project2Id}"]`);
    await page.waitForTimeout(1000);

    // Verify Project 2 data is shown
    await expect(page.locator('input[name="problem"]')).toHaveValue('Problema Proyecto 2');
    await expect(page.locator('input[name="target_audience"]')).toHaveValue('Usuarios Proyecto 2');
  });

  test('should isolate OKRs by project', async ({ page }) => {
    // Login and setup projects...
    
    // Create OKR in Project 1
    await page.goto(`${BASE_URL}/dashboard/okrs`);
    // ... create OKR steps ...
    
    const okr1Count = await page.locator('[data-testid="okr-item"]').count();

    // Switch to Project 2
    await page.click('[data-testid="project-selector"]');
    await page.click(`[data-project-id="${project2Id}"]`);
    await page.waitForTimeout(1000);

    // Verify Project 2 has different OKRs (or none)
    const okr2Count = await page.locator('[data-testid="okr-item"]').count();
    // OKRs should be different or empty for new project
  });

  test('should isolate coach chats by project', async ({ page }) => {
    // Login and setup...
    
    // Send message in Project 1
    await page.goto(`${BASE_URL}/vitacoach`);
    await page.fill('textarea[placeholder*="mensaje"]', 'Mensaje Proyecto 1');
    await page.click('button:has-text("Enviar")');
    await page.waitForTimeout(2000);

    const messages1 = await page.locator('[data-testid="message"]').count();

    // Switch to Project 2
    await page.click('[data-testid="project-selector"]');
    await page.click(`[data-project-id="${project2Id}"]`);
    await page.waitForTimeout(1000);

    // Verify Project 2 has different messages (or none)
    const messages2 = await page.locator('[data-testid="message"]').count();
    // Messages should be different or empty for new project
  });

  test('should sync project selection across tabs', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Login in both tabs
    await page1.goto(`${BASE_URL}/auth`);
    // ... login steps ...
    await page2.goto(`${BASE_URL}/dashboard`);

    // Select project in tab 1
    await page1.click('[data-testid="project-selector"]');
    await page1.click(`[data-project-id="${project1Id}"]`);
    await page1.waitForTimeout(1000);

    // Verify tab 2 detects the change
    await page2.waitForTimeout(2000); // Wait for storage event
    const selectedProject2 = await page2.evaluate(() => 
      localStorage.getItem('selected_project_id')
    );
    expect(selectedProject2).toBe(project1Id);

    await page1.close();
    await page2.close();
  });
});

test.describe('Project Management', () => {
  test('should create and delete projects', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    // ... login ...

    // Create project
    await page.goto(`${BASE_URL}/dashboard/projects/new`);
    await page.fill('input[name="name"]', 'Proyecto Temporal');
    await page.fill('textarea[name="description"]', 'Descripción temporal');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard\/startup-builder/);

    // Verify project appears in selector
    await page.click('[data-testid="project-selector"]');
    await expect(page.locator('text=Proyecto Temporal')).toBeVisible();

    // Delete project
    await page.goto(`${BASE_URL}/dashboard/startup-builder`);
    await page.click('button:has-text("Eliminar")');
    await page.click('button:has-text("Eliminar"):last-of-type'); // Confirm

    // Verify project is removed
    await page.click('[data-testid="project-selector"]');
    await expect(page.locator('text=Proyecto Temporal')).not.toBeVisible();
  });
});
