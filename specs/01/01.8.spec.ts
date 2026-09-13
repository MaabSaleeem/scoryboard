// 01.8 - The padel rating questionnaire.
//
// Nine screens behind one button on Profile settings. The whole thing is one
// Radix dialog with its contents swapped, so every capture asserts its own copy
// before it is taken - a bare `[role="dialog"]` matches the first screen and
// the last equally well and proves nothing.
//
// --- The account is rebuilt, because the wizard runs once ---------------
//
// Completing the questionnaire sets `rating7`, and that REMOVES the "Complete
// The Padel Rating Questionnaire" panel from Profile settings - which is this
// article's only entry point. `rating7` cannot be put back: `null` and `0` are
// both refused 400. See PADEL_QUESTIONNAIRE_RUNS_ONCE in lib/fixtures-01.mjs.
//
// So rebuildPadel01() deletes the address and makes it again, exactly the way
// 01.4 treats kb-01-wizard@. scripts/seed-01.mjs does the same job; both exist
// so a run that follows a crashed one still works.
//
// `/padel-level` stays reachable by URL afterwards - the same wizard drawn as a
// full page rather than a modal, and the step a padel signup meets in 01.4 -
// but this article documents the entry point a reader can find, which is the
// one that goes away.
//
// --- Why nine screens become ten shots, and one is skipped --------------
//
// The four questions are the same screen four times: a heading, a line of help
// and a column of answer buttons. Photographing all four would be four pictures
// of one thing. Three are captured and the racket-sports question is not:
//
//   03  question 1, UNANSWERED, reading STEP 1 OF 3
//   04  the follow-up, reading STEP 2 OF 4
//   05  the last question
//
// 03 and 04 are both taken because the count between them is the article's
// point: answering question 1 with "I play regularly" or the competitive option
// adds a follow-up and turns 3 into 4. A reader who picks "No, never" never
// sees screen 04 at all, and the article says so.
//
// The racket-sports question also REWORDS its own options by what you answered
// first - "Padel is my racket sport - no other real experience" on the regular
// path, "No real racket sport experience" on the beginner one. Measured on both
// paths, 2026-09-13. Not captured: it is a detail of a screen the article
// already describes, and a second picture of it would not carry the difference.
//
// --- The spec DOES finish the questionnaire -----------------------------
//
// Unlike 13.10 and 13.12, which photograph a confirm dialog and cancel it. The
// difference is that this one is repeatable: the account is thrown away and
// remade at the top of the run, so completing it costs nothing and the last
// step of the article is verified rather than assumed.
//
// It also proves the defect the article warns about. The questionnaire's own
// save is a PARTIAL `PUT /users/:userId` carrying `rating7` and the three
// preference fields and nothing else - read off the wire, 2026-09-13 - and the
// optional fields it leaves out are cleared. So a bio written before the
// questionnaire is gone after it. The spec writes one, finishes the wizard and
// asserts it has been wiped. Same family as the defect 02.5 warns about, where
// changing your photo clears your bio.

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, onScreen, centre,
  rebuildPadel01, padelRatingPanel, padelWizard, answerAndNext,
  KB01, KB01_INFO, asUser, API,
} from '../../lib/kb';

const BIO = 'Five-a-side on Tuesdays, padel on Sundays.';
const PADEL_BIO = 'New to padel and looking for a regular fourth.';

test.describe('01.8 The padel rating questionnaire', () => {
  test('from Add Rating to Self-rated, and the bio it wipes on the way', async ({ page }) => {
    const { token, me } = await rebuildPadel01(KB01.padel, KB01_INFO.padel);

    // A bio, written before the questionnaire the way 01.6 tells a reader to.
    // Asserted gone at the end - see the header note.
    const seeded = await asUser(token, `/users/${me.id}`, {
      method: 'PUT',
      body: { ...KB01_INFO.padel, isMarketingOpted: false, bio: BIO, padelBio: PADEL_BIO },
    });
    expect(seeded.ok, 'the bio could not be written before the questionnaire').toBe(true);

    await blockPromos(page);
    await signInAs(page, KB01.padel, '/profile-settings');
    await quiet(page);
    await expect(page.getByText('First Name *', { exact: true })).toBeVisible();

    // 01 - the panel, and the button that opens the wizard. It is on Profile
    // settings between the banner and Basic Information, and it is there only
    // while the account has no rating.
    const panel = await padelRatingPanel(page);
    const addRating = panel.getByRole('button', { name: 'Add Rating', exact: true });
    await centre(panel);
    await expect(panel).toContainText(
      'Complete the questionnaire to get your initial padel rating '
      + 'so you can have the right starting point',
    );
    await shot(page, '01.8', '01-add-rating', { clip: panel, annotate: addRating });

    await addRating.click();

    // 02 - the opening screen. It promises four questions and sixty seconds,
    // and the middle of its three rows is the one that matters: a self-rating
    // is a starting point, not a verdict.
    const intro = await padelWizard(page, "Let's find your starting level.");
    await expect(intro).toContainText('Self-rated, not final');
    await shot(page, '01.8', '02-intro', { clip: intro, clipPad: 12 });

    await intro.getByRole('button', { name: 'Get started', exact: true }).click();

    // 03 - question 1, with nothing selected. STEP 1 OF 3 at this point: the
    // fourth screen does not exist until the answer asks for it.
    const q1 = await padelWizard(page, 'Have you played padel before?');
    // Case-insensitive on purpose: the counter renders as STEP 1 OF 3 but the
    // DOM says "Step 1 of 3" - CSS does the uppercasing, the same trap
    // lib/kb.ts records for the LEVEL panel and the tile grids. Cost one run.
    await expect(q1).toContainText(/step 1 of 3/i);
    await shot(page, '01.8', '03-experience', { clip: q1, clipPad: 12 });

    // "I play regularly" is what turns 3 into 4. Asserted rather than assumed,
    // because it is the thing shot 04 is for.
    await q1.getByRole('button', { name: 'I play regularly', exact: true }).click();
    await expect(q1).toContainText(/step 1 of 4/i);
    await q1.getByRole('button', { name: 'Next', exact: true }).click();

    // 04 - the follow-up. It exists only on this path.
    const q2 = await padelWizard(page, 'How long have you been playing padel?');
    await expect(q2).toContainText(/step 2 of 4/i);
    await shot(page, '01.8', '04-how-long', { clip: q2, clipPad: 12 });
    await answerAndNext(page, q2, '1 to 2 years');

    // The racket-sports question. Answered, not photographed - see the header.
    const q3 = await padelWizard(page, 'Have you played other racket sports?');
    await answerAndNext(
      page, q3, 'A little tennis, squash, badminton or table tennis alongside padel',
    );

    // 05 - the last question. Its help line is the one that names the cap, and
    // the cap is what the level cards two screens later are limited by.
    const q4 = await padelWizard(page, 'How would you describe your movement and fitness on court?');
    await expect(q4).toContainText('It does not override the cap.');
    await shot(page, '01.8', '05-movement', { clip: q4, clipPad: 12 });
    await answerAndNext(page, q4, 'I move well and feel fit');

    // 06 - the suggested range. A slider from 1.0 to 7.0 with a band on it, and
    // the first of the two places the app names PadelLevels to the reader.
    const range = await padelWizard(page, /your suggested range/i);
    await expect(range).toContainText(
      'Once you play matches against players with established levels, '
      + 'your PadelLevels rating will update automatically.',
    );
    await shot(page, '01.8', '06-suggested-range', { clip: range, clipPad: 12 });

    await range.getByRole('button', { name: 'See the level cards', exact: true }).click();

    // 07 - the level cards. One card per level in the suggested band, each with
    // a number, a name, a paragraph and four named attributes.
    //
    // Not clipped to the dialog: it is taller than the viewport here and the
    // clip would stop partway down the first card. The viewport, scrolled to
    // the top of the list, shows the cap line and the warning panel above it -
    // which is what the step is about.
    const cards = await padelWizard(page, 'Which description feels most like you?');
    await expect(cards).toContainText('Higher levels unlock once you');
    await expect(cards).toContainText(/shot consistency/i);
    await shot(page, '01.8', '07-level-cards');

    // Take the middle card. `.nth(1)` rather than a name: every card's button
    // carries the same label, which is the point of the screen.
    await cards.getByRole('button', { name: 'This sounds like me', exact: true }).nth(1).click();

    // 08 - the confidence question. Three answers and no wrong one; it changes
    // nothing a reader can see, and the article says so rather than implying it
    // moves the number.
    const confidence = await padelWizard(page, 'How confident are you that this starting level is right?');
    await shot(page, '01.8', '08-confidence', { clip: confidence, clipPad: 12 });
    await answerAndNext(page, confidence, 'Fairly sure');

    // 09 - Player preferences. The same three fields Profile settings carries -
    // Court position, Match type, Preferred time - asked again here, and all
    // three optional. Skip and Next both move on with nothing chosen.
    const prefs = await padelWizard(page, 'Player preferences');
    await expect(prefs).toContainText('Court Position');
    await expect(prefs).toContainText('Match Type');
    await expect(prefs).toContainText('Preferred time');
    await shot(page, '01.8', '09-player-preferences', { clip: prefs, clipPad: 12 });

    for (const choice of ['Both sides', 'Friendly', 'Evening']) {
      await prefs.getByRole('button', { name: choice, exact: true }).click();
    }
    await prefs.getByRole('button', { name: 'Next', exact: true }).click();

    // 10 - the result, and the three states. Self-rated is ticked, Provisional
    // and Validated are named with the app's own one-line definitions, and this
    // is the second place PadelLevels is named. Nothing is saved yet: the two
    // buttons are Run the rating again and Save and proceed.
    const done = await padelWizard(page, "You're all set.");
    await expect(done).toContainText('Your chosen starting level.');
    await expect(done).toContainText('Once you have some match data, but not enough yet.');
    await expect(done).toContainText('Enough reliable match history for the rating to be trusted.');
    await expect(done.getByRole('button', { name: 'Run the rating again', exact: true }))
      .toBeVisible();
    await shot(page, '01.8', '10-all-set', { clip: done, clipPad: 12 });

    await done.getByRole('button', { name: 'Save and proceed', exact: true }).click();

    // The one write the whole wizard makes, verified off the API rather than
    // off the screen. `rating7` lands, the three preferences land with it, and
    // BOTH bios are wiped - which is the defect the article warns about, and
    // the reason its last step tells a reader to write their bio afterwards.
    await expect.poll(async () => {
      const r = await asUser(token, '/users/me');
      const u = r.body?.data ?? {};
      return {
        rated: typeof u.rating7 === 'number',
        courtPositions: u.courtPositions ?? null,
        matchType: u.matchType ?? null,
        preferredTime: u.preferredTime ?? null,
        bio: u.bio ?? '',
        padelBio: u.padelBio ?? '',
      };
    }, {
      message: 'the questionnaire should save a rating, keep the preferences and wipe both bios',
    }).toEqual({
      rated: true,
      courtPositions: 'Both sides',
      matchType: 'Friendly',
      preferredTime: 'Evening',
      bio: '',
      padelBio: '',
    });

    // And the entry point is gone, which is why this account is rebuilt.
    await page.goto('/profile-settings');
    await quiet(page);
    await expect(page.getByText('First Name *', { exact: true })).toBeVisible();
    await expect(page.getByText('Complete The Padel Rating Questionnaire', { exact: true }))
      .toHaveCount(0);
    expect(API).toBeTruthy();
    expect(onScreen(page.locator('body')).first()).toBeTruthy();
  });
});
