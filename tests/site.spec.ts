import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import projectsJson from '../src/data/projects.json' with { type: 'json' };
import presentationJson from '../src/data/presentation.json' with { type: 'json' };
import experienceJson from '../src/data/experience.json' with { type: 'json' };

const projects = projectsJson.projects;
const pres = presentationJson.projects as Record<string, { slug: string; featuredRank?: number; displayTitle?: string }>;
const nameOf = (id: string) => pres[id].displayTitle ?? projects.find((p) => p.id === id)!.title;
const slugOf = (id: string) => pres[id].slug;
const featured = projects.filter((p) => pres[p.id].featuredRank);
const total = projects.length;
const inGroup = (g: string) => projects.filter((p) => p.group === g).length;
const canonicalPages = ['', 'projects/', ...projects.map((p) => `projects/${slugOf(p.id)}/`), 'experience/', 'about/', 'contact/'];
const pageTypes = ['', 'projects/', `projects/${slugOf('project-1')}/`, `projects/${slugOf('project-3')}/`, 'experience/', 'about/', 'contact/'];

async function noHorizontalOverflow(page: Page) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw, 'page must not scroll horizontally').toBeLessThanOrEqual(cw);
}

test.describe('routes', () => {
  test('every canonical page returns real HTML with HTTP 200 on direct load', async ({ request }) => {
    for (const path of canonicalPages) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(200);
      expect(await res.text(), path).toContain('<h1');
    }
  });

  test('legacy v1 routes forward to the new canonical pages', async ({ page }) => {
    await page.goto('projects/project-5');
    await page.waitForURL(`**/projects/${slugOf('project-5')}/`);
    await expect(page.locator('h1')).toHaveText(nameOf('project-5'));
    await page.goto('projects/all');
    await page.waitForURL('**/portfolio/projects/');
    await expect(page.locator('h1')).toHaveText('Projects');
  });

  test('unknown routes show a helpful 404', async ({ page }) => {
    const res = await page.goto('does-not-exist/');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Page not found');
    await expect(page.getByRole('link', { name: 'All projects' })).toBeVisible();
  });
});

test.describe('home', () => {
  test('identity, current role and six featured projects are visible without clicking', async ({ page }) => {
    await page.goto('');
    await expect(page).toHaveTitle('Kshitij Sharma | Robotics & Perception Software Engineer');
    await expect(page.locator('h1')).toHaveText('Kshitij Sharma');
    await expect(page.locator('.hero')).toContainText('Perception Software Engineer at Lucid Motors');
    const cards = page.locator('#projects article[data-project]');
    await expect(cards).toHaveCount(6);
    for (const p of featured) {
      const card = page.locator(`#projects article[data-project="${p.id}"]`);
      await expect(card.locator('img')).toHaveAttribute('src', /\.webp$/);
      await expect(card.getByRole('heading', { name: nameOf(p.id) })).toBeVisible();
      await expect(card).toContainText(p.mainDescr);
      await expect(card.locator(`a[href$="/projects/${slugOf(p.id)}/"]`).first()).toBeVisible();
      await expect(card.locator(`a[href="${p.link}"]`)).toBeVisible();
    }
    for (const e of experienceJson.experienceData) await expect(page.locator('#experience')).toContainText(e.role);
  });

  test('legacy homepage section anchors exist', async ({ page }) => {
    await page.goto('');
    for (const id of ['bio', 'projects', 'skills', 'experience']) await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator('#skills img')).toHaveCount(9);
  });
});

test.describe('project gallery', () => {
  test('every project is browsable; category, search, empty state and clear work with URL state', async ({ page }) => {
    await page.goto('projects/');
    const visible = page.locator('[data-gallery] article[data-project]:visible');
    await expect(visible).toHaveCount(total);

    await page.getByRole('button', { name: /^Computer Vision/ }).click();
    await expect(visible).toHaveCount(inGroup('Computer Vision'));
    await expect(page).toHaveURL(/category=computer-vision/);
    await expect(page.locator('[data-count]')).toHaveText(`Showing ${inGroup('Computer Vision')} of ${total} projects`);

    await page.getByLabel('Search projects').fill('pytorch');
    await expect(page).toHaveURL(/q=pytorch/);
    const cvPytorch = projects.filter((p) => p.group === 'Computer Vision' && JSON.stringify(p).toLowerCase().includes('pytorch'));
    await expect(visible).toHaveCount(cvPytorch.length);

    await page.getByLabel('Search projects').fill('zzzz-no-match');
    await expect(visible).toHaveCount(0);
    await expect(page.getByText('No projects match your filters.')).toBeVisible();
    await page.locator('[data-empty]').getByRole('button', { name: 'Clear filters' }).click();
    await expect(visible).toHaveCount(total);
    await expect(page).toHaveURL(/\/projects\/$/);
  });

  test('search is case-insensitive across titles, descriptions and tags', async ({ page }) => {
    await page.goto('projects/');
    await page.getByLabel('Search projects').fill('LIDAR');
    await expect(page.locator('article[data-project="project-1"]')).toBeVisible();
    await page.getByLabel('Search projects').fill('kalman');
    await expect(page.locator('article[data-project="project-7"]')).toBeVisible();
  });

  test('filter state restores from the URL and survives back navigation', async ({ page }) => {
    await page.goto('projects/?category=planning-and-control&view=list');
    await expect(page.locator('[data-gallery]')).toHaveAttribute('data-view', 'list');
    await expect(page.locator('[data-gallery] article:visible')).toHaveCount(inGroup('Planning and Control'));
    await page.locator('article[data-project="project-5"] h2 a').click();
    await expect(page.locator('h1')).toHaveText(nameOf('project-5'));
    await page.goBack();
    await expect(page).toHaveURL(/category=planning-and-control/);
    await expect(page.locator('[data-gallery] article:visible')).toHaveCount(inGroup('Planning and Control'));
    await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('all cards, case-study and source links remain available', async ({ page }) => {
    await page.goto('projects/');
    await expect(page.locator('article[data-project]')).toHaveCount(total);
    for (const p of projects) {
      await expect(page.locator(`article[data-project="${p.id}"] h2 a`)).toHaveAttribute('href', `/portfolio/projects/${slugOf(p.id)}/`);
      await expect(page.locator(`article[data-project="${p.id}"] a[href="${p.link}"]`)).toBeVisible();
    }
    await expect(page.locator('.qv-btn').first()).toBeHidden();
    await page.goto('');
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects' })).toBeVisible();
  });
});

test.describe('quick view', () => {
  test('opens from the gallery, shows original content, closes with Escape and restores focus + filters', async ({ page }) => {
    await page.goto('projects/?category=robotics');
    const opener = page.locator('article[data-project="project-1"] button[data-qv-open]');
    await opener.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(nameOf('project-1'));
    await expect(dialog).toContainText(projects[0].description.slice(0, 80));
    await expect(dialog.getByRole('link', { name: 'GitHub repository' })).toHaveAttribute('href', projects[0].link);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page).toHaveURL(/category=robotics/);
  });

  test('opens from the homepage thumbnail and closes via the close button', async ({ page }) => {
    await page.goto('');
    await page.locator('#projects article[data-project="project-5"] .pcard-media').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close preview' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('#projects article[data-project="project-5"] button[data-qv-open]')).toBeFocused();
  });
});

test.describe('media budget', () => {
  test('no GIF is downloaded on page load, and playing a demo uses the video derivative', async ({ page }) => {
    const gifs: string[] = [];
    page.on('request', (r) => { if (/\.gif($|\?)/i.test(r.url())) gifs.push(r.url()); });
    for (const path of ['', 'projects/', `projects/${slugOf('project-4')}/`]) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.mouse.wheel(0, 20000);
      await page.waitForLoadState('networkidle');
    }
    await page.goto(`projects/${slugOf('project-4')}/`);
    await page.getByRole('button', { name: /^Play demo/ }).click();
    await expect(page.locator('.detail-media video')).toHaveCount(1);
    expect(gifs).toEqual([]);
  });
});

test.describe('layout', () => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of pageTypes) {
        await page.goto(path);
        await noHorizontalOverflow(page);
      }
    });
  }

  test('mobile menu opens, closes with Escape and returns focus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav).toBeHidden();
    const btn = page.getByRole('button', { name: 'Menu' });
    await btn.click();
    await expect(nav).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(btn).toBeFocused();
  });

  test('theme toggle switches and persists', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('');
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  });
});

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`no violations on any page type — ${scheme}`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'axe runs once, in Chromium');
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      for (const path of [...pageTypes, 'does-not-exist/']) {
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations.map((v) => `${path}: ${v.id} — ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)).toEqual([]);
      }
    });
  }

  test('quick view dialog has no violations', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'axe runs once, in Chromium');
    await page.goto('projects/');
    await page.locator('article[data-project="project-1"] button[data-qv-open]').click();
    const results = await new AxeBuilder({ page }).include('dialog').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});
