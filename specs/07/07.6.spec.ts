// 07.6 - Joining a team you have been invited to.
//
// Persona: fresh (Fin). The invitation to KB 07 United is seeded PENDING and
// this spec never accepts it - accepting cannot be undone, and the invitation is
// the fixture. The "after" is KB 07 Wanderers, which Fin joined in the seed.
//
// Two tests, because the last shot needs an account with nothing pending and a
// spec cannot switch accounts inside one test. Ada is a second actor inside this
// collection, not a borrowed persona.
//
// The surprise this article has to carry: **you are on the team before you
// accept.** The moment the owner adds your address the team is in your
// /teams?all=true and shows in Manage Teams as Player. Accepting changes
// `invitationStatus`, and the icon on your row in the owner's member list.

import { test, expect } from '@playwright/test';
import {
  shot, quiet07, signInAs, signInBare, unstickHeader, onScreen, centre,
  fixtures07, teamListReady, teamRow, teamPageReady, teamJoinedSince, teamViews,
  sidebarIdentity, notificationBadge,
  KB07, KB07_PROFILES, KB07_TEAMS,
} from '../../lib/kb';

const FIN = `${KB07_PROFILES.fresh.name} ${KB07_PROFILES.fresh.lastName}`;

test.describe('07.6 Joining a team you have been invited to', () => {
  test('the Join a team screen, and a team already joined', async ({ page }) => {
    const fx = await fixtures07();

    // Signing in with an invitation outstanding lands you here by itself; the
    // spec navigates to it explicitly so the capture does not depend on where
    // the app's guard happens to route. signInBare(), not signInAs(): this
    // screen has no sidebar, and signInAs() proves the session by waiting for one.
    await signInBare(page, KB07.fresh, '/team/join');
    await quiet07(page);
    const card = onScreen(page.getByText(KB07_TEAMS.united, { exact: true }))
      .first().locator('xpath=ancestor::div[contains(@class,"border")][1]');
    await expect(page.getByText('Join a team', { exact: true })).toBeVisible();
    await expect(card).toContainText('invited you');
    // Wait for the team's crest to arrive. The card renders the team's initials
    // on a coloured disc first and swaps in the crest when it loads, and
    // imagesPainted() cannot see an <img> that is not in the DOM yet - so the
    // first run of both these shots caught "KU" where the badge should be.
    await expect(card.locator('img')).toBeVisible();

    // 01 - the screen as it opens. No sidebar on this one: it is an interstitial,
    // like collection 01's wizard steps, so there is no identity to mask.
    await shot(page, '07.6', '01-join-a-team');

    // 02 - the team selected, and the button that would accept it. NOT clicked.
    await card.click();
    const cont = page.getByRole('button', { name: 'Continue', exact: true });
    await shot(page, '07.6', '02-card-selected', { annotate: cont });

    // 03 - and the thing worth knowing: the team is ALREADY in your list, as a
    // Player, before you accept anything.
    await page.goto('/teams');
    await quiet07(page);
    await teamListReady(page, [KB07_TEAMS.united, KB07_TEAMS.wanderers]);
    await unstickHeader(page);
    const masks = [sidebarIdentity(page, FIN), notificationBadge(page)];
    const row = teamRow(page, KB07_TEAMS.united);
    await expect(row).toContainText('Player');
    await centre(row);
    await shot(page, '07.6', '03-teams-list', { annotate: row, mask: masks });

    // 04 - the "after": a team Fin has actually accepted, opened from his side.
    await page.goto(`/teams/${fx.teams.wanderers}`);
    await quiet07(page);
    await teamPageReady(page, KB07_TEAMS.wanderers);
    await shot(page, '07.6', '04-joined-team-page', {
      mask: [...masks, teamJoinedSince(page), teamViews(page)],
    });
  });

  // Ada has no invitations outstanding, which is the only way to reach the
  // empty state. A second actor inside this collection, not another
  // collection's persona.
  test('what the screen says with nothing pending', async ({ page }) => {
    await signInBare(page, KB07.admin, '/team/join');
    await quiet07(page);
    await expect(page.getByText(/don.t have any pending team invites/)).toBeVisible();
    // 05 - the empty state.
    await shot(page, '07.6', '05-no-invitations');
  });
});
