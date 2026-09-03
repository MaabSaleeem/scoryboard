// 21.1 - Becoming a referee, and your referee profile
//
// Seven captures. Read `briefs/21.md`, "21.1", with this.
//
// --- Preconditions --------------------------------------------------------
//
// `node scripts/seed-21.mjs` must have run. It is the seed that makes Rae a
// referee at all, and it is the only thing that can: `isReferee` is set by
// `POST /tournaments/:id/referee` and by nothing else in the product.
//
// --- Capture order is NOT article order, on purpose ----------------------
//
// Shots 04 and 05 need the Referee Bio EMPTY and shots 06 and 07 need it
// filled, so the spec runs:
//
//   01 (organiser)  ->  clear the bio  ->  04, 05  ->  type  ->  06
//                   ->  save  ->  02, 03, 07
//
// The bio is cleared and restored over the API by this spec, not by the seed:
// docs/style-guide.md, "A spec that consumes or mutates a fixture puts it back
// itself" - every other spec in this collection expects the bio SET. The
// restore runs in `afterAll` so a failed capture still puts it back.
//
// --- One capture is the organiser's screen -------------------------------
//
// Shot 01 is the Add referee dialog on `/tournaments/:id/participants`. It is
// the only screen in the product that explains how a person becomes a referee,
// and no other brief in this project covers it. It is taken on the Single
// referee tab, because that is the only mode that can turn an existing account
// into a referee - see `lib/kb.ts`, `openAddRefereeDialog21`.

import { test, expect } from '@playwright/test';
import {
  KB21, KB21_NAMES, KB21_BIO, KB21_BIO_LIMIT,
  fixtures21, context21, tournament21, openAddRefereeDialog21,
  openRefereeProfile21, profileHero21, profileRoleSwitch, refereeRoleOption,
  playerRoleOption, selectRole21, refereeStatTiles21, myBioPanel21,
  refereeBioBlock21, refereeBioBox21, defaultProfileRow21, setRefereeBio21,
  openAccountBlock, settingsRow, shot, unionBox,
  clearUnionBox, onScreen, mintSession, settled10,
  type Fx21,
} from '../../lib/kb';

const ARTICLE = '21.1';

let fx: Fx21;

test.beforeAll(async () => { fx = await fixtures21(); });

// Put the bio back whatever happened. Every other spec here expects it set.
test.afterAll(async () => { if (fx) await setRefereeBio21(fx, KB21_BIO); });

test('01 - the organiser adds you by email', async ({ browser }) => {
  const organiser = await mintSession(KB21.organiser);
  const tournamentId = await tournament21(organiser.idToken);
  const { ctx, page } = await context21(browser, KB21.organiser, '/tournaments');

  const dialog = await openAddRefereeDialog21(page, tournamentId);
  await expect(dialog.getByPlaceholder('Enter first name')).toBeVisible();
  await expect(dialog.getByPlaceholder('Enter last name')).toBeVisible();
  await expect(dialog.getByText('Save for future tournaments', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Allow referee to start and end matches', { exact: true })).toBeVisible();

  // clipPad frames the dialog with a margin of the dimmed page behind it.
  // Without it a clip that hugs the rounded corners catches a sliver of the
  // dim in each one, which reads as a smudge - collection 04's six gates.
  await shot(page, ARTICLE, '01-add-referee-dialog', {
    clip: dialog,
    clipPad: 12,
    annotate: dialog.getByPlaceholder('Enter email address'),
  });
  await ctx.close();
});

test('04, 05 - your profile is not finished until the referee bio is written', async ({ browser }) => {
  // Clear the bio first. Both captures in this test are of its absence.
  await setRefereeBio21(fx, '');

  const { ctx, page } = await context21(browser, KB21.referee, '/teams');

  // 04 - the sidebar block. The count is asserted rather than matched loosely:
  // it is IN the screenshot, and it is the whole point of the capture. Three
  // outstanding fields with the referee bio cleared - a preferred position, a
  // player bio and the referee bio. The individual labels are never drawn, only
  // the count, so the count is what the article points at.
  const block = await openAccountBlock(page, KB21_NAMES.referee);
  const warning = onScreen(page.getByText(/^Complete your profile \(\d\)$/)).first();
  await expect(warning).toHaveText('Complete your profile (3)');
  // NO clipPad here. The block is the full width of the sidebar, so any pad
  // reaches past it into the page behind and publishes a white band with a
  // rounded corner down the right edge. Collection 20 shipped three captures
  // like that before the pad came off. The annotation carries the framing.
  await shot(page, ARTICLE, '04-complete-your-profile', {
    clip: block,
    annotate: warning,
  });

  // 05 - the empty Referee Bio box, reached the way the warning reaches it.
  await page.goto('/profile-settings#referee-bio');
  await settled10(page);
  // settingsRow, not settingsSection: "My Bio" is a row inside BASIC
  // INFORMATION rather than one of the page's five h2 cards. Collection 01's
  // 01.6 found the same thing.
  const bio = await settingsRow(page, 'My Bio');
  const refereeBio = await refereeBioBlock21(page);
  await expect(refereeBioBox21(page)).toHaveValue('');
  await shot(page, ARTICLE, '05-referee-bio-empty', {
    clip: bio,
    clipPad: 8,
    annotate: refereeBio,
  });

  // 06 - the same box with the bio typed and its counter. Typed rather than
  // written over the API, because the counter is the subject and the counter is
  // client-side.
  await refereeBioBox21(page).fill(KB21_BIO);
  const counter = refereeBio.getByText(`${KB21_BIO.length}/${KB21_BIO_LIMIT.chars}`, { exact: true });
  await expect(counter).toBeVisible();
  await shot(page, ARTICLE, '06-referee-bio-filled', {
    clip: refereeBio,
    clipPad: 8,
    annotate: counter,
  });

  // 07's precondition. Saved through the form rather than over the API, so this
  // proves the form works - the article's step 7 is "select Save Changes".
  await page.getByRole('button', { name: /^Save Changes$/i }).first().click();
  await page.reload();
  await settled10(page);
  await expect(refereeBioBox21(page)).toHaveValue(KB21_BIO);

  await ctx.close();
});

test('07 - the bio and the referee statistics on your profile', async ({ browser }) => {
  // The bio has to be set for this one. The test above leaves it set through the
  // form; set it again here so this test can also run on its own.
  await setRefereeBio21(fx, KB21_BIO);

  const { ctx, page } = await context21(browser, KB21.referee, '/teams');
  await openRefereeProfile21(page, fx.referee.playerId);
  await settled10(page);

  const bioPanel = await myBioPanel21(page);
  await expect(bioPanel.getByText(KB21_BIO)).toBeVisible();
  const tiles = await refereeStatTiles21(page);

  // The two panels sit side by side under the hero and the article talks about
  // them together - the bio you wrote, and the numbers a referee gets instead of
  // a player's. One invisible box over both, so one clip covers them.
  const both = await unionBox(page, [bioPanel, tiles], 4);
  // No mask: the clip covers the two panels and the sidebar is not in it.
  await shot(page, ARTICLE, '07-referee-profile', { clip: both });
  await clearUnionBox(page);
  await ctx.close();
});

test('02, 03 - the Referee and Player switch on your profile', async ({ browser }) => {
  const { ctx, page } = await context21(browser, KB21.referee, '/teams');
  await openRefereeProfile21(page, fx.referee.playerId);
  await settled10(page);
  const hero = await profileHero21(page);

  // 02 - the profile as it opens. `defaultProfile` is set to Referee by the same
  // call that made her a referee, so the referee side is what she lands on and
  // the assertion in openRefereeProfile21 has already proved it.
  await expect(refereeRoleOption(page)).toHaveAttribute('aria-checked', 'true');
  await shot(page, ARTICLE, '02-profile-referee-switch', {
    clip: hero,
    // A negative pad: the switch sits flush against the hero's right edge, and a
    // positive one would put the outline outside the clip.
    annotate: profileRoleSwitch(page),
    annotatePad: -2,
  });

  // 03 - the same hero, switched. Only the selected segment carries a label, so
  // the two captures differ by which word is on the pill as well as by which
  // half is white.
  await selectRole21(page, 'player');
  await expect(playerRoleOption(page)).toHaveAttribute('aria-checked', 'true');
  await settled10(page);
  await shot(page, ARTICLE, '03-profile-player-switch', {
    clip: hero,
    annotate: profileRoleSwitch(page),
    annotatePad: -2,
  });

  // Leave the profile on the referee side. Nothing persists here - profileRole
  // is a search parameter, not a stored preference - but the next spec asserts
  // the landing state and a stray click is not worth debugging twice.
  await selectRole21(page, 'referee');
  await ctx.close();
});

// The article's last step - "Select your default profile" on Profile settings -
// has NO screenshot, deliberately. It is the same blue pill as shots 02 and 03,
// in a second place, and the brief's seven shots are spent. This test is not a
// capture: it asserts the control is there and set to Referee, so the sentence
// in the article cannot go stale without a spec failing.
test('the default-profile control exists and reads Referee (no capture)', async ({ browser }) => {
  const { ctx, page } = await context21(browser, KB21.referee, '/profile-settings');
  await settled10(page);
  const row = await defaultProfileRow21(page);
  await expect(
    row.locator('button[role="radio"]').filter({ has: page.locator('img[alt="Referee profile"]') }).first(),
  ).toHaveAttribute('aria-checked', 'true');
  await ctx.close();
});
