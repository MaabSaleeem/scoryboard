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

// --- collection 14: the fixture schedule ------------------------------------

/**
 * Look collection 14's fixtures up by title.
 *
 * Never hardcode an id: `scripts/seed-14.mjs` can legitimately recreate a
 * tournament, and a hardcoded id would then point at a deleted row.
 */
export async function fixtures14() {
  const email = personaEmail('organiser', '14');
  const session = await mintSession(email);
  const token: string = session.idToken;
  const list = (await asUser(token, '/tournaments')).body.data ?? [];
  const byTitle = (t: string) => {
    const row = list.find((x: any) => x.title === t);
    if (!row) throw new Error(`Fixture tournament "${t}" is missing. Run: node scripts/seed-14.mjs`);
    return String(row._id ?? row.id);
  };
  return {
    email,
    token,
    cup: byTitle('KB 14 Cup'),
    league: byTitle('KB 14 League'),
    padelCup: byTitle('KB 14 Padel Cup'),
    padelOpen: byTitle('KB 14 Padel Open'),
    clashCup: byTitle('KB 14 Clash Cup'),
    padelClash: byTitle('KB 14 Padel Clash'),
    detail: async (id: string) => (await asUser(token, `/tournaments/${id}`)).body.data,
  };
}

/**
 * Wait for the Schedule tab to have finished loading.
 *
 * The tab paints its phase tabs, its EXPORT FIXTURES button and each group's
 * header - including SELECT MATCH TO UPDATE - before the fixture cards arrive.
 * A capture taken as soon as the group header is readable therefore catches an
 * empty card. Gate on a fixture's own status chip instead, the same reasoning as
 * `fixturesReady()` on the Results tab.
 *
 * `Incomplete` is included because a knockout fixture, and any fixture with an
 * empty spot, never reads `Scheduled`.
 */
export async function scheduleReady(page: Page) {
  // `.first()` goes on the OUTSIDE of the or: a schedule can hold both chips at
  // once - KB 14 Clash Cup has a Scheduled group and an Incomplete one - and an
  // or of two single locators then resolves to two elements and fails strictly.
  await expect(
    onScreen(page.getByText('Scheduled', { exact: true }))
      .or(onScreen(page.getByText('Incomplete', { exact: true })))
      .first(),
  ).toBeVisible();
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
}

/**
 * One group's or bracket's card on the Schedule tab.
 *
 * Pass the name as the DOM holds it - `Group A`, `Bracket C`. The tab renders it
 * upper case, but that is a CSS text-transform: the accessible name is still the
 * original casing, so `GROUP A` matches nothing.
 *
 * The card has no id, role or test id, and only a group's name is a real
 * heading - a bracket's is a bare span. So the card is reached from the name
 * text and the result is asserted to contain it, which fails loudly here rather
 * than producing a screenshot of the wrong element.
 */
export async function scheduleCard(page: Page, name: string) {
  const label = onScreen(page.getByText(name, { exact: true })).first();
  // A group's card and a bracket's card are different components and round
  // their corners differently - `rounded-[12px]` against `rounded-xl` - so both
  // are accepted rather than writing two nearly identical helpers.
  const card = label.locator(
    'xpath=ancestor::div[contains(@class,"rounded-[12px]") or contains(@class,"rounded-xl")][1]',
  );
  await expect(card.getByText(name, { exact: true }).first()).toBeVisible();
  return card;
}

/**
 * The header strip of a group's or bracket's card: its name, SELECT MATCH TO
 * UPDATE and BULK MATCH UPDATE.
 *
 * Worth having its own locator because the card itself is several screens tall
 * on an eight-team group, and three articles want a shot of just these controls.
 *
 * The buttons render upper case through CSS, so their accessible names are the
 * original casing - "Bulk Match Update", not "BULK MATCH UPDATE".
 */
export async function scheduleCardHeader(page: Page, name: string) {
  const label = onScreen(page.getByText(name, { exact: true })).first();
  const header = label.locator('xpath=ancestor::div[contains(@class,"border-b")][1]');
  await expect(header.getByRole('button', { name: 'Bulk Match Update', exact: true })).toBeVisible();
  return header;
}

/**
 * One fixture's card, found by a team or pair name it shows.
 *
 * Same handle as collection 13's `matchCard`: the nearest ancestor carrying
 * Tailwind's `group` marker class, which is the only stable hook on it.
 */
export async function fixtureCard(page: Page, teamName: string) {
  const card = onScreen(page.getByText(teamName, { exact: true })).first()
    .locator('xpath=ancestor::div[contains(concat(" ", @class, " "), " group ")][1]');
  await expect(card.getByText(teamName, { exact: true })).toBeVisible();
  return card;
}

/**
 * Pick a time in the app's three-column time picker.
 *
 * The picker is hours 01-12, a colon, minutes 00-59 and AM/PM, all rendered as
 * plain divs rather than options - so "09" is ambiguous between the hour column
 * and the minute column and has to be addressed per column. The columns are the
 * children of the picker's own flex row; index 0 is hours, 2 is minutes, 4 is
 * AM/PM (1 is the colon and 3 is a spacer).
 *
 * `trigger` is the button that opens it - "Select time" in the bulk dialog, or a
 * fixture card's own time.
 */
export async function pickTime(
  page: Page, trigger: Locator, hour: string, minute: string, meridiem: 'AM' | 'PM',
) {
  await trigger.click();
  const popper = onScreen(page.locator('[data-radix-popper-content-wrapper]')).first();
  const columns = popper.locator('div.flex.items-start.justify-center > div');
  await expect(columns).toHaveCount(5);
  await columns.nth(0).getByText(hour, { exact: true }).click();
  await columns.nth(2).getByText(minute, { exact: true }).click();
  await popper.getByText(meridiem, { exact: true }).click();
}

/**
 * Pick a date in the app's month calendar.
 *
 * The calendar opens on the current month, which is why any spec that uses it
 * must freeze the clock first - otherwise `monthsForward` lands somewhere else
 * next month. The two non-numeric buttons in the calendar are its previous and
 * next month arrows; neither carries an accessible name.
 */
export async function pickDate(page: Page, trigger: Locator, monthsForward: number, day: string) {
  await trigger.click();
  const popper = onScreen(page.locator('[data-radix-popper-content-wrapper]')).first();
  const nextMonth = popper.locator('button').filter({ hasNotText: /^\d+$/ }).last();
  for (let i = 0; i < monthsForward; i += 1) {
    await nextMonth.click();
  }
  await popper.getByText(day, { exact: true }).click();
}

/**
 * The Bulk Match Updates dialog, opened from one group's or bracket's card.
 *
 * `BULK MATCH UPDATE` and `SELECT MATCH TO UPDATE` open the SAME dialog. The
 * difference is what it is addressed to: the bulk button sends no match ids and
 * updates every fixture in the group, the selection flow sends the ticked ones.
 */
export async function openBulkDialog(page: Page, card: Locator) {
  await card.getByRole('button', { name: 'Bulk Match Update', exact: true }).click();
  const dialog = openDialog(page);
  await expect(dialog.getByText('Bulk Match Updates', { exact: true })).toBeVisible();
  return dialog;
}

/**
 * Untick "Same start time per round", which is what makes Duration and Time
 * between matches editable.
 *
 * They are disabled while the box is ticked - `disabled: isSubmitting ||
 * watch("sameStartTimePerRound")` in the bundle - and the box defaults to
 * ticked. That is the whole subject of 14.3 and the cause 14.6 explains, so the
 * assertions here are deliberately loud: if the default ever changes, every one
 * of those articles is wrong and this fails first.
 */
export async function untickSameStartTime(dialog: Locator) {
  const box = dialog.locator('[role="checkbox"]').first();
  await expect(box).toHaveAttribute('data-state', 'checked');
  await expect(dialog.locator('input[name="timeBetweenMatches"]')).toBeDisabled();
  await box.click();
  await expect(box).toHaveAttribute('data-state', 'unchecked');
  await expect(dialog.locator('input[name="timeBetweenMatches"]')).toBeEnabled();
  return box;
}

// Re-exported so a spec that changes a schedule can put it back with exactly the
// values scripts/seed-14.mjs uses. See lib/fixtures-14.mjs for why they live in
// one place.
// @ts-ignore - plain JS module, no types
export { LEAGUE_SCHEDULE, PADEL_CONFIG, restoreGroupSchedule, regeneratePadelSchedule } from './fixtures-14.mjs';

// --- collection 01: getting started and onboarding --------------------------

// @ts-ignore - plain JS module, no types
import { firebaseSignUp, firebaseSetPassword, deleteAccount } from './api.mjs';
// @ts-ignore - plain JS module, no types
import { ACCOUNTS as KB01, PASSWORD as KB01_PASSWORD, PERSONAL_INFO as KB01_INFO, INVITE as KB01_INVITE } from './fixtures-01.mjs';
// @ts-ignore - plain JS module, no types
import { verificationCode, passwordResetLink, firstLink, emptyInbox } from './mail.mjs';

export { KB01, KB01_PASSWORD, KB01_INFO, KB01_INVITE, firebaseSignUp, firebaseSetPassword, deleteAccount };
export { verificationCode, passwordResetLink, firstLink, emptyInbox };

/**
 * Stop the home page's promotional campaign from reaching the browser.
 *
 * `GET /promo-campaigns/active?screen=Home` returns whatever campaign is
 * running - "Summer competition" today, something else next month - and it
 * renders as a full-width banner that pushes the page down. It is not part of
 * any collection-01 screen, and collection 02.5 is the article about it.
 *
 * Blocked rather than dismissed: the dismiss control writes the dismissal to
 * the account, which would make the first run of a spec differ from the second.
 *
 * Call before the first navigation - a route added after the fetch has gone out
 * does nothing.
 */
export async function blockPromos(page: Page) {
  await page.route('**/promo-campaigns/active**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'OK', data: null }),
    }),
  );
}

/**
 * Sign in the way the article tells the reader to: the form, with a password.
 *
 * Not signInAs(), which uses a minted token. Two reasons. The password path is
 * what 01.2 documents. And the token path leaves Firebase's `providerData`
 * empty, which makes Profile settings replace Change Password with "You signed
 * in with Unknown" - a screen no reader ever sees.
 */
export async function signInWithPassword(page: Page, email: string, to?: string) {
  if (!KB01_PASSWORD) throw new Error('KB01_PASSWORD missing from .env - see .env.example');
  await page.goto('/signin');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(KB01_PASSWORD as string);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/signin'), { timeout: 40_000 });

  // Prove the session on the home page, then go wherever the spec asked. The
  // wizard screens - Create Leaderboard, Set up your team - render without the
  // sidebar, so the session cannot be proved on them.
  await page.goto('/');
  await expect(page.locator('a[href="/teams"]').first()).toBeVisible();
  if (to && to !== '/') await page.goto(to);
}

/**
 * Everything collection 01 needs off-screen before a capture.
 *
 * quiet() covers the messenger and the animations; this adds the two things
 * that are specific to these screens. The TRENDING feed on the home page is
 * global activity - other people's teams and other collections' tournaments -
 * so no capture may include it (docs/style-guide.md: never another persona's
 * data). It is hidden rather than masked, because a black block the height of
 * the page is not a screenshot anybody can read.
 */
export async function quiet01(page: Page) {
  await quiet(page);
  await page.addStyleTag({
    content: `
      [class*="promo"], #kb-trending-hidden { display: none !important; }
    `,
  });
  const trending = page.getByText('TRENDING', { exact: true });
  if (await trending.count()) {
    await trending.first().evaluate((el) => {
      const panel = el.closest('div');
      if (panel) (panel as HTMLElement).style.visibility = 'hidden';
    });
  }
}

/** The fresh persona's Scoryboard user, with a token, looked up by address. */
export async function fresh01() {
  const session = await mintSession(KB01.fresh);
  const token: string = session.idToken;
  const me = (await asUser(token, '/users/me')).body?.data;
  if (!me?.playerId) {
    throw new Error(`${KB01.fresh} is not seeded. Run: node scripts/seed-01.mjs`);
  }
  return { email: KB01.fresh as string, token, me };
}

/**
 * Put the fresh persona back the way scripts/seed-01.mjs leaves it.
 *
 * 01.5 creates a team and a leaderboard on purpose, and a Free account may hold
 * exactly one leaderboard - so a run that did not clean up would make the next
 * one open "Leaderboard Limit Reached" instead of the create form. Called at the
 * START of that spec as well as the end, because the state a crashed run leaves
 * behind is exactly what has to be cleared.
 *
 * Only touches names beginning "KB 01". The two teams the account was born with
 * are not ours to delete.
 */
export async function restoreFresh01(token: string) {
  const teams = (await asUser(token, '/teams?all=true')).body?.data ?? [];
  for (const t of teams.filter((x: any) => x.name.startsWith('KB 01'))) {
    await asUser(token, `/teams/${t.teamId}`, { method: 'DELETE' });
  }
  const boards = (await asUser(token, '/leaderboards')).body?.data ?? [];
  for (const l of boards) {
    await asUser(token, `/leaderboards/${l.id}`, { method: 'DELETE' });
  }
}

/**
 * Recreate the account 01.7 deletes.
 *
 * POST /admins/users on purpose: 01.7 photographs the delete panel, its confirm
 * dialog and the signed-out screen that follows, and none of those show the
 * profile fields that make an admin-created account differ from a reader's.
 * Rebuilding it the real way would put an inbox read inside a capture spec.
 */
export async function recreateDoomed01() {
  const r = await admin('/admins/users', {
    method: 'POST',
    body: { name: 'Dee', lastName: 'KB', email: KB01.doomed },
  });
  // 409 "User with this email already exists" is the normal answer when the
  // account is still there - which it is at the start of the run, before the
  // spec deletes it. Only a real failure should stop the spec.
  if (!r.ok && r.status !== 409) {
    throw new Error(`Could not rebuild ${KB01.doomed}: ${r.status} ${JSON.stringify(r.body)}`);
  }
  return r;
}

/**
 * Fill the wizard's Personal information step.
 *
 * Every control on it is a Radix combobox with a hidden <select> beside it, so
 * the option has to be picked from the open list rather than set on the select.
 * Sports is a multi-select and stays open after a choice - hence the Escape.
 */
export async function fillPersonalInfo(
  page: Page,
  info: { name: string; lastName: string; gender: string; sports: string[]; position: string },
) {
  await page.locator('input[name="name"]').fill(info.name);
  await page.locator('input[name="lastName"]').fill(info.lastName);
  await pickFromList(page, 'Gender *', info.gender);
  for (const sport of info.sports) await pickFromList(page, 'Sports *', sport);
  await page.keyboard.press('Escape');
  await pickFromList(page, 'Preferred position *', info.position);
}

/** Open the combobox that follows `label` and choose `value` from it. */
export async function pickFromList(page: Page, label: string, value: string) {
  await page.locator('label', { hasText: label }).locator('xpath=following-sibling::button[1]').click();
  await page.getByRole('option', { name: value, exact: true }).click();
}

/**
 * The countdown on the verification screen.
 *
 * It reads "Didn't receive an email? 00:57" and ticks every second, so it is
 * masked in every capture that includes it. Once it reaches zero the digits are
 * replaced by a Resend link, which is stable and is not masked.
 */
export function resendCountdown(page: Page) {
  return page.getByText(/^\d\d:\d\d$/).first();
}

/**
 * The bordered card the signed-out and wizard screens are drawn inside.
 *
 * Personal information and Create Leaderboard are both taller than the 900px
 * viewport, and a full-page capture of either comes out wrong: the app's header
 * is `position: sticky`, so Playwright stitches it into the MIDDLE of the image,
 * on top of the First name field. Clipping to the card avoids the stitch
 * entirely and frames the step rather than the browser.
 *
 * The card is the only element on these screens with a rounded 20px border, and
 * it is asserted to contain the heading so a DOM change fails here rather than
 * producing a screenshot of the wrong box.
 */
export async function authCard(page: Page, heading: string) {
  // Matched on the class attribute rather than as a CSS class: Tailwind's
  // arbitrary-value classes carry brackets, and `div.rounded-\[20px\]` needs
  // escaping that does not survive a JavaScript string. Collection 14 reaches
  // its schedule cards the same way.
  const card = page.locator('div[class*="rounded-[20px]"]').first();
  await expect(card.getByText(heading, { exact: true }).first()).toBeVisible();
  return card;
}

/**
 * Stop the app's header floating over a clipped capture.
 *
 * The header is `position: sticky`, so on any screen taller than the viewport it
 * paints itself over whatever is scrolled underneath - including the top of the
 * card a clipped capture is aimed at. The first run of 01.1 lost the "Step 1"
 * label to it.
 *
 * Sticky elements already occupy their space in normal flow, so switching to
 * static moves nothing. Call it after quiet01(), before a tall capture.
 */
export async function unstickHeader(page: Page) {
  await page.addStyleTag({ content: 'header { position: static !important; }' });
}

/**
 * The profile header at the top of the home page: banner, avatar, name,
 * position and the Followers / Following / Leaderboard / Views counters.
 *
 * Two articles want a picture of "you are signed in", and the home page below
 * this block carries a TRENDING feed of everybody else's activity - other
 * people's teams, other collections' tournaments - which no capture may show.
 * Clipping here is simpler and safer than masking a column.
 *
 * Reached from the Followers counter, because the block itself has no id, role
 * or heading. The result is asserted to hold the counter, so a DOM change fails
 * here rather than producing a screenshot of the wrong box.
 */
export async function profileHeader(page: Page) {
  const counter = onScreen(page.getByText('Followers', { exact: true })).first();
  const header = counter.locator(
    'xpath=ancestor::div[contains(@class,"bg-white") and contains(@class,"border-b")][1]',
  );
  await expect(header.getByText('Followers', { exact: true }).first()).toBeVisible();
  return header;
}

/**
 * "Joined Since August 2026" in the profile header.
 *
 * The account's own join date, so it does not drift between runs - but it does
 * change whenever the seed has to rebuild the persona, and it is not what either
 * capture that includes it is about. docs/style-guide.md: mask absolute dates
 * that are not the point of the screenshot.
 */
export function joinedSince(page: Page) {
  return onScreen(page.getByText(/^Joined Since /)).first();
}

/**
 * The block at the top of the sidebar: your name and address, Edit User Profile
 * with its "Complete your profile (n)" warning, and Sign out.
 *
 * Collapsed until you select your name, which is step 1 of 01.6. Reached from
 * the warning line, because that is the only text in the block that appears
 * nowhere else - "Edit User Profile" is also the page heading of Profile
 * settings, and matching it picks the heading first.
 */
export async function sidebarUserBlock(page: Page) {
  const warning = onScreen(page.getByText(/^Complete your profile \(/)).first();
  await expect(warning).toBeVisible();
  const block = warning.locator('xpath=ancestor::div[contains(@class,"border-y")][1]');
  await expect(block.getByText('Sign out', { exact: true })).toBeVisible();
  return block;
}

/** The "Complete your profile (n)" line itself, for the annotation. */
export function profileChecklistLine(page: Page) {
  return onScreen(page.getByText(/^Complete your profile \(/)).first();
}

/**
 * One labelled row of Profile settings - "Personal Details", "My Bio",
 * "Change Password" - as a clip: the label column on the left and its fields on
 * the right.
 *
 * The page is 2800px tall and nothing on it has an id, so each row is reached
 * from its own heading. The result is asserted to still contain that heading.
 */
export async function settingsRow(page: Page, label: string) {
  const heading = onScreen(page.getByText(label, { exact: true })).first();
  const row = heading.locator('xpath=ancestor::div[contains(@class,"lg:flex-row")][1]');
  await expect(row.getByText(label, { exact: true }).first()).toBeVisible();
  return row;
}

/**
 * "Created on 28/08/2026" on a leaderboard card.
 *
 * Today's date, so it differs on every run. Masked wherever it appears - the
 * card's subject is the leaderboard, not the day it was made.
 */
export function createdOn(page: Page) {
  return onScreen(page.getByText(/^Created on /)).first();
}

/**
 * Build an account in the state a reader is in the moment their email is
 * verified: verified, with a password, with Step 1's fields filled in, and with
 * no leaderboard.
 *
 * This is scripts/seed-01.mjs's own recipe, in a form a spec can call. 01.4
 * needs it because the wizard cannot be walked end to end in one pass: Step 1
 * and the code screen are only visible on an account that has never been
 * verified, and Create Leaderboard and Step 3 only open once it has. Nothing
 * returns the six-digit code over the API, and the inbox is not something a
 * capture may depend on - so the spec photographs the first half on a real
 * signup, then rebuilds the same address on the far side of verification and
 * photographs the rest.
 *
 * Deletes whatever is at the address first, so it is safe to call at any point.
 */
export async function rebuildVerified01(
  email: string,
  info: { name: string; lastName: string; gender: string; sports: string[]; position: string },
) {
  await deleteAccount(email, KB01_PASSWORD);

  const made = await admin('/admins/users', {
    method: 'POST', body: { name: info.name, lastName: info.lastName, email },
  });
  if (!made.ok) throw new Error(`POST /admins/users ${email}: ${JSON.stringify(made.body)}`);

  let session = await mintSession(email);
  // A password change revokes every token Firebase has issued, so the session
  // has to be minted again afterwards.
  const set = await firebaseSetPassword(session.idToken, KB01_PASSWORD);
  if (!set.ok) throw new Error(`accounts:update ${email}: ${JSON.stringify(set.body)}`);
  session = await mintSession(email);

  const me = (await asUser(session.idToken, '/users/me')).body?.data;
  await asUser(session.idToken, `/users/${me.id}`, {
    method: 'PUT',
    body: {
      name: info.name,
      lastName: info.lastName,
      gender: info.gender,
      sports: info.sports,
      position: info.position,
      isMarketingOpted: false,
    },
  });

  // POST /admins/users makes "<Name>'s leaderboard". A reader who has just
  // verified their email has none, and Create Leaderboard is the next screen
  // they see - so it has to go.
  for (const board of (await asUser(session.idToken, '/leaderboards')).body?.data ?? []) {
    await asUser(session.idToken, `/leaderboards/${board.id}`, { method: 'DELETE' });
  }
  return { token: session.idToken as string, me };
}
