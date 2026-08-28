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

// Collection 12's accounts. `organiser` is unsuffixed because this collection was
// captured before accounts were isolated per collection, and its 80 published
// screenshots come from that account - see account_isolation in
// config/personas.yaml. Every later collection uses personaEmail() below.
export const PERSONAS = {
  organiser: 'kb-organiser@yopmail.com',
  admin: 'kb-12-admin@yopmail.com',
  outsider: 'kb-12-outsider@yopmail.com',
} as const;

/**
 * The account address for a persona role inside one collection.
 *
 * One account per role per collection: a collection seeds only into its own
 * accounts. Sharing an account across collections is what stopped six of
 * collection 12's specs from running - a sibling seeded two tournaments and every
 * spec that had photographed the list went stale.
 *
 * Collection 12 keeps the unsuffixed address it was captured from.
 */
export function personaEmail(role: string, collection: string): string {
  if (collection === '12' && role === 'organiser') return PERSONAS.organiser;
  return `kb-${role}-${collection}@yopmail.com`;
}

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
// The tournament list renders "Your Tournaments (0)" with a row of grey skeleton
// cards before its fetch lands, so the heading alone is not a safe gate for a
// capture.
//
// Do NOT gate on the count. It is global state for the persona: every collection
// that seeds a tournament for this organiser changes it. Six of collection 12's
// specs waited for "Your Tournaments (2)" and stopped running the day the padel
// fixtures took it to four. Wait for cards that are always present instead, which
// proves the fetch landed without caring how many other tournaments exist.
// Takes the titles so a later collection can name its own fixtures rather than
// copy this with different strings baked in.
export async function tournamentListReady(
  page: Page,
  titles: string[] = ['KB Cup', 'KB New Cup'],
) {
  for (const title of titles) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }
}

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

/**
 * Freeze the wall clock.
 *
 * docs/style-guide.md: "Freeze the clock where the screen shows a date or a
 * countdown ... a calendar's today marker will otherwise differ every run." The
 * Create Tournament modal defaults its start date to today and its date picker
 * greys out everything before today, so any spec that captures either needs this.
 *
 * setFixedTime, not install: it pins Date.now() without replacing the timers
 * Firebase uses to refresh the session, so a frozen clock cannot sign the spec
 * out mid-run. Call it after signIn, never before - the token exchange needs a
 * real clock.
 */
export const FROZEN_NOW = new Date('2026-08-28T09:00:00.000Z');

export async function freezeClock(page: Page) {
  await page.clock.setFixedTime(FROZEN_NOW);
}

/**
 * Scroll `target` to the middle of the viewport.
 *
 * scrollIntoViewIfNeeded only moves an element just far enough to be technically
 * in view, which on these pages leaves it flush against the bottom edge with its
 * annotation outline half cut off. Centring gives the capture room around the
 * subject.
 *
 * Call it before opening a popover, never after: the popovers here are portalled
 * and positioned once, so scrolling the page underneath them leaves them
 * pointing at the wrong place.
 */
export async function centre(target: Locator) {
  await target.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
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
export async function annotate(page: Page, target: Locator, pad = 4) {
  const box = await target.boundingBox();
  if (!box) throw new Error('annotate(): target has no bounding box');
  await page.evaluate(
    ({ x, y, width, height, pad: p }) => {
      const el = document.createElement('div');
      el.id = 'kb-annotation';
      Object.assign(el.style, {
        position: 'absolute',
        left: `${x + window.scrollX - p}px`,
        top: `${y + window.scrollY - p}px`,
        width: `${width + p * 2}px`,
        height: `${height + p * 2}px`,
        border: '3px solid #E5202A',
        borderRadius: '4px',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: '2147483000',
      });
      document.body.appendChild(el);
    },
    { ...box, pad },
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
  /**
   * How far outside the annotated element to draw the outline. 4px by default.
   * Use a negative value when the target sits flush against the edge of a
   * clipped capture - a positive pad would put the outline outside the clip and
   * only its inner edge would survive.
   */
  annotatePad?: number;
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

  // Clipped captures only: put the page back to the top first.
  //
  // Playwright scrolls a clipped element into view itself, but where it lands
  // depends on where the page was scrolled to when the capture started - and
  // that varies with what the spec did beforehand. A fractional difference in
  // the element's device-pixel alignment re-renders every glyph's antialiasing,
  // which is enough to change the file's content hash and therefore its URL.
  // Measured at 1.5% of pixels on the padel bracket board.
  if (opts.clip) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => window.scrollY === 0);
  }

  if (opts.annotate) await annotate(page, opts.annotate, opts.annotatePad);
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
    padelCup: byTitle('KB Padel Cup'),
    newPadelCup: byTitle('KB New Padel Cup'),
    detail: async (id: string) => (await asUser(token, `/tournaments/${id}`)).body.data,
  };
}

// --- collection 13 and later: sign in by address, not by a hardcoded key -----

/**
 * Sign a persona in by email address and land on `path`.
 *
 * `signIn` above takes a key from collection 12's PERSONAS map. Every later
 * collection addresses its own accounts with personaEmail(role, collection), so
 * this variant takes the address itself. Same flow otherwise: a freshly minted
 * signin URL, never a pasted token.
 */
export async function signInAs(page: Page, email: string, to = '/tournaments') {
  const url: string = await signinUrl(email);
  await page.goto(url);
  await page.waitForURL((u) => !u.pathname.startsWith('/signin'), { timeout: 30_000 });
  await page.goto(to);
  await expect(page.locator('a[href="/tournaments"]').first()).toBeVisible();
}

/**
 * Look collection 13's fixtures up by title.
 *
 * Never hardcode an id: `scripts/seed-13.mjs` can legitimately recreate a
 * tournament, and a hardcoded id would then point at a deleted row.
 */
export async function fixtures13() {
  const email = personaEmail('organiser', '13');
  const session = await mintSession(email);
  const token: string = session.idToken;
  const list = (await asUser(token, '/tournaments')).body.data ?? [];
  const byTitle = (t: string) => {
    const row = list.find((x: any) => x.title === t);
    if (!row) throw new Error(`Fixture tournament "${t}" is missing. Run: node scripts/seed-13.mjs`);
    return String(row._id ?? row.id);
  };
  return {
    email,
    token,
    cup: byTitle('KB 13 Cup'),
    summerCup: byTitle('KB 13 Summer Cup'),
    league: byTitle('KB 13 League'),
    sundayLeague: byTitle('KB 13 Sunday League'),
    padelCup: byTitle('KB 13 Padel Cup'),
    padelOpen: byTitle('KB 13 Padel Open'),
    detail: async (id: string) => (await asUser(token, `/tournaments/${id}`)).body.data,
  };
}

/**
 * Wait for the tournament board to have finished loading.
 *
 * The Format and Results tabs render their chrome - header, tab strip - before
 * the fetch lands, so the tab strip alone is not a safe gate for a capture.
 * Wait for something only the loaded board has.
 */
export async function boardReady(page: Page, marker: Locator) {
  await expect(marker).toBeVisible();
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
}

/** The dialog that is actually on screen. Radix leaves closed ones mounted. */
export function openDialog(page: Page) {
  return onScreen(page.locator('[role="dialog"]')).first();
}

/** Close whatever dialog is open, without confirming anything. */
export async function cancelDialog(page: Page) {
  const dlg = openDialog(page);
  const cancel = dlg.getByRole('button', { name: 'Cancel', exact: true });
  if (await cancel.count()) await cancel.first().click();
  else await dlg.getByRole('button', { name: 'Close' }).first().click();
  await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
}

/**
 * One phase's card on the Format board.
 *
 * The board gives each card `id="phase-card-<phaseId>"`, which is the only
 * stable hook on it - the headings are plain text and the cards are otherwise
 * unlabelled divs. Take the phase id from GET /tournaments/:id, never from the
 * order the cards happen to render in.
 */
export function phaseCard(page: Page, phaseId: string) {
  return page.locator(`#phase-card-${phaseId}`);
}

/**
 * The Phases board on the Format tab: the heading, the "+ Phase" button and
 * every phase card.
 *
 * Clipped rather than captured as a viewport, because the board is taller than
 * 900px on an eight-team tournament and a viewport shot cuts the second group
 * off. There is no id or role on the wrapper, so it is reached from the one
 * element that does have an id - a phase card - and the result is asserted to
 * contain the heading, which fails loudly if the DOM moves.
 */
export async function phasesBoard(page: Page, anyPhaseId: string) {
  const board = phaseCard(page, anyPhaseId).locator('xpath=ancestor::div[4]');
  await expect(board.getByText('Phases', { exact: true })).toBeVisible();
  return board;
}

/**
 * Text on the Format board, narrowed to the copy that is on screen.
 *
 * Every card on this board is rendered twice - a wide layout and a mobile one -
 * and the mobile copy comes first in the DOM with a zero-sized box. A plain
 * getByText is therefore both ambiguous and, with .first(), usually the
 * invisible one.
 */
export function boardText(page: Page, text: string) {
  return onScreen(page.getByText(text, { exact: true })).first();
}

/**
 * The card for one bracket match, by its title.
 *
 * The card is the nearest ancestor carrying Tailwind's `group` marker class -
 * the only stable handle on it, since the card has no id, role or test id. The
 * result is asserted to contain the title, so a DOM change fails here rather
 * than producing a screenshot of the wrong element.
 */
export async function matchCard(page: Page, title: string) {
  const card = boardText(page, title)
    .locator('xpath=ancestor::div[contains(concat(" ", @class, " "), " group ")][1]');
  await expect(card.getByText(title, { exact: true })).toBeVisible();
  return card;
}

/**
 * Scroll `target` to just below the top of the viewport.
 *
 * centre() is right for most captures, but a control that opens a tall popover
 * downwards needs the room below it: the position menu on a bracket slot is
 * nine items and gets cut off when its trigger sits mid-screen. Like centre(),
 * call this before opening the popover, never after.
 */
export async function alignTop(target: Locator) {
  await target.evaluate((el) => {
    el.scrollIntoView({ block: 'start', behavior: 'instant' });
    window.scrollBy(0, -140);
  });
}

/**
 * Wait for the fixtures list under a standings table to have rendered.
 *
 * The Results tab paints its table and the FIXTURES heading before the match
 * cards arrive, so a capture taken as soon as the table is readable catches a
 * half-built list in the bottom third of the frame. That was three screenshots
 * differing between two runs of the collection-13 suite.
 *
 * Gate on a card's own status chip, not on the FIXTURES heading: the heading is
 * there before the list has anything in it.
 */
export async function fixturesReady(page: Page) {
  await expect(
    onScreen(page.getByText('Ended', { exact: true })).first()
      .or(onScreen(page.getByText('Scheduled', { exact: true })).first()),
  ).toBeVisible();
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
}
