import { expect, test } from '@playwright/test';

test('replays a recorded run as a labeled, expandable step', async ({ page }) => {
  await page.goto('/?mode=replay&fixture=mini&speed=50');
  await expect(page.getByTestId('recorded-badge')).toHaveText('Recorded run — Live mode needs a local Python (see README).');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('step-label')).toHaveText('Generated code');
  await expect(page.getByTestId('step-code')).toHaveText('print(1+1)');
  await expect(page.getByTestId('step-output')).toContainText('2');
  await expect(page.getByTestId('assistant-text')).toContainText('1+1 is 2.');
  await expect(page.getByTestId('metrics')).toContainText('events');
});
