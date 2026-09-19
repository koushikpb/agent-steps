import { expect, test } from '@playwright/test';

type LabelWindow = Window & { __firstLabels: string[] };

test('shows the running label first, then done labels for code, diff, and chart steps', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/?mode=replay&fixture=demo&speed=4');
  // At this speed the first step's running label is visible for under 200 ms, shorter than
  // Playwright's assertion polling, so record every distinct label the first step shows in-page.
  await page.evaluate(() => {
    const seen: string[] = [];
    (window as unknown as LabelWindow).__firstLabels = seen;
    new MutationObserver(() => {
      const text = document.querySelector('[data-testid="step-label"]')?.textContent ?? '';
      if (text && seen[seen.length - 1] !== text) seen.push(text);
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  await page.getByTestId('run').click();
  await expect(page.getByTestId('metrics')).toBeVisible({ timeout: 170_000 });
  const firstLabels = await page.evaluate(() => (window as unknown as LabelWindow).__firstLabels);
  expect(firstLabels[0]).toMatch(/^(Generating code|Editing file|Generating visualization)$/);
  expect(firstLabels[firstLabels.length - 1]).toMatch(/^(Generated code|Edited file|Generated visualization)$/);
  const labels = await page.getByTestId('step-label').allTextContents();
  expect(labels).toContain('Generated code');
  expect(labels).toContain('Edited file');
  expect(labels).toContain('Generated visualization');
  await expect(page.getByTestId('step-diff').first()).toBeVisible();
  await expect(page.getByTestId('chart').first()).toBeVisible();
  await expect(page.getByTestId('step').first()).toHaveAttribute('data-status', /ok|error/);
});
