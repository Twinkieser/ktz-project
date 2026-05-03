import { test, expect } from '@playwright/test';

test.describe('KTZ Locomotive Dispatcher - E2E Testing Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go to the main dashboard
    await page.goto('/');
  });

  test('Dashboard should load KPIs correctly', async ({ page }) => {
    // Check main title
    await expect(page.getByText('Обзор системы')).toBeVisible();
    
    // Check KPI cards presence
    await expect(page.getByText('Выполнено рейсов')).toBeVisible();
    await expect(page.getByText('Эффективность парка')).toBeVisible();
    await expect(page.getByText('Средний простой')).toBeVisible();
    await expect(page.getByText('Конфликты')).toBeVisible();
    
    // Check if API status is visible
    await expect(page.getByText('API Online')).toBeVisible();
  });

  test('Navigation to Graph Page should work and show timeline', async ({ page }) => {
    // Click on Timeline/Graph tab in Sidebar
    await page.getByRole('button', { name: /График/i }).click();
    
    // Verify header and button
    await expect(page.getByText('Гант-график подвязок')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Обновить график' })).toBeVisible();
    
    // Check if timeline canvas or container exists (depending on how library renders)
    // Looking for the timeline container class defined in App.tsx
    const timeline = page.locator('.timeline-container');
    await expect(timeline).toBeVisible();
  });

  test('Locomotive List should display maintenance data', async ({ page }) => {
    // Navigate to Locomotives
    await page.getByRole('button', { name: /Локомотивы/i }).click();
    
    await expect(page.getByPlaceholder('Поиск по номеру или модели...')).toBeVisible();
    
    // Verify specific info in locomotive cards (assuming there's data)
    await expect(page.getByText('Пробег до ТО')).first().toBeVisible();
    await expect(page.getByText('Моточасы до ТО')).first().toBeVisible();
    await expect(page.getByText('Топливо')).first().toBeVisible();
  });

  test('Conflict Detection module should be accessible', async ({ page }) => {
    // Navigate to Conflicts
    await page.getByRole('button', { name: /Конфликты/i }).click();
    
    await expect(page.getByText('Журнал конфликтов и нарушений')).toBeVisible();
    
    // Check for "Show on graph" capabilities in the table if entries exist
    // This part depends on existing seed data
  });

  test('Import page should have validation requirements visible', async ({ page }) => {
    // Navigate to Import
    await page.getByRole('button', { name: /Импорт данных/i }).click();
    
    await expect(page.getByText('Загрузите файлы CSV или XLSX')).toBeVisible();
    await expect(page.getByText('Требования к формату колонок:')).toBeVisible();
    
    // Verify required headers check
    const columns = ['locomotive_number', 'train_number', 'from_station', 'to_station'];
    for (const col of columns) {
      await expect(page.getByText(col)).toBeVisible();
    }
  });

  test('Shoulder boundaries (service regions) should list active routes', async ({ page }) => {
    // Navigate to Shoulders (Плечи)
    await page.getByRole('button', { name: /Плечи/i }).click();
    
    await expect(page.getByText('Плечи обслуживания')).toBeVisible();
    await expect(page.getByText('Управление маршрутами и региональными ограничениями')).toBeVisible();
  });

});
