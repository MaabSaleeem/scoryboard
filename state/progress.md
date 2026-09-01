# Progress

Read this first, every session. Update it at the end of every session.

Status values: `not started` | `in progress` | `drafts on Intercom` | `published` |
`blocked`.

`drafts on Intercom` is where a finished run leaves a collection: every article
drafted, nothing public, waiting for a human to read it in Intercom. Only a human
moves a collection to `published`.

One collection per session. Do not touch a collection that is not this session's
target.

| # | Collection | Articles | Shots (est.) | Persona default | Status | Brief | Notes |
|---|---|---|---|---|---|---|---|
| 01 | Getting started & onboarding | 7 | 44 | fresh | drafts on Intercom | [briefs/01.md](../briefs/01.md) | 43 screenshots. **01.4-01.7 published by the reviewer 2026-08-28; 01.1-01.3 still drafts.** 01.3 retitled "Resetting your password" - the invited-account half was dropped. Seven accounts, all `kb-fresh-01@` or `kb-01-*@`; two now unused |
| 02 | Finding your way around & your profile | 8 | 36 | player | published | [briefs/02.md](../briefs/02.md) | 36 screenshots. **All eight published by the reviewer 2026-08-29.** 02.1, 02.3 and 02.6 amended and republished afterwards. 03 merged in 2026-08-29; four articles dropped. Accounts: `kb-player-02@`, `kb-02-owner@`, `kb-02-pro@` |
| 04 | Plans & membership | 6 | 30 | manager_free | published | [briefs/04.md](../briefs/04.md) | 30 screenshots. **All six published by the reviewer 2026-08-29.** 04.6 amended and republished afterwards - when a slot is spent. Collection 16 was retired into this one 2026-08-29 - its six articles became three, and 16.5 was dropped. 04.1 amended and republished - the Coming soon paragraph was dropped. Pro is a free self-serve toggle during beta - no payment step, and no confirmation in either direction. Flag for rewrite when beta ends. Three accounts, NOT one flipped: `kb-manager-free-04@`, `kb-04-pro@`, `kb-04-upgrade@` |
| 05 | Friends | 5 | 26 | manager_free | drafts on Intercom | [briefs/05.md](../briefs/05.md) | 26 screenshots. **05.1-05.4 published by the reviewer 2026-08-31; 05.5 is a draft.** Collection 06 was retired into this one 2026-08-31 - 06.1 became 05.5. Found that a **refused Add To Team deletes the friend** (ONE_FRIEND_PER_TEAM), which also answers collection 04's open question 1. Accounts: `kb-manager-free-05@`, `kb-05-mate@`, `kb-05-player@`, `kb-05-invitee@`. `kb-05-claimer@` is burnt - see the session log |
| ~~06~~ | ~~Following~~ | - | - | - | **retired** | - | **RETIRED 2026-08-31, merged into 05.** 06.1 became 05.5. Intercom collection 19733975 was empty before the merge and is empty after it; it must not be reused |
| 07 | Teams | 11 | 63 | manager_pro | published | [briefs/07.md](../briefs/07.md) | 63 screenshots. **All eleven published by the reviewer 2026-08-29.** 07.7 and 07.9 retitled - the app has no ownership transfer and no Fan role. Accounts: `kb-manager-pro-07@`, `kb-fresh-07@`, six `kb-07-*@` |
| 08 | Leaderboards & leagues | 5 | 30 | manager_pro | drafts on Intercom | [briefs/08.md](../briefs/08.md) | 30 screenshots. Found that **removing a team from a leaderboard has no confirmation at all**, that the league table carries **no points, no draws and no goals conceded**, that the Share Leaderboard "public link" sends a signed-out visitor to `/signin`, and that a comment can never be deleted - `DELETE /comments/:id` answers 401 even to its author. The **External** badge on a team row means "not one of your own", and it wrongly marks the owner’s own teams until the account has opened `/teams` once. Four accounts: `kb-manager-pro-08@`, `kb-08-admin@`, `kb-08-free@`, `kb-08-outsider@`. Four played matches; they cannot be undone |
| 09 | Creating & scheduling matches | 7 | 44 | manager_pro | drafts on Intercom | [briefs/09.md](../briefs/09.md) | 44 screenshots. Found that **Create Match creates the match** on the click, that **seven** fields decide Incomplete vs Scheduled - and a **leaderboard is one of them, even for a friendly** - and that **`DELETE /matches/:id` does not delete**, it sets `status: "Cancelled"`. 09.5 retitled "Editing or cancelling a match" - there is no delete anywhere in the app. 09.6's referee half narrowed: the Referee box only offers referees saved from a tournament, so it reads "No results found" for a manager who has never run one. The match **share link is not public** - a signed-out visitor gets Sign In and permanent skeletons. Four accounts: `kb-manager-pro-09@`, `kb-09-admin@`, `kb-09-player@`, `kb-referee-09@`. Two Scheduled fixtures on FIXED dates (24 and 30 Sept 2026); the seed refuses to run once they have passed. **All seven were published by the reviewer 2026-08-31, two minutes after the run posted them as drafts** |
| 10 | Match day | 10 | 60 | manager_pro | published | [briefs/10.md](../briefs/10.md) | 60 screenshots. **All ten published 2026-09-01 on the owner's instruction, straight after the run - not reviewed in Intercom first. The help centre is LIVE, so they are public.** See the session log. Found that **a match runs itself**: it starts when its date arrives and **ends itself 24 hours after full time** - the card says "Match auto-ends in" - so a match created more than a day after it finished arrives `Finished` at 0-0 and can never be scored (10.9). **END MATCH does not exist until the timer hits 00:00**; the timer pill IS the pause control. **Penalties and typed score entry are tournament-only**, so 10.6 was retitled "Yellow and red cards, and how the final score is set". The match feed has **no REST read at all** - it is a Firestore subscription, which is what makes 10.10 work. Two Free gates with no error code: the fourth substitute slot and Add media. **Reloading a paused match resumes it** - a real defect, warned about in 10.3 and 10.4. Four accounts: `kb-manager-pro-10@`, `kb-10-admin@`, `kb-10-player@`, `kb-referee-10@`. Two leaderboards: KB 10 Sunday League holds the fixtures, KB 10 Midweek holds every throwaway. One Scheduled fixture on a FIXED date (15 Oct 2026); the seed refuses to run once it has passed |
| 11 | Match insights & statistics | 3 | 9 | player | drafts on Intercom | [briefs/11.md](../briefs/11.md) | 9 screenshots. 11.1 retitled - the app has no form guide and no head-to-head record. Found that **a match outside a leaderboard writes no statistics at all** and that a player counts the matches they were in the LINEUP for. Accounts: `kb-player-11@`, `kb-11-owner@`. Four played matches; they cannot be undone. **All three published by the reviewer 2026-08-31, then all three rewritten for clarity and republished** |
| 12 | Tournaments - setting one up | 10 (+2) | 80 | organiser | published | [briefs/12.md](../briefs/12.md) | 12 published, 80 screenshots. 12.11 and 12.12 added for Padel; not in the map |
| 13 | Tournaments - groups, brackets & phases | 11 | 55 | organiser | drafts on Intercom | [briefs/13.md](../briefs/13.md) | flag: TOURNAMENT_FEATURE_ENABLED. 11 drafts, 55 screenshots. 13.8 retitled. Account: kb-organiser-13@yopmail.com |
| 14 | Tournaments - the fixture schedule | 8 | 37 | organiser | drafts on Intercom | [briefs/14.md](../briefs/14.md) | flag: TOURNAMENT_FEATURE_ENABLED. 8 drafts, 37 screenshots. 14.5 retitled - fixtures cannot be deleted. Account: kb-organiser-14@yopmail.com |
| 15 | Tournaments - publishing & running | 9 | 62 | organiser | not started | - | flag: TOURNAMENT_FEATURE_ENABLED. Structure unchanged; 15.8 needs a padel section. Account: kb-organiser-15@yopmail.com |
| ~~16~~ | ~~Tournament plans & payment~~ | - | - | - | **retired** | - | **RETIRED 2026-08-29, merged into 04.** 16.1+16.2 -> 04.4, 16.3+16.4 -> 04.5, 16.6 -> 04.6. 16.5 dropped - managing a live Annual subscription needs a completed payment. Intercom collection 19733985 is empty and must not be reused |
| 17 | Collecting & making payments | 9 | 63 | manager_pro | not started | - | REAL MONEY, Stripe Connect. Two audiences - the organiser collecting and the player paying. |
| 18 | Chat & messaging | 4 | 27 | manager_free | not started | - | - |
| 19 | Comments, likes & ratings | 4 | 19 | player | not started | - | - |
| 20 | Notifications, emails & the activity feed | 4 | 16 | player | not started | - | No push notifications exist. Do not write one. |
| 21 | Referees | 3 | 18 | referee | not started | - | - |
| 22 | Venues & club locations | 2 | 11 | manager_pro | not started | - | - |
| 24 | Troubleshooting & policies | 4 | 13 | manager_free | not started | - | - |

Totals: 130 articles, 727 screenshots estimated across 20 live collections
(03, 06, 16 and 23 are retired). Collection
16 was retired into 04 on 2026-08-29; 04 grew from 3 articles to 6. These count
what `config/articles.yaml` lists and still exclude collection 12's two padel
articles, which are published but never went back into the map.

Every collection has its own accounts - `kb-<persona>-<collection>@yopmail.com`.
Collection 12 is the one exception. See `account_isolation` in
`config/personas.yaml`.

Deferred, not in scope: collection 25, internal back-office operations
(10 articles, API-key protected, no UI, text only).

## Session log

Append one entry per session: date, collection, what published, what differed from
the brief, what was skipped, the commit SHA the image URLs are pinned to.

**2026-08-28 - setup, no collection.** Scaffolded the repo. Confirmed the staging
Firebase web config and the Intercom token. Created all 24 Intercom collections in
help centre 5705778 and recorded their ids in `config/intercom.yaml`
(`node scripts/bootstrap-intercom-collections.mjs`). No articles published, no
screenshots captured, no staging data created. Next: `/kb-brief 06`.

**2026-08-28 - collection 12, step 1 (brief only).** Seeded the `organiser`
persona plus two supporting accounts (`kb-12-admin@`, `kb-12-outsider@`) with
`node scripts/seed-12.mjs`, which is idempotent - a second run makes zero writes.
Built two tournament fixtures, `KB Cup` (configured) and `KB New Cup`
(untouched), two saved venues, eight tournament teams and two referees. Wrote ten
Playwright specs under `specs/12/` and `briefs/12.md`. Nothing published, no
Intercom call, no commit.

Exploration corrected `config/api.md` in several places, each marked `(observed in
app, 2026-08-28)`: the signin-token endpoint returns a URL rather than a token;
`GET /tournaments/:id/config` is a 404 and the wizard `PUT`s the tournament
instead; the Tournament Pro grant is additive with no revoke; and fifteen
tournament endpoints that were not in the Postman export are now recorded.

Three articles are retitled because the map describes a product that is not on
staging: there is no Draft state, no numbered setup wizard, and no registration
or referee fees. The live-lock screenshot in 12.10 is unreachable until a
tournament can be made Live, which is collection 15. Nine open questions are in
the brief. Next: a human reads `briefs/12.md`.

**2026-08-28 - collection 12 brief APPROVED.** Approved in session by the repo
owner, after asking about the three retitles (no Draft state, no setup wizard, no
registration or referee fees) and being shown that production and staging agree on
all three. Approval covers `briefs/12.md` as it stands: those ten articles, those
steps, those 65 screenshots, including the two known gaps - 12.1 illustrates only
the Published state, and 12.10 has no live-lock screenshot. Both are to be topped
up when collection 15 produces a Live and a Completed tournament.

Still open and NOT covered by this approval: the nine numbered open questions in
the brief, and the two "please confirm" items (whether `kb-12-admin@` and
`kb-12-outsider@` should be promoted into `config/personas.yaml`). None of them
blocks publishing.

**2026-08-28 - collection 12, step 2. Nine of ten articles published.**

| Article | Intercom ID | Shots | Pinned commit |
|---|---|---|---|
| 12.1 | 16733150 | 3 | 0ed9dd4 |
| 12.2 | 16733171 | 8 | 0ec3021 |
| 12.3 | 16733190 | 7 | c5fae3a |
| 12.4 | 16733249 | 9 | eca5179 |
| 12.5 | 16733298 | 9 | 3730425 |
| 12.6 | 16733318 | 6 | f1e3512 |
| 12.8 | 16733354 | 6 | 29c1d38 |
| 12.9 | 16733367 | 6 | 3e3ad46 |
| 12.10 | 16733381 | 6 | 4fa083f |

60 screenshots. Every embedded image URL was re-checked against the published
article bodies at the end of the run: all 60 return 200 with an `image/*`
content type, pinned to the commits above on branch `kb/collection-12`.

**12.7 "Tournament crest and phase names" was NOT published. Stopped, not
skipped.** The approved brief says the tournament has no banner and drops that
half of the mapped article. That is wrong. The settings page carries two file
inputs, `Upload banner image` and `Upload avatar image`, and both render with
their own edit and delete controls. The banner was missed in step 1 because that
exploration read pages as text, and an unlabelled image control leaves no text
behind. 12.7 needs its brief entry rewritten to cover the banner, and then a
fresh approval. Its five captures were taken and left uncommitted.

Same root cause, smaller consequence: the brief says a tournament referee has no
email field. The **Single referee** tab does have one - it is the **Multiple
referees** tab that is names only. 12.9 was written from the captures and is
correct; only the brief's note is wrong.

**Differed from the brief.** Masks. The brief's table for the tournament-list
shots says "mask: header name"; the specs had grown two more masks during step 1
determinism work, which put black bars over the cards those shots are about. The
creation date is the tournament's own stored date, not today's, so it never
drifted and never needed masking. Removed in 12.1, 12.2 and 12.8.

**Capture defects found and fixed in the specs, not the images.** Shot 12.2/07
had the venue popover open across the form and its annotation drawn below the
modal's internal fold. Three shots in 12.4 did not contain their own subject -
the annotated field sat flush against the bottom edge, and the overflow toggle
was off-screen entirely. 12.5/09 caught the tournament list as grey skeletons.
12.3/04 and 12.6/02 showed the persona's name unmasked. Two new shared helpers
came out of it: `centre()` and `imagesPainted()`.

**Worth a decision.** 12.5/09 is the free Tournament Pro allowance panel. The
brief asks for the remaining count to be masked because it drifts. Masking it
takes the number out of a panel whose only point is the number, so the shot now
carries two redacted blocks and says little. Recommend dropping that mask.

**No flakes.** Eleven specs, run repeatedly through the session, never failed
once the selector fixes were in.

**Not committed to master.** Everything is on `kb/collection-12`, pushed. The
image URLs resolve from that branch's commits. Merging is the human's call.
Also set `http.sslBackend=schannel` in this repo's local git config - git-bash
could not validate GitHub's certificate without it.

Next: re-brief 12.7, then `/kb-brief 13`.

**2026-08-28 - collection 12 complete. All ten articles published.**

| Article | Intercom ID | Shots | Pinned commit |
|---|---|---|---|
| 12.1 | 16733150 | 3 | 0ed9dd4 |
| 12.2 | 16733171 | 8 | 0ec3021 |
| 12.3 | 16733190 | 7 | c5fae3a |
| 12.4 | 16733249 | 9 | eca5179 |
| 12.5 | 16733298 | 9 | 3730425 |
| 12.6 | 16733318 | 6 | f1e3512 |
| 12.7 | 16733486 | 5 | 7f0e122 |
| 12.8 | 16733354 | 6 | 29c1d38 |
| 12.9 | 16733367 | 6 | 3e3ad46 |
| 12.10 | 16733381 | 6 | 4fa083f |

65 screenshots, matching the approved brief exactly. Every image URL embedded in
the published bodies was re-checked at the end: all 65 return 200 with an
`image/*` content type.

**12.7 published after the brief was corrected and re-approved.** The tournament
does have a banner - `Upload banner image` sits beside `Upload avatar image`
under Profile appearance, each with its own edit and delete control. The article
is back to the map's original title and covers both. Its two appearance captures
now outline the banner and the crest rather than the section heading and its
size caption.

**Game-type scoping, added at the repo owner's request.** The three format
templates in 12.4 are the Football set; Padel has its own. Verified in the
rendered create form: choosing Padel adds Play mode, Enrollment type and a
Friendly Tournament toggle, and choosing Other Sports changes nothing at all.

- 12.2 -> "Creating a football tournament"
- 12.4 -> "Choosing a format for a football tournament"

Both say Other Sports works identically and Padel is separate, so an Other Sports
reader is not turned away from an article that does describe their screen. 12.5
and 12.7 got a pointer rather than a retitle. The other six were left alone:
states, dates, venues, settings, referees and deletion do not vary by game type.

Republished by PUT against the existing Intercom IDs, so no duplicates and no new
URLs - the screenshots did not change and stayed pinned to their original
commits.

**Still open for the Padel work.** Whether Other Sports really uses the same
three format templates was inferred from the bundle having one non-Padel format
set, not seen on screen. Confirm it before writing the Padel articles, because
the Football articles now assert it.

Next: `/kb-brief 13`, and a Padel pass over collection 12.

**2026-08-28 - collection 12, padel pass. Two articles added, twelve published.**

| Article | Intercom ID | Shots | Pinned commit |
|---|---|---|---|
| 12.1 | 16733150 | 3 | 0ed9dd4 |
| 12.2 | 16733171 | 8 | 0ec3021 |
| 12.3 | 16733190 | 7 | c5fae3a |
| 12.4 | 16733249 | 9 | eca5179 |
| 12.5 | 16733298 | 9 | 3730425 |
| 12.6 | 16733318 | 6 | f1e3512 |
| 12.7 | 16733486 | 5 | 7f0e122 |
| 12.8 | 16733354 | 6 | 29c1d38 |
| 12.9 | 16733367 | 6 | 3e3ad46 |
| 12.10 | 16733381 | 6 | 4fa083f |
| 12.11 | 16734124 | 7 | 2b0b16c |
| 12.12 | 16734128 | 8 | 2b0b16c |

80 screenshots. Every image URL embedded in the published bodies re-checked at
the end: all 80 return 200 with an `image/*` content type. Committed straight to
`master` from here on, as instructed.

**12.11 "Creating a padel tournament"** and **12.12 "Choosing a format for a
padel tournament"** are new. Neither is in `config/articles.yaml` - the map has
no padel coverage at all, which is why scoping 12.2 and 12.4 to Football last
session exposed a gap rather than closing one.

Padel is a genuinely different surface, verified in the rendered app:

- Its create form adds **Play mode**, **Enrollment type** (required) and a
  **Friendly Tournament** toggle. `POST /tournaments` gains `playMode`,
  `padelEnrollmentType` and `isFriendlyTournament`.
- Its Format tab offers **five** formats - Swiss, Americano, Mexicano, King of
  the Court, Round Robin - behind a **Next** button rather than football's
  **Save**, with a configuration step for standings type, scoring, player count,
  rounds, courts and the gap between rounds, and a rules panel alongside.
- **Other Sports adds nothing.** Its create form is Football's, which settles
  the open question left last session about whether the two really match. The
  Other Sports *Format* tab is still unseen, so that half stands.

12.12 documents **Swiss** end to end, as asked, and names the other four.

**Fixtures.** Two padel tournaments seeded - `KB Padel Cup` (Doubles, Swiss, 8
players, 4 rounds, 4 courts, scoring 24) and `KB New Padel Cup` (untouched).
Tournament Pro slots are down to 12. The seed can only **check** that KB Padel
Cup still carries Swiss, not rebuild it: the two-step format save was never
captured on the wire, so if the check fails the script prints the URL to fix it
by hand.

**Capture defects found and fixed in the specs.** Three of 12.11's captures were
full-page with the persona's name unmasked, and its Friendly Tournament shot had
the enrollment list still covering the field while the annotation sat below the
modal's fold. Both fixed the same way as their football equivalents.

**New quirk worth remembering.** Padel's player-count option only responds to
`dispatchEvent('click')` - a real mouse sequence opens and closes it without
selecting. Same behaviour as the venue add button in 12.3 and 12.6. Two
independent controls now share it, so treat it as a house pattern rather than a
one-off.

### Step numbering fixed across the collection - 2026-08-28

**The fault.** To interleave screenshots, every procedure was split into several
`<ol>` blocks carrying the count with `start="2"`, `start="3"`. Intercom strips
the `start` attribute, so each block restarted at 1 and articles read 1. 2. 1. 2.
1. Confirmed by fetching the stored bodies back: every list came back as a bare
`<ol>`.

**The fix.** One `<ol>` per procedure, each screenshot nested inside the `<li>`
of the step it illustrates. Intercom keeps nested images - it rewrites each item
into its own paragraph and image container - and numbers the list unbroken.
Verified against the rendered help centre, not just the stored HTML: 12.11 shows
`list-style-type: decimal` and markers 1-10.

**Eight articles rewritten**: 12.2, 12.4, 12.5, 12.6, 12.9, 12.10, 12.11, 12.12.
12.7 and 12.8 already had unsplit lists. 12.1 and 12.3 have no procedure. All
step text is unchanged and no screenshot moved to a different step.

**One content cost.** 12.11 lost two mid-procedure headings ("The three padel
questions", "The rest is the same"), because a list cannot span an `<h2>`. Their
sense is already carried by the step text. Approved by the human before the rest
of the pass ran.

**Guarded, not just fixed.** `scripts/build-article.mjs` now refuses any article
carrying `<ol start=`, or two `<ol>` blocks with no heading between them. Both
guards were negative-tested. The rule is written up in `docs/style-guide.md`
under "Numbered steps and their screenshots".

All 12 articles re-verified after republishing: 0 lists with `start`, image
counts match the manifest, all published in `19733981`.

### Collections 13, 14 and 15 split by sport in the map - 2026-08-28

Walked football and padel through all nine tournament tabs before deciding, using
KB Cup (round-robin), KB Padel Cup (Swiss) and a temporary football
group-and-knockout tournament. What the screens actually do:

| Screen | Football | Padel |
|---|---|---|
| Group controls | Edit and Delete | Edit only |
| Phase controls | Edit/Delete Group Phase, Edit Knockout Phase | "Delete Swiss format"; no Edit Group Phase |
| Bracket slots | "Add team to slot", manual | pre-seeded, plus Fill automatically / Clear |
| Format sub-tabs | Phase, Group, Bracket | the same plus Configuration |
| Standings columns | PLD W D L PTS GF GA GD | PLD SCORE W D L PTS |
| Schedule | flat, 10:00 / 10:10 / 10:20 | ROUND 1, ROUND 2; matches share a time, carry a court |
| Leaderboard stat | Goals | Score |
| Sponsor, presentation, prizes, chat | identical on both | |

**13: 6 -> 11 articles.** Split everywhere except the phases article. Phase
controls turned out to be driven by having two phases, not by sport - a
group-only football tournament shows none of them, which is why they first looked
padel-specific.

**14: 5 -> 8 articles.** Generation, bulk-scheduling and the clash article split;
rescheduling and PDF export are shared. The clash article mattered most: two padel
matches at the same time on different courts are intended, so a football-only
version of that article would be wrong rather than merely incomplete.

**15: unchanged at 9.** Sponsor, presentation, prizes and chat are
tournament-shell features and render identically. Only 15.8 needs a padel section.

Map totals now 154 articles / 844 screenshots. They still exclude collection 12's
two padel articles, which are published but never made it back into the map.

**Also fixed while in the file:** article ids were unquoted, so YAML parsed them as
floats and `x.1` collided with `x.10`. Four collections were already affected
(07, 10, 12, 17) and collection 13 would have become the fifth. All 154 ids are now
quoted strings.

### Collection 12's specs no longer replay - 2026-08-28 - OPEN

Six specs (12.1, 12.2, 12.3, 12.5, 12.6, 12.8) wait for `Your Tournaments (2)`.
The organiser has four tournaments since the padel pass, so they fail. Confirmed by
running 12.2, not inferred. Four published screenshots show the list and would
change once the specs run again: 12.1/01, 12.2/01, 12.5/09, 12.8/01.

The fix is to wait on a named tournament card instead of a total, then re-capture
those four. Not done - flagged for a decision.

**This constrains 13, 14 and 15.** Every fixture tournament a collection seeds
changes the organiser's list and breaks its siblings. Collection 13 needs a football
group-and-knockout fixture, so it will hit this immediately. Decide first whether
these collections get their own persona, or whether specs stop asserting counts.

Free Tournament Pro slots are at 11: exploring cost one, and deleting the fixture
afterwards does not give it back.

### Accounts are now isolated per collection - 2026-08-28

**The rule.** One account per persona role per collection,
`kb-<persona>-<collection>@yopmail.com`. A collection seeds only into its own
accounts and does not read another collection's. Second actors belong to the
collection too (`kb-<collection>-<role>@`), as collection 12 already did with
`kb-12-admin@` and `kb-12-outsider@`.

**Collection 12 is the single exception** and keeps `kb-organiser@yopmail.com`
unsuffixed, because its 80 published screenshots were captured from that account.

**Why it covers every collection, not the eight that photograph lists.** A
collection breaks its siblings by *seeding*; it gets broken by *photographing* a
list of what the account owns. Isolating only the photographers leaves every
seeder still sharing the account, so the hole stays open. `kb-organiser@` was
shared by 12 to 16 and `kb-manager-pro@` by 07, 08, 09, 10, 17 and 22.

**Cost is near zero right now.** Only collection 12 has been captured; everything
else is `not started`, so no account in use has to move. Each collection creates
its accounts in its own idempotent seed script.

Written into `config/personas.yaml` (`account_isolation`), `docs/workflow.md` step
1.2, and `lib/kb.ts` as `personaEmail(role, collection)`.

### Collection 12: specs fixed, screenshots deliberately not re-captured

The count-gate fault is fixed - `tournamentListReady()` in `lib/kb.ts`, used by
12.1, 12.2, 12.3, 12.5, 12.6, 12.8 and 12.11. All eight tests pass.

**Deliberate divergence, decided 2026-08-28:** collection 12 is NOT to be re-run.
The published screenshots stay as they are. A re-run today yields 19 of 52 captures
differing from what is live - six visibly (12.1/01, 12.2/01, 12.3/04, 12.5/09,
12.6/02, 12.8/01, all showing the tournament list) and thirteen by about 0.011% of
their pixels. All 19 would take new content hashes and new URLs. The articles
themselves remain accurate: the screenshots show a demo account with fewer
tournaments, which misleads nobody.

Do not "fix" this by re-capturing without being asked.

Next: `/kb-brief 13`.

### 2026-08-28 - collection 13 complete. Eleven articles, all drafts.

| Article | Intercom ID | Shots | Pinned commit |
|---|---|---|---|
| 13.1 | 16735803 | 4 | cb332f5 |
| 13.2 | 16735807 | 4 | 902a84d |
| 13.3 | 16735812 | 5 | b730216 |
| 13.4 | 16735813 | 4 | dea8dc0 |
| 13.5 | 16735816 | 3 | 33b6313 |
| 13.6 | 16735818 | 3 | 6f70fde |
| 13.7 | 16735824 | 6 | eef0a89 |
| 13.8 | 16735828 | 6 | 4dc2262 |
| 13.9 | 16735843 | 5 | 7931748 |
| 13.10 | 16735857 | 5 | 8c3747a |
| 13.11 | 16735884 | 10 | 4805124 |

55 screenshots, all in Intercom collection `19733982`. Every image URL embedded
in the stored bodies was re-fetched at the end: all 55 return 200 with an
`image/*` content type. No article carries `<ol start=`. **Every one is a draft.
Nothing is published and nothing has been reviewed.**

**One article retitled.** 13.8 "Brackets in a padel tournament, and filling them
automatically" is published as **"Brackets in a padel tournament"**. Fill
automatically and Clear are group controls, not bracket ones: they sit in the
padel Group Phase card and send `PUT /tournament-groups/:id` with
`autofillStrategy` or `clearAssignments`. The autofill material is in 13.2, which
is the article about how pairs are grouped.

**One extra screenshot.** 13.11 has 10 rather than the mapped 9. End Phase needs
both its card and its confirm dialog, and the card alone does not show what
confirming does.

**Four map notes were wrong, and are corrected in the brief:**

- Padel's **Configuration** is a button that opens a dialog, not a sub-tab.
- A group-only tournament shows the full Phases board with **Edit Group Phase**
  and **Delete Group Phase**. What it has no trace of is the phase banner on
  **Results**. The banner appears only when there is something to do.
- Only the **last** phase carries a Delete control - the reverse of the
  2026-08-28 note in this file, which had football as "Edit/Delete Group Phase,
  Edit Knockout Phase".
- Football's **Add Team** on a bracket slot opens a menu of positions (1st Group
  A ... Bye), not of teams. A second control, the round **+**, opens a team
  search. Both are in 13.9.

**Also found:** padel phase cards carry fewer controls than football's. Football
Group Phase has Edit; Knockout Phase has Edit and Delete. Padel Group Phase has
neither, and its Knockout Phase has Delete only - a padel phase cannot be
renamed.

### The padel format save is now automatable

Collection 12 recorded that the two-step padel Format screen "was never captured
on the wire" and left its seed able only to check the result. It was captured
this session. It is a plain **`PUT /tournaments/:id`** - the same call football's
format save uses - carrying `padelFormat`, `padelStandingType`,
`padelScoringPoints`, the win/loss/draw points, `padelMin/MaxPlayers`,
`padelRoundCount`, `padelCourtCount` and `padelRoundGapMinutes`. `teamIds` is
empty on a first save and the server generates the pairs.

`scripts/seed-13.mjs` builds both padel fixtures from nothing, with no hand work.
The call is in `config/api.md`, along with twenty other group, bracket and phase
endpoints read off the wire this session.

### Fixtures

Six tournaments under `kb-organiser-13@yopmail.com`, all built and reconciled by
`node scripts/seed-13.mjs` (idempotent - a second run makes zero writes):

| Name | Game | State | Used by |
|------|------|-------|---------|
| KB 13 Cup | Football | Group and Knockout, 8 teams, nothing played | 13.1, 13.3, 13.7, 13.9, 13.11 |
| KB 13 Summer Cup | Football | the same, group phase fully scored, bracket drawn from group positions | 13.5, 13.11 |
| KB 13 League | Football | Round Robin, one phase, nothing played | 13.11 |
| KB 13 Sunday League | Football | Round Robin, one phase, every match scored | 13.11 |
| KB 13 Padel Cup | Padel | Swiss, 8 players, nothing played | 13.2, 13.4, 13.8, 13.10 |
| KB 13 Padel Open | Padel | Swiss, 8 players, group matches scored | 13.6 |

The seed reconciles rather than appends: stray phases are deleted, bracket slots
are cleared or re-drawn, group draws are re-ordered, the padel configuration is
reset, and a knockout phase left started is undone. That matters because three
specs mutate their fixture on purpose.

### Capture defects found and fixed in the specs

- **13.11/04** had the header-identity mask painted across the preview dialog's
  explanatory paragraph. The dialog is the widest in the app. Clipped to the
  dialog instead, which needs no mask.
- **13.11/05** clipped to the whole next-phase column, which is taller than the
  modal's scroll area, so the capture stitched in the page underneath. Clipped to
  one match card.
- **13.5/02 and 13.6/02** annotated the column heading row, which is the top row
  of the clip, so only the outline's lower border survived. `shot()` now takes an
  `annotatePad`, and these two use a negative one.
- **13.2/03** outlined Fill automatically only, leaving Clear outside a shot
  whose step is about the pair. Outlines the row that holds both.
- **13.9/02** cut the position menu off the bottom of the viewport. New
  `alignTop()` helper moves the trigger up first. The menu still scrolls - it has
  a fixed maximum height and shows six and a half of its nine options.
- **13.10/02** was cut off at Loss points as a viewport shot. Clipped to the
  dialog, which is cleaner, though the dialog scrolls internally and the last two
  fields are still below its fold. They are readable in 13.10/05.

### Determinism, and where it was left

Three things made captures differ between runs and are fixed:

1. **A spec that mutates its fixture must put it back itself.** 13.9 fills a
   bracket slot. Leaving the seed to clear it changed nine screenshots across
   13.1, 13.3 and 13.7, which photograph the same board.
2. **Clipped captures need a known scroll position.** Playwright scrolls a
   clipped element into view from wherever the page already was; a fractional
   device-pixel difference re-renders every glyph's antialiasing. 1.5% of the
   pixels on the padel bracket board. `shot()` now scrolls to the top first.
3. **The Results tab paints its table before its fixture list.** New
   `fixturesReady()` gates on a match card's status chip, not on the FIXTURES
   heading, which renders before the list has anything in it.

**Left deliberately, on the repo owner's instruction during this run:** one or
two captures per pair of runs still differ by a fraction of a percent of their
pixels, from font antialiasing. That was judged not worth chasing. A re-run gives
those files a new content hash and therefore a new URL; the image is the same
image.

### Worth a look, and worth a ticket

- **The board's Group and Bracket buttons appear to do nothing.** Every phase
  card has a **Group** and a **Bracket** button, and the bundle has
  `POST /tournament-groups` and `POST /tournament-brackets` behind them. Clicking
  either on KB 13 Cup fired no request and changed no state, three times. The
  **Phase** button beside them works on the first click, with no dialog and no
  undo. No article documents adding a group or a bracket. This looks like a bug.
- **The number fields in Padel Configuration barely accept typing.** The caret is
  forced back to position 0 on every render, so Backspace never deletes and a
  typed digit is prepended - typing "2" over "4" leaves "42". The stepper works,
  but a second press in the same session puts the value back up. 13.10 tells the
  reader to use the stepper.
- **13.6 says SCORE is "the points the pair won across its matches".** That
  matches the fixture's numbers and the way the column moves, but it was not
  confirmed against a spec or a product owner. Look hard at that sentence.
- **Dragging a team across a group boundary was not tried.** Dragging within a
  group is verified and persists. 13.1 claims reordering inside a group only.

### Where to look hard in the drafts

13.6's SCORE definition, above. 13.11's steps 9 and 10: the End Phase card and its
confirm were photographed on a one-phase tournament and the button was never
clicked, because ending a phase cannot be undone - so what happens after
confirming is described, not shown. And 13.9's claim that the slot menu lists
positions: it lists real team names instead once the feeding group has been
played, which the article says but no screenshot shows.

No flakes. The eleven specs were run repeatedly through the session and never
failed once the selector fixes were in.

Next: `/kb-brief 14`.

### 2026-08-28 - collection 14 complete. Eight articles, all drafts.

| Article | Intercom ID | Shots | Pinned commit |
|---|---|---|---|
| 14.1 | 16736750 | 5 | 56e7a37 |
| 14.2 | 16736752 | 5 | 55d7723 |
| 14.3 | 16736753 | 5 | 20abd3e |
| 14.4 | 16736755 | 5 | 835cf7d |
| 14.5 | 16736756 | 6 | 679f8c9 |
| 14.6 | 16736757 | 4 | 7623051 |
| 14.7 | 16736759 | 4 | 11b79d9 |
| 14.8 | 16736763 | 3 | ff82913 |

37 screenshots, exactly the 37 the map estimated, all in Intercom collection
`19733983`. Every image URL embedded in the stored bodies was re-fetched at the
end: all 37 return 200 with an `image/*` content type. No article carries
`<ol start=`. **Every one is a draft. Nothing is published and nothing has been
reviewed.**

### The finding that shaped four of the eight articles

**Bulk Match Updates disables the gap field exactly when it is needed.** The
dialog has a checkbox, **Same start time per round**, whose help text promises
*"Matches in one round share a start time. The next round starts after the round
gap."* It defaults to **ticked**, and while it is ticked **Duration** and **Time
between matches** are both disabled - `disabled: isSubmitting ||
watch("sameStartTimePerRound")` in the bundle.

The server is not at fault. `PUT /tournament-groups/:id` with
`sameStartTimePerRound: true` **and** a `timeBetweenMatches` does exactly what
the help text says: rounds share a kick-off and the next starts one gap later.
Verified on the wire - 09:00, 09:25, 09:50, 10:15 on a 25-minute gap. The form
just will not let you send it.

So through the UI, ticking the box always collapses **every fixture in the group
onto one kick-off time**. On football it is worse, because a football group has
no rounds at all: the whole group counts as one. Six fixtures at 10:00 with one
team needed in three of them.

That is 14.6's clash, and it is the dialog's own default doing it. **Worth a
ticket.** No article works around it - 14.3 tells the reader to untick the box,
14.6 explains the state they land in if they do not.

### One article retitled

**14.5 "Rescheduling, rolling and deleting fixtures" is published as
"Rescheduling fixtures, and rolling them onto the next day".** A tournament
fixture cannot be deleted. The Schedule tab's cards carry a status chip, a View
button and four editable cells, and no menu; View goes to `/match/:id/preview`,
which is titled "Match Preview (View Only)" and has no menu either. The bundle
does hold `DELETE /matches/:id` behind a **Cancel Match** action, but that action
belongs to the general match card used elsewhere in the product and is not
rendered for a tournament fixture. Checked on both screens.

The map's own note for 14.5 already scoped the article to "SELECT MATCH TO
UPDATE, BULK MATCH UPDATE", so deletion looks to have been speculative. The
article says outright that fixtures cannot be deleted and points at 13.3.

### Three more things the map had wrong

- **The round gap is not in the bulk dialog.** It is **Gap between rounds
  (minutes)** in the **Padel Configuration** dialog on the Format tab. 14.4
  covers the dialog for rounds and courts and steps across to Format for the gap.
- **The two sports are not scheduled by different machinery.** The same dialog
  serves both and differs by one word - football says **Pitch number**, padel says
  **Court number**. What differs is the generated default, and either can be
  turned into the other. Both were done on the wire.
- **14.8's dialog offers Excel as well as PDF**, and exporting needs Tournament
  Pro (on Basic the button opens an upgrade prompt). The article keeps its mapped
  title, names Excel, and states the Pro requirement.

### Fixtures

Six tournaments under `kb-organiser-14@yopmail.com`, all built and reconciled by
`node scripts/seed-14.mjs` (idempotent - a second run makes zero writes):

| Name | Game | Schedule | Used by |
|------|------|----------|---------|
| KB 14 Cup | Football, Group and Knockout | groups 10:00-10:50 and 11:00-11:50, bracket 12:00-13:00 | 14.1, 14.8 |
| KB 14 League | Football, Round Robin | one group, 10:00-10:50 | 14.3, 14.5 |
| KB 14 Padel Cup | Padel, Swiss | four rounds at 10:00 / 10:20 / 10:40 / 11:00, courts 1 and 2 | 14.2, 14.7 |
| KB 14 Padel Open | Padel, Swiss | the same | 14.4 |
| KB 14 Clash Cup | Football, Group and Knockout | **broken on purpose**: Group A all on one kick-off, Group B with a spare slot so four fixtures carry one team | 14.6 |
| KB 14 Padel Clash | Padel, Swiss | **broken on purpose**: every match at 10:00 on court 1 | 14.7 |

The two broken ones are seeded broken rather than broken by a spec. 14.6 and 14.7
explain a schedule that has already gone wrong, and a spec that broke a shared
fixture would change what three other articles photograph.

### Determinism

Collection 13's three rules held, and two things were added.

- **14.3, 14.4 and 14.5 each restore their own fixture.** The target states and
  the restore calls live in `lib/fixtures-14.mjs`, which the seed reads too, so a
  spec cannot drift from what the seed expects. Confirmed after the full suite
  ran: the seed reports every fixture already correct and makes no writes.
- **A padel group's court numbers cannot be restored by another bulk update.**
  The dialog's Court number field writes ONE court across every match it touches.
  Only regenerating from the format brings back "Round 1 - Court 1" on court 1 and
  "Round 1 - Court 2" on court 2 - and re-sending an identical configuration does
  not regenerate, so the gap is nudged by a minute and put straight back.
- **`scheduleReady()` gates on a fixture's own status chip**, accepting
  `Incomplete` as well as `Scheduled`, because a knockout fixture and a one-team
  fixture never read Scheduled. The `.first()` goes on the OUTSIDE of the `or`:
  KB 14 Clash Cup shows both chips at once and an or of two single locators then
  resolves to two elements and fails strictly.
- **Upper case on this tab is CSS, not content.** GROUP A, BULK MATCH UPDATE,
  ROUND 1 and EXPORT FIXTURES are all `text-transform: uppercase`, so their
  accessible names are `Group A`, `Bulk Match Update`, `Round 1` and
  `Export Fixtures`. Matching the rendered casing finds nothing. Cost two failed
  specs before it was spotted.

### Capture defects found and fixed in the specs

- **14.1/04** was the same viewport frame as 14.1/01 with one outline added, so
  the reader got the same picture twice. Clipped to the phase-tab strip instead.
- **14.1/05** was centred on a bracket card far taller than the frame, which
  pushed the QUARTER-FINALS heading off the top - two of the three round headings
  the shot exists to show. Uses `alignTop()` now.

### Worth a look, and worth a ticket

- **The disabled gap field, above.** The clearest defect this project has found so
  far, and it is reproducible from the API in both directions.
- **The exported PDF is titled after the first phase only.** With all three
  sections ticked the file came out named for the Group Phase and headed
  "KB 14 Cup - Group Phase - Fixtures", but its table held the Knockout Phase rows
  too. Cosmetic. 14.8 does not mention the title.
- **A knockout fixture's date reads with a leading comma** - ", Sep 19 2026"
  rather than "Sat, Sep 19 2026". Bracket cards only. Visible in 14.1/05. No
  article mentions it.
- **The pitch cell on a fixture card only responds to a dispatched click.** A real
  mouse sequence opens and closes it. That is now the third control to behave this
  way, after the venue add button in 12.3 and the padel player count in 12.11.
  Firmly a house pattern.

### Where to look hard in the drafts

**14.8's description of the exported file.** The spec stops at the dialog and
cancels; the file's contents were read by hand once, during step 1, by decoding
the PDF. Excel was never exported at all, and 14.8 names it as an option without
claiming anything about it.

**14.6 and 14.7's fixes.** Both articles tell the reader how to undo a broken
schedule. Untick-and-update was verified. Rebuilding a padel group's courts by
saving Padel Configuration was verified over the API but not clicked through the
dialog end to end, because saving it rebuilds the fixture three other articles
photograph.

**14.5's claim that a fixture cannot be deleted.** Checked on the Schedule tab
and on the match page, and by searching the bundle. It is the strongest negative
claim in the collection, and a negative is the kind of thing worth a second pair
of eyes.

No flakes. The eight specs were run repeatedly through the session and never
failed once the selector fixes were in.

Next: `/kb-brief 15`.

### 2026-08-29 - collection 01 complete. Seven articles, all drafts.

| Article | Intercom ID | Shots | Pinned commit |
|---|---|---|---|
| 01.1 | 16738263 | 8 | e7f99e3 |
| 01.2 | 16738266 | 4 | 7e42a7d |
| 01.3 | 16738270 | 4 | 89ab3a1 |
| 01.4 | 16738275 | 12 | ad60ed9 |
| 01.5 | 16738278 | 8 | 9b84df4 |
| 01.6 | 16738281 | 3 | fe7fff8 |
| 01.7 | 16738286 | 4 | 4936e45 |

43 screenshots, all in Intercom collection `19733970`. Every image URL embedded in
the stored bodies was re-fetched at the end: all 43 return 200 with an `image/*`
content type. No article carries `<ol start=`. **Every one is a draft. Nothing is
published and nothing has been reviewed.**

The commit column is filled in from `state/manifest.json`, which carries the exact
SHA each article's images are pinned to.

### The finding that shaped the seed

**`POST /admins/users` does not make the account a reader has**, and collection 01
is the first collection where that matters. It also creates
`<Name>'s leaderboard`, and a Free account may hold exactly one - so an
admin-created persona opens **Leaderboard Limit Reached** where a reader opens the
create form, which is half of 01.5. It also leaves `gender`, `sports` and
`position` empty, so Profile settings reads *4 highlighted fields are still
missing* instead of the *1* a reader sees, which is the whole of 01.6.

`scripts/seed-01.mjs` creates the account that way and then brings it to a
reader's state: a password through Identity Toolkit's `accounts:update`, Step 1's
fields through `PUT /users/:id`, and the leaderboard deleted. Compared against a
real signup on screen afterwards: same two default teams, same
`1 highlighted field is still missing.` on both sections, same Change Password
panel.

**Every collection that photographs a leaderboard or a profile checklist should
read that paragraph before seeding.**

### CHANGED mid-run - yopmail started demanding a CAPTCHA

Three of these flows finish in the reader's inbox: the signup verification code,
the password-reset link, and a team invitation. `config/personas.yaml` anticipated
that and put every persona on yopmail. It worked - `lib/mail.mjs` reads a yopmail
inbox, and the first version of this seed signed the persona up for real and read
the six-digit code back.

Partway through exploration **yopmail began answering "Complete the CAPTCHA to
continue"**, and every mail-reading path stopped at once. Completing a CAPTCHA is
not something this project may do. Three consequences, all written into
`briefs/01.md`:

- **The seed no longer touches a mailbox.** It reaches the same state over the API.
  This is strictly better and should stay that way even if yopmail recovers.
- **01.4 photographs the wizard in two passes on one address.** Step 1 and the code
  screen are only visible while the account is unverified; Create Leaderboard and
  Step 3 only open once it is verified; nothing returns the code over the API. So
  the spec signs the address up for real, photographs the first six screens, then
  rebuilds the same address on the far side of verification and photographs the
  rest. Every frame is a frame a reader sees, in the order they see it. What the
  spec no longer proves is that typing the code is what moves between them.
- **01.3 lost a screenshot.** Planned shot 05 was the screen an invitation link
  opens. That link exists only inside the invitation email. The article keeps that
  half as prose, and the prose is verified - see below.

**`lib/mail.mjs` is kept.** It works, the flows it reads are real, and 20.2 will
want it. Nothing depends on it now.

### What 01.3 says without a screenshot, and how it was verified

Somebody added to a team by email has a player row and **no account**.
`POST /users/reset-password` answers 200 for that address and **sends nothing**,
while the app still shows "Check Your Email". Watched on the inbox during step 1:
the invitation arrived, the reset never did. The invitation link opens
`/signin?token=<jwt>` with the address filled in from the token, and the way
through is **Create an account** with that same address - after which the
invitation is waiting at Step 3. Confirmed end to end by signing an invited address
up and reading `GET /team-invitations` back.

01.3's fourth capture is the real reset form, opened by its own path rather than by
following the link: `/resetPassword` renders identically with no code, with an
invalid one and with a real one, checked all three ways. The spec does not submit
it. What happens after submitting was watched twice by hand: you are signed in and
land on the home page, and `/passwordUpdated` - which exists, and reads "Password
updated!" - is never rendered.

### Six things the map or the reference had wrong

- **The verification screen is not reached from `/signup`.** Signing up lands on
  **Step 1, Personal information**, and the code screen only opens once Step 1 is
  submitted. 01.1 therefore has to show Step 1 to reach its own end point. It gives
  it two shots and points at 01.4.
- **A brand-new account already owns two teams.** `POST /users` creates
  `<First> <LastInitial> FC` and `... Away`. The Teams screen is never empty, and
  01.5 says so in its first line.
- **A wrong password and an unknown address give the same message** -
  *The credential is invalid or has expired.* Firebase does not distinguish them.
  01.2 says so rather than promising a message the reader will not get.
- **The profile checklist really is in the sidebar**, as the map's title says.
  Select your name and the block opens to show **Complete your profile (2)**.
  Selecting it lands on `/profile-settings#date-of-birth-field` - the app jumps you
  to the first outstanding field.
- **Team size has no default.** The `5 VS 5` on the Add Team dialog is placeholder
  text; submitting without choosing gives *This field is required.*
- **There is no screen labelled Step 2.** The screens say Step 1, Step 3 and Step 4;
  the message catalogue defines step1 to step6; the code screen carries no label.

### Fixtures

Seven accounts under `kb-fresh-01@` and `kb-01-*@`, all built and reconciled by
`node scripts/seed-01.mjs` (idempotent - a second run makes no writes to the
persona):

| Account | State | Used by |
|---|---|---|
| kb-fresh-01@ | verified, password set, Step 1 fields set, two default teams, **no leaderboard** | 01.2, 01.5, 01.6 |
| kb-01-signup@ | **must not exist** - 01.1 signs it up and leaves it unverified | 01.1 |
| kb-01-wizard@ | **must not exist** - 01.4 signs it up, then rebuilds it | 01.4 |
| kb-01-reset@ | exists with **no password**, rebuilt every run | 01.3 |
| kb-01-owner@ | owns `Ola K FC`, one invitation out | 01.3 (prose) |
| kb-01-invited@ | **must not exist**, invitation waiting | 01.3 (prose) |
| kb-01-delete@ | exists; 01.7 deletes it and recreates it | 01.7 |

`kb-01-reset@` is torn down and remade every run on purpose: Firebase refuses a
reset that does not change the password, so it has to start with none.

### Determinism

Collections 13 and 14's rules held. Five things are specific to these screens and
live in `lib/kb.ts`:

- **The promotional banner is blocked, not dismissed.** `blockPromos()` fulfils
  `GET /promo-campaigns/active` with empty data. Dismissing it writes the
  dismissal to the account, which would make the first run differ from the second.
- **The home page's TRENDING feed is never in a capture.** It is global activity -
  other people's teams, other collections' tournaments. Both home captures are
  clipped to the profile header.
- **`unstickHeader()` before any tall clip.** The header is `position: sticky`, so
  on a page taller than 900px it paints over the top of the clip. The first run of
  01.1 lost the "Step 1" label to it. A full-page capture is worse - the header
  lands in the middle of the image.
- **A list that opens is captured as a viewport, not clipped.** Every dropdown here
  is portalled outside its dialog and several open upwards, so a clip to the dialog
  is a floating list over a box the reader cannot see.
- **`accounts:update` revokes every token Firebase has issued for that user.** The
  session that set the password is dead immediately afterwards. Cost one failed
  seed run.

Masked: the verification countdown, "Joined Since ..." in the profile header, and
"Created on ..." on a leaderboard card. **Not** masked: the persona's name and
address in 01.6's sidebar capture, because that block is the article's subject.

### Capture defects found and fixed in the specs

- **01.1/03 and 01.1/04** were full-page captures with the sticky header stitched
  into the middle of the image, on top of the First name field. Clipped to the card
  and `unstickHeader()` added.
- **01.1/02** carried the "This email is already in use" line from the error state
  captured just before it - the message stays until the page is reloaded. The spec
  reloads.
- **01.5/03** clipped to the dialog and caught a floating list over a blank box.
  Captured as a viewport.
- **01.5/05** caught the new team's row before its Leaderboards, Matches and Members
  counts arrived. The spec reloads first.
- **01.7** matched `DELETE ACCOUNT` as text. The capitals are a CSS
  text-transform - the same trap collection 14 hit on GROUP A. Matched by role.

### Worth a look, and worth a ticket

- **Forgot password on an address with no account reports success and sends
  nothing.** `POST /users/reset-password` answers 200 and the app shows "Check Your
  Email". Anybody invited to a team by email is in exactly that state. The clearest
  defect this collection found.
- **`/selectClubLocation` is labelled Step 4 and nothing navigates to it.** The
  route name occurs once in the whole bundle, in the enum that defines it. Either a
  step was dropped from the wizard, or the screen should go.
- **`/passwordUpdated` is never rendered.** The route exists and reads "Password
  updated! ... Go to Login". Resetting signs you in and lands on the home page.
- **`/padel-level` sits in the onboarding chain for padel players** and was not
  walked. 01.4 documents the football path only. A padel wizard article may be
  wanted, the way collection 12 needed 12.11 and 12.12.

### Where to look hard in the drafts

**01.3.** It is the article with the least mechanical backing: one of its five
planned captures is missing, its fourth was reached by URL rather than by the link,
and everything it says about the invited half is prose. All of it was verified by
hand, none of it by a spec.

**01.4's step 6.** The spec no longer types the verification code, so the join
between the first six screens and the last six is asserted rather than replayed.

**01.2 and 01.7's claim that a disabled account says something different.** The
message text comes from the bundle's error map and was never seen on screen - no
endpoint on staging can disable an account.

No flakes. The seven specs were run repeatedly through the session and never failed
once the selector fixes were in.

### Collections 02 and 03 merged - 2026-08-29

Four articles dropped on the repo owner's instruction: 02.3 installing the app,
02.5 cookies and ads, 02.6 the embeddable widget, and 03.4 player statistics
explained. What was left - three navigation articles and five profile ones - is
one collection of eight.

**Collection 02 is now "Finding your way around & your profile", persona
`player`, account `kb-player-02@yopmail.com`.** Articles renumbered 02.1 to 02.8:
navigation first, then profile.

**Collection 03 is retired.** Its Intercom collection `19733972` is empty and
nothing publishes into it. The entry stays in `config/intercom.yaml` marked
`retired: true` so the id is not silently reused.

**No other collection was renumbered.** 04 to 24 keep their ids. Briefs, specs,
screenshot paths and `state/manifest.json` all reference them, and 12, 13, 14 and
01 are already drafted in Intercom under those ids. The map now runs 01, 02,
04...24 - 23 collections, 149 articles, 823 screenshots.

Next: `/kb-brief 02`.

### 2026-08-29 - collection 01, 01.3 retitled and shortened

At the repo owner's request, **01.3's "Setting a password on an invited account"
section is gone**, and the article is retitled from the map's "Resetting your
password, and setting one on an invited account" to **"Resetting your password"**.

Republished by PUT against the existing Intercom id `16738270`, so no duplicate and
no new screenshot URLs - its four images stay pinned to `89ab3a1`. Re-fetched
afterwards: still a draft, still in `19733970`, four images all 200 `image/*`, no
`<ol start=`, no trace of the dropped section.

`config/articles.yaml` keeps the mapped title, the way 13.8 and 14.5 were handled.
`briefs/01.md` and `specs/01/01.3.spec.ts` record the retitle and why.

**One "If it does not work" bullet was reworded.** It used to send the reader to
the dropped section - "you probably have no account with that address - see the
section above". It now stands on its own.

**The screenshots did not change.** Re-running the spec regenerated four identical
captures under their pre-hash names; they were deleted rather than re-finalised, so
the published files and their URLs are untouched.

**Two accounts are now unused.** `kb-01-owner@` and `kb-01-invited@`, and the
invitation between them, existed only for the half that has gone. The seed still
builds them - deleting accounts nobody asked to delete is not this session's call -
and `briefs/01.md` marks them unused in both the personas table and the fixtures
table. Drop them from `scripts/seed-01.mjs` when somebody confirms.

**The finding behind that section still stands, and no article now carries it:**
`POST /users/reset-password` answers 200 for an address with no Firebase account
and sends nothing, while the app shows "Check Your Email". Anybody invited to a
team by email is in exactly that state. It is in `config/api.md` and in this log,
and it is still worth a ticket.

### 2026-08-29 - collection 01, Google/Apple wording, and four articles were published by the reviewer

**Wording, at the repo owner's request.** 01.1's "Signing up with Google or Apple"
section is gone; the two providers are named in step 1 instead, with the note that
they rejoin the procedure at step 4. 01.2's equivalent section was rewritten as a
short list. Both republished by PUT against their existing ids - `16738263` and
`16738266` - so their screenshots keep their URLs and stay pinned to `e7f99e3` and
`7e42a7d`.

Also fixed while in those files: 01.1 and 01.2 both linked to 01.3 under its old
title. Both now say "Resetting your password".

### The reviewer published 01.4, 01.5, 01.6 and 01.7 - and the manifest did not know

Checking the drafts after the republish showed four of the seven reading
`state: published`. **Nothing in this session published them.** The evidence:

- all seven were created 19:21-19:24, by the step-2 run;
- 01.4 to 01.7 were updated at **19:57:57-19:57:58**, four articles inside one
  second, with no call from here at that time - a bulk publish in the Intercom UI;
- 01.1 to 01.3 were updated at 20:03 and 20:07, which are this session's PUTs.

That is the intended workflow: the human reads the drafts in Intercom and publishes
the ones they are happy with. Nothing needs undoing and nothing was undone.

**But it left a live hazard.** `state/manifest.json` still recorded those four as
`draft`. `scripts/publish-article.mjs` only omits `state` from its PUT when the
manifest says `published` - so the next `/kb-publish 01`, or any re-run of one of
those four, would have sent `state: "draft"` and **knocked four live articles off
the help centre**. The script's guard was working exactly as designed; it was
reading a stale record.

The manifest now records what Intercom actually holds. Verified by re-running
`node scripts/publish-article.mjs 01.7`: it printed *"01.7 is already published;
leaving its state untouched"* and the article came back `state=published`.

**Worth carrying into every later collection.** A run that finishes, and a human
who starts reviewing before the next session, is the normal case - so the manifest
is stale by default, not by accident. Step 2 should reconcile the manifest against
Intercom before it publishes anything, rather than trusting what it wrote last
time.

### Where collection 01 stands

| Article | Intercom ID | State |
|---|---|---|
| 01.1 Creating your Scoryboard account | 16738263 | draft |
| 01.2 Signing in, and common sign-in problems | 16738266 | draft |
| 01.3 Resetting your password | 16738270 | draft |
| 01.4 The setup wizard - what each step does | 16738275 | **published by the reviewer** |
| 01.5 Setting up your first team and leaderboard | 16738278 | **published by the reviewer** |
| 01.6 The profile checklist in your sidebar | 16738281 | **published by the reviewer** |
| 01.7 Deleting your account, and why an account may be disabled | 16738286 | **published by the reviewer** |

43 images across the seven, all still 200 `image/*`, none carrying `<ol start=`.

### 2026-08-29 - collection 02, complete. Eight drafts on Intercom.

| Article | Intercom ID | Shots | State |
|---|---|---|---|
| 02.1 The main navigation and your home feed | 16738968 | 6 | draft |
| 02.2 Searching for players and teams | 16738970 | 3 | draft |
| 02.3 Getting help and contacting support | 16738971 | 3 | draft |
| 02.4 Profile settings - what you can change | 16738974 | 5 | draft |
| 02.5 Your profile photo, banner and bio | 16738975 | 7 | draft |
| 02.6 What your public player profile shows | 16738976 | 4 | draft |
| 02.7 Your teams, rankings and match history | 16738977 | 4 | draft |
| 02.8 Comparing your stats with other players | 16738979 | 4 | draft |

36 screenshots, matching `briefs/02.md` and the map exactly - nothing added,
nothing dropped. All eight sit in Intercom collection **19733971**. The retired
`19733972` was checked at the end of the run and holds nothing.

Image URLs are pinned to **`2000806a276fe05ecc19821ed91a3f135a369fc4`** on branch
`kb/collection-02`, pushed. All 36 were re-checked inside the published article
bodies afterwards: 36/36 return `200 image/*`, and no article carries `<ol start=`.

**Nothing is published. The eight drafts are unreviewed.**

#### Three tooling faults found here that affect every collection

- **`page.route()` has never worked.** The app registers a service worker, and a
  request a service worker makes does not reach Playwright's route handler.
  `playwright.config.ts` now sets `serviceWorkers: 'block'`. Until today,
  collection 01's `blockPromos()` had never blocked a promo campaign - what hid
  the banner was `quiet01()`'s stylesheet. Any collection whose specs rely on an
  interception should be re-checked.
- **URL globs do not reach past a query string.** `'**/promo-campaigns/active**'`
  never matched `.../active?screen=Home`. `blockPromos()` and
  `onlyOurActivities()` now take a URL predicate.
- **`imagesPainted()` could hang for ever.** A hidden duplicate of
  `registered.svg` on a player profile reports `complete: false` permanently while
  still having a `naturalWidth`. It now ignores images with a zero-sized box.

#### A product defect this collection had to document

**Changing your profile photo deletes your bio.** The settings page saves a new
photo with `PUT /users/:userId {"avatarToken": "..."}` and nothing else, and that
PUT is a full replace for optional fields, so `bio` comes back `""`. Gender, date
of birth, sports and position survive because they are required. Isolated on
staging: read the bio, change nothing but the photo, read the bio again. The
banner does the same.

02.5 is written around it - photo, then banner, then bio - and both 02.4 and 02.5
carry an "If it does not work" bullet for it. It is in `config/api.md`. It is
worth a ticket.

#### Five more behaviours now recorded in config/api.md

1. `POST /players/avatar` and `POST /players/:playerId/banner` accept **WebP
   only**. A PNG is refused `415 "Unsupported file type"`, even though the page
   says "JPG, GIF or PNG" - its cropper re-encodes in the browser first.
2. **A finished match is permanent.** It cannot be reopened, edited or deleted,
   and the player statistics it wrote survive even deleting the team it was played
   for. A match dated in the past also auto-starts a second or two after creation,
   so an event written too early is lost for good.
3. Match event `teamType` is `HomeTeam` / `AwayTeam`. Lineup positions are the
   app's enum - `CenterBack`, `CentralMidfielder` - not the labels the profile
   form shows.
4. Player statistics are written **asynchronously** after a match finishes: zeroes
   a second later, correct a minute later. The seed and three specs poll.
5. On the Free plan a team owner may add each friend to **one** team only -
   `400 ONE_FRIEND_PER_TEAM`.

#### What differed from the brief

Three shots were re-scoped after looking at them. The brief was edited and says so:

- **02.4/03** clips the whole Basic information card rather than the My bio row.
  Discard and Save Changes belong to the form, not to either row, and there is no
  wrapper holding My bio and the buttons without Personal details - so a clip to
  the row put the annotation outside the capture.
- **02.6/03** clips the column holding My bio, the tiles, Team rank and Teams
  rather than the tile grid alone. The grid on its own was the same picture as
  02.1's.
- **02.6/04** switches to Past Matches first. The panel opens on Upcoming, and a
  capture of that is a tall empty box reading "No matches yet, stay tuned!" - it
  showed the missing Create Match button only by absence and read as an error.

Also corrected in the brief: the compare arrows mark the **larger** number, not
the better one. A higher Loss count gets a green arrow.

#### One documented departure from personas.yaml

`personas.yaml` says the player persona belongs to "two teams she does not own".
She belongs to one, because a Free owner may add a friend to only one of his teams
and the owner here is Free on purpose. Her Teams panel still holds three.

#### Deliberately not produced

- **The Contact Us confirmation.** `POST /contacts` emails Scoryboard support, and
  a spec meant to be re-run must not send one every run. 02.3 fills the form and
  stops; the spec aborts the request if a later edit ever adds the click. The four
  validation messages the article quotes were produced by selecting Submit on an
  empty form, which sends nothing.
- **The Pro upgrade from inside the Compare gate.** Selecting it would make the
  persona Pro and break the other seven articles.

#### Two devices in the specs worth knowing about

- **02.1's Trending shot is filtered.** `GET /activities` is a global feed -
  other collections' fixtures and other people's accounts - which
  `docs/style-guide.md` forbids in a capture and which drifts every run. The spec
  routes the call and keeps only entries naming this collection's own fixtures.
  Real payload, narrowed; nothing invented. The relative timestamps are masked.
- **02.5 restores the images it changed.** The page's cropper stores a zoomed
  centre band rather than the file it was given, so the spec re-uploads the seed's
  own copies at the end. Without that, the persona's banner looked one way in the
  articles captured before 02.5 and another way after it, purely by run order.

#### Where to look hard in the drafts

- **02.4 and 02.6 carry two sentences that were reasoned, not seen.** 02.4 says
  the Change Password box is replaced by a line naming your sign-in method when
  you did not use a password - that comes from collection 01's observation, not
  from this run. 02.6 says your email address and date of birth are not on your
  public profile - true of the capture, but nothing was found that guarantees it.
- **02.2's result lists are global.** Both search terms were chosen to match only
  this collection's fixtures, but nothing stops another account creating a team
  called "KB 02 something" and appearing in a re-run.
- **The Views counter** was masked everywhere. It rose from 0 to 1 the moment
  another account opened the profile, so it counts visits, but whether it counts
  unique visitors was not established.
- **`/profile-view`** is in the app's route list and nothing navigated to it. The
  public profile documented here is `/player/:playerId`.

#### Flakes

None. The nine specs were run repeatedly through the session - the full suite four
times - and never failed once the selector fixes were in.

#### Not committed to master

Everything is on `kb/collection-02`, pushed. The image URLs resolve from that
branch's commits. Merging is the human's call.

Next: `/kb-brief 04`.

### 2026-08-29 - collection 07 complete. Eleven articles, all drafts.

| Article | Intercom ID | Shots | Pinned commit |
|---|---|---|---|
| 07.1 | 16740184 | 8 | b7b1595 |
| 07.2 | 16740185 | 5 | f233020 |
| 07.3 | 16740186 | 5 | f7eebab |
| 07.4 | 16740187 | 7 | 61e6b21 |
| 07.5 | 16740189 | 9 | a70f712 |
| 07.6 | 16740195 | 5 | 4e858a9 |
| 07.7 | 16740215 | 5 | 75e91d5 |
| 07.8 | 16740236 | 5 | a3816ec |
| 07.9 | 16740266 | 6 | a5c005c |
| 07.10 | 16740286 | 5 | 2d3bfc5 |
| 07.11 | 16740298 | 3 | af73b43 |

63 screenshots, exactly the 63 the map estimated, all in Intercom collection
`19733976`. Every image URL embedded in the stored bodies was re-fetched at the
end: all 63 return 200 with an `image/*` content type. No article carries
`<ol start=`. **Every one is a draft. Nothing is published and nothing has been
reviewed.**

### The finding that shaped the whole collection

**Teams is the collection of one-way actions, and none of the specs performs
one.** Accepting an invitation, claiming a team, removing a member, blocking them
and deleting a team are all irreversible. Each is photographed as the control,
and the confirmation dialog where there is one, and stopped there; every "after"
state comes from a second fixture the seed already built. That is the pattern
collections 12 and 13 used for ending a phase, applied to a whole collection.

Exploration found the cost of getting it wrong. An exploratory click on **Remove
from team** removed a member from KB 07 United and the fixture had to be rebuilt:
**neither removal is confirmed.** *Remove from team* and *Remove & Block* both
fire on the click, next to an *Edit* that opens a dialog. That is the clearest
defect this collection found.

### Two articles are retitled, because the map describes features that do not exist

- **07.9 "Claiming a team and transferring ownership" is published as "Claiming a
  team".** There is no ownership transfer. The role list the app offers is a
  literal two-element array of Player and Administrator, there is no Owner option
  anywhere, and the bundle holds no transfer mutation - its team mutations are
  create, update, delete, claim, add/remove/update player, remove-and-block, bulk
  invite, invite and join. A team changes hands only by being created unowned and
  then claimed. The article's last screenshot is the evidence for the negative.
- **07.7 "Team roles - Owner, Administrator, Player and Fan" is published as
  "Team roles - Owner, Administrator and Player".** The API takes `role: "Fan"`
  and hides those rows unless `?includeFans=true` - verified both ways on one
  team - but the app's own `TeamRole` enum has no Fan, nothing in the UI can
  create one, and a seeded Fan row renders on the Edit Team page **with no role
  badge at all**. Following a team does not make one either. A Fan section would
  have documented a state no reader can reach, illustrated by a row that looks
  broken.

`config/articles.yaml` keeps both mapped titles, the way 13.8, 14.5 and 01.3 were
handled.

### The finding every later collection needs

**A match that is not in a leaderboard writes no statistics at all.** Isolated on
staging with two finished matches between the same two teams and the same
line-ups, one carrying `leaderboardId` and one not. The one without left
`GET /teams/:id/stats` answering with no `data` key and every player on zero; the
one with it read `matches: 1, wins: 1, goals: 1` within seconds.

07.10 is the article about team statistics. Without the leaderboard its whole
subject is a row of zeroes, and the first version of this seed produced exactly
that. **Collections 08, 09, 10, 11 and 19 should read this before seeding.**

### Six more behaviours now recorded in config/api.md

1. **The Add Team checkboxes are named the opposite way round from their fields.**
   "Create a Dummy team" carries `id="isPrivate"`; "I don't want to own this team"
   carries `id="isSystem"`. A dummy team is in its owner's list and nobody
   else's; an unowned team is in NO list at all, not even its creator's, and
   `GET /teams?name=` is the only handle on one.
2. **`POST /teams/:teamId/banner` does not store a banner.** It answers with a
   token, exactly as `POST /teams/avatar` does, and the token has to be saved
   with `PUT /teams/:teamId {"bannerToken"}`. config/api.md said it uploaded
   "onto the team"; it does not. The `v` query parameter is required on both
   image GETs - omitting it is a 400 schema error, not a cache miss.
3. **Blocking only stops the person letting themselves back in.**
   `POST /team-players/join/:shareCode` answers 200 for somebody removed without
   the flag and `400 "You are blocked from joining this team."` for somebody
   removed with it. The owner can still add a blocked person back, which clears
   the block. **There is no blocked-members list, and no removed member is
   rendered anywhere** - the rows survive in the API flagged `isDeleted` and no
   screen shows them.
4. **On Free you cannot add an Administrator.** `400 TEAM_ADMIN_LIMIT_EXCEEDED`,
   shown as a **Team Limit Reached** modal carrying a FREE Upgrade (Beta) button.
   The dialog offers Administrator either way; the refusal only arrives on submit.
5. **The two "Generate invitation link" buttons make different links.** The
   dialog's makes `?shareCode=` from the team's own code; a name-only member's
   own Invite button makes `?inviteCode=` from
   `POST /team-players/invite/:teamPlayerId`, bound to that one row.
6. **`DELETE /teams/:teamId` is the Owner's alone** - an Administrator gets
   `403 "Only team Owner can delete team"`, and the Edit Team page renders the
   DELETE TEAM card for them with the button disabled. Screen and API agree.

### Unlike collection 02, a crest-only save does NOT clear the team bio

Checked deliberately, because collection 02 found that saving a profile photo
wipes your profile bio. `PUT /teams/:id {"avatarToken"}` leaves `bio` alone.
07.3 therefore carries no warning about it. A negative worth having written down.

### Fixtures

Eight accounts and eight teams, all built by `node scripts/seed-07.mjs`
(idempotent - verified twice from a fresh `--rebuild`, and again after the full
capture suite: zero writes).

| Team | Owner | What makes it the fixture |
|------|-------|---------------------------|
| KB 07 United | Mo | crest, banner, bio, 9 members, every role the app can set, one finished match, one upcoming, 3 followers |
| KB 07 Rovers | Mo | the opponent |
| KB 07 Athletic | Mo | one member removed **and blocked**, one removed plainly - 07.8's "after" |
| KB 07 Wanderers | **Nia** | Mo is an **Administrator** on it, which is where 07.4 and 07.11 photograph the not-the-Owner half |
| KB 07 Casuals | **Fred (Free)** | the Free half of 07.7 |
| KB 07 Reserves | Mo | a **dummy** team (`isPrivate`) |
| KB 07 Orient | **nobody** | **unclaimed** (`isSystem`), findable only by search |
| KB 07 Albion | Mo | created unclaimed, then claimed - 07.9's "after" |

Nia has to be **Pro**, which is not obvious: a Free owner cannot hold an
Administrator, and Wanderers exists to carry one.

**The upcoming match is dated 5 December 2026 on purpose.** A match whose date
has passed starts itself. Move `UPCOMING.date` in `lib/fixtures-07.mjs` if this
collection is ever re-captured after then.

**A removed row cannot be un-removed.** `ensureRemovedRow()` looks for the dead
row first and does nothing when it is there; without that, KB 07 Athletic would
grow one more removed member on every run.

### Capture defects found and fixed in the specs

- **Five team crests came out as initials.** Every Manage Teams row paints the
  team's coloured initials first and swaps in the crest when it loads, and
  `imagesPainted()` cannot see an `<img>` that is not in the DOM yet.
  `teamListReady()` now waits for that one crest. The same race on the Join a
  team card is fixed the same way in 07.6.
- **07.4/06 clipped the sidebar, not the card.** `teamCard()` matched its heading
  page-wide and the sidebar navigation carries a "Leaderboards" link, so the
  LEADERBOARDS shot came out a 510px strip of the sidebar. Scoped to `main`.
- **07.1/08 cut off its own subject** - a new team lands below the fold. `centre()`.
- **07.9/01 had a black bar across the search results.** A mask paints at the
  element's own coordinates and the open dropdown covers them, so the identity
  block landed on top of the list. Hidden rather than masked - the call
  collection 02 made about the notification badge on the same screen. New helper
  `hideSidebarIdentity()`.
- **07.1/04 and 07.3/03 left the persona's name legible.** Both are viewport
  shots of a dialog, so the sidebar is still in frame. Masks added.

### Three things learned about writing specs for this app

- **A spec cannot switch accounts inside one test.** `signInAs()` mints a fresh
  session but the context still holds the first account's, and the app stays
  signed in as whoever got there first. 07.2, 07.6, 07.7 and 07.8 are two
  `test()` blocks each; each test gets its own context.
- **`signInAs()` assumes a sidebar.** It waits for the `/tournaments` link, which
  `/team/join` does not have. New helper `signInBare()`.
- **The Radix selects here do NOT need the dispatched click** that collections
  12, 13 and 14 all needed. They open on a plain click. What they need is not
  pressing Escape afterwards: Escape closes the whole modal, not just the list.

### Worth a look, and worth a ticket

- **Removing a member is unconfirmed.** Two irreversible menu items fire on the
  click, beside an Edit that does not. The clearest defect here.
- **"Select player from friend list" never lists anybody.** It opens to "No
  options available" on an account with 19 friends, on a team none of them are
  on, and with a friend that belongs to no team at all. The other two paths on
  that dialog work. 07.5 names the control and does not tell the reader to rely
  on it.
- **The Fan role is half-built.** The API stores it and gates it behind
  `?includeFans=true`; the app cannot set it, cannot label it, and renders it as
  a row with no badge. Either the API should stop accepting it or the app should
  grow the badge.
- **"Team Limit Reached" is the wrong title** for a modal whose message is about
  admins, not team count.
- **`/team/create`, `/team/congratulations` and `/team/invite`** are in the app's
  route enum and nothing navigates to any of them - the same shape as collection
  01's `/selectClubLocation`.

### Where to look hard in the drafts

- **07.5's claim that an Administrator can invite.** It says Owner or
  Administrator, reasoned from an Administrator getting the full Edit Team page
  and its Add New Player button. Not exercised end to end as an Administrator.
- **07.9's two quoted refusals** - "This team is already claimed by someone else."
  and the tournament-team name clash. Both come from the bundle's message
  catalogue and neither was produced on screen.
- **07.9's description of the Success dialog after claiming.** Seen once during
  exploration, on a throwaway team. The spec does not claim anything, so the
  sentence is described rather than shown.
- **07.2's claim that neither checkbox can be changed after creation.** Reasoned
  from the settings page having no such control, not from a refused API call.
- **07.10's line that Followers is a count and not a list.**
  `GET /teams/:id/followers` returns real people; no screen was found that
  renders them.

### Flakes

None. The eleven specs were run repeatedly through the session - the full suite
three times - and never failed once the selector fixes were in.

### ~~Not committed to master~~ - merged 2026-08-29

This said collection 07 was parked on `kb/collection-07` and that merging was the
human's call. It has since been merged into `master`, and the branch rule has
changed: **commit straight to `master`, no feature branch** - see "How you work"
in [CLAUDE.md](../CLAUDE.md). Screenshot URLs are pinned to the commit that holds
them, so work left on a side branch resolves its images from somewhere the help
centre will not keep. The eleven articles' images stay pinned to the commits in
the table above, all of which are now on `master`.

Next: `/kb-brief 05`.

### 2026-08-29 - collection 02, three articles amended after the reviewer published

The reviewer published all eight, then asked for two wording changes. 02.1, 02.3
and 02.6 were republished by PUT against their existing ids, so no duplicates and
no new screenshot URLs - all thirteen images stay pinned to `2000806a`. Verified
afterwards: all three still `published`, still in `19733971`, every image 200
`image/*`, no `<ol start=`.

**`state/manifest.json` was stale, and it was a live hazard.** It recorded every
article as `draft`. Reconciling it against Intercom corrected **41 entries**
across collections 01, 02, 07, 13 and 14 - everything the reviewer has published.
`scripts/publish-article.mjs` only omits `state` from its PUT when the manifest
says `published`, so the next re-run of any of those would have sent
`state: "draft"` and knocked 41 live articles off the help centre. The script's
guard was working; it was reading a stale record. This is the second time - the
same thing happened to collection 01 on 2026-08-28. **Step 2 should reconcile the
manifest against Intercom before it publishes anything**, rather than trusting
what it wrote last time. It still does not.

**02.3.** "The form does not know who you are, so type the address you want a
reply on" now reads "Use the address you want the reply to go to."

**02.6 reframed, title unchanged.** The article walks the reader through opening
somebody else's profile, which read as though it were an article about looking at
other people. It is not: **Scoryboard has no preview of your own profile.**
Checked in the app bundle - the profile component takes an `isSelfProfile` flag
and renders either your view or a visitor's view of the same page. There is no
"view as", no preview and no toggle. The one-line answer and step 1 now say that
up front, and "If it does not work" carries a bullet for the reader who goes
looking for a preview. The mapped title is accurate and was left alone; the
screenshots did not change.

#### Two things the brief got wrong, both now corrected in it

- **`/profile-view` is not an app route.** It is an API path in the app's own
  `ApiEndPoints` enum. The route sweep in `scripts/route-sweep.mjs` greps quoted
  path literals out of the bundle and cannot tell an app route from an API path -
  worth knowing before the next collection writes a "Routes covered" table from
  it. Open question 1 was therefore based on a mistake.
- **The Views counter is a control, not a label.** Selecting it opens **Profile
  Views**, the list of who has viewed your profile, backed by
  `GET /profile-view/player/:playerId/viewers`. Confirmed on screen in both
  states, not just read in the bundle: **Pro** gets the list ("No profile views
  yet" when empty), **Free** gets "Unlock Profile Views", the same gate shape as
  Compare in 02.8. So it is a `free_pro` feature that nothing in the map covers.

02.1 now names it in one sentence, at the repo owner's request and deliberately
with **no screenshot** - so 02.1 stays at its mapped 6 shots and no spec changed.
Neither state is photographed anywhere. Whoever plans the Pro-features work
should pick it up.

#### Flake

`PUT /articles/16738976` (02.6) answered 400 once and 200 on an immediate retry,
with an unchanged payload. Transient, on the Intercom side. Nothing else in the
run needed a retry.

### 2026-08-29 - the manifest can no longer unpublish live articles

`scripts/publish-article.mjs` now reads the article's state from **Intercom**
before it decides what to send, and corrects `state/manifest.json` from the same
read. It used to trust the manifest, which only ever knew about publishes the
script itself had done - and publishing is the reviewer's action, taken in the
Intercom UI between sessions. The manifest was stale by default, and the guard was
reading a stale record. It nearly cost four live articles on 2026-08-28 and
forty-one on 2026-08-29.

Four paths, all exercised against the live workspace before committing:

| Situation | What it does |
|---|---|
| Intercom says published, no `--state` | omits `state`; the article stays published |
| Manifest says draft, Intercom says published | says so, goes with Intercom, stays published |
| Manifest's id answers 404 | refuses, exits 1, creates no duplicate |
| Intercom unreachable | omits `state`, warns; nothing can be unpublished |

`--state` still overrides everything, and `--state draft` on a live article now
warns that it takes the article off the help centre.

Two smaller things fixed while in there. The script's exits are
`process.exitCode` rather than `process.exit()`: exiting with a fetch still open
aborts the process instead of ending it, and on Windows under Node 24 that trips
a libuv assertion and exits 127, which reads as a crash rather than a deliberate
refusal. And `docs/workflow.md` stage 8 now describes the behaviour, so nobody
reconciles by hand again.

### 2026-08-29 - collection 04, Plans & membership

**Three drafts on Intercom, nothing published.** Articles land in collection
`19733973`; the images are pinned to the SHAs below.

| Article | Title | Intercom id | Shots | Images pinned to |
|---|---|---|---|---|
| 04.1 | Free vs Pro - what is included | 16744143 | 4 | `0d5b555` |
| 04.2 | Pro is free during beta - how to upgrade | 16744144 | 5 | `1556c6a` |
| 04.3 | Every Free-plan limit, and the messages you will see | 16744149 | 8 | `d517db5` |

17 screenshots, matching the map exactly. Nothing added, nothing dropped.

Accounts: `kb-manager-free-04@yopmail.com` (Free, on every limit),
`kb-04-pro@yopmail.com` (Pro), `kb-04-upgrade@yopmail.com` (Free at rest, the
only account 04.2 touches). `node scripts/seed-04.mjs` is idempotent - a second
run makes no writes.

**This collection does not flip one account between Free and Pro, and
`config/personas.yaml` says it should.** That note predates the "Actions you can
only do once" section of `docs/style-guide.md`, which says the opposite and is
right. 04.3's six captures are all gates that vanish the moment the account is
Pro, so a half-done flip destroys them, and a crash between the flip and the flip
back leaves the persona Pro for every later run with the other specs still
passing. `personas.yaml` is now corrected for 04 and 18; 18 was not run.

**Ten API observations** are now in `config/api.md`, marked
`(observed in app, 2026-08-29)`, most of them in a new section, "Membership,
plans and the Free-plan limits": the two tabs on `/subscriptions` and the fact
that only one of them is free, the plan cards coming from Prismic rather than the
Scoryboard API, the complete eight-code `MembershipLimits` enum, the gate modals
rendering the app's own wording rather than the API's, `GET /friends` excluding
friends who have joined your teams, `POST /team-players` creating a friend record
as a side effect, no team-count limit on Free, a new account being born with one
leaderboard and two teams, and `GET /players/:playerId` recording a profile view.

`shot()` in `lib/kb.ts` gained `clipPad`, for modals. A clip that hugs a rounded
dialog catches a sliver of the dimmed page in each top corner, which reads as a
dark smudge along the top edge wherever the screen behind is dark. It did, on the
leaderboard and player screens.

**Where to look hard.** Two things a reviewer should check against the app:

1. **`ONE_FRIEND_PER_TEAM` appears to be unreachable through the UI.** The API
   raises it reliably, but no screen can: a friend who joins a team leaves
   `GET /friends`, and both controls that could offer them again read that same
   list. 04.3 states the limit in its table with the modal's wording and does not
   claim the reader can trigger it. If the reviewer knows a path to it, the
   article should get a ninth capture.
2. **The substitute limit is stated as 3 and is not confirmed.** It comes from
   reading the lineup code in the bundle, not from a real lineup. Reaching it
   needs a match - collection 10's fixtures.

Everything else in 04.3's table was confirmed one call at a time on staging.

No flakes. Every spec was re-run after publishing, against a re-seeded set of
accounts, and all five passed.

### 2026-08-29 - collection 04, after review

The reviewer published all three. 04.1 was then amended at their request: the
closing paragraph about the PRO card's "Coming soon" line was dropped. Rebuilt
against the same SHA its images were already pinned to (`0d5b555`) and
republished with `scripts/publish-article.mjs`, which read the live state off
Intercom, saw `published`, and left it alone rather than sending `draft`. The
article stayed live through the edit; nothing was taken off the help centre.

### 2026-08-29 - collection 16 retired into 04

At the repo owner's request, and for the same reason 03 was retired into 02: both
collections documented the same `/subscriptions` screen from opposite ends, and
its two tabs are two different products. A reader who lands there has to be told
which is which before anything else.

Six articles became three. **16.5 was dropped** - see below.

| Was | Now | Intercom id | Shots |
|---|---|---|---|
| 16.1 + 16.2 | 04.4 Tournament Pro - what it is, and the three plans | 16744250 | 6 |
| 16.3 + 16.4 | 04.5 Upgrading a tournament to Tournament Pro | 16744251 | 5 |
| 16.6 | 04.6 Free Tournament Pro slots | 16744252 | 2 |
| 16.5 | dropped | - | - |

**Three new drafts, nothing published.** Images pinned to `11e8de2`. Collection
04 is now six articles and 30 screenshots. Intercom collection `19733985` is
retired, empty, and must not be reused - confirmed empty after the run.

**No money was spent, and no card number was ever typed.** Both controls that end
the Scoryboard part of the flow were photographed and not selected:
`Continue with PRO` posts to `/tournaments/:id/billing/checkout-session`, and
`Start with ANNUAL` swaps the plans area for a Stripe `embedded-checkout` iframe
inside a Scoryboard panel. Everything inside that panel is Stripe.

Two new accounts, both this collection's own: `kb-04-organiser@yopmail.com`
(no free slots, owns one Basic tournament - the paywall case) and
`kb-04-grant@yopmail.com` (two free slots - 04.6's case). They have to be two
accounts because the free-Pro grant is additive and **has no revoke**: an account
that has ever held one can never show the paywall again.

**Where to look hard.**

1. **The Basic team limit is 8, and the plan card advertises 5.** The card says
   "Up to 5 teams"; the app's own message is "Tournament Pro is required to add
   more than 8 teams to a group", with a matching one for brackets. 04.4 states
   both and tells the reader 8 is the number that bites. This is either a stale
   marketing line or a limit that moved, and it is worth a ticket either way.
2. **16.5 is gone, deliberately.** Managing a live Annual subscription - changing
   the card, cancelling, resuming - has real endpoints, recorded in
   `config/api.md`, but the screens only render once an Annual subscription is
   active. That needs a completed payment. Written blind it would have been
   invention, so it was dropped rather than guessed. If the client wants it,
   somebody has to make a real Stripe test-mode purchase first.
3. **04.5's prose describes what happens after checkout** - the plan changing
   from Basic to Pro and the limits lifting - without a screenshot of it. That is
   inference from the plan cards and the gate messages, not something observed.

No flakes. All nine specs across the six articles were re-run after publishing,
against a re-seeded set of five accounts, and all nine passed.

### 2026-08-29 - 04.6 amended, after review

The reviewer published all six, then asked for the timing rule in 04.6 to be
unmissable. It was worth testing before making it the headline: the article
inferred it from the panel's wording and nothing had watched a slot actually go.

Tested on staging and put back - creating a tournament on the grant account, then
deleting it and topping the allowance up. Three things, all now in the article and
in `config/api.md`:

- `POST /tournaments` on an account with slots answers `pricingPlan: "Pro"`
  immediately. No checkout, no session, no upgrade call;
- the allowance drops on that create, 2 to 1;
- **deleting the tournament does not give the slot back.** It stayed at 1. That
  warning was not in the article before and now is.

The panel is driven by `...Remaining`, not `...Total` - after the top-up the
total read 3 and the panel still said 2. That is what makes the seed's
grant-only-the-shortfall strategy correct, and 04.6's spec still asserts 2.

The article gained a "When a slot is spent" heading and a four-row table -
looking, creating, upgrading, deleting - so the answer is visible without reading
a paragraph. Rebuilt against `11e8de2`, the SHA its images were already pinned
to; no screenshot changed. `publish-article.mjs` read the live state off
Intercom, saw `published`, and left it published.

The brief's "Unreachable" table said a slot being spent could not be observed.
That was wrong and is corrected: it was observed, and simply not made into a
capture, because it would take the count off 2 and change what every later run of
04.6 photographs.

### 2026-08-30 - collection 05 complete. Four articles, all drafts.

| Article | Intercom ID | Shots | Pinned commit |
|---|---|---|---|
| 05.1 What your friends list is and why teams depend on it | 16749940 | 3 | `ef345f9` |
| 05.2 Adding, editing and removing friends | 16749941 | 8 | `6cad3ef` |
| 05.3 Merging a friend with an existing player when emails clash | 16749943 | 4 | `7107d3d` |
| 05.4 Invite codes and claiming your own record | 16749944 | 5 | `d552081` |

20 screenshots, exactly the 20 the map estimated, all in Intercom collection
`19733974`. Every image URL embedded in the stored bodies was re-fetched at the
end: all 20 return 200 with an `image/*` content type. No article carries
`<ol start=`. **Every one is a draft. Nothing is published and nothing has been
reviewed.**

Nothing was added, dropped or retitled. The four mapped titles are the four
published titles.

### The finding that shaped the collection

**A refused Add To Team deletes the friend.** On Free a friend may belong to one
of your teams only. Asking for a second answers `400 ONE_FRIEND_PER_TEAM`, raises
a **Team Limit Reached** modal, **and soft-deletes the friend record**. The person
stays on the team they were already on and disappears from the friends list.
Reproduced from the API and through the app, several times.

From the app it is worse than it sounds, because the friends list is where the
**Add To Team** button lives: the reader selects it on a row, gets a modal, closes
it, and the row they started from is gone. Recovering is not straightforward
either - re-adding by name creates a NEW placeholder player while the original
stays on the team, so the team member and the new friend are two different people.
Only `POST /friends` with a `playerId` puts the real row back, and no screen sends
that.

05.1 documents it and its spec exercises it, spending a friend every run and
reviving the record in a `finally`. **This is the clearest defect this collection
found. Worth a ticket: a refusal should not delete data.**

### Two corrections to what was already written down

**`GET /friends` does NOT exclude a friend who is on one of your teams.** That
note has been in `config/api.md` since 2026-08-29 and it is wrong. Checked three
ways - adding an existing friend to a team by `playerId`, adding a new person by
`name`, and re-reading the list immediately, after four seconds and after nineteen.
The count never moved. What made the list shrink during collection 04's test was
the refusal above, not the successful add. The old paragraph is struck through in
`config/api.md` rather than deleted.

**Collection 04's open question 1 is answered: `ONE_FRIEND_PER_TEAM` IS reachable
through the app.** The path is the friends list - Add To Team on a friend already
on one of your teams, choose the other team. `briefs/04.md` is updated. **04.3 was
not re-captured**; it still states the limit in its table with no screenshot, which
is accurate but under-illustrated. Whoever next touches collection 04 should give
it a ninth capture. `specs/05/05.1.spec.ts` shows how to raise the modal and how to
put the deleted friend back.

### Deleting an account does not free its player - and it burnt an account

**`DELETE /admins/user-delete/:id` leaves the player behind, anonymised.** Its name
is blanked and its address is rewritten to `<userId>@scoryboard.com`, and an
account created again at the **same email** is handed that same playerId back.
Every friend record that ever pointed at it is still there, soft-deleted.

`POST /friends/join/:shareCode` then revives one of those old records **instead of**
taking over the record whose link was used. 05.4 came back with a nameless row on
the friends list and its placeholder gone. `kb-05-claimer@yopmail.com` is burnt;
the collection uses `kb-05-invitee@yopmail.com`, which has never been deleted.

`scripts/seed-05.mjs` no longer deletes an account to correct its name - it stops
and says to use a new address. **Every collection whose seed offers `--rebuild`
should read this. A rebuilt account is not a new account.**

### Five more behaviours now in config/api.md

1. **A friend row linked to a real account is read-only.** Its **Edit** menu item
   is `aria-disabled`, `GET /friends/:id/shareCode` answers `400 "Cannot generate
   share code for a friend who is already registered."`, and its **Chat** button is
   enabled - the opposite of a placeholder on all three.
2. **POST and PUT treat a clashing email differently.** `POST /friends` with an
   address that already belongs to a player links the two **silently**.
   `PUT /friends/:id` refuses with `400 "A player with this email already exists."`,
   which is what raises the **Email Already Exists** prompt. Its Yes re-sends with
   `isReplaceAllow: true`, and **the name you typed is discarded** - the row takes
   the account's own name.
3. **The two invitation links do different things.** `GET /friends/invite-code` is
   your account's - accepting adds a new row. `GET /friends/:id/shareCode` is one
   record's - accepting hands that record over. Both produce
   `/friendList?shareCode=<code>&playerId=<yours>` and both open the same dialog, so
   the screen never says which is which. Both codes are stable per account and per
   record.
4. **Friendship is one-way**, and **a signed-out visitor loses the code**: the link
   bounces to `/signin` with no query string, so signing in from there does not
   resume the invitation.
5. **A malformed email stops the Add Friend form with no message.** No request, no
   error text - the button simply does nothing. The empty-name case does show
   "This field is required." Duplicate friend names are accepted.

### Fixtures

Four accounts, two teams and five friends, all built by `node scripts/seed-05.mjs`
(idempotent - verified: after the full capture suite it makes zero writes).

| Row | Kind | Used by |
|---|---|---|
| Ade Nwosu | placeholder, no email | 05.3's edit and its clash |
| Bo Lindqvist | placeholder with an email | shows an email alone is just text |
| Cara KB (`kb-05-mate@`) | linked to a real account | 05.2/08, 05.3/04 |
| Sam Ruiz | placeholder, on `KB 05 FC` | 05.1/03 - and the row that refusal deletes |
| Nia Halvorsen | placeholder | 05.4 - `kb-05-invitee@` takes it over |

The seed also **deletes the two teams every account is born with**. Their names
carry the date the account was made - `Marc K FC 3008` - and 05.1 photographs the
Select Team dropdown.

Two fixtures are spent per run and put back by the specs themselves: Sam Ruiz by
`reviveFriend()` (same record id, same place in the list), and Nia Halvorsen by an
`afterAll` that deletes the claimed row and creates the placeholder again. She is
the **last** entry in the list for that reason - a new record lands at the end, and
anywhere else in the array one run of 05.4 would reorder every other capture.

### Capture defects found and fixed in the specs

- **05.4/04 came back as two blue dots in a large white square.** The accepted-
  invitation dialog carries a 192px **Lottie** animation, which draws from
  JavaScript - neither `animations: 'disabled'` nor `reducedMotion: 'reduce'`
  settles it, and it has no end frame to wait on. New helper `hideLottie()` removes
  the box; the dialog collapses to its heading, its message and Close.
- **05.3/04 and 05.4/05 caught slivers of the rows above and below.** Both are
  single friend rows and neither sits over a dimmed page, so both dropped the
  `clipPad` that the modal captures need.
- **Three assertions matched text that the app renders inside one element.** The
  Team Limit Reached paragraphs, the Send Invitation explanation and the invitation
  dialog's two sentences are each one node split by a line break.
- **The Add Friend dialog's heading and its submit button carry the same words**,
  so the heading is matched by role.
- **Radix marks the page `aria-hidden` while a row menu is open**, so 05.2's
  assertion that a linked row's Chat is enabled had to move above the menu.
- **The invitation dialog uses a straight apostrophe and the removal warning uses a
  curly one.** Both are matched as the app writes them.

### Where to look hard in the drafts

- **05.3's step 5.** The spec never selects **Yes** - merging cannot be undone,
  because the merged row's Edit is greyed out afterwards. So the screenshot is a
  **different** row, one the seed had already linked. The article says so. The merge
  itself was performed twice during exploration, over the API and through the app,
  so what Yes does is observed rather than reasoned - but no screenshot in the
  article shows the row from step 1 after the merge.
- **05.4/01 and 05.4/02 look almost identical.** They are the same panel, because
  the app opens the same panel from both places; only the dialog heading differs. If
  that reads as a duplicate to the reviewer, the fix is a product one.
- **05.1's claim that adding somebody to a team from the Teams screen also adds them
  to your friends list.** Verified on the wire - `POST /team-players` with a `name`
  creates a friend record as a side effect - but not walked through the Teams UI in
  this run.
- **05.4's "sign in first" instruction.** The signed-out redirect to `/signin` was
  watched once during exploration. What was not tried is whether signing in from
  that screen ever resumes the invitation; the article says it does not.
- **What "No, thanks" does.** Never selected. The article names the button and
  claims nothing about it.

### Flake

**One, in 05.4's first test.** It failed before any capture and the next run cleared
`test-results/`, so no artefact survives and it was not diagnosed. Three further
runs of that file passed and the full six-test suite passed twice, before and after.
If it returns, the likely candidate is `invitePanel()`, which waits on a link field
whose value arrives from `GET /friends/invite-code`.

Nothing else failed. Every spec restores its own fixture, and
`node scripts/seed-05.mjs` reported zero writes after the full suite.

Next: `/kb-brief 06`.

### 2026-08-31 - collection 06 retired into 05. 06.1 is now 05.5.

At the repo owner's request, and for the same reason 03 went into 02 and 16 into
04: following is the other half of "who is in your list" - you follow people you
want to watch and befriend people you want to pick - and a single-article
collection is a worse home for it than the collection it belongs with.

**Intercom collection `19733975` held nothing**, checked before the merge and
again after it, so no article moved and no URL changed. This was a fresh build,
not a transfer. It is marked `retired: true` in `config/intercom.yaml` so the id
is not silently reused, and `config/articles.yaml` carries collection 06
commented out with the same note. 05.5 keeps 06.1's mapped title and its mapped
six screenshots.

| Article | Intercom ID | Shots | Pinned commit |
|---|---|---|---|
| 05.5 Following players, teams and tournaments | 16755990 | 6 | `f8214ef` |

Collection 05 is now **five articles and 26 screenshots**, all in `19733974`.
All 26 embedded image URLs were re-fetched at the end: 26/26 return 200 with an
`image/*` content type, and no article carries `<ol start=`.

**05.5 is a draft and has not been reviewed.**

### The reviewer published 05.1 to 05.4 while this ran

Checked at the end of the session: those four now read `state: published`,
updated between this session's two halves. That is the intended workflow and
nothing needed undoing.

`state/manifest.json` still recorded all four as `draft` and has been reconciled.
This is the third time - collection 01 on 2026-08-28, five collections on
2026-08-29, and now this. `scripts/publish-article.mjs` reads the live state off
Intercom before it decides, so nothing was ever at risk; the manifest is simply
stale by default, because publishing happens in the Intercom UI between runs.

### The finding that shaped 05.5

**One control, three places - but the result is only listed in two.** A player
profile, a team page and a tournament page each carry the same Follow control in
their own header, beside their counters. Selecting it is the whole action: no
confirmation, nothing sent to the person followed, no Pro gate.

Followed players and teams are then listed in the **Following** window on your
own profile, under a Players tab and a Teams tab. **A followed tournament is
listed nowhere.** Not in that window - its heading count excludes them and there
is no third tab - not on the Tournament screen, which lists only tournaments you
own, and there is no `/following/tournaments`. The only handle on one is
`GET /tournaments/:id/follow` for an id you already have.

05.5 documents it and tells the reader to go back to the tournament's own page to
unfollow. **Worth a ticket:** either a Tournaments tab is missing or following a
tournament is meant to mean something else.

### Four more behaviours now in config/api.md

1. **The tournament follow endpoints exist**, and `config/api.md` said they did
   not: `POST`, `DELETE` and `GET /tournaments/:id/follow`, the same shape as the
   player and team pairs. All three POSTs answer
   `{"message": "Successfully followed ...", "followId": ...}`.
2. **Following is one-way and ungated.** It creates no friend record, adds nobody
   to a team, and works on Free.
3. **Your own profile has no Follow control** - you cannot follow yourself - but
   **your own teams and tournaments do** carry one. Checked, because the article's
   first draft claimed the opposite about teams.
4. **The header search returns tournaments**, which the 2026-08-29 note about
   `searchType=all` does not mention. Searching a tournament title returns it
   labelled `Tournament`. So the search reaches players, teams, leaderboards and
   tournaments.

### Fixtures

Three new ones, all owned by `kb-05-mate@` and all built by
`node scripts/seed-05.mjs` (still idempotent - after the full six-spec suite it
reports zero writes):

| Fixture | Why |
|---------|-----|
| `KB 05 Rovers` (team) | **followed** at rest, so the Following window's Teams tab has a row |
| `KB 05 Wanderers` (team) | **not** followed - 05.5's team capture shows **Follow** |
| `KB 05 Cup` (tournament) | **not** followed - 05.5's tournament capture |

**A Free account can create a tournament** and it is born `status: "Published"`,
so no Tournament Pro grant and no wizard was needed. That is worth knowing for
any later collection that wants a cheap tournament fixture.

No new account. 05.5 follows `kb-05-player@` during its run and unfollows in a
`finally` - following is reversible in both directions, so unlike the rest of this
collection there was no one-way action to work around.

**What Marc follows is reconciled, not appended.** Followed players and teams can
be enumerated, so the seed unfollows strays. A followed tournament cannot be, so
the seed can only check the one tournament this collection owns - which is the
gap the article documents, showing up in the tooling.

### Capture defects found and fixed in the specs

- **The first player capture cut the counters row in half.** A player and a team
  header sit in a white band with a bottom border that holds the banner *and* the
  counters; a tournament sits in its own dark `min-h-[280px]` banner with the
  counters inside it and no border at all. The first locator matched the nearest
  ancestor of either kind, which on a player picked the inner banner.
  `followHeader()` now prefers the band and falls back to the banner.
- **The Follow control paints before the follow state arrives**, so it can read
  Follow for a moment on something you already follow. `followStateReady()` gates
  on the expected label AND on the opposite label being absent.
- **Every capture is clipped to a header or a dialog.** All three of these pages
  carry a TRENDING feed of global activity, which `docs/style-guide.md` forbids in
  a capture and which drifts every run. Clipping keeps it out; no interception was
  needed.

### Where to look hard in 05.5

- **Shot 06 shows the player followed in step 2.** The spec unfollows in a
  `finally`, after the capture, so the window reads Following (3) with both
  players in it. Deliberate and deterministic - every run follows before it
  reaches that step - and it reads better, because the reader sees the person
  they just followed. But it is not the fixture's rest state.
- **What following actually gets you was not established.** The article says it
  "keeps them in view", which is the plain reading of a Following list, but
  nothing was found that changes because of a follow: no feed filter, no
  notification setting. The home activity feed is global.
- **05.5's step 1 says the header search finds all three.** Verified for a team
  and a tournament by searching this collection's own fixtures. Not verified for
  a player, where the article's own path is a profile you already have open.

### Flake

None in this half. 05.5 was run three times and passed each time; the seed
reported zero writes afterwards.

### 2026-08-31 - collection 11. All three articles are drafts.

| Article | Title as published | Intercom ID | Shots | Pinned commit |
|---|---|---|---|---|
| 11.1 | Match facts - insights and Statistics so far | 16756932 | 4 | `a1fdaf5` |
| 11.2 | How team and player statistics are calculated | 16756936 | 3 | `6e58965` |
| 11.3 | When your statistics update after a match | 16756939 | 2 | `1548298` |

All three sit in Intercom collection `19733980`, all `state: "draft"`, all
`parent_type: "collection"`. Nine screenshots. Every embedded image URL was
re-fetched off the published article bodies at the end of the run: **9/9 return
200 with an `image/*` content type**, and no article carries `<ol start=`.

**The drafts were unreviewed and nothing was published when this run finished.**

**Amended later the same day, after review.** The reviewer had published all
three by then. 11.2 and 11.3 were rewritten for clarity and re-sent with PUT:
11.2's opening no longer says "a team counts" and no longer explains its own
reasoning to the reader; both articles have shorter sentences, one instruction per
sentence, and 11.2's second tile table now lists only the three tiles that are the
team's own rather than repeating the seven it shares with the player grid. 11.3's
opening dropped "nothing announces it". No screenshot changed, so both are still
pinned to the commits above, and `scripts/publish-article.mjs` read the live state
off Intercom and left them published rather than knocking them back to draft.

**11.1 was given the same pass straight afterwards.** Its opening became a
two-item list instead of one compound sentence; "It is the easiest thing to
misread on the screen, because the two teams sit either side of one label" was cut
as the same kind of leak; and the "Drawn is worked out, not counted" paragraph was
dropped outright - how the app derives that figure is not something a reader needs.
So all three articles have had the pass, none of the nine screenshots changed, and
all three are still published.

### 11.1 is retitled, and it matters

The map called it *"Match facts, insights, form and head-to-head"*. **Two of
those four things do not exist.** Published as **"Match facts - insights and
Statistics so far"**, which is the app's own wording.

- **No form guide.** There is no row of W/D/L badges anywhere in Scoryboard. The
  Insights panel is where that information lives, as five sentences per team,
  each about "its last 5 games".
- **No head-to-head record.** The panel that looks like one, *Statistics so far*,
  is **each team's whole record in the leaderboard**, shown side by side. The
  article says so in as many words, because it is the easiest thing on the screen
  to misread.

`config/articles.yaml` is unchanged, as it was for 01.3, 07.7 and 07.9 - the map
stays the map.

### How the head-to-head question was settled

Not by reasoning. The fixture was built to answer it: a **third team**, KB 11
Athletic, and a fourth match Rovers won **4-0** against it, which Pia was not in
the lineup for.

On the Rovers v City page the two columns then read **four matches and three**,
and Rovers' *Biggest win* renders as **4-0 against a team that is not the
opponent**. Both are in screenshot `11.1/03`. It cannot be a head-to-head record.

That fourth match paid for itself four times: it settled the head-to-head
question, it gave 11.2 its whole argument (the player reads 3 where the team
reads 4), it produced the only clean sheet, and it took *Winning Streaks* to 2.

### Five things about statistics that were not known before

All five are now in `config/api.md`, marked `(observed in app, 2026-08-31)`.

1. **A match outside a leaderboard writes nothing, and shows nothing.** The Facts
   tab reads "No insights available yet" / "No statistics available yet", and no
   figure is ever counted. Isolated against the match **tag**, which was the
   other candidate: a `friendly` in a leaderboard has all five insights, and a
   `league` outside one has none. Screenshot `11.1/04` is that empty state.
2. **A player is counted for matches they were in the LINEUP for.** The team reads
   4, the member left out of one reads 3. But `GET /players/:id/matches` returns
   the match she was left out of - so the **Matches list and the Matches tile
   count different things**, which is a ticket waiting to happen and is now
   answered in 11.2.
3. **A clean sheet is not simply conceding nothing.** The 0-0 draw scored **none**
   for either team; the 4-0 win scored one. The article says "matches the team
   won without conceding" - stated as what the number does, not as a rule the
   product documents. See the open questions.
4. **Statistics are written 1.6 to 6.8 seconds after the final whistle**, measured
   off `statsCalculatedAt` minus `finishedAt` on all four matches. The match
   object also carries `queueName`. 11.3 says "within seven seconds" and tells the
   reader to reload, because nothing announces it.
5. **`GET /matches/:id/facts` is not admin-only.** `config/api.md` had it under
   the admin key because the Postman collection sends one. The app calls it with
   the signed-in user's bearer token, on every match page.

### Two product gaps worth a ticket

- **Goals conceded per match is always a dash**, for both teams, on every match.
  `GET /matches/:id/facts-stats` carries no conceded figure at all, so no data
  will fix it. The article sends the reader to the team's GOALS / CONCEDED tile
  instead.
- **Two tiles are both labelled CARD**, on the player grid and the team grid, told
  apart only by a coloured rectangle. **Red comes first on the tiles; yellow comes
  first in the Player Stats and Leaderboards tables.** Nothing on screen says
  which is which. 11.2 does.

### Where to look hard in the drafts

- **11.2's claim about Rank.** The Player Stats table ranks members 1st to 5th and
  the ordering could not be worked out: goals clearly outweigh matches played
  (Pia, 3 matches, is above Otto, 4), but Rory is above Pia on identical goals and
  assists, and Otto and Sam have *identical rows* and different ranks. The article
  describes the column and explicitly does not claim a formula. If the reviewer
  knows the rule, that paragraph should be rewritten.
- **11.2's clean-sheet sentence.** "Matches the team won without conceding" is the
  simplest reading consistent with two observations (0-0 gave none, 4-0 gave one).
  It is not a documented rule and a win-to-nil by one goal was never tested.
- **11.1's insight line "It's been 0 days since KB 11 Rovers's last game".** It
  disagrees with the match dates - the last match is 20 August and this was read
  on 31 August - so it appears to count from when the match row was created. It
  will therefore read differently on every re-run of the spec. **Deliberately not
  masked:** it is one of the five lines the article is about, and a black bar
  through the middle of the subject is worse than a number that drifts.
- **11.3's "reload the page" instruction.** The lag was measured on the API. What
  was not tested is whether any screen updates itself - the article says reload,
  which is safe advice either way, but it is advice rather than an observation.
- **11.1's step 1 navigation.** "From Home, in the MATCHES panel, select Past
  Matches" was walked. "You can also reach it from the MATCHES tab on a team" was
  seen but not walked through to a match.
- **Two claims were cut from 11.2's first draft** for being unverified: that a
  named substitute who never came on still counts towards Matches, and that a
  mis-credited goal is corrected on the FEED tab. Neither was tested. The second
  survives in the weaker form the API does support - a live match can be
  corrected, a finished one cannot.

### Changed during step 2

Four mechanical fixes, all written into `briefs/11.md` under "Changed during step
2" and into `lib/kb.ts`. None changed what an article says.

1. **11.1's first capture became a viewport shot.** The brief planned a clip of
   the tab strip. Both of the strip's `[role="tablist"]` containers have **zero
   height** and the tabs overflow them, so `onScreen()` discarded both and
   `.first()` fell through to the **Pay** tablist in the payment section, 3,200
   pixels down the page - which is what the first run photographed. The viewport
   is the better shot anyway.
2. **All three of 11.2's captures gained `clipPad: 12`.** The annotated MATCHES
   tile is in the grid's top-left corner and the annotated table row is full
   width, so the red rectangle was being drawn outside the clip and came back
   missing two of its four edges.
3. **11.2's third capture gained an annotation the brief did not plan** - the
   persona's row. It is the article's whole argument and the shot was not pointing
   at it.
4. **The Facts card is clipped to the card, not to `#facts`.** That wrapper's box
   starts a few pixels above the white card and those pixels are the banner photo,
   so the first run had a dark seam across the top edge.

Two selector traps that **collections 09 and 10 will hit**, because they own this
screen:

- **`waitUntil: 'networkidle'` never resolves on a match page.** The presence
  connection behind the feed's ONLINE badge keeps the network busy and every
  navigation times out at 30 seconds. `openMatch()` waits for content instead.
- **The MATCH ENDED pill is `Match Ended` in the DOM**, upper-cased by CSS - the
  same trap as GROUP A in 14 and DELETE ACCOUNT in 01.

### The fixture, and why it cannot be repaired

Two accounts, `kb-player-11@` and `kb-11-owner@`, both Free. Three teams, one
leaderboard, **four played matches** on consecutive Thursdays in August 2026.
`node scripts/seed-11.mjs` builds all of it and reported **0 writes** on a second
run, again after the exploration probes, and again after the full three-spec
suite.

Two of the three teams cost nothing to make: `KB 11 Athletic` and the leaderboard
are both **renamed from what the account was born with**. Free may own exactly one
leaderboard, and renaming kept the friend count at 12 of an allowance of 14.

**A finished match cannot be reopened, edited or deleted.** So the seed never
touches a match it did not have to create, and it verifies both scorelines and all
eighteen expected figures at the end. If a number ever comes out wrong the only
repair is `node scripts/seed-11.mjs --rebuild`, which deletes both accounts and
starts from nothing. There is nothing smaller.

### The one mutation any spec here makes

11.1's empty-state capture needs a match that belongs to no leaderboard.
`withoutLeaderboard()` creates one dated **2027-09-09**, photographs it and
deletes it in a `finally`. Both halves of that date are forced: a match whose date
has passed **cannot** be deleted, and one created with a past date **starts
itself** within seconds. It is tagged `league`, like the four seeded matches, so
nothing in the frame suggests a friendly is the reason it is empty. Checked after
the full suite: no stray match exists, on any of the three teams.

### Unreachable

- **The leaderboard screens.** `/leaderboard/:id/standings` and the
  `/stats/teams`, `/stats/players` and `/results` tails are all in the app's route
  enum and all answer **Page not found** when opened by URL. Nothing in collection
  11 needs them - but **collection 08 owns them and should expect to have to find
  the real path.**
- **The statistics lag, as a picture.** No screen shows statistics being
  calculated. Measured off the API instead.
- **A form guide.** There is not one.

### Flake

None. Each spec was run at least twice while its selectors were fixed, and the
full three-spec suite passed in one go afterwards. The seed reported zero writes
after it.

Next: `/kb-brief 08`, which needs the leaderboard-route question answered first.

### 2026-08-31 - collection 08. All five articles are drafts.

| Article | Title as published | Intercom ID | Shots | Pinned commit |
|---|---|---|---|---|
| 08.1 | Creating a leaderboard | 16760527 | 7 | `217f65f` |
| 08.2 | Your leaderboard settings screen | 16760641 | 6 | `f908fa3` |
| 08.3 | Adding and removing teams | 16760678 | 6 | `f8c3ece` |
| 08.4 | Leaderboard statistics, players and matches | 16760742 | 6 | `0ae3932` |
| 08.5 | Sharing, commenting on and deleting a leaderboard | 16760763 | 5 | `83c9706` |

All five sit in Intercom collection `19733977`, all `state: "draft"`, all with
`parent_ids: [19733977]`. Thirty screenshots. Every embedded image URL was
re-fetched off the published article bodies at the end of the run: **30/30 return
200 with an `image/*` content type**, and no article carries `<ol start=`.

**The drafts are unreviewed and nothing is published.**

Titles are as `config/articles.yaml` writes them. Nothing was added, dropped or
retitled. 08.1 has seven shots rather than eight and 08.2 has six rather than
five, both with reasons in the brief; the collection total is the 30 the map
estimated.

### What collection 08 found

Appended to `config/api.md`, marked `(observed in app, 2026-08-31)`.

- **The league table has no points column, no draws column and no
  goals-conceded column.** `GET /leaderboards/:id/stats/teams` carries none of
  them either. Win/Loss reads "1/1", and a draw is only the gap between Matches
  and win + loss. The fixture was built so one row proves it: KB 08 Rovers,
  played 3, won 1, lost 1.
- **Removing a team from a leaderboard has no confirmation.** One click and
  `DELETE /leaderboards/:id/teams/:teamId` has fired. Adding it back restores its
  figures, but nothing warns you first. Deleting the leaderboard itself *is*
  confirmed, from both entry points.
- **A comment can never be taken back.** `DELETE /comments/:commentId` exists,
  is not in the Postman collection, and answers `401 "Unauthorized to delete this
  comment"` to the account that wrote it. And `GET /comments` returns top-level
  comments only - a reply lives behind `/comments/:id/replies` and is invisible to
  that listing. The seed posted its reply twice on the first run because of it,
  and the only repair was `--rebuild`.
- **Commenting and liking on a leaderboard are members-only.** `403 "Only
  leaderboard members can comment on or like leaderboard content"` to anybody who
  is neither Owner, Administrator, nor a player on one of its teams - although the
  composer is still drawn for them.
- **A non-member reads more than you would guess.** The league table, the player
  grid, the fixtures and the comments all answer 200 to anybody signed in.
  `/leaderboards/:id/teams` and `/leaderboards/:id/players` answer 403.
- **The Share Leaderboard "public link" is not public.** It offers a link, a copy
  button and a QR code under "People with this link can view your board", and a
  signed-out visitor who opens it is sent to `/signin`. The QR code's own `<title>`
  says "tournament" on a leaderboard.
- **`Leaderboard style` is a disabled field reading "Football leaderboard"** on
  both screens that show it, and the in-app Create window does not show it at all.
- **The Free create-leaderboard gate is client-side** - selecting Create New
  Leaderboard on Free opens Leaderboard Limit Reached and sends no POST, so the
  reader never sees the form. Every account is born with one leaderboard, so a
  Free account is at the limit from the moment it exists.
- **An Administrator gets the whole settings screen**, Delete Leaderboard
  included. A non-owner gets the app's error boundary - "This page couldn't load"
  - with no API call and no Access-denied screen.
- **The Views tile comes from `GET /profile-view/leaderboard/:id/viewers`**, which
  is not in the Postman collection.
- **A match created with no `clubLocationId` is `Incomplete`, not `Scheduled`**,
  and the Matches tab offers Finish Setup instead of a fixture card. `PUT` with a
  venue fixes it, on a future match only.

### The External badge, and the capture it spoiled

08.2's first capture of the settings screen showed all three of the owner's own
teams badged **External**. It is not a role marker: it marks a team that is not one
of *your own*, and it is computed against the `teams` slice of the app's persisted
Redux store - which **only `/teams` fills**. `/leaderboards` fires
`GET /teams?all=true` as well, and the answer never reaches the slice. So a session
that signs in and goes straight to a leaderboard marks every team the reader owns
External, indefinitely: ten seconds on the list changed nothing, and one visit to
Manage Teams fixed it and stayed fixed across a full page load.

`loadOwnTeams08()` opens `/teams` before every owner-view capture and
`ownTeamsResolved()` gates on the badge count being zero. 08.2's article carries it
as a troubleshooting line, because a reader can hit it too.

### What else was fixed mid-run

Every one of these was found by looking at a screenshot, not at an exit code.

- **Three different things on these pages are a red circle**, and the mask was
  hitting two of them. The unread badge is `w-5 h-5 absolute`; the dot marking an
  unregistered player is `h-2.5 absolute`; a player's initials avatar is neither,
  because the avatar palette includes `bg-red-500`. One run painted out a player's
  face; the next turned all fifteen dots into black squares.
- **A hover highlight.** Playwright leaves the mouse where it last clicked and
  these tables shade the row under it, so one row came out shaded for no reason a
  reader could see. `parkPointer()`.
- **A spinner** under the comment thread: "Comments (1)" paints before the reply
  counts land. `settled08()` waits on `.animate-pulse` and `.animate-spin`.
- **Four locators walked to the wrong element** - the team row (its name is
  wrapped in a marquee `div.relative`), both stats tables (CSS grids with no
  `rounded` ancestor on a header cell) and the fixture card (several `rounded`
  descendants). All four are found by structure now.
- **A Remove button is `position: absolute`** and sits outside its own row's box,
  so two attempts at a tight clip came back with no control in the picture. 08.3's
  last two shots are the whole TEAMS section; what changes between them is which
  control the article points at.
- **The board header shot** clipped to the banner card alone and showed footballs
  with neither the tiles nor the tab strip. It is a viewport capture now.
- **08.5's share window is unmasked.** The plan masked the link and the QR code;
  doing it filled most of the window with two black slabs and hid the copy button
  with them. docs/style-guide.md, in the paragraph that lists QR codes: "Do not
  mask the thing the article is about."

### Where to look hard in 08

- **08.5 says the Owner or an Administrator can delete a leaderboard.** An
  Administrator is given the whole DELETE LEADERBOARD section and its button, and
  that is what the article is written from. **It was not tested** - confirming it
  would have destroyed four unrepeatable matches. If the API refuses an
  Administrator, that line is wrong.
- **08.2 says an administrator added by email is matched to their account.** True
  for an address that already has one - the id returned is that account's own
  `playerId` and they immediately read the board with `isAdmin: true`. What happens
  to an address with no account was not tested.
- **08.4 says Compare needs Pro.** Read off `config/api.md`'s list of client-side
  gates rather than seen refused: the persona is Pro, so the control was live.
- **08.5 says a non-member's comment is refused.** Proved over the API, not
  through the browser - the refusal raises an error toast, which the style guide
  will not have in a capture. What the reader actually sees on screen is unknown.
- **`adminPlayers[].isRegistered` reads `false` for an account that exists.**
  Assumed to be a bug in that field. No article repeats it.

### Flake

None. The five specs were run individually while their captures were fixed, then
the whole seven-test suite was run in one go and passed. The seed reported zero
writes afterwards, and the league was back to three teams.

### A leftover session from another collection

The in-app browser this session opened was still signed in as
`kb-player-11@yopmail.com`, collection 11's persona. Its Leaderboards list was on
screen before anything was typed. Nothing was changed and no call was made as her;
the storage was cleared and the rest of the exploration ran through Playwright in
its own context. Worth knowing that the shared browser keeps a session between
sessions.

Next: pick from the remaining collections - 09, 10, 15, 17, 18, 19, 20, 21, 22, 24.

### The remaining collections were filtered - 2026-08-29

The repo owner cut articles from six collections that had not started, and
renumbered what was left so each collection runs from .1 with no gaps.

| # | Was | Now | Dropped |
|---|---|---|---|
| 08 | 8 | 5 | what a leaderboard is; leaderboard admins; reading the league table |
| 09 | 8 | 7 | creating a match from the calendar. 09.1 retitled "Creating a match" |
| 10 | 11 | 10 | after the match - the league table, rating and results |
| 17 | 11 | 9 | payout account statuses; when your payout arrives |
| 18 | 8 | 4 | group admins; sending messages, photos and files; read receipts; chat on the Free plan |
| 21 | 4 | 3 | your referee statistics and availability |

Renumbering moved two articles that other files referenced: **09.7 became 09.6**
and **17.10 became 17.8**. Both fixed in `config/personas.yaml`.

Nothing published was touched - all six were `not started`.

**Collection 23 retired the same day.** Powerleague & CentreNet bookings was
dropped rather than merged - those partner-booking articles are not being written.
Its Intercom collection `19733992` is empty and marked `retired: true`, as 03 and
16 were. Totals are now 130 articles, 727 screenshots, 20 live collections.

Next: pick from the remaining collections.

---

## Collection 09 - Creating & scheduling matches - 2026-08-31

Seven articles, 44 screenshots, all sitting in Intercom collection `19733978` as
**drafts**. Nothing published.

| Article | Title | Intercom id | Shots |
|---|---|---|---|
| 09.1 | Creating a match | 16762189 | 10 |
| 09.2 | Match statuses, and why a match is stuck on Incomplete | 16762191 | 5 |
| 09.3 | Venue, date, kick-off time, duration and pitch | 16762193 | 6 |
| 09.4 | Match tags, and attaching a match to a leaderboard | 16762195 | 5 |
| 09.5 | Editing or cancelling a match | 16762196 | 5 |
| 09.6 | Assigning a referee, and adding a banner or note | 16762197 | 6 |
| 09.7 | Inviting people, sharing a preview and the matches calendar | 16762199 | 7 |

Image URLs are pinned to **`67a299df04e14b628587ce1fe9c9661786925859`**. All 44
verified 200 `image/png` on jsDelivr before publishing.

### The three findings that shaped the collection

- **Create Match creates the match.** The click fires
  `POST /matches {"status":"Incomplete"}` and lands on `/matches/:id`, already a
  real row. Nothing is confirmed. A reader who closes the tab leaves a half-built
  match on their team's fixture list with a **Finish Setup** button on it. 09.2 is
  that article, and it is the likeliest support ticket here.
- **Seven fields decide Incomplete versus Scheduled**: `homeTeam`, `awayTeam`,
  `leaderboardId`, `clubLocationId`, `date`, `duration`, `teamSize`. Isolated by
  dropping one at a time. `tag` and the line-ups are not among them. The
  leaderboard is the surprise - **a friendly kickabout needs one too**, and nothing
  on the form says so. `config/api.md` had only the venue half, from collection 08.
- **There is no delete.** `DELETE /matches/:id` answers "Match cancelled
  successfully" and sets `status: "Cancelled"`; the row survives and still answers
  200 by id, it just leaves every list. The gear menu offers *Configure
  appearance*, *Edit* and *Cancel Match* and nothing else. **09.5 retitled**
  "Editing or cancelling a match".

### What differed from the brief

Nothing structural: seven articles, 44 shots, none added or dropped. Five shot
descriptions were corrected mid-run, all of them step-1 claims the app disagreed
with. They are written up in [briefs/09.md](../briefs/09.md) under "What happened
in step 2"; the short version:

1. **"Match Preview (View Only)" is never on screen.** The `h1` says it and is
   `display: none` at every desktop width. 09.4 and 09.5 now describe what a plain
   Player actually gets - the match read-only, no gear, no form.
2. **The empty referee list has two wordings**: *No options available* cold, *No
   results found* once you type. And the list is seeded from the match's own
   referee, so on a match that has one it looks like a working search. 09.6's shot
   is taken on a match with no referee, with a name typed in.
3. **The Game type badge changes on save, not on selection.** 09.4's shot 02 was
   re-taken from the saved page.
4. **The calendar's Day view opens on today**, and both fixtures are later in the
   month, so the first capture was an empty column. It now picks 24 September.
5. **The notifications panel says "Match scheduled"**, not "Match invitation" -
   that is the home page's Trending wording, and the first capture was of Trending.

### What was skipped

Nothing. Two things could not be produced and are documented as absences rather
than dropped:

- **A reader choosing a referee.** The Referee box searches
  `tournamentSelectionOnly=true`, which narrows it to referees you saved while
  setting up a tournament. `isReferee` is settable through nothing a user can
  reach. 09.6 shows the empty list and says why.
- **A working public preview.** Photographed as it is - broken.

### Look hard at these

- **09.6's referee section.** The one article that documents an absence. If a
  referee-registration flow exists outside a tournament, it is wrong. Collection 21
  owns `21.1 Referee registration`, which `config/api.md` still lists as having no
  endpoint.
- **09.7's warning that the share link needs a Scoryboard account.** It
  contradicts the app's own copy, deliberately. Second of two: collection 08 found
  the same shape on a leaderboard's share link.
- **09.5's "there is no undo".** True of the app. Not true of the API, where
  `POST /matches/:id/status {"status":"Scheduled"}` revives a cancelled match. The
  article documents the app.
- **09.2's status list.** Incomplete, Scheduled, Cancelled and Finished were all
  seen. **Live and Paused were not** - they are collection 10's, and are named here
  from the API's enum.
- **09.7 shot 02 is nothing but skeletons**, which `docs/style-guide.md` forbids.
  Deliberate: the skeletons are the defect the article is about.

### Two rendering faults, no article

- **A team the reader does not own renders as a placeholder** - "Add Away Team",
  "Not set", "Location not set" - until the app has loaded `/teams` once in that
  session. Over data that is present. `warm09()` in `lib/kb.ts` is the specs' fix;
  a reader following a link straight to a match has none. Worth a ticket.
- **The match card does not redraw after Add Team.** The save lands, the window
  closes, the button still says Add Away Team. 09.1 warns about it.

### Flake

None. The whole fourteen-test suite ran in one go and passed, and the seed
reported zero writes afterwards.

### The fixture is perishable

The two seeded matches sit on **fixed** dates - 24 and 30 September 2026 - because
a screenshot of a calendar has to say the same thing every run. A match created
with a past date starts itself, so once those dates pass `scripts/seed-09.mjs`
would build a Live match instead of a Scheduled one. **It refuses to run in that
case** and names the date to move. Move both forward in `lib/fixtures-09.mjs`,
`--rebuild`, re-capture. Every spec freezes its clock to 2026-09-01T09:00:00Z.

Six throwaway matches are created and cancelled across a full run. A cancelled
match cannot be deleted, so they accumulate on `kb-manager-pro-09@yopmail.com` -
invisible everywhere, harmless.

### 09.6 rewritten after publishing

Its referee section read as a three-step procedure that led nowhere - a reader
followed it and found they could not do the thing. Rewritten as prose that leads
with the answer: you cannot add a referee to an ordinary match, then why, then
what to do instead. Same six screenshots, same commit SHA, no re-capture.

The article was already published by then. `publish-article.mjs` read the live
state, found `published`, and PUT the new body without sending `state` - content
updated, article left on the help centre. Working exactly as it is meant to.

### All seven were published two minutes after the run - not by the run

Worth writing down, because the timestamps look alarming until you read them.

`scripts/publish-article.mjs` POSTed each article and Intercom answered
`state=draft` every time - that is in the run's own output, and `state/manifest.json`
records `draft` for all seven. The last POST landed at **16:09:45Z**. Reading the
seven back afterwards, every one says `state: "published"`, and every one was
updated inside a **four-second window at 16:11:22-16:11:26Z**, in creation order.

Nothing in this session touched Intercom between those two moments. This is the
reviewer doing what the workflow says they do: read the drafts and publish them.
Collection 08 shows the same shape from earlier the same day - its manifest still
says `draft`, and Intercom has had those articles published since ~13:30Z.

**They were left alone.** Flipping them back would take live articles off the help
centre, which is the exact failure `publish-article.mjs` was rewritten to prevent.
The manifest will correct itself on the next re-publish, which reads the live state
before it decides.

So: the run published drafts, and only drafts. **Whether the content was reviewed
before that publish is not something this session can see** - the reviewer may have
read them, or may have published the collection wholesale. Everything under "Look
hard at these" above still wants a human eye, published or not.

Next: pick from the remaining collections - 15, 17, 18, 19, 20, 21, 22, 24.

---

# Session log - collection 10, Match day, 2026-09-01

Ten articles, sixty screenshots, all ten now drafts in Intercom collection
19733979. **Nothing is published.** The drafts are unreviewed.

| Article | Intercom id | Shots | Title |
|---|---|---|---|
| 10.1 | 16769856 | 9 | The match screen, its tabs and the guided tour |
| 10.2 | 16769863 | 9 | Picking your lineup and choosing a formation |
| 10.3 | 16769866 | 6 | Starting, pausing and ending a match |
| 10.4 | 16769870 | 3 | The match timer |
| 10.5 | 16769873 | 6 | Awarding a goal, and revoking one entered by mistake |
| 10.6 | 16769874 | 7 | **Yellow and red cards, and how the final score is set** (retitled) |
| 10.7 | 16769875 | 3 | Choosing Player of the Match |
| 10.8 | 16769877 | 8 | The match feed and commentary |
| 10.9 | 16769879 | 5 | Recording a match that has already been played |
| 10.10 | 16769883 | 4 | Live viewers, and following a match from another device |

Each article's images are pinned to the commit that added them; the last is
`9c4ca1982dabd8caccc7bebcb0ec5fa0a7180376` (10.10). Every URL was checked for
`200` and `image/*` before its article was built. Sixty URLs, none broken.

### What the collection is built on

**A match runs itself.** It starts when its date arrives - `autoStarted: true`,
about two seconds after `POST /matches`, with nothing open in a browser. And it
**ends itself 24 hours after full time**: past the whistle the countdown in the
card changes from "Match starts in" to **"Match auto-ends in"** and runs for a
day. Both halves of one rule, and the second is what 10.9 is about - a match
created more than a day after it finished arrives `Finished` at 0-0 and can never
be scored. Measured across three durations before it was written down.

**END MATCH does not exist until the timer reaches 00:00.** Two exploration runs
looked for it in the gear menu and down the page body first. The timer pill is
also the pause control; there is no separate one.

**A Live match cannot be edited** - `PUT` answers 403 on any configuration field.
The gear menu still offers Edit, and its save is refused.

**There are no penalties and no final-score field on an ordinary match.** Both are
tournament-knockout features. 10.6 was retitled for it.

**The match feed has no REST read.** `GET /matches/:id/events` answers 404; the
page subscribes to Firestore. That is what makes 10.10 true, and it means a spec
cannot assert the feed over the API.

All of this is now in `config/api.md`, along with the six-tab layout, the
controls-by-role table, the Shepherd.js tour and the two Free gates.

### What differed from the brief

The brief carries a **"Changed during the run"** section listing all of it. The
four that matter:

1. **10.6 retitled** - decided in step 1, for the reason above.
2. **`PUT {status:"Cancelled"}` works on a Finished match.** The brief and the seed
   both said it did not. Corrected everywhere: nothing this collection creates
   accumulates, and a full run leaves the two fixtures it started with.
3. **The throwaway leaderboard was renamed** `KB 10 Scratch` to `KB 10 Midweek`
   after the first full run showed it in the detail strip of eight screenshots. A
   reader should see a plausible second league, not scaffolding. Re-captured.
4. **A line-up position that repeats needs its index** - `CenterBack-1` /
   `CenterBack-2`. The first fixture used the plain value twice, the API accepted
   it, and the pitch drew three of five players. Rebuilt.

### Look hard at these

- **10.9's 24-hour deadline.** The figure is measured, not documented: 24h ago
  works, 25.13h does not, and the same boundary holds at 90 and 120 minutes once
  the duration is subtracted. What is *not* known is whose clock the server uses -
  UTC, the venue timezone, or the account's - or whether the worker that does it
  runs on a schedule that could delay the effect. A reader in another timezone
  recording a match near the boundary might get a different answer. The article
  says "more than a day ago" rather than quoting a figure.
- **10.3's claim that the referee can end a match.** An assigned referee was
  confirmed to get START MATCH and the timer pill on both a Scheduled and a Live
  match. **END MATCH was not exercised as the referee** - it only appears at full
  time, and putting a refereed throwaway there needs its own frozen clock. The
  article says the referee can start, pause and end; the "end" is inference from it
  being the same button in the same place. **The one line in this collection resting
  on inference rather than observation.**
- **10.6's "there are no penalties".** An article that documents an absence. The
  evidence is the app bundle - `isPenalty` read behind `tournamentMatchId`, beside
  "Enter a deciding score ... to proceed with the next round of the tournament" -
  plus a 0-0 match ended on staging that produced a plain DRAW with nothing asked.
  If a penalty control exists on an ordinary match somewhere, the article is wrong.
- **10.2's Free/Pro split rests on the signed-in user's membership.** Ada is a Free
  *Administrator* on a Pro owner's team and hits both gates, which is what lets this
  collection avoid a membership flip. Verified both ways on SUB-1 and SUB-4, but it
  is worth a second look: if the gate ever keys off the team owner instead, 10.2 and
  10.8 both become wrong.
- **10.1 shot 04, the FACTS panel.** Its *Statistics so far* half is
  leaderboard-scoped and stable. Its *Insights* half is not - the five sentences per
  team count that team's last five games across everything, throwaways included, so
  a re-capture will read "0 consecutive goals" where this one reads "1". Harmless,
  because no article quotes those numbers, and the panel is collection 11's subject.
  Named so it is not mistaken for a regression.

### One product defect found

**Reloading a paused match resumes it.** The page decides on load that a match
inside its own window should be running and posts `{status: "Live"}`. Proved three
times: Paused before the reload, Live after it. A manager who pauses at half-time
and refreshes has restarted the clock, and nothing on screen says so. 10.3 warns
about it and asserts it; 10.4 repeats the warning. **Worth a ticket.**

Also worth knowing, though not a defect: **finishing the guided tour clears the
account's bio**, exactly as Skip Tour does, because both send a full-replace
`PUT /users/:id`. Third instance of that shape in `config/api.md` after the profile
photo and the banner. 10.1's spec restores the profile in a `finally`.

### One fix that belongs to every collection

`imagesPainted()` in `lib/kb.ts` was dropping its background-image probe `Image`
objects. Nothing referenced them once the function returned, so the browser was
free to collect them before they loaded, and neither `onload` nor `onerror` ever
ran - the wait then timed out on two images that both answered 200 when fetched by
hand. Intermittent by nature, which is how it survived nine collections. The probes
are now retained and the wait polls on a timer rather than on
`requestAnimationFrame`. **If an older collection has ever failed in
`imagesPainted` for no visible reason, this was why.**

### Flake

One, and it was that bug rather than the app: 10.3's fourth test failed twice in
`imagesPainted` before the cause was found. After the fix it ran three times in a
row and then twice more as part of the full suite, clean. **The final
twenty-two-test suite passed in one go**, and the seed reported zero writes
afterwards.

Three specs were rewritten during the run rather than patched - 10.3 was split from
three tests into four, because pausing and ending cannot share a frozen clock.
Every failed run's cause is written into the spec that hit it.

### The fixture is perishable in one place

`MATCHES.scheduled` sits on a **fixed** date, 15 October 2026, because a countdown
has to say the same thing every run. Once that date passes the same POST would
build a match that starts itself, and `scripts/seed-10.mjs` **refuses to run** and
names the date to move. Move it forward in `lib/fixtures-10.mjs`, `--rebuild`,
re-capture.

The `played` fixture has **no** fixed date and cannot have one: events are only
accepted while a match is Live, and a match is Live only between its date and its
date plus its duration, so a fixed date months back is Live for about a second and
then finishes itself with the events half written. The seed dates it five minutes
before it runs, and `fixtures10()` derives every frozen clock from it. That is why
there is no `FROZEN_NOW` constant in this collection.

### Published, on the owner's instruction, without the Intercom review

The run posted all ten as `state: "draft"`, which is the only thing it is allowed
to do, and verified them: `parent_ids: [19733979]`, sixty images rendering.

**The owner then asked for all ten to be published, and they were** - ten
`PUT`s with `--state published`, all 200, all confirmed `published` afterwards
with their images intact. So `docs/workflow.md`'s review gate did not happen for
this collection: nobody read these articles in Intercom before they went out.

**And the help centre is live.** `website_turned_on` was `false` when
`config/intercom.yaml` was written on 2026-08-28 and is **`true`** as of
2026-09-01, so these ten are publicly readable now. That file has been corrected;
it was the reason the stakes of publishing were checked before doing it rather
than after.

Live URLs:

```
10.1   https://help.scoryboard.com/en/articles/16769856-the-match-screen-its-tabs-and-the-guided-tour
10.2   https://help.scoryboard.com/en/articles/16769863-picking-your-lineup-and-choosing-a-formation
10.3   https://help.scoryboard.com/en/articles/16769866-starting-pausing-and-ending-a-match
10.4   https://help.scoryboard.com/en/articles/16769870-the-match-timer
10.5   https://help.scoryboard.com/en/articles/16769873-awarding-a-goal-and-revoking-one-entered-by-mistake
10.6   https://help.scoryboard.com/en/articles/16769874-yellow-and-red-cards-and-how-the-final-score-is-set
10.7   https://help.scoryboard.com/en/articles/16769875-choosing-player-of-the-match
10.8   https://help.scoryboard.com/en/articles/16769877-the-match-feed-and-commentary
10.9   https://help.scoryboard.com/en/articles/16769879-recording-a-match-that-has-already-been-played
10.10  https://help.scoryboard.com/en/articles/16769883-live-viewers-and-following-a-match-from-another-device
```

**"Look hard at these" above still stands, and now it applies to live pages.** In
particular 10.3's line about the referee being able to end a match is inference,
and 10.6 documents an absence. If either is wrong it is wrong in public. Both are
one `node scripts/publish-article.mjs <id>` away from being corrected - the script
reads the live state and PUTs new content without knocking a published article
back to draft.

### Prose pass after publishing, 2026-09-01

The owner read 10.9 and 10.1 and found sentences that take a beat to process.
A full pass over all ten followed: **38 edits, no re-capture.** Every article was
rebuilt against the commit its own screenshots are pinned to, so no image URL
changed, and republished in place - all ten still published, sixty images intact,
verified by reading the live bodies back and grepping them for the old phrasing.

The pattern being fixed was one of two things every time: a pronoun whose referent
is two clauses back, or three ideas welded into one sentence. The worst were
10.1's "They scroll you down it", 10.2's "Check the shape has room for both" (the
reader had added one player, so "both" pointed at nothing), 10.3's "do not reload
and do not reopen the match on another device - either one puts the clock back
on", and 10.6's "Select team is marked with an asterisk because you have to do it
first". Six flourishes the style guide bans went with them - "A finished match is
finished", "The laurel follows the player", "Scoryboard puts the whistle where it
belongs" - and 10.6's "sending off", which is not the product noun where the app
says **Red Card**.

**One of the 38 was a content correction, not a rewording.** 10.9 told a reader
catching up on a weekend of fixtures to "start with the most recent". That is
backwards if several matches are still inside the 24-hour window, because the
**oldest** expires first; it is only right if the older ones are already lost, and
the sentence did not say so. Cut rather than reworded - ambiguous advice about a
deadline is worse than none.

Worth drawing from this: the articles were written and published in one run
without a reader, and a reader found a dozen sentences in a few minutes. The
step-2 checklist inspects every screenshot and nothing reads the prose aloud.
