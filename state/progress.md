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
| 01 | Getting started & onboarding | 7 | 44 | fresh | drafts on Intercom | [briefs/01.md](../briefs/01.md) | 7 drafts, 43 screenshots. 01.3 is one short - the invitation screen needs an inbox and yopmail now demands a CAPTCHA. Seven accounts, all `kb-fresh-01@` or `kb-01-*@` |
| 02 | Finding your way around | 6 | 25 | manager_free | not started | - | - |
| 03 | Your profile & settings | 6 | 30 | player | not started | - | - |
| 04 | Plans & membership | 3 | 17 | manager_free | not started | - | Pro is a free self-serve toggle during beta. No payment step. Flag for rewrite when beta ends. |
| 05 | Friends | 4 | 20 | manager_free | not started | - | - |
| 06 | Following | 1 | 6 | player | not started | - | - |
| 07 | Teams | 11 | 63 | manager_pro | not started | - | - |
| 08 | Leaderboards & leagues | 8 | 40 | manager_pro | not started | - | - |
| 09 | Creating & scheduling matches | 8 | 50 | manager_pro | not started | - | - |
| 10 | Match day | 11 | 65 | manager_pro | not started | - | - |
| 11 | Match insights & statistics | 3 | 9 | player | not started | - | - |
| 12 | Tournaments - setting one up | 10 (+2) | 80 | organiser | published | [briefs/12.md](../briefs/12.md) | 12 published, 80 screenshots. 12.11 and 12.12 added for Padel; not in the map |
| 13 | Tournaments - groups, brackets & phases | 11 | 55 | organiser | drafts on Intercom | [briefs/13.md](../briefs/13.md) | flag: TOURNAMENT_FEATURE_ENABLED. 11 drafts, 55 screenshots. 13.8 retitled. Account: kb-organiser-13@yopmail.com |
| 14 | Tournaments - the fixture schedule | 8 | 37 | organiser | drafts on Intercom | [briefs/14.md](../briefs/14.md) | flag: TOURNAMENT_FEATURE_ENABLED. 8 drafts, 37 screenshots. 14.5 retitled - fixtures cannot be deleted. Account: kb-organiser-14@yopmail.com |
| 15 | Tournaments - publishing & running | 9 | 62 | organiser | not started | - | flag: TOURNAMENT_FEATURE_ENABLED. Structure unchanged; 15.8 needs a padel section. Account: kb-organiser-15@yopmail.com |
| 16 | Tournament plans & payment | 6 | 35 | organiser | not started | - | REAL MONEY. Stripe test mode required. |
| 17 | Collecting & making payments | 11 | 72 | manager_pro | not started | - | REAL MONEY, Stripe Connect. Two audiences - the organiser collecting and the player paying. |
| 18 | Chat & messaging | 8 | 50 | manager_free | not started | - | - |
| 19 | Comments, likes & ratings | 4 | 19 | player | not started | - | - |
| 20 | Notifications, emails & the activity feed | 4 | 16 | player | not started | - | No push notifications exist. Do not write one. |
| 21 | Referees | 4 | 23 | referee | not started | - | - |
| 22 | Venues & club locations | 2 | 11 | manager_pro | not started | - | - |
| 23 | Powerleague & CentreNet bookings | 4 | 16 | manager_free | not started | - | Partner-initiated records. High ticket volume because the user did not start the action. |
| 24 | Troubleshooting & policies | 4 | 13 | manager_free | not started | - | - |

Totals: 153 articles, 842 screenshots estimated across 24 collections. These count
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

Next: `/kb-brief 02`.
