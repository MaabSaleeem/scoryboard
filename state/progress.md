# Progress

Read this first, every session. Update it at the end of every session.

Status values: `not started` | `brief in progress` | `brief awaiting approval` |
`brief approved` | `publishing` | `published` | `blocked`.

One collection per session. Do not touch a collection that is not this session's
target.

| # | Collection | Articles | Shots (est.) | Persona default | Status | Brief | Notes |
|---|---|---|---|---|---|---|---|
| 01 | Getting started & onboarding | 8 | 46 | fresh | not started | - | - |
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
| 13 | Tournaments - groups, brackets & phases | 6 | 32 | organiser | not started | - | flag: TOURNAMENT_FEATURE_ENABLED |
| 14 | Tournaments - the fixture schedule | 5 | 23 | organiser | not started | - | flag: TOURNAMENT_FEATURE_ENABLED |
| 15 | Tournaments - publishing & running | 9 | 60 | organiser | not started | - | flag: TOURNAMENT_FEATURE_ENABLED |
| 16 | Tournament plans & payment | 6 | 35 | organiser | not started | - | REAL MONEY. Stripe test mode required. |
| 17 | Collecting & making payments | 11 | 72 | manager_pro | not started | - | REAL MONEY, Stripe Connect. Two audiences - the organiser collecting and the player paying. |
| 18 | Chat & messaging | 8 | 50 | manager_free | not started | - | - |
| 19 | Comments, likes & ratings | 4 | 19 | player | not started | - | - |
| 20 | Notifications, emails & the activity feed | 4 | 16 | player | not started | - | No push notifications exist. Do not write one. |
| 21 | Referees | 4 | 23 | referee | not started | - | - |
| 22 | Venues & club locations | 2 | 11 | manager_pro | not started | - | - |
| 23 | Powerleague & CentreNet bookings | 4 | 16 | manager_free | not started | - | Partner-initiated records. High ticket volume because the user did not start the action. |
| 24 | Troubleshooting & policies | 4 | 13 | manager_free | not started | - | - |

Totals: 146 articles, 806 screenshots estimated across 24 collections.

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

Next: `/kb-brief 13`.
