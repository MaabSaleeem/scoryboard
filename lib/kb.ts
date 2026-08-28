// Helpers the collection 12 specs share.
//
// Three jobs: sign a persona in, put the page into a state that captures the
// same way every run, and take the screenshot the brief asked for.
//
// Nothing here reads a clock, invents a name, or waits on a duration. If you are
// tempted to add something that does, it belongs in the spec as a seeded fixture
// instead.

import { expect, type Page, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// lib/api.mjs is the one implementation of the API client; scripts/ run it under
// plain node, specs bundle it through Playwright's esbuild.
// @ts-ignore - plain JS module, no types
import { admin, asUser, mintSession, signinUrl, API, APP } from './api.mjs';

export { admin, asUser, mintSession, signinUrl, API, APP };

export const PERSONAS = {
  organiser: 'kb-organiser@yopmail.com',
  admin: 'kb-12-admin@yopmail.com',
  outsider: 'kb-12-outsider@yopmail.com',
} as const;

export type PersonaKey = keyof typeof PERSONAS;

/**
 * Sign a persona in and land on `path`.
 *
 * The session comes from a freshly minted signin URL, never a pasted token. The
 * URL is single-use per run and expires, which is why it is minted inside the
 * spec rather than stored.
 */
export async function signIn(page: Page, persona: PersonaKey, to = '/tournaments') {
  const url: string = await signinUrl(PERSONAS[persona]);
  await page.goto(url);

  // The app exchanges the token and then routes wherever it likes: the home
  // feed, a "Join a team" interstitial, or a leaderboard prompt, depending on
  // what the account has. Wait for the token to be spent - the /signin path is
  // gone - rather than for any one landing screen.
  await page.waitForURL((u) => !u.pathname.startsWith('/signin'), { timeout: 30_000 });

  // That landing screen can be a bare interstitial with no sidebar, so do not
  // assert anything on it. Go where the spec asked and prove the session there:
  // the sidebar links carry an icon and a label, so match the href rather than
  // an accessible name.
  await page.goto(to);
  await expect(page.locator('a[href="/tournaments"]').first()).toBeVisible();
}

/**
 * Everything that must be off-screen before any capture.
 *
 * The Intercom messenger, the Stripe helper frames and any promo campaign all
 * float over the page and all of them change between runs. Hiding them in the
 * page (rather than masking them) keeps the layout identical.
 */
export async function quiet(page: Page) {
  await page.addStyleTag({
    content: `
      #intercom-container, .intercom-lightweight-app, #intercom-frame,
      iframe[name^="__privateStripe"], #stripeDataLayerFrame,
      [data-testid="promo-campaign"], [role="status"], [aria-live="polite"] {
        display: none !important;
      }
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
  await expect(page.locator('#intercom-container')).toBeHidden();
}

/** Wait for a tournament board tab to be the selected one. */
export async function openBoardTab(page: Page, tab: string) {
  await page.getByRole('button', { name: tab, exact: true }).click();
  await expect(page.getByRole('button', { name: tab, exact: true })).toHaveAttribute(
    'data-state', 'active',
  );
}

/**
 * Draw the one annotation the style guide allows: a 3px #E5202A outline with a
 * 4px radius, no fill, around `target`. Drawn in the page before the capture, so
 * a re-run reproduces it exactly.
 */
export async function annotate(page: Page, target: Locator) {
  const box = await target.boundingBox();
  if (!box) throw new Error('annotate(): target has no bounding box');
  await page.evaluate(
    ({ x, y, width, height }) => {
      const el = document.createElement('div');
      el.id = 'kb-annotation';
      Object.assign(el.style, {
        position: 'absolute',
        left: `${x + window.scrollX - 4}px`,
        top: `${y + window.scrollY - 4}px`,
        width: `${width + 8}px`,
        height: `${height + 8}px`,
        border: '3px solid #E5202A',
        borderRadius: '4px',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: '2147483000',
      });
      document.body.appendChild(el);
    },
    box,
  );
}

export async function clearAnnotation(page: Page) {
  await page.evaluate(() => document.getElementById('kb-annotation')?.remove());
}

export type ShotOptions = {
  /** Clip to this element instead of capturing the whole page. */
  clip?: Locator;
  /** Elements to paint over. Dynamic data only - never the article's subject. */
  mask?: Locator[];
  /** Draw the red outline around this element. */
  annotate?: Locator;
};

/**
 * Block until every image on the page has actually painted.
 *
 * Playwright's screenshot does not wait for images, and the tournament header is
 * a remote photo. Capture too early and you get a black banner - which is what
 * made eight of these screenshots differ between two runs of the same spec.
 * Covers both <img> elements and CSS background images.
 */
export async function imagesPainted(page: Page) {
  await page.waitForFunction(() => {
    const imgs = Array.from(document.images);
    if (!imgs.every((i) => i.complete && i.naturalWidth > 0)) return false;

    const urls = new Set<string>();
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') continue;
      for (const m of bg.matchAll(/url\("?(.*?)"?\)/g)) urls.add(m[1]);
    }
    const w = window as unknown as { __kbBg?: Map<string, boolean> };
    w.__kbBg ??= new Map();
    let ready = true;
    for (const url of urls) {
      if (url.startsWith('data:')) continue;
      if (!w.__kbBg.has(url)) {
        w.__kbBg.set(url, false);
        const probe = new Image();
        probe.onload = () => w.__kbBg!.set(url, true);
        probe.onerror = () => w.__kbBg!.set(url, true);
        probe.src = url;
      }
      if (!w.__kbBg.get(url)) ready = false;
    }
    return ready;
  }, undefined, { timeout: 20_000 });
}

/**
 * Take one capture and write it to
 * `screenshots/<collection>/<article>/<nn>-<slug>.png`.
 *
 * Step 2 renames each file to carry its content hash. Step 1 writes the plain
 * name so a diff between runs is readable.
 */
export async function shot(
  page: Page,
  article: string,
  name: string,
  opts: ShotOptions = {},
) {
  const collection = article.split('.')[0];
  const dir = path.join('screenshots', collection, article);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.png`);

  await imagesPainted(page);
  if (opts.annotate) await annotate(page, opts.annotate);
  const common = {
    path: file,
    animations: 'disabled' as const,
    caret: 'hide' as const,
    mask: opts.mask ?? [],
    maskColor: '#1F2933',
  };
  if (opts.clip) await opts.clip.screenshot(common);
  else await page.screenshot({ ...common, fullPage: false });
  if (opts.annotate) await clearAnnotation(page);
  return file;
}

/**
 * Narrow a locator to the copy that is actually on screen.
 *
 * Several screens render a wide-layout and a narrow-layout copy of the same
 * control and give the unused one a zero-sized box. Both are in the DOM, so a
 * plain match is ambiguous and `.first()` can pick the invisible one.
 */
export function onScreen(l: Locator) {
  return l.locator('visible=true');
}

/** The signed-in user's name and avatar in the header. Masked in most captures. */
export function headerIdentity(page: Page) {
  return page.getByText('Oona KB', { exact: true });
}

/**
 * Look a collection 12 fixture up by name. Specs must never hardcode an id: the
 * seed can legitimately recreate a tournament, and a hardcoded id would then
 * point at a deleted row.
 */
export async function fixtures(persona: PersonaKey = 'organiser') {
  const session = await mintSession(PERSONAS[persona]);
  const token = session.idToken;
  const list = (await asUser(token, '/tournaments')).body.data ?? [];
  const byTitle = (t: string) => {
    const row = list.find((x: any) => x.title === t);
    if (!row) throw new Error(`Fixture tournament "${t}" is missing. Run: node scripts/seed-12.mjs`);
    return row._id ?? row.id;
  };
  return {
    token,
    cup: byTitle('KB Cup'),
    newCup: byTitle('KB New Cup'),
    detail: async (id: string) => (await asUser(token, `/tournaments/${id}`)).body.data,
  };
}
