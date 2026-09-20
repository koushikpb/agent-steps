import { promises as fs } from 'node:fs';
import path from 'node:path';
import { test } from '@playwright/test';

// Records the replay flow to docs/demo.webm. Run: npx playwright test tests/video
test('records the demo flow to docs/demo.webm', async ({ browser }) => {
  test.setTimeout(240_000);
  const size = { width: 1100, height: 800 };
  const context = await browser.newContext({ viewport: size, recordVideo: { dir: 'docs', size } });
  const page = await context.newPage();
  await page.goto('http://localhost:3117/?mode=replay&fixture=demo&speed=0.5');
  await page.getByTestId('run').click();
  await page.getByTestId('metrics').waitFor({ timeout: 200_000 });
  await page.getByTestId('chart').first().hover();
  const firstSummary = page.getByTestId('step').first().locator('summary');
  await firstSummary.click();
  await firstSummary.click();
  const video = page.video();
  await context.close(); // the video file is complete only after close
  if (video) {
    await video.saveAs(path.join('docs', 'demo.webm'));
    await fs.rm(await video.path(), { force: true }); // remove the random-named original
  }
});
