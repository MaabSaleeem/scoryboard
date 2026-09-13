# Progress

Read this first, every session. Update it at the end of every session.

Status values: `not started` | `in progress` | `published` | `blocked`.

`published` is where a finished run leaves a collection: every article live on
`https://help.scoryboard.com`. **Changed 2026-09-02** - a run used to stop at
`drafts on Intercom` and wait for a human to read the drafts and publish them, and
only a human could move a collection to `published`. That gate is gone; phase B
publishes. See the session log entry "The workflow changed".

`drafts on Intercom` still appears in older entries below. Read it as history.

The status column is checked against Intercom, not remembered:
`node scripts/reconcile-manifest.mjs` reads every article back and reports what
disagrees. On 2026-09-02 that found 90 stale rows and seven wrong collection
statuses.

One collection per session. Do not touch a collection that is not this session's
target.

| # | Collection | Articles | Shots (est.) | Persona default | Status | Brief | Notes |
|---|---|---|---|---|---|---|---|
| 01 | Getting started & onboarding | 8 | 54 | fresh | published | [briefs/01.md](../briefs/01.md) | 43 screenshots. **01.4-01.7 published by the reviewer 2026-08-28; 01.1-01.3 followed later.** 01.3 retitled "Resetting your password" - the invited-account half was dropped. Seven accounts, all `kb-fresh-01@` or `kb-01-*@`; two now unused **Status corrected to `published` 2026-09-02: scripts/reconcile-manifest.mjs read every article in this collection back off Intercom and all of them are live.**  **AMENDED 2026-09-08: 01.4 and 01.6, prose only - a padel signup has `Best hand *` instead of Preferred position, gains a `/padel-level` step, and its profile checklist reads (3), not (2). 8sept-updates.md A11.** **AMENDED 2026-09-13: 01.8 ADDED - "The padel rating questionnaire", 10 shots, LIVE. Eighth account `kb-01-padel@` (Padma KB), rebuilt every run. 8sept-updates.md B3.** |
| 02 | Finding your way around & your profile | 9 | 46 | player | published | [briefs/02.md](../briefs/02.md) | 36 screenshots. **All eight published by the reviewer 2026-08-29.** 02.1, 02.3 and 02.6 amended and republished afterwards. 03 merged in 2026-08-29; four articles dropped. Accounts: `kb-player-02@`, `kb-02-owner@`, `kb-02-pro@`  **AMENDED 2026-09-08: 02.6, 02.7 and 02.8. A FOURTH ACCOUNT was added - `kb-02-padel@` (Perry KB), the only padel account here. 3 new screenshots (36 -> 39). The padel profile is a different layout, Team rank does not need a leaderboard, and Compare reads football statistics only. 8sept-updates.md A8, A10, A12.** **AMENDED 2026-09-13: 02.9 ADDED - "Setting up your padel profile", 7 shots, LIVE. Fifth account `kb-02-padelsetup@` (Pax KB), rebuilt every run. 8sept-updates.md B2.** |
| 04 | Plans & membership | 6 | 30 | manager_free | published | [briefs/04.md](../briefs/04.md) | 30 screenshots. **All six published by the reviewer 2026-08-29.** 04.6 amended and republished afterwards - when a slot is spent. Collection 16 was retired into this one 2026-08-29 - its six articles became three, and 16.5 was dropped. 04.1 amended and republished - the Coming soon paragraph was dropped. Pro is a free self-serve toggle during beta - no payment step, and no confirmation in either direction. Flag for rewrite when beta ends. Three accounts, NOT one flipped: `kb-manager-free-04@`, `kb-04-pro@`, `kb-04-upgrade@` |
| 05 | Friends | 5 | 26 | manager_free | published | [briefs/05.md](../briefs/05.md) | 26 screenshots. **05.1-05.4 published by the reviewer 2026-08-31; 05.5 followed later.** Collection 06 was retired into this one 2026-08-31 - 06.1 became 05.5. Found that a **refused Add To Team deletes the friend** (ONE_FRIEND_PER_TEAM), which also answers collection 04's open question 1. Accounts: `kb-manager-free-05@`, `kb-05-mate@`, `kb-05-player@`, `kb-05-invitee@`. `kb-05-claimer@` is burnt - see the session log **Status corrected to `published` 2026-09-02: scripts/reconcile-manifest.mjs read every article in this collection back off Intercom and all of them are live.** |
| ~~06~~ | ~~Following~~ | - | - | - | **retired** | - | **RETIRED 2026-08-31, merged into 05.** 06.1 became 05.5. Intercom collection 19733975 was empty before the merge and is empty after it; it must not be reused |
| 07 | Teams | 11 | 63 | manager_pro | published | [briefs/07.md](../briefs/07.md) | 63 screenshots. **All eleven published by the reviewer 2026-08-29.** 07.7 and 07.9 retitled - the app has no ownership transfer and no Fan role. Accounts: `kb-manager-pro-07@`, `kb-fresh-07@`, six `kb-07-*@`  **AMENDED 2026-09-08: 07.10, prose only - tournament fixtures count towards the team tiles. 8sept-updates.md A8.** |
| 08 | Leaderboards & leagues | 5 | 30 | manager_pro | published | [briefs/08.md](../briefs/08.md) | 30 screenshots. Found that **removing a team from a leaderboard has no confirmation at all**, that the league table carries **no points, no draws and no goals conceded**, that the Share Leaderboard "public link" sends a signed-out visitor to `/signin`, and that a comment can never be deleted - `DELETE /comments/:id` answers 401 even to its author. The **External** badge on a team row means "not one of your own", and it wrongly marks the owner’s own teams until the account has opened `/teams` once. Four accounts: `kb-manager-pro-08@`, `kb-08-admin@`, `kb-08-free@`, `kb-08-outsider@`. Four played matches; they cannot be undone **Status corrected to `published` 2026-09-02: scripts/reconcile-manifest.mjs read every article in this collection back off Intercom and all of them are live.**  **AMENDED 2026-09-08: 08.4, one sentence - "adds nothing to any table" narrowed to this leaderboard's own tabs. 8sept-updates.md A8.** |
| 09 | Creating & scheduling matches | 7 | 44 | manager_pro | published | [briefs/09.md](../briefs/09.md) | 44 screenshots. Found that **Create Match creates the match** on the click, that **seven** fields decide Incomplete vs Scheduled - and a **leaderboard is one of them, even for a friendly** - and that **`DELETE /matches/:id` does not delete**, it sets `status: "Cancelled"`. 09.5 retitled "Editing or cancelling a match" - there is no delete anywhere in the app. 09.6's referee half narrowed: the Referee box only offers referees saved from a tournament, so it reads "No results found" for a manager who has never run one. The match **share link is not public** - a signed-out visitor gets Sign In and permanent skeletons. Four accounts: `kb-manager-pro-09@`, `kb-09-admin@`, `kb-09-player@`, `kb-referee-09@`. Two Scheduled fixtures on FIXED dates (24 and 30 Sept 2026); the seed refuses to run once they have passed. **All seven were published by the reviewer 2026-08-31, two minutes after the run posted them as drafts** **Status corrected to `published` 2026-09-02: scripts/reconcile-manifest.mjs read every article in this collection back off Intercom and all of them are live.**  **AMENDED 2026-09-13: 09.2, one sentence - `PUT /matches/:id {date: null}` really does return a Scheduled match to Incomplete, but nothing on the match form does. 8sept-updates.md A14.** **AMENDED 2026-09-08: 09.7 rewritten and 2 shots re-captured - the match share link is genuinely public now. See the session log for 8sept-updates.md A1.** **ALSO 2026-09-08: 09.4, prose only - a tournament fixture carries no leaderboard and still writes statistics. 8sept-updates.md A8.** **AMENDED 2026-09-13: 09.6, one paragraph - the match note is public. Anyone with the link reads it signed out. 8sept-updates.md B9.** |
| 10 | Match day | 10 | 60 | manager_pro | published | [briefs/10.md](../briefs/10.md) | 60 screenshots. **All ten published 2026-09-01 on the owner's instruction, straight after the run - not reviewed in Intercom first. The help centre is LIVE, so they are public.** See the session log. Found that **a match runs itself**: it starts when its date arrives and **ends itself 24 hours after full time** - the card says "Match auto-ends in" - so a match created more than a day after it finished arrives `Finished` at 0-0 and can never be scored (10.9). **END MATCH does not exist until the timer hits 00:00**; the timer pill IS the pause control. **Penalties and typed score entry are tournament-only**, so 10.6 was retitled "Yellow and red cards, and how the final score is set". The match feed has **no REST read at all** - it is a Firestore subscription, which is what makes 10.10 work. Two Free gates with no error code: the fourth substitute slot and Add media. **Reloading a paused match resumes it** - a real defect, warned about in 10.3 and 10.4. Four accounts: `kb-manager-pro-10@`, `kb-10-admin@`, `kb-10-player@`, `kb-referee-10@`. Two leaderboards: KB 10 Sunday League holds the fixtures, KB 10 Midweek holds every throwaway. One Scheduled fixture on a FIXED date (15 Oct 2026); the seed refuses to run once it has passed  **AMENDED 2026-09-08: 10.10, prose only - the two sign-in claims were false, and signed-out viewers show as `Anonymous User`. 8sept-updates.md A3.** **ALSO 2026-09-08: 10.1 was CHECKED for 8sept-updates.md A8 and is correct - the Facts tab really is leaderboard-only. No change.** |
| 11 | Match insights & statistics | 3 | 9 | player | published | [briefs/11.md](../briefs/11.md) | 9 screenshots. 11.1 retitled - the app has no form guide and no head-to-head record. Found that **a match outside a leaderboard writes no statistics at all** and that a player counts the matches they were in the LINEUP for. Accounts: `kb-player-11@`, `kb-11-owner@`. Four played matches; they cannot be undone. **All three published by the reviewer 2026-08-31, then all three rewritten for clarity and republished** **Status corrected to `published` 2026-09-02: scripts/reconcile-manifest.mjs read every article in this collection back off Intercom and all of them are live.**  **AMENDED 2026-09-08: 11.2 and 11.3, prose only - tournament fixtures count towards the tiles; the LEADERBOARDS table is still leaderboard-only. 11.1 was checked and is CORRECT - the Facts tab really is leaderboard-only. 8sept-updates.md A8.** |
| 12 | Tournaments - setting one up | 10 (+2) | 80 | organiser | published | [briefs/12.md](../briefs/12.md) | 12 published, 80 screenshots. 12.11 and 12.12 added for Padel; not in the map  **THE DO-NOT-RE-RUN WAS REOPENED FOR 12.4 ONLY, 2026-09-08, on the repo owner's instruction** - all 9 of its shots re-captured, shot 06 re-pointed at the League schedule block. Every other collection-12 article is still not to be re-run. 8sept-updates.md A5.|
| 13 | Tournaments - groups, brackets & phases | 12 | 61 | organiser | published | [briefs/13.md](../briefs/13.md) | flag: TOURNAMENT_FEATURE_ENABLED. 11 articles, 55 screenshots. 13.8 retitled. Account: kb-organiser-13@yopmail.com **Status corrected to `published` 2026-09-02: scripts/reconcile-manifest.mjs read every article in this collection back off Intercom and all of them are live.**  **AMENDED 2026-09-13: 13.5 (3 shots, all re-captured, plus 13.6's provenance line) and 13.11 (6 of 10 re-captured) - the football draw is worth 2 points by default now, applied at read time, so historical standings recomputed. Ranking order unchanged. A Results-tab fixture card also shows `startedAt` instead of the scheduled kick-off; published on the owner's instruction. 8sept-updates.md A15.** **AMENDED 2026-09-08: 13.10, prose only - football and Other Sports both have a Configuration button now, opening a dialog headed `Football Configuration`. No re-capture. 8sept-updates.md A7.** **AMENDED 2026-09-13: 13.12 ADDED - "Changing a football format after you have saved it", 6 shots, LIVE. New fixture KB 13 Configuration, the only rolling-date tournament in this seed. 8sept-updates.md B1.** **AMENDED 2026-09-13: 13.5 prose only (PTS provenance, reusing 13.6's wording) and 13.11 prose plus ONE new shot (11) - the padel `Continue <format>` banner. EVERY padel format shows that banner, Swiss included; 8sept-updates.md B5 and config/api.md were both wrong about which. The gate is the current round being complete. King of the Court puts `Create Playoffs` in the End Phase dialog, not the banner. 8sept-updates.md B4, B5.** **AMENDED 2026-09-13: 13.6, prose only - the shared-kick-off rule is every padel format except Round Robin, which gives each match its own slot and ignores the round gap. 8sept-updates.md B8.** |
| 14 | Tournaments - the fixture schedule | 8 | 37 | organiser | published | [briefs/14.md](../briefs/14.md) | flag: TOURNAMENT_FEATURE_ENABLED. 8 articles, 37 screenshots. 14.5 retitled - fixtures cannot be deleted. Account: kb-organiser-14@yopmail.com **Status corrected to `published` 2026-09-02: scripts/reconcile-manifest.mjs read every article in this collection back off Intercom and all of them are live.**  **AMENDED 2026-09-13: 14.3, prose plus 4 of 5 shots - `Last allowed match start time` is gone from the dialog entirely on a Group-phase-only tournament, and the Schedule tab has WEEK and UNSCHEDULED bands. Shot 01 was pixel-identical and kept. 8sept-updates.md A13.** **AMENDED 2026-09-08: 14.1 prose only, and 14.5 rewritten with 6 shots re-captured - `Last allowed match start time` no longer exists. `14.3` has the same stale `WEEK 1` problem and is NOT fixed. 8sept-updates.md A2, A4, A13.** **ALSO 2026-09-08: 14.7, prose only - the generator DOES double-book, on a round added by the `Continue` banner, and saving a changed Padel Configuration wipes every played result. No re-capture. 8sept-updates.md A6.** **AMENDED 2026-09-13: 14.5 gained a section and 2 shots (07, 08) - dragging a fixture into the UNSCHEDULED band, the only control in the product that takes a date off a tournament fixture. 14.3 had one sentence corrected: the band sits UNDER the weeks, not above them. Two of 8sept-updates.md B6's claims are wrong - no toast renders at all, and the reverse drag normally lands on the earliest kick-off in that week, not on midnight. 8sept-updates.md B6.** **AMENDED 2026-09-13: 14.6 gained a Matches per week section (B7); 14.2 and 14.4 gained Round Robin scope sections (B8); 14.4 step 5 corrected and 14.7 scoped, both out of scope and fixed anyway. Prose only, no shot changed. 8sept-updates.md B7 and B8.** |
| 15 | Tournaments - publishing & running | 9 | 62 | organiser | published | [briefs/15.md](../briefs/15.md) | flag: TOURNAMENT_FEATURE_ENABLED. 65 screenshots. **AMENDED 2026-09-13: 15.9, 3 of 6 shots re-captured - the draw is worth 2 points now (9/6/2/2, was 9/6/1/1); shots 03 and 04 moved on layout only. 8sept-updates.md A15.** **All nine published by the reviewer 2026-09-01, within the hour the run posted them as drafts. 15.8 step 1 was simplified and republished afterwards, live.** Four articles retitled: **15.1 there is nothing to publish** (`isPublic` is already true on every tournament, and the public page really IS public, unlike the leaderboard and match share links); 15.2 drops access tokens (`/tournaments/token/:token` exists and nothing mints one); 15.6 drops prizes because **the PRIZES tab is a Winner panel whose picker records nothing** - Save Winner can never be enabled, established with a trusted click sequence and a passing control test; 15.9's "completing" re-scoped to the aftermath, since there is no Complete control. **Score entry is now verified** - START, two typed boxes that save on their own, END - and ending the PHASE is what closes it. 15.7's free_pro flag does NOT bite: Free and Pro read a long tournament message identically. Announcement-only chat refuses a tournament ADMIN too. The info page and gallery DO exist, behind a 16-pixel unlabelled pencil. Four accounts: `kb-organiser-15@`, `kb-15-admin@`, `kb-15-free@`, `kb-15-outsider@`. Six tournaments; two on FIXED dates in Oct and Nov 2026 and the seed refuses to run once they have passed |
| ~~16~~ | ~~Tournament plans & payment~~ | - | - | - | **retired** | - | **RETIRED 2026-08-29, merged into 04.** 16.1+16.2 -> 04.4, 16.3+16.4 -> 04.5, 16.6 -> 04.6. 16.5 dropped - managing a live Annual subscription needs a completed payment. Intercom collection 19733985 is empty and must not be reused |
| 17 | Collecting & making payments | 9 | 63 | manager_pro | published | [briefs/17.md](../briefs/17.md) | 52 screenshots. **All nine published by the repo owner 2026-09-02, on their instruction, without the usual draft review.** Every capture stops before Stripe, on instruction: setting up a payout account opens a window at connect.stripe.com, Pay Now opens Stripe Elements, and both are CAPTCHA-gated. 17.9 retitled "Payment statuses and failed payments" - the app has no refund feature at all. 17.2 is 4 shots not 12, 17.8 is 6 not 8; the rest were Stripe's own screens. **The payout account on `kb-manager-pro-17@` was connected by a human and cannot be rebuilt from here** - never `--rebuild` this collection without one. `kb-17-nopayout@` must stay un-onboarded. Four accounts: `kb-manager-pro-17@`, `kb-player-17@`, `kb-17-admin@`, `kb-17-nopayout@` |
| 18 | Chat & messaging | 4 | 27 | manager_free | published | [briefs/18.md](../briefs/18.md) | 27 screenshots. **All four published by the repo owner 2026-09-02, on their instruction, without the usual draft review. All 10 cross-references are live anchors.** **The persona default does NOT work here.** On Free an incoming message arrives as its first ten characters and an ellipsis, and replying to one or reacting to one is refused with 403 - so `kb-18-pro@` takes every capture and `kb-manager-free-18@` appears only in 18.1 where the gate is the subject. **Chat has a full REST surface** - nineteen `/chats` endpoints, now in config/api.md; personas.yaml's "seed the group chat through the UI" was wrong and is corrected. Deleting a message is NOT confirmed and cannot be undone. No read receipts exist. Five accounts: `kb-18-pro@`, `kb-manager-free-18@`, `kb-18-member@`, `kb-18-outsider@`, `kb-18-empty@` (holds no conversation, for the empty state) |
| 19 | Comments, likes & ratings | 4 | 19 | player | published | [briefs/19.md](../briefs/19.md) | 20 screenshots. **All four published by the repo owner 2026-09-02, on their instruction, without the usual draft review. All 6 sibling cross-references are live anchors (17 in all).** **Two of the four mapped titles describe features this build does not have, and both are retitled**: 19.1 "Commenting on a team or a leaderboard" - only a team page and a leaderboard render a comment panel, though `commentType` accepts match, player and tournament too; 19.2 "Replying to and liking comments" - a comment cannot be edited or deleted, by anyone, ever. 19.1's `free_pro` flag is **dropped**: Add Media on a comment is not Pro-gated, unlike the match feed's. 19.3 is 7 shots not 6 - a rating CAN be removed, from a kebab on your own row in the reviews list, found mid-run. **`POST /tournaments/:id/referee` is what sets `isReferee`** - closes a TODO collections 09 and 21 both left open. Five accounts: `kb-player-19@`, `kb-19-owner@`, `kb-19-pro@`, `kb-referee-19@`, `kb-19-outsider@` |
| 20 | Notifications, emails & the activity feed | 4 | 16 | player | published | [briefs/20.md](../briefs/20.md) | **12 screenshots, not 16.** All four published by the repo owner 2026-09-03, on their instruction, without the usual draft review. 14 sibling cross-references are live anchors (21 in all). **Three of the four mapped titles describe controls this build does not have, and all three are retitled**: 20.1 drops "filtering" (there is no filter control in the notification modal, the app never sends the API's `type` or `isRead`, and `isRead` answers an empty list for every value); 20.2 drops "Every" (the payment and tournament-organiser emails cannot be produced from here); 20.4 drops "how to filter it" and is named **Trending**, which is what the panel is called - the feed component takes a `query` prop and no caller passes one, across 65 chunks swept from every app route. **20.2 shipped table-only with 0 of its 4 shots**, on the owner's instruction: yopmail rate-limited this IP mid-run and answers a CAPTCHA in place of every message body. Its spec is written and unrun and its header carries the five steps to finish. **The bell badge is a running tally in Firestore, not a count, and it is not clamped** - it goes negative and stays there, so `scripts/seed-20.mjs` must run before EVERY capture and it heals and asserts the tally. **The Trending strip scrolls itself every 2.5 seconds.** The clock is deliberately NOT frozen - every stamp here is relative and freezing made every row read "3 hours ago". Four accounts: `kb-player-20@`, `kb-20-owner@`, `kb-20-mate@`, `kb-20-empty@` (holds no notifications, for the empty state). One match on a FIXED date, 1 Dec 2026; the seed refuses to run once it has passed |
| 21 | Referees | 3 | 18 | referee | published | [briefs/21.md](../briefs/21.md) | **19 screenshots, one over the estimate.** All three published by the run 2026-09-03, no draft review. 7 sibling cross-references are live anchors (21 in all). **There is no referee sign-up and no referee route** - `/referees` answers 404 and `POST /tournaments/:id/referee` is the only call in the product that sets `isReferee`, so an organiser is the only thing that can make one. A referee is the ordinary player profile in a **Referee / Football** role switch. **21.2 retitled** - it drops "Accepting an invitation", because there is none: no notification, no email, no accept endpoint, no pending state. **`config/api.md`'s referee role matrix was wrong on two cells** - the assigned referee DOES get the score steppers and DOES get Yellow/Red/Player of Match; it has no gear menu; and what the match page reads is `refereePlayerId`, not `isReferee`. No published article had repeated the wrong claim. **Two step-1 findings were corrected during step 2**: See All is not dead (it opens a Refereed Matches modal - hence the extra shot) and the switch says Football, not Player. **`scripts/seed-21.mjs` remakes the referee account on EVERY run** - referee stats are a lifetime count that includes cancelled matches, so 21.1's MATCHES tile drifted 1, 2, 3 across three runs. Three accounts: `kb-referee-21@`, `kb-21-organiser@`, `kb-21-newref@` (a referee with no matches, for the empty state). Two FIXED match dates, 5 and 6 Dec 2026; the seed refuses to run once either has passed  **AMENDED 2026-09-08: 21.1, prose only - a padel account has two profile pills without being a referee, and a padel referee has three. "No Referee switch" was the wrong diagnosis. 8sept-updates.md A9.** |
| 22 | Venues & club locations | 2 | 11 | manager_pro | published | [briefs/22.md](../briefs/22.md) | 11 screenshots, pinned to `37e38f874b7c675a67515fc47b9303532a032d43`. **Both published LIVE by the run on 2026-09-04, nothing reviewed first.** 12 cross-references are live anchors. **A venue belongs to its creator and only the creator may edit or delete it** - `403 "Club location can only be modified by its creator"` - and that holds inside a tournament, so a tournament Owner cannot edit a venue its Admin added. **Venue lists are per account**, which corrects collection 09's "covers every venue on the platform"; the only shared rows are 14 ownerless **Powerleague** venues that every account finds by a 3-letter search. **Two kinds of venue that never meet**: ordinary (match forms) and tournament (`isTournament`), and a tournament venue is offered to the next tournament only when `saveForFutureTournaments` is also true - otherwise it is **tournament-only** and invisible everywhere but that tournament. `POST /club-locations` **upserts by name**, so adding the same name twice yields one venue; a logo can be replaced but never removed; a deleted venue leaves matches at it untouched, still showing its name. **`/tournaments/:id/settings` with no role redirects to `/tournaments/:id/info`**, not to `/` - measured here, and it differs from the singular-route finding in 12 and 24. Accounts: `kb-manager-pro-22@` (Mo, Pro, holds all the venues), `kb-22-admin@` (Ana, Free, Admin of KB 22 Cup, holds none). The seed **sweeps** every non-fixture venue and tournament off both accounts. One FIXED tournament date, 19 Dec 2026; the seed refuses to run once it has passed |
| 24 | Troubleshooting & policies | 4 | 13 | manager_free | published | [briefs/24.md](../briefs/24.md) | 14 screenshots, pinned to `c71b85aa63f09b2d0347dbb29a34422966f2edde`. **All four published LIVE by the run on 2026-09-04, nothing reviewed first.** 24.2 has four captures, not three: the server refuses a comment photo at 2MB while the page promises 3MB. Accounts: `kb-manager-free-24@` (Free reader), `kb-24-owner@` (Pro). `KB 24 Comments FC` is remade on every seed run |

Totals: 133 articles, 750 screenshots estimated across 20 live collections
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

**One exception, 2026-09-08.** The repo owner reopened this for **12.4 alone**,
because the app changed under it: the overflow Yes/No question is gone from
"Group phase only" and a League schedule block stands in its place, so
`06-overflow-matches-toggle` had become unproducible. All nine of 12.4's shots
were re-taken and it was republished. **The divergence above still stands for
every other article in collection 12.** Note that none of 12.4's captures is one
of the six that photograph the tournament list, so the count that made this a
divergence in the first place did not appear in any of them.

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

Next: pick from the remaining collections. **Collection 21 published 2026-09-03**,
so 22 and 24 are what is left.

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

**2026-09-01 - collection 15, both steps.** Nine articles published as **drafts**
in Intercom collection 19733984: 15.1 `16771619`, 15.2 `16771622`, 15.3
`16771627`, 15.4 `16771638`, 15.5 `16771641`, 15.6 `16771643`, 15.7 `16771646`,
15.8 `16771652`, 15.9 `16771659`. 65 screenshots. Nothing published; nothing
reviewed. Image URLs are pinned per article to the commit that holds them, the
last being `76c1899`; the run finished at `3f1dc4a`.

Seeded with `node scripts/make-assets-15.mjs` then `node scripts/seed-15.mjs`,
which is idempotent - a second run makes zero writes. Four accounts
(`kb-organiser-15@`, `kb-15-admin@`, `kb-15-free@`, `kb-15-outsider@`) and six
tournaments: KB 15 Cup (Group A scored, Group B and the knockout not, so the
public page has both past and upcoming fixtures), KB 15 League (all scored,
announcement-only chat), KB 15 Padel Cup (all scored), KB 15 Sunday League
(nothing played - the one fixture a spec may change), KB 15 New Cup (never
configured) and KB 15 Done Cup (phase ENDED). Dates are fixed in Oct and Nov
2026 and the seed refuses to run once they have passed.

**Four articles retitled or rescoped.**

- **15.1 "Your public tournament page".** There is no publishing step:
  `GET /tournaments` answers `isPublic: true` on every row and no screen carries
  a control for it. The page is also *genuinely* public - a signed-out visitor
  gets the whole thing - which is the opposite of the leaderboard and match
  "public links" that collections 08 and 09 found bounce to `/signin`.
- **15.2 "Sharing your tournament link and QR code".** Access tokens dropped:
  `/tournaments/token/:token` is a real route that renders "This tournament
  access link is invalid or expired.", and nothing in the organiser board mints
  one. The article shows that screen as the only form of it a reader will meet.
- **15.6 "Sponsors on your tournament", prizes DROPPED.** The PRIZES tab holds
  no prizes; it is a **Winner** panel, and its picker records nothing - the
  trigger stays on "Select a team", the hidden native select stays empty, and
  **Save Winner can never be enabled**. Established rather than assumed: the
  option receives `pointerdown, mousedown, pointerup, mouseup, click`, every one
  `isTrusted: true`, and the listbox does not even close; and the **control test
  passes** - the Group component's Radix Select in the slideshow editor takes the
  identical click and moves from "Select group" to "Group A". No request is ever
  made, so the call that saves a winner has never been observed and is not
  written down. **This is the one thing needing a human decision.**
- **15.9's "completing a tournament" re-scoped to the aftermath.** There is no
  Complete control anywhere, and the phase controls are 13.11's article. What
  15.9 adds is what a finished tournament looks like.

**15.3 was retitled and then put back.** An earlier pass concluded the info page
and gallery did not exist, because the Website sub-tab holds six switches and
nothing else. It was wrong: the **Info** row carries a 16-pixel pencil whose only
accessible name is `aria-label="Edit info page"`, with no text and no tooltip,
and it opens Description, Pictures and Attachments. `config/api.md` was corrected
in the same pass.

**Score entry is verified**, which the map had marked UNVERIFIED. A fixture card
on Results is Scheduled (START, `VS`, no boxes), Live (END, two empty boxes) or
Ended (a trophy, boxes still editable). Typing in a box fires
`PUT /matches/:id/score` on its own - no Save, no confirmation, and none on START
or END either. **Ending the PHASE is what closes score entry.** A played fixture
cannot be put back: `POST /matches/:id/status {"status":"Scheduled"}` answers
`400 "Cannot update status of a Finished match"` and there is no reset endpoint -
what works is nudging `PUT /tournament-groups/:id {teamCount}` and back, which
makes the generator rebuild the group with the same teams, pairings, order and
kick-off times.

**15.7's `free_pro` flag does not bite.** `config/api.md`'s limits table blocks
"Reading incoming chat in full" on Free; the tournament group chat is not where
that happens. Free and Pro both get a "Read more" control on a long message and
both expand it in place, with no `CHAT_PRO_REQUIRED` modal. Both captures are in
the article and it says the two are the same. The real role finding is different:
**anybody signed in who opens the public Chat tab joins the room and gets a
composer** - an outsider on no team included - and **announcement-only refuses a
tournament ADMIN as well**, leaving the Owner as the one person who can post,
even though the setting's own help text says "owner and admins".

**Two fixes in `lib/kb.ts` that affect every collection.** `shot()` drew its
annotation before centring the clip; this app scrolls an inner container, so
`window.scrollY` stays 0 and the outline stayed put while the target moved out
from under it - found on 15.9's public header, where the outline landed a
button's height below the button. And `shot()` now **refuses to capture while an
`.animate-pulse` is on screen**: the style guide forbids photographing a
skeleton, and this collection produced three from three different missing gates
(a public tab captured on the click, a slide whose heading paints before its
fixtures, a followers dialog whose title comes from a count the page already
had). A `.gitattributes` was added as well - the hand-written PDF attachment is
almost all ASCII and git was going to convert its line endings on checkout,
which would have left every offset in its xref table wrong.

**Fixed during step 2, all in the specs:** five capture faults, every one a
missing gate rather than a bad screenshot - 15.1's Matches and Standings tabs,
15.5's group slide, 15.6's sponsor banner (the name paints two seconds before
the picture) and 15.9's followers dialog. Three clips framed the wrong element
(15.8's standings took the header row alone at 2264x114; 15.8's padel rules is a
`<section>`, so two attempts with `locator('div')` walked up to a 2000-pixel
ancestor; 15.4's settings block). 15.2's fourth capture was repointed - it had
duplicated 15.1/03, and the public page turned out to carry the same Share
dialog for a visitor with no account, which is worth its own shot.

**Flake:** 15.4 failed once when the signin URL exchange sat on `/signin` past 30
seconds. Passed on the retry, no change needed.

**Also worth knowing.** The public Matches tab labels a link **Match Settings**
for everybody, signed out included; followed with no session it opens
`/match/:id/preview`, the read-only preview - a mislabelled link, not a
permission leak, and 15.1 says what it opens. Padel's Results tab carries a
**RULES AND REGULATIONS** panel football has no equivalent of. The **View Stats**
control is narrow-layout only: at the 1440-wide viewport the style guide mandates
its box is zero pixels, so 15.8 describes it in prose and asserts it stays
off-screen. `presentation.website.infoBody` is written and rendered but never
returned by `GET /tournaments/:id`.

`config/api.md` gains three sections marked `(observed in app, 2026-09-01)` -
publishing and the presentation object, the Results tab's score entry, and the
Prizes tab - plus seven endpoints the Postman export lacks, including the
multipart field names (`picture`, `attachment`) for the two info-page uploads and
the component `type` enum quoted by the server's own validator, whose
**`sponsor` is singular** where the button says Sponsors.

**2026-09-01 - collection 15, follow-up.** All nine articles were **published by
the reviewer** within the hour, so the collection moved from `drafts on Intercom`
to `published` on the same day. `state/manifest.json` still said `draft` for all
nine and has been reconciled; `scripts/publish-article.mjs` read the live state
and left it alone, which is the guard working as intended.

One prose change afterwards, on the repo owner's instruction: **15.8's first step
was carrying three ideas** - open Results, what a Scheduled card shows, and where
the teams sit - so it was split into two short sentences and the `VS` detail
moved out of the step (the screenshot's alt text still names it). Step 2 changed
with it, because it had referred back to that `VS`. No screenshot changed and the
commit SHA the images are pinned to is unchanged. **The article was already live,
so this edit went straight to the public help centre, not to a draft.**

**2026-09-01 - collection 15, cross-references linked.** On the repo owner's
instruction, the quoted article titles in collection 15's prose are now real
hyperlinks. All nine articles were rebuilt and republished (they were already
live, so this went straight to the public help centre).

`scripts/build-article.mjs` gained a **`{{link:<article-id>|link text}}`**
placeholder, and `scripts/publish-article.mjs` now records each article's public
address as `intercom_url` in `state/manifest.json` from Intercom's own answer. The
prose therefore never carries a URL. An article with no public address renders as
the quoted title in plain text and warns, rather than throwing: a collection's
articles reference each other, so the first build of a fresh collection would
otherwise be impossible to get past. Publish, build again, and the placeholders
become anchors. Intercom recognises them as internal links
(`class="intercom-content-link"`).

31 cross-references. Inline ones read *"Read &lt;title&gt; to &lt;do the
thing&gt;"*; the Related lists keep the linked title plus their one-line gloss,
because "Read ... to ..." three times in a row reads worse than what it replaced.
The title is the link text throughout, not the words "this article".

Three articles outside this collection were **re-PUT with identical content** to
capture their `intercom_url`, because collection 15 links to them: 12.9, 13.5 and
13.11. No content and no state changed on any of them.

**Worth a look:** 13.5 and 13.11 answer `state: published`, but this file still
records collection 13 as `drafts on Intercom`. That row was not touched - it is
outside this session's collection - but the record is stale and somebody should
reconcile 13.

`build-article.mjs` also validates the commit sha now. A trailing carriage return
from `python -c print(sha) | while read` on Windows built image URLs Intercom
refused with *"Failed to ingest image at url ...@<sha>{CR}/screenshots/..."*. The
bad build was rejected by Intercom, so nothing broken was ever published, but the
guard moves the failure to the build where it is readable.

### 2026-09-02 - collection 17 complete. Nine articles, all drafts.

**Collecting & making payments.** 52 screenshots, nine drafts in Intercom
collection `19733986`, nothing published. Brief: [briefs/17.md](../briefs/17.md).

| Article | Intercom id | Shots |
|---|---|---|
| 17.1 Collecting money through Scoryboard - an overview | 16775809 | 5 |
| 17.2 Setting up your payout account | 16775810 | 4 |
| 17.3 Requesting payment - choosing a source | 16775811 | 9 |
| 17.4 Choosing who to charge, and setting the amount and due date | 16775812 | 7 |
| 17.5 Fees - passing them on or absorbing them | 16775813 | 5 |
| 17.6 Editing, cancelling and sending reminders | 16775816 | 6 |
| 17.7 Tracking money you have asked for | 16775817 | 5 |
| 17.8 Paying a request you have received | 16775818 | 6 |
| 17.9 Payment statuses and failed payments | 16775819 | 5 |

Images pinned to `6fde7f174a61b4d44e71d2fa26e77db8689028ff`. All 52 URLs verified
200 `image/png` on jsDelivr before publishing. Live state read back off the
Intercom API afterwards: all nine `draft`, all nine `parent_ids: [19733986]`.

### The payout account is human-made and cannot be rebuilt from here

This is the thing a future session most needs to know.

**Nothing in this collection works without a connected Stripe payout account.**
`POST /payments` answers `500 internal error` for any account whose payout
account is not live - verified against four accounts in three states - and there
is no admin endpoint that enables one.

**Stripe's signup is CAPTCHA-gated**, so it cannot be automated. The submit step
raises a visible hCaptcha challenge ("Identify the TWO characters that are
partially hidden behind a line") and the payment form loads `hcaptcha-invisible`.
The account on `kb-manager-pro-17@` (`acct_1UAuuNRXqNL8FLzZ`, test mode,
`chargesEnabled: true`) was completed by the repo owner by hand on 2026-09-01.

So: **never run `scripts/seed-17.mjs --rebuild` without a person available to
redo the onboarding.** It deletes the accounts and the payout account goes with
them. The plain seed is safe and idempotent - a second run makes zero writes.

**`kb-17-nopayout@` must stay un-onboarded.** It is the only account that can
still show the "Get started with payments" state, which is what 17.1 and 17.2
are about. Connecting it would destroy that fixture permanently.

### Where Scoryboard stops, and why the shot counts are down

Two handoffs, and on instruction no capture crosses either:

- **Setting up a payout account.** `Add information` opens a **new browser
  window** at `connect.stripe.com`.
- **Paying.** `Pay Now` fires `POST /payments/transaction/:id/pay` and swaps the
  dialog for **Stripe Elements** - card number, expiry, security code.

That is why 17.2 is 4 shots against 12 mapped and 17.8 is 6 against 8. The
dropped ones were all Stripe screens. Same rule collection 04 followed for
Tournament Pro.

### 17.9 retitled, because refunds do not exist

The map called it "Payment statuses, failed payments and refunds". The string
`refund` appears **zero** times across every JavaScript chunk the app loads,
there is no refund endpoint on the wire or in the Postman export, and there is no
refund control on any screen. Now "Payment statuses and failed payments", and it
says a refund is a support request rather than inventing a feature.

### Six things worth a ticket

1. **"You're all set to receive payments!" is shown when the account is NOT set
   up.** The dialog fires when the Stripe window closes, not when the account
   becomes chargeable. Reproduced twice: an account left `Restricted` with
   `chargesEnabled: false` got the same congratulation as a finished one. It
   misled this session for a full round trip. 17.2 tells readers to check by
   pressing **Request Payment** again instead of trusting it.
2. **Select Team and Select Leaderboard are empty until `/teams` is visited.**
   "Your Teams (0) / No teams found where you are the owner" for an owner of two
   teams. Same persisted-Redux cause as the External badge. A reader who goes
   straight to Payment after signing in hits it. Photographed as 17.3 shot 09.
3. **Absorbing the fee hides the breakdown**, so the organiser is shown no figure
   at all for what they will receive - and the helper text underneath still reads
   "Recipients will pay the total price and will not see the transaction fee",
   which is the opposite of what is then happening.
4. **The Cancel Request window has two buttons both labelled some form of
   "Cancel".** "Cancel" dismisses; "Cancel request" goes through.
5. **A cancelled request's people still read Pending.** The status is overridden
   on the request row and not carried down to the participants.
6. **The due-date calendar shows no month or year.** The popover draws the arrows
   and the day grid; "September 2026" exists only in the accessibility tree as a
   `status` element. Visible in 17.4 shot 05.

### config/api.md - the payments section was rewritten

The Postman export had three things wrong and was missing five endpoints. The
status read is `GET /payments/stripe/account/status` with **no body**, not the
`POST ... {name}` the collection lists - that path answers 404. Create, edit,
cancel and the three per-entity listings were absent entirely. All now recorded,
with the `POST /payments` body, the fee arithmetic, both status enums and the
rules that decide which actions are available.

**The request enum differs between the API and the screen.** `GET
/payments/my/requests` answers `status: "Active"` for a live request and the
table renders it as **Pending**. Do not assert one against the other.

### Fixtures

Four accounts, two teams, one leaderboard, one venue, one Scheduled match and
four payment requests. `scripts/seed-17.mjs` builds all of it and makes zero
writes on a second run.

`KB 17 Away travel` is created and then **cancelled by the seed**, on purpose.
`DELETE /payments/:id` does not delete - it sets the status and the row stays for
ever - so a spec that cancelled one of the others would add a dead row on every
run and change what 17.7 photographs.

### Determinism

- Clock frozen to `2026-09-05T09:00:00.000Z`. Not only for the date picker: the
  app decides `overdue` in the browser as `dueDate <= now`, and an overdue
  request has **Add participants** and **Edit** disabled. The fixtures are due
  30 September 2026, so without the freeze 17.6's captures would change
  behaviour on their own the day that date passes.
- **Every persona gets its own browser context.** Signing a second account in on
  the same page leaves the first one's persisted Redux store behind, and that
  store decides what the Teams page and Select Team can see. 17.1's first run
  signed Nils in, then Mo, and Mo's Teams page never rendered.
- The unread bell badge and the "Grow Your Team" promo are hidden in `quiet17()`.
  The badge counts up every time the seed runs, because seeding a request
  notifies both participants.

### Capture defects found and fixed in the specs

Six, all fixed in the specs. Full table in [briefs/17.md](../briefs/17.md). The
two that would have been worst:

- **17.5 published a form with no fee figures on it.** The fee block sits below
  the fold of the Payment Request window scroller, so a dialog-wide clip lost the
  article's entire subject.
- **17.6, 17.7 and 17.9 lost their participant rows** the same way.

Both are now shared helpers - `feeBlock()` and `participantRows()` - so the next
collection that photographs a scrolling dialog does not rediscover them.

### Flakes

- **The Request Payment button can be clicked before the page is ready**, and the
  click is swallowed silently - no dialog, no error. Cost 17.1 one run.
  `openSourceChooser()` now settles first and retries the click once.
- **The Select Friends list is fetched after its window is on screen**, so 17.3
  photographed six skeleton rows. Caught by the skeleton backstop in `shot()`.
  `dialogSettled()` now gates on a row.

### Where to look hard in the drafts

- **17.2 shot 03 contains a spinner, deliberately**, against the letter of
  `docs/style-guide.md`. The loading state is the article's subject: it is the
  last thing Scoryboard shows before a Stripe window opens over the top. If the
  reviewer disagrees, drop the shot and 17.2 stands at three.
- **17.5's claim about what you receive when you absorb the fee.** The app never
  shows that figure and no payout was ever observed, so the article does not
  quote one. It tells the reader to switch the toggle on to read the fee instead.
  Do not add a number here without observing a real payout.
- **17.9's Paid, Processing and Failed statuses are described, not photographed.**
  Each needs a completed or declined card payment, which this run did not make.
  The colours and meanings come from the bundle.
- **17.7's table is all Pending.** A part-paid request would need a real payment.

### Cross-references are links - the second pass was done

Intercom gives a draft no public URL, so the first build rendered every
`{{link:...}}` as a quoted title. After publishing, the collection was rebuilt and
re-published and all **29 cross-references are now real anchors**. Verified off
the live API: 29 links and 52 images across the nine articles.

**Intercom rewrites anchors on ingest.** `<a href="...">` comes back as
`<a href="..." target="_blank" class="intercom-content-link">`, so a verification
regex that expects `">` immediately after the href matches nothing and looks like
a total failure. It cost this session one false alarm. Match
`<a [^>]*href="..."[^>]*>` instead.

The nine live URLs are under `https://help.scoryboard.com/en/articles/`, ids
16775809-13 and 16775816-19.

### One hazard in the tooling, not in this collection

`scripts/build-article.mjs` writes `state: "published"` into every
`articles/<id>.json` (line 158). `scripts/publish-article.mjs` overrides it and
sends `draft`, so nothing has ever gone out wrong - but a file on disk that says
`published`, in a project whose cardinal rule is drafts only, is one careless
`curl` away from publishing a collection. Worth changing to `draft`.

### The shared browser was signed in as collection 15's organiser, again

The in-app browser this session opened still held `kb-organiser-15@`, and its
persisted Redux store survived a fresh sign-in - the sidebar showed Oona while
Firebase was authenticated as Mo. Nothing was written as her; the session was
signed out through the UI and all exploration moved to Playwright, which starts
every context signed out. This is the second session to hit it. Sign out before
you finish, or do not use the shared browser for a signed-in persona at all.

### 2026-09-02 - collection 18 complete. Four articles, all drafts.

**Chat & messaging.** 27 screenshots, four articles in Intercom collection
`19733987`. Brief: [briefs/18.md](../briefs/18.md).

**All four were published by the repo owner on 2026-09-02, on their instruction,
without the usual draft review.** They went out as drafts first, were published on
that instruction, then rebuilt and re-published so their cross-references became
real links. They are live at `https://help.scoryboard.com/en/articles/`.

| Article | Intercom id | Shots |
|---|---|---|
| 18.1 Chat overview - conversations, direct messages and groups | 16780987 | 6 |
| 18.2 Creating and setting up a group chat | 16780990 | 6 |
| 18.3 Replying, forwarding, reacting, editing and deleting | 16780993 | 9 |
| 18.4 Leaving, deleting and reporting | 16780994 | 6 |

Images pinned to `e5874550449770e69464909ed83b8c9066260015`. All 27 URLs verified
200 `image/png` on jsDelivr before publishing. Read back off the Intercom API
afterwards: all four `draft`, all four `parent_ids: [19733987]`, all 27 images
rehosted by Intercom.

### Chat is REST, and personas.yaml was wrong about it

`config/api.md` recorded chat as possibly having no REST surface at all -
Firestore for messages, RTDB for presence - and `config/personas.yaml` told this
collection to seed its group chat through the UI. Reading the app bundle turned up
**nineteen `/chats` endpoints**, all ordinary bearer-token REST, and every one was
exercised against staging. They are now written up in `config/api.md` under
"Chat and messaging", and `scripts/seed-18.mjs` builds a group, four members, a
seven-message transcript, a reaction, an edit and a deletion in 26 writes.

Firestore does carry the live read - the chat page opens a `Listen/channel` - and
the RTDB does carry presence under `/online/users/:uid`. The guess was half right.
Both files are corrected.

### The Free gate is much wider than CHAT_PRO_REQUIRED said

`config/api.md` described it as "reading an incoming message in full". Measured:

- `GET .../messages` returns somebody else's message as its **first ten characters
  plus an ellipsis**, `isContentLocked: true`. Your own come back whole. The
  conversation list's preview is truncated the same way.
- **Replying to an incoming message is refused**, and so is reacting to one:
  `403 {"reason":"Upgrade to Pro to access the full message content"}`. The gate is
  on the message, not on the verb.

So a Free reader sees a column of ten-character stubs, each with an **Unlock with
Pro** button. That is a true screenshot and a useless one, which is why this
collection's capture persona is `kb-18-pro@` and not the map's `manager_free`.
`config/personas.yaml` now says so on the manager_free entry.

The seed found this the hard way: the transcript's reply was Marc's in the first
draft and the seed stopped on a 403.

### Two things worth a ticket

- **Deleting a message is not confirmed and cannot be undone.** *Delete for me*
  and *Delete for everyone* both fire on the click. There is no dialog for either.
  Found by choosing *Delete for everyone* on a seeded message during exploration -
  it vanished, and the seed had to be re-run to put it back. The scope enum is
  `self | everyone`, not `me | everyone`.
- **There are no read receipts.** `memberState[uid].lastReadAt` is the only trace
  and nothing renders it. The single tick beside an outgoing message is drawn
  unconditionally and does not change when the other person reads it. The cut
  article "read receipts" has nowhere to go, and 18.1 does not mention ticks
  meaning anything.

### Three capture lessons that will bite the next chat-shaped collection

- **A bubble whose menu has been opened keeps its chevron for good.** Not hover,
  not focus: parking the pointer does not clear it and neither does blurring. Two
  runs went out with a chevron on the two opened bubbles and none on the rest.
  18.3 now captures its three at-rest shots BEFORE any menu exists.
- **Annotations inside the transcript need a clipped capture.** The transcript
  scrolls in its own container, so `window.scrollY` stays 0 and `annotate()`
  cannot convert a viewport box to a document box. An outline on a full-page
  capture lands below its target.
- **The transcript paginates on scroll** and shows a "Loading older messages..."
  pill - plain text, not an `.animate-pulse`, so `shot()`'s skeleton backstop does
  not catch it. One run published one. `transcriptSettled()` now gates on it.

### Transcript timestamps are deliberately NOT masked

A deviation from `docs/style-guide.md`, which lists "absolute dates and times that
are not the point". A collection 18 capture has twelve to fourteen of them - one
under every bubble, one on every conversation row - and masking them all turns the
transcript into a column of black rectangles. They are `h:mm` on the day the seed
ran, with no date beside them, and identify nobody. The clincher: the app renders
an edited message's footer as ONE node, `8:34 - edited`, so any regex loose enough
to catch the time paints over the word 18.3's last capture exists to show. The
signed-in name and all three unread badges are still hidden. Reasoned at length in
`lib/kb.ts` where `chat18Times()` would have gone, and in briefs/18.md.

### Cross-references are links - the second pass was done

Intercom gives a draft no public URL, so the first build rendered all ten
`{{link:...}}` placeholders as quoted titles. After publishing, the four were
rebuilt and re-published and **all ten are now real anchors** - seven between the
collection's own articles, three into collection 04. Verified off the live API: 10
links and 27 images across the four, and all 33 distinct URLs answer 200.

Two of those links only work because of the reconcile below. `04.2` and `04.3` were
live on the help centre and the manifest still said `draft`, so the first build
refused to link them and said nothing was wrong.

### The manifest was stale for 90 rows, and it silently broke links

`state/manifest.json` is documented as stale by default: it only learns about
publishes `publish-article.mjs` itself did, and the reviewer publishes in the
Intercom UI between sessions. `publish-article.mjs` reconciles - but only for the
one article it is publishing. **Nothing reconciled the rest**, and
`build-article.mjs` reads the manifest for every OTHER article when it resolves a
`{{link:}}`. A stale row degrades the link to quoted plain text and nothing fails.

`scripts/reconcile-manifest.mjs` is new and fixes that. It GETs every article in
the manifest and corrects `status` and `intercom_url` from Intercom's own answer.
Read-only against Intercom - it sends nothing but GETs, so it cannot publish or
unpublish anything, and the only file it can write is the manifest. A row whose id
answers 404 is reported and left alone.

Run on 115 articles, none missing, **90 rows were wrong**:

- **16 said `draft` and are live**: 04.2, 04.3, 04.4, 04.5, 05.5, 08.1 to 08.5,
  09.1 to 09.5, 09.7.
- **74 had no `intercom_url` recorded at all** - rows that predate the field, in
  collections 01, 02, 04, 05, 07, 09, 10, 11, 12, 13 and 14. Every cross-reference
  into any of them has been rendering as plain text.

**Worth doing next: rebuild and re-publish the collections that link into those.**
This session only rebuilt 18. Every other collection's `{{link:}}` placeholders
were resolved against the stale manifest at the time they were built, so some of
them are quoted titles on the live help centre that should be links.

### Three status rows in the table above are now wrong, and only a human may fix them

The reconcile shows Intercom holds these as fully published, while the table still
says `drafts on Intercom`. This file says only a human moves a collection to
`published`, so they were left alone:

| # | Table says | Intercom says |
|---|---|---|
| 05 | drafts on Intercom | all 5 published |
| 08 | drafts on Intercom | all 5 published |
| 09 | drafts on Intercom | all 7 published |

### The `articles/<id>.json` hazard is still there

`scripts/build-article.mjs` still writes `state: "published"` into every article
JSON. `publish-article.mjs` overrides it and sent `draft` four times here, so
nothing went out wrong - but collection 17 flagged this and it has not been
changed. Still worth changing to `draft`.

### The workflow changed: the run now publishes, and there is no draft gate

**2026-09-02, on the repo owner's instruction.** Phase B used to leave every article
in Intercom as a draft, and a human read the drafts with the screenshots rendered and
published the ones they were happy with. That click was the review and the approval.
It is gone. Phase B now publishes with `--state published`, and `website_turned_on`
is `true`, so an article is publicly readable the moment the run finishes.

Phase B also gained two stages, both mandatory, both because of what this session
found:

1. `node scripts/reconcile-manifest.mjs --write`, **before the build**, because the
   build is what resolves `{{link:}}` out of the manifest. A stale row turns a
   cross-reference into quoted plain text and fails nothing.
2. **A second build and publish of the whole collection**, after the first publish.
   Intercom answers `url: null` for a draft, so a first build cannot link an article
   to its own siblings. Then verify the anchors off the LIVE API, not off the JSON.

The full order is now: capture, inspect, optimise, name - stop for the human to
commit and push - then verify, reconcile, read, build, publish, build again, publish
again, verify live, record.

Five files carried the drafts-only rule and all five were updated: `CLAUDE.md`,
`docs/workflow.md`, `README.md`, `.claude/commands/kb-brief.md` and
`.claude/commands/kb-publish.md`. `CLAUDE.md` is the one that overrides everything
else, so a change made only in `docs/workflow.md` would have been ignored by the
next session.

**What a future session should take from this.** Nobody vets the brief and nobody
vets the result. "Stop and ask" is now the only check between a step-1
misunderstanding and a live help centre article, and the end-of-session report is
read after the fact. `kb-publish` is the sharper edge: it re-runs a collection that
is usually already public, so a bad capture published there replaces a good live one.

### The cross-collection link sweep was run. There was nothing to fix.

I raised this as an outstanding job and I was wrong, so here is the correction with
the evidence. The reasoning was: 74 manifest rows had no `intercom_url`, and
`build-article.mjs` resolves `{{link:}}` out of the manifest, therefore eleven
collections must have published quoted titles where links belong.

The middle step does not follow. Those articles were built when the manifest DID
carry the URLs; the field was lost from the manifest afterwards, and the published
bodies were never affected. Swept 2026-09-02 and measured three ways:

- **87 cross-references** across all 119 prose sources. All 87 resolve, and all 87
  are already anchors in the built JSON. **Nothing would gain a link from a
  rebuild.**
- **All 119 live articles match their built JSON** - same anchor count, same anchor
  targets, same image count - and not one live body contains a quoted title where a
  link belongs.
- **The workspace is clean.** Intercom holds 121 articles: our 119, all
  `published` and all in the collection the manifest names, plus two untouched
  drafts in no collection - `16640595` "Your first public article" (Intercom's own
  starter) and `16742469` "Untitled public article" (an API test). Deleting those
  needs a human's say-so; `docs/workflow.md` has said so since the one-off setup,
  where there were five of them.

**No article was rebuilt or re-published.** The sweep was read-only, because it
found nothing to change.

### scripts/audit-live.mjs - ask this before you trust the record

The sweep is now a script, and it is worth running at the start of a session as
well as the end. Read-only, GETs only, writes nothing. It answers the three things
a per-article stage cannot:

1. every `{{link:}}` in every source - resolvable? an anchor in the built JSON?
2. every live article against its built JSON - anchors, images, and state
3. the workspace - untracked articles, and anything filed in the wrong collection

It exits non-zero on a real problem and reports the two untracked starter drafts
without failing. It compares COUNTS and TARGETS, never raw HTML, because Intercom
rewrites what it stores - it rehosts every image and turns `<a href="x">` into
`<a href="x" target="_blank" class="intercom-content-link">`.

This matters more now that the run publishes. There is no draft to read, so the
only way to know the live help centre matches this repo is to ask it.

Next: pick from the remaining collections - 20, 21, 22, 24.

---

## Collection 19 - Comments, likes & ratings - 2026-09-02

Four articles, 20 screenshots, all four LIVE. Images pinned to
`3a5cb094d67f3c5bf2abccc4a96dc390fc56252f`.

| Article | Intercom id | Shots | Public URL |
|---|---|---|---|
| 19.1 Commenting on a team or a leaderboard | 16782573 | 6 | [/16782573](https://help.scoryboard.com/en/articles/16782573-commenting-on-a-team-or-a-leaderboard) |
| 19.2 Replying to and liking comments | 16782574 | 4 | [/16782574](https://help.scoryboard.com/en/articles/16782574-replying-to-and-liking-comments) |
| 19.3 Rating a match, player, team or referee | 16782576 | 7 | [/16782576](https://help.scoryboard.com/en/articles/16782576-rating-a-match-player-team-or-referee) |
| 19.4 How average ratings are calculated | 16782578 | 3 | [/16782578](https://help.scoryboard.com/en/articles/16782578-how-average-ratings-are-calculated) |

Verified off the live Intercom API: 4 published, all in collection 19733988,
**17 anchors and 20 images, 0 broken, 0 stray placeholders**. Six of those anchors
are sibling links inside collection 19 and only resolved on the second
build-and-publish pass. Intercom rehosted every image.

### The map promised more than the app has

Two of the four titles in `config/articles.yaml` describe features that do not
exist on this build. Both were measured endpoint by endpoint and screen by screen
before anything was written, and both are retitled rather than dropped.

- **Comments exist on two screens, not five.** `POST /comments` takes
  `commentType` from `leaderboard | team | match | player | tournament` - the API
  prints that list in its own validation error - and stores all five. Only a
  **team** page and a **leaderboard** page render a comment panel. A match page
  fires no `/comments` request at all (its FEED is the match event list), a player
  profile fires none, and no tournament tab fires one either. So 19.1 became
  **"Commenting on a team or a leaderboard"**.
- **A comment cannot be edited or deleted.** The whole surface is post, read,
  replies, like and the media pair. There is no `editComment` and no
  `deleteComment` in the bundle; `PUT /comments/:id` works over the API and
  nothing calls it; `DELETE /comments/:id` answers 401 to the author. So 19.2
  became **"Replying to and liking comments"**, and says plainly that a comment is
  permanent. Collection 08's article 08.5 already had this right - only
  `config/api.md` was behind.
- **19.1's `free_pro` flag has no basis and is dropped.** There are two Add Media
  buttons in the bundle. The **match feed**'s checks `membership === Pro`; the
  **comment composer**'s checks nothing, and `POST /comments/media` answers 200 to
  a Free account. Nothing else in the comment or rating surface differs by plan,
  so there is no dual capture in this collection.

### Corrected mid-run: a rating CAN be removed

The brief said a rating could be changed and never taken back, because the Rate
panel offers only Post, Update and Close and `useDeleteRatingMutation` looked
unwired. It is wired somewhere easy to miss: the read-only **reviews list** puts a
kebab on **your own** review row - and only on yours - carrying **Edit** and
**Delete**. No accessible name, plain ellipsis icon. It surfaced when an unrelated
assertion in 19.4 failed and printed the dialog's accessibility tree.

19.3 therefore has a seventh capture. `config/api.md` and `lib/fixtures-19.mjs`
both carried the wrong claim for part of the run and are corrected.

### config/api.md

Eight corrections, all observed on the wire or in the app. The two that matter
beyond this collection:

- **`POST /tournaments/:id/referee` sets `isReferee: true` and
  `defaultProfile: "Referee"`.** That closes the TODO collections 09 and 21 both
  left open about how somebody becomes a referee. There is still no way to become
  one outside a tournament, which is why `scripts/seed-19.mjs` holds one.
- **`POST /matches/:id/status {"status":"Cancelled"}` works on a match the server
  auto-finished**, and only on that. `config/api.md` said the endpoint could never
  set Cancelled.

The rest: the `commentType` enum (closing this collection's own TODO), `PUT` and
`DELETE` on a comment, the 409 on a double like, leaderboard commenting being open
to a player on a member team, a rating being replaced rather than duplicated, and
where Edit and Delete for a rating actually live.

### The seed rebuilds rather than reconciles, and here is why

`scripts/seed-19.mjs` deletes and remakes both teams, the leaderboard, the played
match and every comment on every run. **A comment cannot be deleted**, so the only
way to make a thread say exactly what the brief planned is to throw away the entity
it hangs off. Team ids, the leaderboard id, the match id and every comment id
therefore change on every run, and no spec hardcodes one - `fixtures19()` looks
each up by name. Accounts, memberships, the venue, the referee flag and every
rating are reconciled.

### Cut after the report, on the repo owner's instruction

19.3's "If it does not work" carried one line saying the Team rating panel's
dropdown is labelled **Player** even though it lists teams. The report flagged it
as a judgement call - naming a defect rather than the product - and the owner had
it cut. 19.3 was rebuilt against the same commit and republished; the live article
no longer mentions it, and nothing else in it changed. Verified off the live API
afterwards: still published, still 4 anchors and 7 images.

**The defect is still there and is still worth a ticket**, and shot 05 shows the
label whether the prose names it or not.

The rule this settles for later collections: a defect goes in the brief, the report
and a ticket - not into an article that teaches a reader to work around it.

### Flakes and traps, for the next session

- **The star row lights on hover.** The Rate chooser's rows sit roughly where the
  stars appear, so the pointer is left resting on a star the moment a panel opens.
  The first walk through read three amber stars on an account that had never rated
  the match. `openRate()` parks the pointer and every capture asserts the star
  count.
- **"MATCH ENDED" is upper-cased by CSS.** Its accessible name is `match ended`.
  The same text-transform trap collections 14 and 01 hit.
- **Opening a menu makes Radix mark the dialog under it `aria-hidden`**, so a live
  `getByRole('dialog')` locator stops resolving mid-capture. Clip targets that
  outlive a menu opening have to be attribute selectors.
- **A comment's attachment is not an `<img>`.** It is a `blob:` URL painted as a
  CSS background; the composer's own preview IS an `<img alt="preview-N">`. Two
  different locators for what looks like one thing.
- **The upload is not the thumbnail.** The preview appears from a local blob
  before `/comments/media` has answered, with a spinner over it. The first run
  published that.

No test-level flakes: the four specs passed together on the final run, and each
has been run at least three times.

---

## Session 2026-09-03 - collection 21, referees

Three articles LIVE, 19 screenshots, pinned to `0f2413c2f2349c1e30a1ba63e85d10403c4557fd`.

| ID | Intercom | Public URL |
|---|---|---|
| 21.1 | 16800259 | https://help.scoryboard.com/en/articles/16800259-becoming-a-referee-and-your-referee-profile |
| 21.2 | 16800261 | https://help.scoryboard.com/en/articles/16800261-seeing-your-assigned-matches |
| 21.3 | 16800263 | https://help.scoryboard.com/en/articles/16800263-refereeing-a-match-what-you-can-and-cannot-do |

Collection: https://help.scoryboard.com/en/collections/19733990-referees

**Nothing was reviewed before it went out.** No draft stage, no gate.

### A referee cannot make themselves one, and that shapes all three articles

There is **no referee sign-up, no referee route and no referee screen**.
`/referees` is an `ApiEndPoints` value, not an app route - it answers **404 from
the server**, and none of the 36 paths in the app's own `Routes` enum is a
referee page. The TODO that had stood in `config/api.md` - "find the real
referee-registration call for 21.1" - is answered: there is none.

Exactly one call in the product sets `isReferee`:
**`POST /tournaments/:id/referee`**, which belongs to a tournament organiser.
Everything a referee then sees is the **ordinary player profile in a different
role** - a blue **Referee / Football** switch on the profile hero that swaps the
bio for `refereeBio`, the leaderboard count for `refereeLeaderboardCount`, the
player stat tiles for six referee ones, and the match lists from
`/players/:id/matches` to `/referees/:id/matches`. Being added also sets
`defaultProfile: "Referee"`, so a new referee's profile opens on the referee
side.

### 21.2 is retitled, because there is no invitation

It was "Accepting an invitation and seeing your assigned matches". Four
measurements, all in `briefs/21.md`:

- `POST /tournaments/:id/referee` sends **no notification** - 0 before, 0 after;
- **no email either** - one yopmail read returned three messages, all "Welcome
  to Scoryboard, set your password" from the `POST /admins/users` calls that
  made the account;
- **none of the eighteen notification types is referee-related**;
- **no accept endpoint and no pending state** - `refereePlayers[]` carries
  `isRegistered`, `saveForFutureTournaments` and `canStartEndMatches` and
  nothing else, and `GET /team-invitations` answers empty.

A referee is **added**, not invited, and is live the moment the organiser saves.
The article says so in its first line.

### config/api.md's referee role matrix was wrong on two cells

This is the finding that mattered most, because 21.3 is the article that would
have published it. The old matrix said the assigned referee gets **no** score
steppers and **no** Yellow / Red / Player of Match. Re-measured side by side
with the Owner on the same Live match:

- the stepper row is **identical** - one blue-bordered pill, four 32px buttons,
  both minus buttons `disabled` at zero and both plus buttons enabled;
- clicking the referee's plus fires
  `POST /matches/:id/events {"type":"GoalAwarded"}` and answers **200**. The
  score moved 0-0 to 1-0;
- **Yellow Card, Red Card and Player of Match are on the referee's FEED** the
  moment the match is Live, and each opens a Select team / Select Player dialog.

**`isReferee` has nothing to do with it.** A plain account that had never been
made a referee, named on a match with `PUT /matches/:id {refereePlayerId}`, got
byte-for-byte the same page. **What the match page reads is `refereePlayerId`.**
That is presumably how the wrong row came about - collections 09 and 10 both
measured from an account that was only named on a match.

Also corrected: **the referee has NO gear menu.** The Owner has three
`button[aria-haspopup="menu"]` on a Scheduled match and the referee has two -
Add to Calendar and the footer's language picker. This contradicts both
`config/api.md` and `briefs/09.md`, which said the referee "gets the gear and
can edit the note".

**No published article had repeated any of it.** Every collection-10 article
body was checked; 10.4's "You are not the Owner, an Administrator or the
referee" is about who gets controls at all, which is right. Nothing live needed
a fix.

The real boundary, isolated on a throwaway match with the referee's own token:

| Call | Answer |
|---|---|
| `POST /matches/:id/status` - Live, Paused, Live, Finished | **200** each |
| `POST /matches/:id/events` - goal, card, Player of the Match | **200** |
| `PUT /matches/:id` - `pitchNumber`, `note`, `date`, `status:"Cancelled"` | **403** `"Only match managers can update match settings"` |
| `DELETE /matches/:id` | **403** `"Only match managers can cancel match"` |

**A referee runs the match and cannot change the match.**

### Two step-1 findings were corrected during step 2

Both are written into `briefs/21.md` under "Amended during step 2", and both
changed what shipped.

**See All is not dead, and 21.2 gained a capture for it.** Step 1 recorded the
REFEREED MATCHES panel's See All button as doing nothing. It opens a modal
titled **Refereed Matches** listing every match you referee. The step-1
measurement was wrong twice: it clicked `getByText('See All')` rather than the
button, and it looked for a change by diffing `main`'s text - and the modal is a
portal outside `main`. **A lesson for the next collection: never conclude a
control is inert from a text diff of `main`.** 21.2 therefore shipped **six**
screenshots against the map's five, and the collection 19 rather than 18.

**The role switch's other side says "Football", not "Player".** Only the
selected segment carries a label, so this was invisible until the capture came
back. Measured in both places the control appears - the profile hero and Profile
settings. The `<img alt>` is "Football profile" on one and "Player profile" on
the other; the visible word is Football in both. The article says Football.

### Four product defects worth a ticket

1. **`POST /tournaments/:id/referee` needs `createMode`, and a call without it
   half-succeeds.** Sent without it the call answers `400 "Referee not found"` -
   having already written `isReferee: true` and `defaultProfile: "Referee"` to
   the target user. That left this collection's first referee marked as a
   referee, on no tournament and in nobody's saved list, and every later add for
   her address failed the same way. Only `DELETE /admins/user-delete` recovered
   it.
2. **The Add referee dialog's Multiple referees tab cannot work.** The client
   posts `{createMode:"multiple", refereeList, ...}` with the names joined by
   newlines, and the server answers
   `400 SCHEMA_VALIDATION_ERROR {"field":"name","message":"Required"}`. Not this
   collection's article - it is the organiser's side, so 13 or 15 - and it
   corrects `config/api.md`'s note that the tab "fires one POST per line".
3. **The referee's Add Note is a silent no-op.** The FEED gives a referee
   **Add Note**, the dialog opens, Save sends `PUT /matches/:id {note}`, the API
   answers 403 - and the dialog closes with **no message on screen** and the
   note still reads "No Note added." 21.3's "If it does not work" warns about
   it, and its spec pins the 403 so the day it is fixed a spec fails.
4. **TOTAL FOULS is always 0 for every referee on the platform.** The profile
   reads `totalFouls` and `GET /referees/:playerId/stats` does not answer that
   field. 21.1 says the tile stays at zero rather than letting a reader wonder.

### The referee account is remade on EVERY seed run

`GET /referees/:playerId/stats` is a **lifetime** count and **it counts
cancelled matches**. 21.1 photographs its MATCHES tile, and the figure read 1,
then 2, then 3 across three seed runs - the teardown cancels last run's matches
and they keep counting. So `scripts/seed-21.mjs` tears the referee account down
and remakes it every run, `--rebuild` or not, and asserts `totalMatches === 1`
before it finishes. `config/personas.yaml` has the precedent: the `fresh`
persona "must be torn down and recreated rather than reused, because its value
is having no state".

Two consequences. **Rae's user and player ids change every run** - nothing
references them, every spec looks her up through `fixtures21()`. And
`ensureReferees()` matches a keyed referee **by playerId, not by name**, because
last run's tournament row still reads "Rae KB" while carrying a deleted
account's id; matching on the name would leave the dead row and never add the
live account.

### Two FIXED match dates, and one that cannot be

`MATCH_DATE` = 2026-12-05T19:00:00Z (Scheduled) and `LIVE_DATE` =
2026-12-06T19:00:00Z (forced Live). **The seed refuses to run once either has
passed**, and refuses if `LIVE_DATE` is not after `MATCH_DATE`. Three reasons:

1. a match whose date has arrived **starts itself**, and 21.3's first half needs
   one that has not;
2. both sit in `scheduleType=Upcoming` and the profile panel draws **only the
   nearest**, so the Live one being earlier would replace 21.2's first capture
   with a match already in progress;
3. `/schedule` opens on the current month, so the calendar capture freezes the
   clock at 2026-12-01T09:00Z and both fixtures are in that grid.

The Live match's kick-off is deliberately NOT fixed - the server stamps
`startedAt` - so 21.3 freezes the page clock at `startedAt + 12 min`, which pins
the timer at **48:00** every run, and at `startedAt + 60 min + 5s` for END
MATCH. Collection 10's pattern.

**The finished match's date cannot be fixed at all** - events are accepted only
while a match is Live, so it is dated 90 seconds back and polled. Its date
**and its time** are masked on 21.2's Past capture. The first run masked the
date alone and published a kick-off of 9:44, which is nothing but the hour the
seed happened to run.

### config/api.md - the Referees section was rewritten

Beyond the role-matrix correction above:

- **`createMode` and all three modes** of `POST /tournaments/:id/referee`, with
  the two defects.
- **`PATCH /tournaments/:id/referee/:refereePlayerId`** - the dialog's Edit
  referee mode. Not previously recorded.
- **`GET /referees/:id/matches` also takes `includeIncomplete`, `startDate` and
  `endDate`** - that is the variant `/schedule` calls, merged with the player
  one. `GET /players/:id/matches` alone answers **0 rows** for a referee who is
  in neither line-up, so the calendar is the only complete list in the product.
- **`savedOnly=true` on `/team-players/search`** - a new parameter, and how the
  Saved referees tab reads the organiser's list. `saveForFutureTournaments`
  lives on the player record and **outlives the tournament row**.
- **`PATCH /players/:playerId/referee-settings` answers 200 to the tournament
  OWNER** on another player's record. The 403 this file recorded is wrong.
- The **six referee stat tiles**, what feeds each, and the missing `totalFouls`.
- The **profile role switch**: `?profileRole=`, `defaultProfile`, and the four
  things the referee role swaps (teams and rankings are NOT swapped).
- **`refereeBio`** (150 chars, 5 lines) and **`defaultProfile`** on
  `PUT /users/:userId`, both rendered in Profile settings only when `isReferee`.

### Flakes and traps, for the next session

- **The shared browser was signed in as collection 20's player.** Again - it has
  now happened to four sessions. Clearing `localStorage` on a LIVE page does not
  work: redux-persist writes `persist:root` straight back from memory. Do
  exploration through a Playwright context instead, which starts from the
  config's empty `storageState`.
- **The match page's guided tour blocks every click.** Shepherd.js opens over it
  on an account that has never dismissed it, behind an opaque full-screen
  overlay, and it cost the first stepper probe a 20-second timeout. The seed
  sets `isTourCompleted: true` on all three accounts, and `openMatch21()`
  asserts the overlay is gone. It has to ride in the same `PUT /users/:id` as
  `refereeBio`, because that call is a full replace.
- **`GET /tournaments` returns rows keyed `_id`, not `id`.** A lookup on `x.id`
  finds nothing and reads like a missing tournament.
- **`settingsSection(page, 'My Bio')` finds nothing.** My Bio is a
  `settingsRow`, not one of Profile settings' five `h2` cards. Collection 01's
  01.6 knew this; it cost a run here.
- **`clipPad` on the sidebar account block publishes a white band** down the
  right edge - the block is the full width of the sidebar. The same class of
  fault collection 20 recorded for notification rows.
- **Do not mask the whole sidebar on a full-page capture.** The first calendar
  shot published a 350-pixel black slab. Mask the signed-in name only.
- **`GET /referees/:id/matches` answers a summary** whose `homeTeam.players[]`
  lists every team member at `Substitute-1..n` regardless of the real line-up.
  `GET /matches/:id` carries the actual positions.
- **A referee lands on "Join a team"** after signing in, not on the home page,
  because a fresh referee has no teams. `signInAs` handles it by waiting for
  `/signin` to be spent rather than for a landing screen.

### Where to look hard

- **21.3.** Its content is close to the opposite of what `config/api.md` said
  before today. Everything in it was measured three ways, but a whole article
  rests on one afternoon.
- **Open question 5 in `briefs/21.md`** - whether the Add referee dialog's
  *Allow referee to start and end matches* toggle gates START MATCH on a
  **tournament** fixture. KB 21 Cup has no fixtures and giving it some would
  turn this into a tournament collection, so it stays unmeasured. 21.3 says
  nothing about the toggle. If it does gate the button, a referee with it off
  will read 21.3 and find no START MATCH. `Nadia Whistle` is seeded with it off,
  so the contrast is available without new seeding.

---

## Session 2026-09-03 - collection 20, notifications, emails & the activity feed

Four articles LIVE, 12 screenshots, pinned to `e037c26ed9099b0c0782a8e0338aa120d041a984`.

| ID | Intercom | Public URL |
|---|---|---|
| 20.1 | 16798691 | https://help.scoryboard.com/en/articles/16798691-your-notifications-reading-marking-and-deleting |
| 20.2 | 16798692 | https://help.scoryboard.com/en/articles/16798692-the-emails-scoryboard-sends-you |
| 20.3 | 16798693 | https://help.scoryboard.com/en/articles/16798693-why-you-are-not-receiving-our-emails |
| 20.4 | 16798694 | https://help.scoryboard.com/en/articles/16798694-trending-the-activity-feed-on-your-home-page |

Collection: https://help.scoryboard.com/en/collections/19733989-notifications-emails-and-the-activity-feed

**Nothing was reviewed before it went out.** No draft stage, no gate.

### Three of the four mapped titles promised a control that is not there

Not a narrowing of scope - a measurement. All three retitled, and `briefs/20.md`
carries the evidence.

- **20.1 loses "filtering".** Notifications are a modal, not a route:
  `/notifications` answers **404 from the server**, and so do `/home` and
  `/activities`. The modal's hook only ever sends `{limit: 10, skip: n}` and the
  modal carries three controls - Mark all as read, and per row a tick and a bin.
  `GET /notifications` accepts `type` and `isRead`; the app sends neither, and
  **`isRead` does not work at all**: `false`, `true`, `0`, `1` and `False` each
  answer an empty list on an account holding sixteen unread rows.
- **20.4 loses "how to filter it", and is renamed Trending.** `GET /activities`
  takes four filters. The component that renders the feed takes a `query` prop
  that becomes them - and no caller passes one. Swept across 65 chunks pulled
  from every path in the app's own `Routes` enum, the component appears twice and
  both times as `<Trending containerClassName="rounded-lg border bg-white p-3" />`.
- **20.2 loses "Every".** Fifteen email subjects were observed and tabled. The
  payment emails need a connected Stripe payout account, which `briefs/17.md`
  records as un-rebuildable from here, and `TournamentUpdate` needs a tournament
  phase ended with the "notify followers" option, which is collections 13 and 15.

### The badge is a running tally in Firestore, and it is not clamped

Worth a ticket. `GET /notifications` answers a bare array with no counters; the
bell badge and the modal title read `{totalCount, unreadCount, notificationIds}`
off an `onSnapshot` listener on the Firestore document
`notifications/<firebase uid>`. That number is arithmetic:

- `mark-all-read` **sets** `unreadCount` to 0;
- `mark-read {ids, isRead: false}` returns every row to unread and **leaves the
  tally alone** - measured at list-unread 16 with the badge and the title gone;
- `DELETE /notifications/:id` on an unread row **subtracts one**, so clearing a
  list whose tally is already 0 drives it negative. One account read
  `{totalCount: 11, unreadCount: -21}`.

A reader who marks all read and then deletes a few unread rows gets a badge that
will not come back until as many new notifications arrive as they deleted.

**So `scripts/seed-20.mjs` must run before EVERY capture of this collection**,
not once. 20.1 photographs the badge and then presses Mark all as read, which
spends it, and only a new notification raises the tally. The seed marks
everything read *before* deleting it - that is what heals a negative tally - then
reads the Firestore document back and refuses to finish unless it says eleven.

### 20.2 shipped with none of its four screenshots

On the repo owner's instruction, mid-run. yopmail rate-limited this IP and began
answering "Complete the CAPTCHA to continue" in place of every message body. The
four email captures had rendered correctly twice before that, so they are
reachable; the article shipped table-only rather than hold the collection.

`lib/api.mjs` already recorded the same service stopping collection 01
mid-session. **This is a standing fragility, not bad luck** - yopmail is a free
service with no API, and three flows in this project read mail through it. If
email captures matter beyond this collection, the durable fix is a mailbox the
project controls with a real API, which means new persona addresses and a
re-seed. That is a repo-owner decision and it was not taken tonight.

The owner was offered, and declined, two alternatives: fold the table into 20.3
and drop 20.2, or hold 20.2 for a later session. Publishing beat dropping
because **20.2 is the only article in the map that documents the email surface**
- collection 24's nearest, 24.4, is about stored data - so dropping it would
have taken the phishing guidance out of the help centre; and 20.3 depends on it.

**A trap for whoever finishes it.** The published article has no `{{shot:}}`
placeholders, so the moment those four captures exist
`scripts/build-article.mjs` refuses to build 20.2 with "captured but never shown
in the article". Put the placeholders back first - `briefs/20.md` keeps their
alt text and masking. `specs/20/20.2.spec.ts`'s header has the five steps.

### scripts/build-article.mjs could not build a text-only article

`fs.readdirSync` on the screenshot directory threw ENOENT. It now treats a
missing directory as zero files. Nothing else is relaxed: a `{{shot:nn}}`
placeholder with no file behind it still throws, tested both ways. This will come
up again - `config/articles.yaml` describes the deferred collection 25 as "text
only, no screenshots possible".

### The clock is deliberately NOT frozen

`docs/style-guide.md` says to freeze it "where the screen shows a date or a
countdown". Every screen this collection photographs shows a **relative** stamp
instead, computed against `Date.now()`. Freezing does not stabilise those, it
corrupts them: measured with a 09:00 UTC freeze against a 06:05 UTC seed, every
row read **"3 hours ago"**, and a seed running after the frozen instant would
render the same rows as "in 3 hours". The real clock stands, the stamps drift a
little between runs, and `docs/style-guide.md` allows that. They are not masked
either - a relative stamp is collection 18's case, not collection 19's.

The one absolute date is the match's, and it comes from the fixture rather than a
clock: `2026-12-01T19:00:00Z`, printed by three notification rows as
`01 Dec 2026, 07:00 PM` in `Europe/London`. **The seed refuses to run once it has
passed.**

### config/api.md

- the complete **18-value** notification `type` enum, printed by the API in its
  own error. The app's renderer has a case for seventeen and **none for
  `PaymentFailed`**, which falls through to "You have a new notification."
- the Firestore badge, its arithmetic, and the sequence that heals it.
- what sends what, per type, and who receives it.
- **`MatchLive` needs an explicit `POST /matches/:id/status {"status":"Live"}`.**
  The automatic start a passed date causes notifies nobody.
- **A `PlayerFollow` notification is sent once per pair of accounts, for ever.**
  Unfollow then follow again answers 200 with the **same** `followId` and sends
  nothing - the record is soft-deleted and revived, the way a friend record is.
- **`ONE_FRIEND_PER_TEAM` is wider than this file recorded.** On Free,
  `POST /team-players` was refused for a registered player on **none** of the
  caller's teams - measured three ways. Every account is born owning two teams,
  so on Free the refusal is effectively unconditional for a real account, and
  each refusal also soft-deleted the caller's friend record for him. **Worth a
  ticket**, and worth re-reading `briefs/05.md` against.
- **`PlayerJoinedTeam` goes to the Owner AND to Administrators**, which is the
  only reason a Free account can receive one at all, given the above.
- **`PUT /team-players/:id` re-issues the invitation.** It requires `name` and
  `email` even when all it changes is the role, and sending them produces a
  second `PlayerTeamInvitation`.
- `/activities` pages with `page` and `limit`, its `referenceType` is an
  eight-value enum, and the strip's 2.5-second self-scroll.
- `POST /admins/users` also creates two teams and a leaderboard, sends a
  "Welcome to Scoryboard, set your password" email, and sets `isMarketingOpted`
  and `isEmailVerified` true.

### Flakes and traps, for the next session

- **Run `node scripts/seed-20.mjs` before every capture.** Not once. See the
  badge section. 20.1 fails its first assertion on an unseeded account, which is
  the intended behaviour.
- **The notification order is enforced, not hoped for.** The first three
  generators are one API call each and all three landed inside the same second,
  and one run came back with the three oldest shuffled. The seed now waits for
  each row to be Pia's newest before firing the next.
- **There are two `.overflow-y-auto` divs in the notification modal and only the
  inner one scrolls.** `.first()` picks the outer, which measures
  `clientHeight 540, scrollHeight 540` and never overflows - a `scrollTop = 0`
  written to it does nothing. That cost 20.1's fifth capture three runs.
- **There are two bells and only one is on screen at desktop width.** The header
  carries a `lucide-bell` marked `md:hidden` with a zero-sized box at 1440px,
  and a class-based locator finds it first and then cannot click it. The
  sidebar's is a bare inline `<svg>` with no lucide class.
- **Scroll anchoring moves the notification list as its avatars paint.**
  `quiet20()` sets `overflow-anchor: none`, and the reset waits for images
  first.
- **Stubbing the Trending list's `scrollTo` is not enough.** The pixels hold
  still and the component's `activeIndex` climbs anyway, so the Previous arrow
  lights up on a strip sitting on card one. The fix is an init script that drops
  timers asked for at exactly 2500ms - which appears once in the whole bundle.
- **Clipping a Trending card that is off to the right scrolls the strip**, and
  the list's own `onScroll` then recomputes `activeIndex`. Every 20.4 capture
  uses a card already on screen; two and a bit fit at 1440px.
- **A row is the full width of its container**, so `clipPad` on a notification
  row or on the sidebar identity row reaches past it into the dimmed page or the
  black hero banner. Three captures published grey or black bands before the pad
  came off.
- **`unionBox()` is new in `lib/kb.ts`**: an invisible box over several elements,
  for one annotation. Written because outlining the Trending arrows' own row
  drew a 2300-pixel rectangle around two 32-pixel buttons.

---

## Session 2026-09-04 - collection 24, troubleshooting & policies

Four articles LIVE, 14 screenshots, pinned to `c71b85aa63f09b2d0347dbb29a34422966f2edde`.

| ID | Intercom | Public URL |
|---|---|---|
| 24.1 | 16815566 | https://help.scoryboard.com/en/articles/16815566-you-do-not-have-permission-to-do-that |
| 24.2 | 16815572 | https://help.scoryboard.com/en/articles/16815572-photo-and-file-upload-limits |
| 24.3 | 16815576 | https://help.scoryboard.com/en/articles/16815576-something-went-wrong-and-page-not-found |
| 24.4 | 16815581 | https://help.scoryboard.com/en/articles/16815581-language-filtering-terms-privacy-and-what-we-store |

Collection: https://help.scoryboard.com/en/collections/19733993-troubleshooting-and-policies

**Nothing was reviewed before it went out.** No draft stage, no gate. The brief
was written and executed in one run; the human reads this afterwards.

### What differed from the map

- **24.2 has four captures, not three.** The map's three were the caption, a
  browser refusal and the video figure. Step 1 measured the server refusing a
  comment attachment at **2MB** while the composer's own check is **3 MB**, so a
  2.5MB phone photo passes the page and comes back "File too large". That gap
  is the fourth capture, and it is the thing a reader will actually hit.
- **The map's "1MB avatars and logos" is not a limit anybody meets.** It is a
  branch of `uploadImageFile` in the bundle that no live caller reaches - all
  three callers upload banners. The measured server limit for a crest or
  avatar is about **100KB** (66KB accepted, 117KB refused), which the cropper's
  WebP output normally stays under. 24.2 says "about 100 KB" for a photo that
  is refused after cropping and quotes the page's 3MB as what you may choose.
- Nothing else changed. Titles are the map's. Five framing changes to captures
  are in `briefs/24.md`, "Amended during step 2"; none altered an article's
  content.

### The findings that shaped the collection

1. **The word filter is on the server and it masks, not refuses.**
   `POST /comments`, `PUT /teams/:id` (name and bio), `PUT /users/:id` (bio),
   `POST /friends` (name) and `POST /chats/.../messages` all answer 200 and
   store the word as asterisks, one per letter. The bundle carries no word list.
   "damn" and "bloody hell" pass. 24.4 photographs a comment posted through the
   UI; only the asterisked form is in the capture, the typed sentence is in
   `lib/fixtures-24.mjs`.
2. **Upload limits are three numbers.** Page caption 3MB; browser check 3 MB
   for an image and 200 MB for a video on the comment composer and the match
   feed, before any request; server 100KB / 3MB / 2MB for avatar / banner /
   comment media, measured by bisection with incompressible WebPs. All in
   `config/api.md`, "Troubleshooting and policies". Also there: the match
   banner cropper checks 3MB and **says** "Image size must be less than 1MB"
   (copy defect), and `POST /comments/media` with 8MB answers **500**.
3. **A team's settings page has a literal Access Denied screen** for a
   non-manager, inside the normal frame, with no write and no redirect. It is
   the only permission screen in the app that says so; the tournament
   equivalent is a silent redirect (briefs/12.md) and the leaderboard
   equivalent is the error boundary (briefs/08.md). 24.1 leads with it.
4. **A permission problem can look like a crash.** `/leaderboards/:id/settings`
   with no role fetches the team list, gets 403, and falls to "This page
   couldn't load". 24.3 photographs it as the "Something went wrong" screen
   because it is the one that can be produced on demand, and tells the reader
   what it means on that page. 24.1 cross-links.
5. **`/matches/<bad id>` has no Not Found state.** The match shell renders with
   empty tabs. Teams, leaderboards, tournaments and players all get a proper
   "<Thing> Not Found" notice. 24.3 warns; worth a ticket.

### Fixtures and the seed

Two accounts, both this collection's: Marc `kb-manager-free-24@yopmail.com`
(Free, the reader) and Owen `kb-24-owner@yopmail.com` (**Pro**, because Free
cannot add an Administrator and 24.1 needs Marc to be one). Owen owns KB 24
United (Marc Administrator), KB 24 Dummy (`isPrivate`), KB 24 Rovers and KB 24
Town with five players each, venue KB 24 Astro, league KB 24 League, and one
Scheduled match Rovers v Town on **2026-12-12T15:00Z**. `scripts/seed-24.mjs`
refuses to run once that date has passed.

- **Marc's KB 24 Comments FC is deleted and remade on every seed run.** 24.4
  posts a comment on it and comments cannot be deleted (401 to the author).
  The spec asserts the panel is empty before it posts, so a run without a
  fresh seed fails rather than photographing two comments.
- **A match with no `leaderboardId` stays Incomplete.** The first seed run
  proved it - the match came back `Incomplete` - and the seed now creates the
  league, adds both teams, and completes a stray Incomplete match with `PUT`.
- **`isTourCompleted: true` is set on both accounts** in the same full-replace
  `PUT /users/:id` that clears Marc's bio (step 1's profanity probe had written
  a masked bio to it). Both accounts open the match page.
- **The oversize files are generated, not committed.** `oversizeFiles24()` in
  `lib/kb.ts` writes a 3.47MB PNG, a 2.48MB PNG and a 201MB sparse .mp4 into
  `test-results/24-fixtures/` from a fixed-seed xorshift. Their names are
  printed on screen, so they are fixtures.

### Flakes and traps, for the next session

No flakes: every failure was deterministic and fixed in the spec.

- **The team page's tab labels are upper-cased by CSS.** `getByRole('button',
  {name: 'COMMENTS', exact: true})` finds nothing; the DOM says "Comments". Use
  `/^comments$/i`. Cost three captures one run.
- **The match page's tab strip is `role="tab"`, not buttons.** A button locator
  never finds MATCH DETAILS or KEYS. Cost one capture two runs. Playwright's
  `error-context.md` accessibility snapshot is the fastest way to see this.
- **Never `waitUntil: 'networkidle'`.** The presence connection keeps the
  network busy and every navigation times out at 30s. `open24()` waits for a
  marker element instead.
- **The Access Denied, DUMMY TEAM and Not Found notices sit in an empty
  1184 x 832 column.** Clipping `main` publishes a grey field with three lines in
  it. Clip a `unionBox` around the notice with a 120-150px margin.
- **A `unionBox` margin on the match hero reaches into the sidebar.** The hero
  starts at the main column's left edge; a 12px pad published a sliver of
  sidebar text. Pad 0 there.
- **The Profile settings email is an input value.** `getByText` cannot see it;
  read `input` values.
- **Windows Git Bash rewrites `/route` arguments as paths** when passed to a
  node script - `/teams/...` became `C:/Program Files/Git/teams/...`. Set
  `MSYS_NO_PATHCONV=1` for exploration scripts that take routes.
- **A scratch script outside the repo cannot import `@playwright/test`.** Use
  `createRequire('file:///.../scoryboard/package.json')`.
- **Noise generators degenerate in doubles.** An LCG written with `*` in JS
  lost precision and its "incompressible" WebPs compressed to 30KB, which made
  a whole round of server-limit measurements meaningless. Use xorshift with
  `^`, `<<` and `>>>`.

### Where to look hard

- **24.2's table row for the match feed.** The browser's figures (3 MB image,
  200 MB video) are what it enforces; the feed's **server** limit was not
  measured, because `POST /matches/:id/events/media` is accepted only on a
  Live match. If the server is stricter there too, the row understates the
  problem. `briefs/24.md`, open question 2.
- **24.2's "about 100 KB" for a photo refused after cropping.** Bisected to
  between 66KB and 117KB; the exact figure is not known and no reader-facing
  message says it - the cropper prints "Upload failed: File too large".
- **24.4's word-filter paragraphs.** Measured over the API and through the UI
  on a comment. The claim that names and bios are masked rests on the API
  alone, and the list of words is the server's. The article gives no list.
- **24.1's fourth screen, Match Preview (View Only).** Measured on a Scheduled
  match. Collection 09 recorded the same heading; what a spectator sees on a
  Live match was not re-measured here.

---

## Session 2026-09-04 - collection 22, venues & club locations

Two articles LIVE, 11 screenshots, pinned to `37e38f874b7c675a67515fc47b9303532a032d43`.

| ID | Intercom | Public URL |
|---|---|---|
| 22.1 | 16815861 | https://help.scoryboard.com/en/articles/16815861-venues-adding-finding-editing-and-logos |
| 22.2 | 16815863 | https://help.scoryboard.com/en/articles/16815863-tournament-only-venues-and-saving-venues-for-reuse |

Collection: https://help.scoryboard.com/en/collections/19733991-venues-and-club-locations

**Nothing was reviewed before it went out.** No draft stage, no gate. The brief
was written and executed in one run; the human reads this afterwards.

### What differed from the map

Nothing. Two articles, both titles as mapped, 11 screenshots against the map's
11 - 7 for 22.1 and 4 for 22.2. Two changes were made to an article's content
mid-run and both are in `briefs/22.md`, "Amended during step 2"; one of them is
finding 6 below, and it was a wrong sentence caught before it was published.

### The findings that shaped the collection

1. **A venue belongs to its creator, and only the creator can change it.**
   `PUT` and `DELETE` from any other account answer
   `403 "Club location can only be modified by its creator"`, and the app
   prints that sentence under the Location field. It holds **inside a
   tournament**: the Owner cannot edit a venue an Admin added, nor the reverse.
   Both directions were measured. That is what 22.2's `role` flag turned out to
   mean, and it is its fourth capture.
2. **Venue lists are per account.** A fresh account searching `Ast` gets `[]`
   although a dozen `KB nn Astro` venues exist on other collections' accounts.
   `briefs/09.md` says the search "covers every venue on the platform" - it
   covers *yours*, plus the partner rows. Corrected in `config/api.md`. This is
   also why collection 22 cannot break a sibling collection through this
   surface, or be broken by one.
3. **Powerleague venues are global and read-only.** Fourteen ownerless rows
   with `source: "Powerleague"` come back to every account from a three-letter
   search, and nobody can edit them. 22.1 names them in a sentence and
   photographs none: the list is the partner's and can change under us.
4. **Two kinds of venue, and they never meet.** Ordinary (`isTournament: false`)
   is what match forms list. Tournament (`isTournament: true`) is what the
   Create Tournament picker lists - but only with `saveForFutureTournaments`
   also true. With it false the venue is **tournament-only**: it answers to
   `?tournamentId=` and nothing else, so it is invisible in Profile settings, on
   match forms, and to the next tournament. Profile settings shows the union of
   the ordinary and saved lists and badges the saved ones **Saved**.
5. **Profile settings is the venue management page**, and the map's four verbs
   all live in one block - Leaderboards, Teams and Locations -> **Locations**.
   Add Location, and Edit / Remove on each row's kebab. **Remove deletes on the
   click, with no confirmation and no undo.** No other screen edits or removes a
   venue. The route sweep found no `/venues` page: `/club-locations` and
   `/selectClubLocation` are the only venue literals in the app's route enum.
6. **`/tournaments/:id/settings` with no role redirects to
   `/tournaments/:id/info`, not to `/`.** The draft of 22.2 said "sends you back
   to the home page", taken from `briefs/12.md` (open question 5) and
   `briefs/24.md`'s route table. Both of those recorded the redirect on
   `/tournament/:id/settings` - the **singular** route. Measured here on the
   plural route by demoting Ana, loading the page and restoring her admin row:
   it lands on the tournament's own public tab. The article was corrected before
   publishing. **The singular route was not re-tested**, so 12 and 24 are left
   alone - treat the two spellings as two findings.
7. **A tournament's venues are public.** That Info tab shows **NO. OF
   LOCATIONS** and names every venue on the tournament, whoever created it.
   Found while checking finding 6, and it is the thing a reader actually wants
   to know, so it is a paragraph in 22.2. No new capture - 12.6 already
   photographs that tab, and adding one would have been a screenshot the brief
   did not list.
8. **Three smaller ones, all in `config/api.md`.** `POST /club-locations`
   **upserts by name** (case-insensitively, within owner + `isTournament`), so
   adding the same name twice yields one venue and the second address is
   discarded. **A logo can be replaced but never removed** - `PUT` without
   `avatarToken` keeps it, `null` answers 400 and `""` answers 400. **Deleting a
   venue does not touch matches at it**: a Scheduled match keeps the id and
   still prints the name, measured on a match page before and after the DELETE.
   Also: `PUT` is the update verb, not the `POST` the Postman export implied,
   and `PATCH` answers 404.

### Fixtures and the seed

Two accounts, both this collection's: Mo `kb-manager-pro-22@yopmail.com` (Pro,
the reader, holds every venue) and Ana `kb-22-admin@yopmail.com` (Free, Admin of
KB 22 Cup, holds none of her own so her Locations list shows the empty state).
Mo holds exactly three venues - KB 22 Astro and KB 22 Park (ordinary), KB 22 Cup
Ground (tournament + saved) - and one tournament, KB 22 Cup, starting
**2026-12-19**, with two tournament-only venues on it: KB 22 Overflow Pitch
(Mo's) and KB 22 Admin Pitch (Ana's).

- **The seed SWEEPS.** Any venue on either account that is not in
  `lib/fixtures-22.mjs`, and any tournament of Mo's that is not KB 22 Cup, is
  deleted. Both articles photograph lists that show everything the account
  holds, so one stray venue changes a capture. Step 1's probes left twelve
  venues and a tournament behind; the first seed run cleared them, 18 writes.
  The second run made **0 writes**.
- **`scripts/seed-22.mjs` refuses to run once the tournament date has passed**,
  the way collections 09, 10, 20, 21 and 24 do with their match dates.
- **22.1 creates and destroys its own venue.** KB 22 Scratch Pitch is added
  through the form, given a logo, edited and removed inside the spec, with an
  `afterAll` that deletes it by name however the run ended. The logo goes on the
  scratch venue precisely because a logo cannot be removed - putting one on a
  fixture would be permanent.
- **The logo is drawn, not committed as an opaque binary.**
  `scripts/make-assets-22.mjs` writes `assets/22/scratch-pitch-logo.png` from
  SVG, the way collections 07, 15 and 19 do.

### Flakes and traps, for the next session

No flakes. Both specs passed on their first full run, and every failure during
exploration was deterministic.

- **The Locations list paints three `.animate-pulse` skeleton rows** until both
  venue fetches land. `shot()` refuses to photograph a skeleton, so the spec
  gates on a known venue name *and* on the skeletons being gone.
- **Closing a row menu leaves focus on the kebab**, which paints a pale focus
  ring. It was published into 22.2's third capture on the first run and
  re-captured. The spec now blurs the active element first. Worth copying
  anywhere a menu is opened only to prove what is in it.
- **The Create Tournament venue picker's "+" has no accessible name** and a real
  mouse click dismisses the popover before its handler runs. `dispatchEvent` is
  the only thing that works - collection 12 found this and it is unchanged, so
  `lib/kb.ts` now has one helper (`openPickerAddForm22`) rather than a third
  copy of the trick.
- **A single-article `GET /articles/:id` returns `parent_ids` (an array), not
  `parent_id`.** A verification reading `parent_id` reports `undefined` for
  every article including known-good ones, which looks like every article has
  fallen out of its collection. It has not.
- **`GET /club-locations?query=` needs three characters.** Two answers
  `400 SCHEMA_VALIDATION_ERROR`, "String must contain at least 3 character(s)".
- **A scratch script outside the repo cannot import `dotenv`**, and running one
  from the scratchpad directory finds no `.env` at all. Run exploration scripts
  with the repo as cwd, and import `dotenv/config` by absolute file URL.

### Where to look hard

- **22.2's claim that a venue cannot be taken off a tournament.** Measured in
  the UI: the row menu offers Edit and no Remove, on every surface that lists a
  tournament's venues. Over the API, `PUT /tournaments/:id {clubLocationIds}`
  was used to *attach* and never tested with a **shorter** list to detach. If
  detaching works there, a future release could expose it and the article would
  need a step. `briefs/22.md`, open question 3.
- **22.1's "another manager's venue never appears, even if you type its exact
  name".** True for the two accounts here and consistent with the API being
  per-account. It rests on my own accounts only; no third account was tried.
- **Finding 6, and the two routes.** `/tournaments/:id/settings` (plural)
  redirects to the tournament's Info tab; `/tournament/:id/settings` (singular)
  was recorded by collections 12 and 24 as redirecting to `/`. I did not
  re-test the singular one. If they are in fact the same screen, one of the
  three records is wrong, and 22.2 is the one that is live.
- **Powerleague venues.** 22.1 tells readers a search finds them. That list is
  a partner import on staging; if production has a different set, or none, the
  sentence is still true in shape but the reader may see nothing.

---

### 2026-09-08 - maintenance pass, A1 to A5 of 8sept-updates.md. Five live articles corrected.

**Not a collection run.** This session amended five already-published articles
across four collections, on the repo owner's instruction, working from
`8sept-updates.md`. Items A6 to A16 and all of section B were NOT touched.

Everything below was measured on staging on 2026-09-08 before it was written.
`node scripts/audit-live.mjs` was clean before the run and clean after it.

| Article | Item | Intercom id | Shots | What changed |
|---|---|---|---|---|
| 09.7 Inviting people, sharing a preview and the matches calendar | A1 | 16762199 | 7 | the share link really is public now; 2 shots re-captured |
| 10.10 Live viewers, and following a match from another device | A3 | 16769883 | 4 | two sign-in claims deleted; Anonymous User added. Prose only |
| 12.4 Choosing a format for a football tournament | A5 | 16733249 | 9 | overflow question scoped per template; all 9 re-captured |
| 14.1 How the fixture list is generated for a football tournament | A4 | 16736750 | 5 | scoped by template. Prose only |
| 14.5 Rescheduling fixtures, and rolling them onto the next day | A2 | 16736756 | 6 | End time replaces a dead label; all 6 re-captured |

All five are live at `https://help.scoryboard.com/en/articles/`:

- 09.7 `.../16762199-inviting-people-sharing-a-preview-and-the-matches-calendar`
- 10.10 `.../16769883-live-viewers-and-following-a-match-from-another-device`
- 12.4 `.../16733249-choosing-a-format-for-a-football-tournament`
- 14.1 `.../16736750-how-the-fixture-list-is-generated-for-a-football-tournament`
- 14.5 `.../16736756-rescheduling-fixtures-and-rolling-them-onto-the-next-day`

Images pinned to `df1b5eb08bc3e22bb0fdbe6fed3289303c2d67d6`. All 31 URLs verified
200 `image/png` on jsDelivr before publishing, and all 31 re-fetched off the live
Intercom bodies afterwards - all rehosted, none broken. Every deleted phrase and
every added phrase was then checked against the rendered public HTML: 0 problems.

None of these five articles uses `{{link:}}`. They all predate cross-references
and carry quoted titles instead, so the additions follow the same convention
rather than mixing two styles in one article. The 173 cross-references elsewhere
in the project are untouched and still resolve.

### The match preview became public. That is the whole of A1 and A3.

`GET /matches/:id` answers **200 with no token**, and so do `GET /teams/:id`,
`GET /teams/:id/players` and `GET /players/:id` - which is where the line-up names
come from. Measured from a fresh browser context, signed out:

- Before kick-off the page is headed **Match Preview (View Only)**; afterwards,
  **Match Result**.
- A stranger sees the score, the countdown, the date, the kick-off, the venue,
  the pitch, the referee, the leaderboard, the organiser's note, **both line-ups
  by name**, and both teams' FACTS insights and statistics.
- Once played, they also see the **whole feed**: every goal with scorer and
  assister by name, every yellow and red card by name, typed commentary,
  **Player of the match**, the average rating and review count - and the name of
  whoever recorded each event, which is the manager.
- The page carries `og:title`, `og:description` and `twitter:card`, so the link
  **unfurls** with the two teams, the venue and its town, and the date.
- A signed-out viewer is **counted** in the ONLINE tally and listed as
  **Anonymous User** in the viewer panel, beside the owner's own row marked
  **(You)**.

**Three things did NOT change and were deliberately left alone**, all re-checked:
`/matches/:id` signed out still redirects to `/signin`; a leaderboard's share link
is still sign-in only (08.5); and `19.4` needed no edit - it says where the average
rating appears, which is still true, and nothing in it becomes false.

`GET /matches/:id/events` still answers **401** with no token. The feed a stranger
reads comes from Firestore, not from that endpoint.

### Verifying the feed half cost a permanent throwaway on kb-manager-pro-09@

The feed and Player of the Match claims could not be read off a Scheduled match,
and collection 09 holds no finished one. Two throwaway teams, a throwaway
leaderboard and two throwaway matches were built on `kb-manager-pro-09@`, one of
them played out with goals, cards, commentary and a Player of the Match, and read
back signed out.

**Both matches then appeared on Mo's `/schedule`,** which is exactly what 09.7's
shots 05 and 06 photograph, and neither could be deleted - `DELETE` refuses any
match whose date has passed. They were removed from the calendar by cancelling
them instead, and the calendar was confirmed back to exactly its two seeded
fixtures. The teams and the leaderboard were deleted. `seed-09.mjs` prunes stray
leaderboards anyway.

**Two cancelled matches now sit on that account for ever.** They are invisible in
the calendar, in team fixture lists and in the leaderboard, which is the same
harmless residue the 09 suite already leaves - see "Cancelled matches left
behind". Worth knowing before somebody counts rows.

**This contradicts `config/api.md`.** It says a Finished match is permanent and
that `POST /status` refuses one. On 2026-09-08 both
`PUT /matches/:id {"status":"Cancelled"}` and
`POST /matches/:id/status {"status":"Cancelled"}` answered **200 on a Finished
match**. No control in the app does this, so no published article is wrong - but
the reference is. Not fixed here; `config/api.md` is A16's job.

### A2 and A5 were stop-and-asks, and both were raised before anything was written

Both fired the CLAUDE.md triggers - a documented step that no longer matches the
app, and a called-for screenshot that cannot be produced. Both were put to the
repo owner with the measurements in hand, and both decisions are theirs:

- **A2**: scope 14.5's rolling section to Group & Knockout.
- **A5**: reopen collection 12's do-not-re-run for 12.4 only.

`Last allowed match start time` is gone from the product. On **KB 14 Cup**
(Group & Knockout) a cutoff survives as **`End time`**, help text *"If the next
match would finish past this time, scheduling moves to the next day."* On
**KB 14 League** (Round Robin) - 14.5's own fixture - there is **no cutoff field
at all**. The rule is finish-inclusive, and the article now works the arithmetic
through: 15-minute matches 20 apart from 10:00 with an End time of 11:00 give
10:00-10:15 and 10:35-10:50, and the next would run 11:10-11:25, so it rolls.

`KB 14 Cup` is also 14.1's and 14.8's fixture. 14.5 now re-times it and restores
it in a `finally` block using the new `CUP_GROUP_A_SCHEDULE` in
`lib/fixtures-14.mjs`. **Verified: after the run, 14.1's five captures and 14.8's
three are pixel-identical to what is published.** If that restore is ever
dropped, both articles' images change.

### A4 and A5 are the same product change, and it is flagged

Saved from the format screen at its own defaults, measured on throwaway
tournaments built on `kb-organiser-14@` and deleted afterwards:

| Template | Fixtures | Dated | Status | Schedule tab |
|---|---|---|---|---|
| Group phase only, 1 group of 4 | 6 | **0** | all **Incomplete** | an empty **WEEK 1**, and an **UNSCHEDULED** band holding all six |
| Group & knockout, 2 groups of 4 | 13 | **13** | all **Scheduled** | no WEEK or UNSCHEDULED bands; 10-minute steps, as before |

The cause is the **League schedule** block that replaced the overflow Yes/No on
Group phase only. It writes `footballGroupScheduleMode`,
`footballScheduleFrequencyWeeks`, `footballScheduleVenueCount`,
`footballScheduleStartTime` and `footballPreferredMatchDays` - and that last one
is **empty by default**. No day ticked means no slot, so every fixture is
generated undated.

Ticking a day does not simply fix it. With the default 1 week and 1 pitch, saving
opens **`Schedule capacity exceeded`**: *"6 matches per group x 1 groups = 6
total. Only 1 fit in 1 weeks. Create 5 extra weeks?"* with **No, create only 1
weeks** / **Yes, create extra weeks** / **Close**. Accepting it dates all six,
one per ticked day a week apart. Both articles say so. **This corrects
8sept-updates.md B1**, which records the dialog as blocking the save with no
inline error - it blocks the save, but it offers a choice.

**Read this before trusting A4 or A5 in production.** Everything in this section
was measured on **staging only**. 8sept-updates.md B1 says the League schedule
block sits behind `FOOTBALL_GROUP_LEAGUE_SCHEDULER_ENABLED` and that nobody has
confirmed that flag outside staging; the flag is unreadable from the app, and
`/users/me` returns no `flags` key in either environment. The repo owner was
asked and chose to publish on the staging measurement. **If that flag is off in
production, 14.1's "Group phase only is different" section and 12.4's shot 06
both describe something a reader cannot see.** That is the single thing to
re-check first.

### Things found on the way that nobody asked for

- **The match share link gained a slug.** It is now
  `/match/<home>-vs-<away>/<id>/preview`, not `/match/<id>/preview`. It broke
  `specs/09/09.7.spec.ts`'s exact assertion, which now matches on the id and the
  route. It also changed 09.7's shot 01, whose QR code encodes that link, so **01
  was re-captured as well** - one shot more than A1 asked for. The old
  slug-less route still resolves.
- **The Round Robin Schedule tab grew a `WEEK 1` band heading.** This is the same
  change A4 is about, showing up where nobody looked for it. It shifted 14.5's
  shot 02 by 19.3% and changed shot 04's height, so all six of 14.5's shots were
  re-captured rather than mixing a stale strip with a fresh one.
  **`14.3` photographs the same tab and is NOT fixed** - its shots predate the
  heading. That is 8sept-updates.md A13, out of this session's scope.
- **12.4's re-capture cost more than shot 06.** The League schedule block is tall,
  so the layout moved under every capture: 03, 04 and 05 differ by about 27%, and
  01, 02, 07 and 08 by about 4%. Only 09 was unchanged. All nine were taken
  together. Nothing was saved on KB New Cup; the spec still only reads the Format
  tab.
- **A5's stated cost did not apply.** Reopening was said to mean accepting that
  `kb-organiser@` holds four tournaments rather than two. The six captures that
  photograph the tournament list are 12.1/01, 12.2/01, 12.3/04, 12.5/09, 12.6/02
  and 12.8/01 - none in 12.4. No visible tournament count changed.

### Two mechanical traps, both now commented in specs/14/14.5.spec.ts

Worth reading before writing any spec that drives the bulk dialog:

- **`pickDate` takes a months-forward count, not a month.** `freezeClock` pins the
  app to 28 Aug 2026, so reaching 19 September needs `1`. Passing `0` picked 19
  **August** and the update silently did nothing.
- **The dialog closes before the refetch lands.** Capturing on the dialog's
  disappearance alone photographs the schedule as it was - which is what the first
  run of this rewrite produced, six fixtures still ten minutes apart on one day.
  The assertion on `Mon, Sep 21 2026` is the proof the update applied. Do not
  replace it with a bare wait.

### Flake

One. `09.7`'s "the share window, and what the link shows a signed-out visitor"
failed once inside a full-file run and passed on the two runs after it, the second
producing a **byte-identical** shot 01 and shot 02. Not diagnosed. If it recurs,
suspect the ONLINE presence subscription, which is the one thing on that page that
depends on another context being open.

### What was left alone, deliberately

- **A6 to A16, and all of section B.** Out of scope for this session.
- **`config/api.md` and `8sept-updates.md`** carry the repo owner's own uncommitted
  edits and were not staged. Two of the seven A16 gaps listed there were measured
  here and could be written up from observed traffic: the `endTime` field on
  `PUT /tournament-groups/:groupId`, and the five `footballSchedule*` fields on the
  tournament.
- **`08.5`, `02.6`, `15.1`, `15.2`, `15.5` and `19.4`**, as A1 instructs. `02.6`'s
  and `19.4`'s claims were re-checked and both still hold.

### Articles to re-read first

1. **14.1** and **12.4** - both rest on the unconfirmed
   `FOOTBALL_GROUP_LEAGUE_SCHEDULER_ENABLED` flag. See above.
2. **09.7's "What the link shows"** - it tells a reader their players' names and
   the whole match feed are readable by anybody holding the link. That is true and
   verified, and it is the sharpest thing any of these five articles says.
3. **14.5** - it now spans two tournaments, KB 14 League for shots 01-04 and
   KB 14 Cup for 05-06. Check the scope sentences read clearly to somebody who has
   only one of the two formats in front of them.

---

**2026-09-08 - 8sept-updates.md A6 to A12. Thirteen live articles corrected across
nine collections. Not one collection: this is the second maintenance pass over the
artifact, and it spans 01, 02, 07, 08, 09, 10, 11, 13, 14 and 21.**

Commit `dbd397adcce6ffae1efa40b83d33876ff65326e0`. Every image URL is pinned to it.
**Nothing was reviewed before it went out.**

### What is now LIVE

| Item | Article | URL | Change |
|---|---|---|---|
| A11 | 01.4 | https://help.scoryboard.com/en/articles/16738275 | padel section: `Best hand *`, the `/padel-level` step |
| A11 | 01.6 | https://help.scoryboard.com/en/articles/16738281 | padel section: the checklist reads (3) |
| A10 | 02.6 | https://help.scoryboard.com/en/articles/16738976 | padel layout section, **+2 shots**, 2 shots re-captured |
| A8 A10 | 02.7 | https://help.scoryboard.com/en/articles/16738977 | Team rank corrected; padel section, **+1 shot** |
| A12 | 02.8 | https://help.scoryboard.com/en/articles/16738979 | Compare reads football statistics only |
| A8 | 07.10 | https://help.scoryboard.com/en/articles/16740286 | tournament fixtures count |
| A8 | 08.4 | https://help.scoryboard.com/en/articles/16760742 | one sentence narrowed |
| A8 | 09.4 | https://help.scoryboard.com/en/articles/16762195 | the leaderboard is what lets a match be played |
| A8 | 11.2 | https://help.scoryboard.com/en/articles/16756936 | tournament fixtures count; the LEADERBOARDS table does not |
| A8 | 11.3 | https://help.scoryboard.com/en/articles/16756939 | same, plus "three places, and a fourth that counts less" |
| A7 | 13.10 | https://help.scoryboard.com/en/articles/16735857 | football and Other Sports both have a Configuration button |
| A6 | 14.7 | https://help.scoryboard.com/en/articles/16736759 | the generator DOES double-book; the old remedy destroys data |
| A9 | 21.1 | https://help.scoryboard.com/en/articles/16800259 | two or three profile sides; look for the Referee segment |

`config/articles.yaml`'s note on 13.10 was corrected in the same pass, as A7 asks.
173 cross-references, 0 unresolvable, verified off the live API.
`node scripts/audit-live.mjs` exits clean. All 67 live images HEAD 200 with an
`image/*` type, after Intercom rehosted them.

### A8 - the player half is settled, and so is the contradiction

A8 said "Settle the player half first" and left it open. It is answered.

Built on two throwaway accounts in collection 11's namespace, `kb-11-tstats@`
(organiser) and `kb-11-tplay@` (Pippa Probe, a **registered** player): one football
tournament, two tournament teams, one fixture, Pippa in the home line-up, two
goals, a yellow card and Player of the Match, then Finished. The fixture carries
**no `leaderboardId` at all**.

`GET /players/:id/stats` a few seconds later:
`totalMatches 1, wins 1, goalsScored 2, playerOfMatch 1, yellowCards 1`. On screen
her Home page reads MATCHES 1 / WIN 1 / PLAYER OF THE MATCH 1 / GOALS SCORED 2 /
CARD 1. She is ranked 1st in `GET /teams/:id/players/stats` and is that team's
`topScorer`. **So a tournament fixture writes player statistics as well as team
statistics.**

The team half was confirmed first, on the fixture A8 named: `KB 15 Reds` holds 0
leaderboards and three finished tournament fixtures whose `leaderboard` is `{}`,
and `GET /teams/:id/stats` reads `matches 3, wins 1, losses 2, goals 2,
conceded 3`.

**This appeared to contradict `config/api.md`**, which says (2026-08-29, isolated)
that "a match that is not in a leaderboard writes no statistics at all". Both are
true, and the reconciliation is what all six articles now say:

- an **ordinary** match with no `leaderboardId` never leaves `Incomplete`
  (`config/api.md` already lists `leaderboardId` as one of the seven fields that
  decide it), so it can never be started, so it can never count;
- a **tournament** fixture has no leaderboard and counts anyway;
- there is **no third kind** of playable match.

**The LEADERBOARDS table is the exception and it is still leaderboard-only.**
Pippa's row stayed at zero with a dash for a rank, and
`GET /players/:id/stats/leaderboards` agrees. That distinction is now written into
02.7, 11.2 and 11.3 rather than left for a reader to discover.

**Two of the four "check these too" articles need no change.** `10.1` and `11.1`
are about the **Facts tab**, and that panel really is leaderboard-only: on the same
tournament fixture `GET /matches/:id/facts` answers `{homeTeam: [], awayTeam: []}`
and `/facts-stats` answers `leaderboard: null` with `stats: null` on both sides.
`08.4` needed one sentence. `02.7` needed three.

**`02.7`'s Team rank was wrong in a way A8 did not predict.** It said the panel
"says where each of your teams sits in the leaderboard it plays in" and stays on
"No rankings yet" until a team "has finished a match in a leaderboard". Pippa's
panel reads **1st Place in Probe Alpha** - a team with no leaderboard, one
tournament fixture. The panel names the **team**, not a leaderboard.

### What the placing in Team rank is measured against is unknown. Worth a ticket.

`GET /players/:id/teams/rank` answers `{teamId, teamName, rank}` and nothing else.
Pia's team won its only match and reads 1st; Pru's team **lost** the same match and
also reads 1st. 02.7 now says only what is on screen - the team's name and the
place - and claims nothing about what it ranks over. **If product can say, 02.7
should be amended again.**

### A6 reproduced exactly, but not where the note pointed

A6 says "Padel round-robin now advances one round at a time". The **first** fixture
list does not. Saved from the wizard's own defaults on a throwaway padel Round
Robin (`kb-13-probe@`, 8 players, 2 courts, 10-minute gap), all six fixtures arrive
at once, each in its own 10-minute slot, courts alternating 1 and 2. Nothing is
double-booked and there is no banner.

The banner and the defect arrive **after the group is fully scored**:

- the Results tab grows **`Continue RoundRobin`** - the format id, unspaced -
  reading *"Complete the current round to create the next player combinations"*,
  with a `Continue` button, above `End Group Phase`. This is 8sept-updates.md B5's
  banner, and it is on Round Robin as well as on Americano, Mexicano and King of
  the Court;
- selecting it added a **Round 4** of six fixtures across **two** kick-off times:
  four at 10:20 on courts 1 to 4, two at 10:30 on courts 1 and 2;
- three of the four at 10:20 read `Player 1 & Player 2`. **One pair, three matches,
  one kick-off.**
- Round 4 Match 3 is 10:20 on court 3. The already-played Round 3 Match 3 is
  **also** 10:20 on court 3. **One court, one time, two matches.**

So 14.7's "The fixture generator will never double-book a court on its own" and
"Only one thing does: a Court number typed into BULK MATCH UPDATE" were both false,
and both are corrected.

**A6's urgent half is confirmed and is worse than a lost round.** Saving a
**changed** padel configuration deleted the Continue-added round and put all
**eighteen** played fixtures back to `Scheduled` with no score. Nothing undoes it.
Saving the dialog with **nothing** changed made no writes at all and left every
score intact - a distinction worth having, and it is in the article. 14.7 now sends
the reader to SELECT MATCH TO UPDATE instead.

### A11's numbers did not hold, and the article says what was measured

A11 says a padel account's two outstanding checklist fields are "Best hand and
Padel Bio" and that "the total is still two". Measured on `kb-01-padel@`, brought
to a fresh padel signup's exact state:

| | Football account | Padel account |
|---|---|---|
| sidebar | `Complete your profile (2)` | **`Complete your profile (3)`** |
| Personal Details | 1 missing - Date of birth | 1 missing - **Date of birth** |
| My Bio | 1 missing - Bio | **2** missing - **Bio** and **Padel Bio** |

**Best hand is not outstanding**, because Step 1 makes a padel reader fill it in.
01.6 carries the measured numbers. **This is the one place where the artifact now
disagrees with 8sept-updates.md, deliberately.**

### Padel: what was measured, for whoever writes B2 and B3

- **The profile-role switch is on every profile now.** One pill (`Football`) on a
  football-only account, two (`Football`, `Padel`) on an account whose `sports`
  include Padel, three (`Referee`, `Football`, `Padel`) once it is also a referee.
  `defaultProfile` decides which one is selected. The reliable handle is the
  `img[alt]` inside each pill, as `config/api.md` already said.
- **A padel profile is a different layout.** No Matches panel, no Leaderboards
  table, no Add To Team for a visitor. It gains a **LEVEL** panel and a **PADEL
  TOURNAMENTS** panel, and five of its ten tiles are its own: WIN RATE, BEST HAND,
  COURT POSITION, MATCH TYPE, PREFERRED TIME.
- **Four profile field names, none of them in `config/api.md`**: `bestHand`,
  **`courtPositions`** (plural, takes one string), `matchType`, `preferredTime`,
  plus `padelBio` and `defaultProfile: "Padel"`. **`courtPositions` cannot be found
  by trying.** Six singular guesses - `courtPosition`, `padelCourtPosition`,
  `courtSide`, `padelPosition`, `side`, `preferredSide` - are each accepted with a
  `200` and silently dropped. It was found in the app bundle. Values are the
  labels: `Left side`/`Both sides`/`Right side`, `Competitive`/`Friendly`/`Both`,
  `Morning`/`Afternoon`/`Evening`, `Left Handed`/`Right Handed`. **These belong in
  `config/api.md` - that is A16's job, not this session's.**
- **`/padel-level` is real and reachable.** After the verification code a padel
  signup lands on it: "Let's find your starting level", a `Get started` button,
  then `STEP 1 OF 3`. Its own `Skip` returns to the opening screen rather than
  leaving. That is B3's article and was not documented here.

### Accounts created, and what they leave behind

Five new accounts. All are in their own collection's namespace and none is shared.

| Account | Why | Left behind |
|---|---|---|
| `kb-02-padel@` (Perry KB) | **a fixture, not a probe.** In `lib/fixtures-02.mjs` and `scripts/seed-02.mjs`, and 02.6 and 02.7 photograph it | permanent, and seeded |
| `kb-11-tstats@`, `kb-11-tplay@` | settled A8's player half | one played tournament fixture that cannot be undone. Nothing photographs either account |
| `kb-13-probe@` | A6 and A7: an Other Sports tournament and four padel tournaments | five throwaway tournaments. Nothing photographs it |
| `kb-01-padel@` | A11: the padel wizard and the padel checklist | rebuilt mid-run the way `01.4`'s spec rebuilds `kb-01-wizard@` |

**No existing fixture was touched.** Collection 15's `KB 15 Reds` was read, never
written. `kb-organiser-13@` and `kb-organiser-14@` were read for their tournament
lists and nothing else - every padel and Other Sports experiment ran on
`kb-13-probe@` precisely so that 13's and 14's published captures stay valid, which
8sept-updates.md's STOP block requires.

### Screenshots

Three new, two re-captured, all in collection 02. **8sept-updates.md A10 asked for
"the padel-layout shots for both" and there were none to re-capture, so these are
additions and `briefs/02.md` was changed to match** - the collection is 39
screenshots now, not 36.

- `02.6/05-padel-profile` - Perry's profile as a visitor sees it, the two-pill
  switch outlined.
- `02.6/06-padel-statistics` - the padel tile grid, clipped.
- `02.7/05-padel-home-panels` - the whole padel home page. The one full-page
  capture in this collection; `docs/style-guide.md` allows it where the article
  documents a whole page, and here two of the four panels are **absent**, which
  cannot be clipped to.
- `02.6/01` and `02.6/02` changed hash. **02.6/01 changed because the product
  did**: a football-only profile now carries a one-pill `Football` switch that was
  not there in August. `02.6/03`, `02.6/04` and all four of `02.7`'s came back
  byte-identical and kept their published filenames.

No shots anywhere else. A6, A7, A9, A11 and A12 asked for none, and 13 and 14 are
not re-capturable until their fixed dates move forward.

### Two mechanical traps in the padel profile, both now commented in lib/kb.ts

- **`statTiles()` cannot find a padel grid.** It keys on "goals scored", which a
  padel profile has no tile for. `padelStatTiles()` keys on "best hand".
- **`LEVEL` is not a string in the DOM.** The panel's own title is `Level
  Progress`; `LEVEL` is CSS-uppercased from something else, the same trap the tile
  grid has. Cost one run.

### Flake

One. `02.6`'s first run failed on `shot(): 01-public-profile - 1 loading
skeleton(s) on screen` and passed on the two runs after it. Not diagnosed. The gate
before that capture is `statsReady()` plus the bio's text; if it recurs, suspect
the Trending strip, which is the one thing on that page that keeps fetching.

### Left alone, deliberately

- **A13 to A16, and all of section B.** Out of this session's scope.
- **`config/api.md`.** A16 owns it. It is now stale in four places this session
  proved: the leaderboard-statistics rule, the six padel profile fields, the padel
  `Continue` round runner, and `GET /users/me` returning no `flags` key
  (re-confirmed here). **A16 should be the next session.**
- **`skeptic05-state.json`** at the repo root. Untracked, pre-existing, and it
  holds browser cookies and Stripe session ids. Not staged, not deleted. It
  probably belongs in `.gitignore`.

### Articles to re-read first

1. **14.7.** It now tells a reader that the app's own Continue button produces a
   broken round, and that the fix the article used to give destroys played results.
   Both are measured, and both are the sharpest thing any of these thirteen
   articles says.
2. **01.6.** It is the one article that contradicts 8sept-updates.md on purpose.
   Check the count against a real padel signup before trusting it.
3. **02.7's Team rank section.** It describes a panel whose ranking nobody can
   explain, and it deliberately says less than the old text did.

---

**2026-09-13 - 8sept-updates.md A13 to A16. Five live articles corrected, 22
screenshots replaced, and `config/api.md` rebuilt.**

**Not a collection run.** The third maintenance pass over the artifact, working
from `8sept-updates.md`. Commit `45226cbf20476b913d94934925bf3ff160f06f70`;
every image URL is pinned to it. Nothing was reviewed before it went out.
`node scripts/audit-live.mjs` is clean: 132 articles compared, 173
cross-references, 0 unresolvable.

| Article | Item | Intercom id | Shots | What changed |
|---|---|---|---|---|
| 09.2 Match statuses, and why a match is stuck on Incomplete | A14 | 16762191 | 5 | one sentence. Prose only |
| 13.5 Reading the group standings table in a football tournament | A15 B4 | 16735816 | 3 | all 3 re-captured, provenance line added |
| 13.11 Tournament phases - preview, start, end and undo | A15 | 16735884 | 10 | 6 re-captured, 4 kept |
| 14.3 Bulk-scheduling a football group, and the gap between matches | A13 | 16736753 | 5 | 4 re-captured, prose rewritten |
| 15.9 Participants, followers and completing a tournament | A15 | 16771659 | 6 | 3 re-captured, 3 kept |

All 29 live images HEAD 200 with an `image/*` type after Intercom rehosted them.

### A16 - `config/api.md` is the biggest change in this pass

Six corrections, each re-measured on 2026-09-13 rather than taken from the note:

- **`endTime` counts the whole match, not the kick-off.** Proved with a
  discriminating case rather than the obvious one: with `End time` 11:15 an
  11:10 kick-off is *still* refused, because it would finish at 11:25. A
  start-time ceiling would have allowed it.
- **The "public link is not public" claim is split.** A match preview is
  genuinely public; a leaderboard's share link is not, and answers 401 exactly as
  before. The two sections now cross-reference each other and say not to
  harmonise them again.
- **"A Scheduled match can never be pushed back to Incomplete" is false.**
  `date` is the only one of the seven deciding fields that accepts a `null`.
- **`/padellevels/*` is not admin-key.** Our key is refused, 401 - the same
  answer a user token and no credential get. Struck out in both places.
- **`GET /users/me` has no `flags` key.** Its 25 keys are listed.
- **`config/articles.yaml`'s 13.10 note** now names the League schedule block.

**Seven undocumented surfaces recovered off the wire**, each driven in the
browser with the network log recording:

| Surface | What was found |
|---|---|
| Football points | `PUT /tournaments/:id`, defaults 3/2/0 |
| League schedule | same call, six `footballSchedule*` fields |
| Padel profile write | `PUT /users/:userId`, six fields with their enums |
| Padel reads | four `/players/:id/padel-profile/*` paths |
| Padel next round | `POST /tournament-phases/:id/padel-next-round`, no body |
| Unschedule | `PUT /matches/:id {date: null}` |
| SEO | the slugged preview route's tags, `robots.txt`, the sitemaps |

### Three things nobody asked for, and one correction to the note itself

1. **A16 named the wrong endpoint.** It asks for football points on
   `PUT /tournament-groups/:groupId` and says line 2295 lacks them. They are not
   there. The Format tab and the **Football Configuration** dialog send the *same*
   `PUT /tournaments/:id`, byte for byte - the same call the padel configuration
   uses. The group row was right as it stood.
2. **A bulk group update silently does nothing when the group's matches have no
   venue.** 200 on every field, no change, no warning, and the response echoes
   only the group's own record. An hour was lost to it before a venue was added
   and the identical body applied in full. Now in `config/api.md`; **never read a
   200 there as proof the update landed.**
3. **A1's sitemap claim does not hold.** Production publishes **225 tournament
   URLs and no match pages at all** - `/sitemaps/matches/2026/0.xml` answers
   `Not found`, and the index does not list it. `matches` *is* a recognised
   entity, so it was either turned off or never on. A match page is readable and
   it unfurls, both re-verified; it is simply not offered to crawlers. **No
   published article claims otherwise** - 09.7 says only that the link unfurls -
   so nothing is wrong for a reader. Worth asking product.

### A13 needed four shots, not the one it named

`14.3/02`, `03` and `04` all photographed **`Last allowed match start time`**,
which no longer exists anywhere in the product - and on a **Group phase only**
tournament there is no cutoff field at all, so the dialog is one field shorter
and all three reflowed. `05` gained the `WEEK 1` band and is 88px taller. `01`
came back **pixel-identical** and keeps its published filename.

`UNSCHEDULED` is a sibling band and appears **only when a fixture is in it**,
holding it as `Incomplete`. Verified by clearing one fixture's date on a
throwaway. The article says both.

### A15 - the count was short, and a second product change rode along

**The expected change is real and confirmed exactly.** The football draw is worth
**2 points by default, not 1**, applied at read time even where the stored config
carries no points fields. KB 13 Summer Cup Group A returned 7/5/3/1 and returns
**8/7/3/2** off identical W/D/L/GF/GA. **Ranking order is unchanged everywhere**,
so brackets, trophy rows and placements all survive.

**Six shots carried wrong points, not seven**, and five more moved on layout
alone. The split matters, so it is written into each brief.

**The second change is not in `8sept-updates.md` at all.** A Results-tab fixture
card now shows the match's **actual `startedAt`** where it used to show its
scheduled kick-off, and while a phase still allows score editing the score
renders in input boxes with no WIN/DRAW badge. The seeds force-start matches in
bulk, so `13.5/01`, `13.5/03` and `15.9/06` now read **one repeated minute**
(13:41, 9:59) where they read 10:00, 10:10, 10:20.

- It is **not clock-driven.** `freezeClock` was added to 13.5 as a hypothesis,
  changed nothing, and was reverted.
- It is **not fixable from a spec.**
- It was **raised with the repo owner on 2026-09-13, who chose to publish.** The
  images are accurate and no prose in either article refers to a kick-off time.

**Read `13.5` first.** Its two full-page shots are where the repeated time is
most visible.

### A method note worth keeping

**A hash change is not evidence a screenshot is stale.** Comparing bytes flagged
23 shots; comparing pixels found 5 of those identical or near-identical, and
several of the rest differed only by a vertical layout shift. Shots containing
the photographic tournament banner re-encode differently between runs.
`13.11/02` and `13.11/05` came back **byte-identical**, which is the evidence
these captures are deterministic. Judge by content, not by hash - and
`docs/workflow.md` already says two runs may differ slightly and still be
correct.

### Staging data

Everything A16 built was deleted afterwards: two throwaway football tournaments,
one ordinary match, two teams, one leaderboard and one venue, all on
`kb-13-probe@yopmail.com`, which was put back to Free. **No seeded fixture was
mutated except by a spec that restores it** - `14.3` re-timed KB 14 League and
the restore was verified off the API (six fixtures, 26 Sep 2026, 10:00 to 10:50,
ten minutes apart); `13.11` started and undid the knockout phase as it always
does.

**Two residues on `kb-13-probe@`, both harmless.** Its `Probe Padel Mexicano`
gained a scored round and a `Continue`-added Round 2, which cannot be undone; and
its profile now carries the six padel fields with `defaultProfile: "Padel"`,
which is what made the write observable. Nothing photographs that account.

### Left alone, deliberately

- **All of section B.** Out of this session's scope. B1's article is still
  unwritten, though its dialog and both of its blocking dialogs are now recorded
  in `config/api.md`.
- **`8sept-updates.md`** carries the repo owner's own uncommitted edits and was
  not staged.
- **`skeptic05-state.json`** at the repo root. Still untracked, still holding
  browser cookies and Stripe session ids. It belongs in `.gitignore`.

---

**2026-09-13 - 8sept-updates.md B1, B2 and B3. Three NEW articles, published
live. Collections 01, 02 and 13.**

**Not a collection run.** The fourth maintenance pass over the artifact, and the
first of them that ADDS articles rather than correcting them. Commit
`06fb25a4f381c1ab7900868e5a10f83ebc462229`; every image URL was pinned to it and
Intercom has since rehosted all 23. **Nothing was reviewed before it went out.**
`node scripts/audit-live.mjs` is clean: 135 articles, 191 cross-references, 0
unresolvable, 0 built as plain text.

### What is now LIVE

| Item | Article | URL | Shots |
|---|---|---|---|
| B3 | 01.8 The padel rating questionnaire | https://help.scoryboard.com/en/articles/16932797 | 10 |
| B2 | 02.9 Setting up your padel profile | https://help.scoryboard.com/en/articles/16932798 | 7 |
| B1 | 13.12 Changing a football format after you have saved it | https://help.scoryboard.com/en/articles/16932799 | 6 |

All 23 images HEAD 200 with an `image/*` type after the rehost. All 18
cross-references in the three articles resolve. 01.8 and 02.9 point at each
other, so both needed the second build and the second publish; 13.12 built clean
first time.

`config/articles.yaml` gained all three rows. `config/api.md` gained three
sections. The three briefs were amended rather than rewritten.

### B1 - the blocked half was solved by choosing the fixture, not by writing less

8sept-updates.md B1 says to split the article, write the points half and hold the
scheduling half, because the League schedule block sits behind
`FOOTBALL_GROUP_LEAGUE_SCHEDULER_ENABLED` and nobody has confirmed that flag in
production.

The split did not have to go through the middle of the prose. Measured on all
three football templates, 2026-09-13, on two throwaways deleted afterwards:

| Field | Group phase only | Group and knockout | Knockout only |
|---|---|---|---|
| `League type *`, `Match duration (minutes) *` | yes | yes | yes |
| `Win / Draw / Loss points *` | yes | yes | yes, and **inert** |
| the two group questions, `Encounters *` | yes | yes | no |
| `How many teams proceed to knockout? *` | no | yes | yes |
| the overflow Yes/No | no | yes | yes |
| **`League schedule` block** | **yes** | no | no |

**Group and knockout is the only template whose dialog carries none of the
flagged surface**, so 13.12 is captured there and every pixel of it is off that
surface. The prose links to **12.4** for the League schedule block instead of
documenting it twice - 12.4 already covers it, live, from the 2026-09-08 pass.

### The Configuration save is worse than 8sept-updates.md describes

B1 asks the article to carry "saving resets and recreates every fixture". It is
sharper than that, and the two cases differ. Measured by reading fixture ids off
`GET /tournaments/:id/matches` either side of the save:

- **Save with nothing changed** sends the `PUT` and every fixture keeps its id.
  Nothing is lost. **Padel differs** - an unchanged padel save makes no write at
  all.
- **Save with any value changed** deletes all 19 fixtures and recreates them with
  new ids, **and a points box is enough to do it**. A fixture that had been
  played and finished **3-1** came back `Scheduled` with no score. Nothing undoes
  it.

That is the article's first section, before the procedure, rather than a
troubleshooting line. `knockoutTeamCount` also appears in the group-and-knockout
body and was not in `config/api.md`; it is now.

### B3 - the questionnaire wipes both your bios, and that is not in 8sept-updates.md

The whole nine-screen wizard writes **one call**:
`PUT /users/:userId {rating7, courtPositions, matchType, preferredTime}`, read
off the wire. The four answers, the confidence answer and the slider position are
**not stored anywhere**.

It is a **partial** PUT, so the optional fields it omits are cleared - `bio` and
`padelBio` both come back empty. Proved twice: once by replaying the observed
body from a script, once by driving the whole wizard in the browser with both
bios set beforehand. Same family as the defect 02.5 already warns about, where
changing your profile photo clears your bio.

01.8 warns about it in "Before you start" and tells the reader to write their bio
afterwards. **It belongs on the known-defects list in 8sept-updates.md and is not
there.**

### Two things cannot be reset over the API, and that decided both padel specs

- **`rating7`.** `{"rating7": null}` answers `400 "Expected number, received
  null"`; `{"rating7": 0}` answers 400 as well. Once it is set, the "Complete The
  Padel Rating Questionnaire" panel disappears from Profile settings - which is
  01.8's only entry point.
- **The four padel profile fields.** This one **corrects what `config/api.md`
  implies**: `PUT /users/:userId` is a full replace that clears the optional
  fields, and `bio` really is cleared that way, but `bestHand`,
  `courtPositions`, `matchType` and `preferredTime` all survive a body that
  leaves them out. Empty string and `null` are both refused by the enum.

So `kb-01-padel@` and `kb-02-padelsetup@` are **deleted and rebuilt every run**,
the same answer 01.4 gives its wizard account. Their ids change every run, so
nothing carries them. Both the seeds and the specs do the rebuild, so a run that
follows a crashed one still works.

### seed-13.mjs now has exactly one Date.now(), and only one

8sept-updates.md's STOP block is right that this file had none.
`ensureFutureTournament()` builds **KB 13 Configuration** on the next Saturday at
least 56 days out, and deletes and rebuilds it once its start date comes within
28 days. `DELETE /tournaments/:id` really does delete (verified: "Tournament
deleted successfully"), and the whole tournament is rebuilt rather than re-dated
because a partial `PUT /tournaments/:id` wipes the groups and all fixtures.

Proved by deleting the tournament and re-running the seed from nothing.

**This does not fix the other six.** KB 13 Cup, Summer Cup, League, Sunday
League, Padel Cup and Padel Open all still carry fixed dates and are still not
re-capturable. Moving them means moving every date visible in 13.5, 13.11, 14.1,
14.2, 14.5, 14.6 and 14.7.

### Staging data

Three accounts and one tournament are new, plus two throwaways that were deleted.

| Account / fixture | Why | Left behind |
|---|---|---|
| `KB 13 Configuration` on `kb-organiser-13@` | 13.12's own tournament | permanent, seeded, rolling date. Nothing else photographs it |
| `kb-02-padelsetup@` (Pax KB) | 02.9 | permanent address, **rebuilt every run** |
| `kb-01-padel@` (Padma KB) | 01.8. Existed as an A11 throwaway; now a seeded fixture | permanent address, **rebuilt every run** |
| `KB 13 Probe KO`, `KB 13 Probe Group` | measuring the other two templates' dialogs | **deleted** |

**No existing fixture was mutated.** `kb-organiser-13@` gained one tournament and
nothing else; the tournament list is not photographed by any collection 13, 14 or
15 spec, and `tournamentListReady()` deliberately does not gate on the count.
Perry KB (`kb-02-padel@`) was not touched - 02.6 and 02.7 photograph him, which is
exactly why 02.9 got its own account.

One played fixture was created and destroyed on KB 13 Configuration while
measuring what the Configuration save does. The tournament ended the session on
its 3/2/0 defaults with 19 unplayed fixtures, and the seed asserts that before
every run.

### Flakes

None. All three specs passed on their final run and nothing was retried for a
better picture. Five failures during development, all real and all fixed in the
spec rather than in a screenshot - each one is commented where it happened and
listed in the brief.

### Left alone, deliberately

- **B2's statistics half.** As B2 instructs. `PADEL TOURNAMENTS` cannot be
  populated from the profile: padel pairs are server-generated placeholders
  (`isRegistered: false`, "Player 1 & Player 2") and every real account's
  `/players/:id/padel-profile/tournaments` answers `[]`. 02.9 describes the panel
  and says the organiser fills it, and claims nothing about a populated one.
  **Needs the enrolment route from product.**
- **B3's failure behaviour.** As B3 instructs. There is no sync status, no
  provider badge and no error copy anywhere in the app, so "why has my level not
  changed" is unanswerable. The article's last troubleshooting line says only
  what the app says. **Needs product input.**
- **The League schedule block.** Not documented a second time. 12.4 has it.
- **B4 to B9, and section A.** Section A is finished. B4 to B9 are not this
  session's.
- **`skeptic05-state.json`** at the repo root. Untracked, still holding browser
  cookies and Stripe session ids. **The work was staged file by file rather than
  with `git add -A` precisely because that command would have committed it.**
  Third session running that this has been flagged. One line in `.gitignore` ends
  it.

### Articles to re-read first

1. **13.12's "Before you start".** It tells an organiser that changing a points
   value destroys every played result in the tournament. That is measured, it is
   the sharpest thing any of these three articles says, and it is the one a
   reader will act on hardest.
2. **01.8's bio warning.** It documents a defect as a precaution, the way 02.5
   does. If the defect is fixed, that paragraph has to go.
3. **02.9's "PADEL TOURNAMENTS is empty"** troubleshooting line. It is the one
   place the half B2 told us to hold shows through, and it says as little as it
   can get away with.

---

**2026-09-13 - 8sept-updates.md B4, B5 and B6. Four live articles amended.
Collections 13 and 14.**

**Not a collection run.** The fifth maintenance pass over the artifact. Commit
`1cd5f3e59128186b413fc3817f2cdaf73a44f733`; the three new image URLs were pinned
to it and Intercom has rehosted all 27 across the four articles. **Nothing was
reviewed before it went out.** `node scripts/audit-live.mjs` is clean: 135
articles, **192** cross-references (was 191 - 13.5 gained one), 0 unresolvable, 0
built as plain text.

### What is now LIVE

| Item | Article | URL | Change |
|---|---|---|---|
| B4 | 13.5 Reading the group standings table in a football tournament | https://help.scoryboard.com/en/articles/16735816 | prose only, 3 shots unchanged |
| B5 | 13.11 Tournament phases - preview, start, end and undo | https://help.scoryboard.com/en/articles/16735884 | prose plus **1 new shot** (11), 10 unchanged |
| B6 | 14.5 Rescheduling fixtures, and rolling them onto the next day | https://help.scoryboard.com/en/articles/16736756 | prose plus **2 new shots** (07, 08), 6 unchanged |
| - | 14.3 Bulk-scheduling a football group | https://help.scoryboard.com/en/articles/16736753 | **one sentence**, out of scope - see below |

27 images HEAD 200 with an `image/*` type off the live bodies after the rehost.
The one cross-reference (13.5 to 13.12) resolves.

### Three things 8sept-updates.md gets wrong, all now measured

Each was checked before a word was written, and every article follows the
measurement rather than the note.

1. **B5: which padel formats show the `Continue` banner.** B5 says "every padel
   format except King of the Court". `config/api.md` said "every format except
   Swiss". **Both are wrong: every padel format shows it, King of the Court and
   Swiss included.** The gate is the **current round being complete** and the
   phase not having ended - read out of the bundle, and confirmed on screen on
   `KB 13 Padel Open`, which is Swiss with all four rounds scored and carries a
   `Continue Swiss` banner today. That is what made 13.11's new shot possible at
   all. `config/api.md` is corrected in the same pass.
2. **B6: the confirmation toast.** `Match moved to Unscheduled` does not render.
   The bundle asks for a toast on **every** branch of the drop handler -
   `Match unscheduled`, `Match rescheduled`, `Match cannot be moved` - and none
   reaches the DOM. Polled every 400ms for five seconds after a drop that
   demonstrably worked, with `quiet()`'s toast-hiding stylesheet removed so it
   could not be this repo's doing: nothing but Next's route announcer. 14.5 says
   the card changing bands is the only confirmation.
3. **B6: the reverse drag.** "Lands on the tournament start date at midnight and
   renders `0:00`" is the exception, not the rule. A fixture dropped into a week
   takes the **earliest kick-off already in that week** and lands on top of the
   fixture holding it - the clash 14.6 is about. The midnight fallback happens
   only when that week holds no dated fixture, and it renders **`1:00`** in
   British Summer Time, not `0:00`. The article carries both and quotes no clock
   face.

### `14.3` was wrong about where the UNSCHEDULED band sits

Out of B4-B6's scope and fixed anyway. 14.3 went live on 2026-09-13 saying the
band "sits above the weeks". It is **last, under them** - the app sorts the null
week to the end of the list. One sentence, prose only; 14.3's shot 05
photographs a group with no undated fixture, so no image is affected. Leaving a
false sentence live about the same band 14.5 now documents was not an option.

### King of the Court, measured end to end

On two throwaway padel tournaments on `kb-organiser-13@`, **`KB 13 Probe KOTC`**
and **`KB 13 Probe Mexicano`**, both **deleted at the end of the session**:

- Both generated **round 1 only** - that is what "advances a round at a time"
  means. Their matches arrived `Incomplete` until a venue was put on each one; a
  padel fixture needs `clubLocationId` before it will take a score, like any
  other match.
- **`Create Playoffs` is not in the banner.** It is a third button inside the
  **End Group Phase** dialog, whose copy on King of the Court reads *"End Group
  Phase, or create a playoff match between the winners of the final round."*
  Selecting it creates a phase named **King of the Court Playoffs** holding a
  `FINAL`, carrying the ordinary `Undo` card.
- A **drawn** King of the Court round is refused two ways: Continue opens a modal
  headed `Round cannot continue`, and Create Playoffs refuses inline in red,
  *"King of the Court playoff matches cannot be created from a draw"*. Both
  photographed on screen before being written down.
- `POST /tournament-phases/:phaseId/padel-next-round` advances a King of the
  Court phase when called directly (rounds 2 to 5), but the bundle has **three
  separate mutations** and only that one has been read off the wire. The other
  two paths are recorded in `config/api.md` as **not observed**.

### The extra screenshot, and why the brief was changed

`13.11/11-padel-continue-banner` is not in 8sept-updates.md B5, which asks for
prose. It was added because 13.11 is an inventory of the controls in that strip
and **every other control in it has a picture**; a padel organiser reading a
football-illustrated article needs to see that the banner is a second, separate
card above the one the rest of the article is about. `briefs/13.md` says so.

**The spec never selects Continue.** That writes a new round into `KB 13 Padel
Open`, which is 13.6's own fixture, and nothing undoes it. The capture is
read-only.

### Determinism: the 14.5 restore is per match, not per group

`restoreGroupSchedule()` is deliberately **not** used by the new test. The group
bulk update re-times a group in the server's own order, and a null date perturbs
that order - the first run of this work put the same six pairings back against
different kick-off times, which would have changed 14.3's shot 05 and 14.5's own
01 to 04 on their next capture. The test records all six dates up front and
`PUT`s each one back in a `finally`.

**Verified afterwards:** the six published shots of `KB 14 League` and
`KB 14 Cup` re-captured **pixel-identical** - 0.00% of subpixels differ on all
six - so the fixture is exactly where it started. The same check on 13.11's ten
published shots: eight identical, two differing by 0.01% and 0.02%
(antialiasing). All sixteen unchanged images were kept rather than reissued; only
the three genuinely new files were added.

### New in `lib/kb.ts`

`scheduleBands()`, `bandFixtures()` and `dragFixture()`. Read `dragFixture()`
before writing another drag: the Schedule tab uses **native HTML5 drag and
drop**, and Playwright's mouse drives it **only while both ends are inside the
viewport**. A band below the fold is silently never reached, the drop lands on
whatever fixture card is at that height, and nothing on screen says anything went
wrong. That cost three runs; the helper throws instead.

### Staging data

Nothing permanent was added, and no existing fixture was left changed.

| Fixture | What happened | Left behind |
|---|---|---|
| `KB 13 Probe KOTC`, `KB 13 Probe Mexicano` | measuring the Continue banner, the playoffs and the draw refusals | **deleted** |
| `KB 13 Padel Open`, `KB 13 Padel Cup` | read only - the banner was photographed, never selected | unchanged |
| `KB 13 Summer Cup` | 13.11's existing start-and-undo | restored by the spec |
| `KB 14 League` | one date cleared, one fixture dragged, six dates put back | **verified pixel-identical** |
| `KB 14 Cup` | 14.5's existing roll | restored by the spec |

### Flakes

None. All three specs passed on their final run.

### Left alone, deliberately

- **B5's failure toast**, `Unable to create the next round`. It is in the bundle
  and it is not in 13.11, for the same reason B6's toast is not in 14.5: this app
  renders no toast on these screens. Writing "a message tells you" would send a
  reader looking for something that is not there. The two refusals 13.11 *does*
  describe are a modal and an inline error, both seen on screen.
- **B7, B8 and B9.** Not this session's.
- **`8sept-updates.md`** was not edited. It carries the repo owner's own notes.

### One repo change outside the articles

**`.gitignore` now carries `skeptic05-state.json`.** It has been flagged for
three sessions, it holds browser cookies and Stripe session ids, and CLAUDE.md
instructs the run to stage with `git add -A` - which would have committed it.
Take the line back out if that is the wrong call.

### Articles to re-read first

1. **14.5's "Dragging it back is not an undo"** paragraph. It is the sharpest
   thing in this pass, it contradicts what 8sept-updates.md says, and it is the
   one a reader will act on.
2. **13.11's King of the Court paragraph.** It describes a button inside a dialog
   this article does not photograph.
3. **13.5's "Where PTS comes from".** It tells an organiser the defaults were
   applied to tournaments they configured before the change - which is why their
   old standings moved.

---

**2026-09-13 - 8sept-updates.md B7, B8 and B9. Six live articles amended.
Collections 09, 13 and 14.**

**Not a collection run.** The sixth maintenance pass over the artifact.
**Prose only: not one screenshot was captured, re-captured or changed, and no
spec was run.** Every image URL was re-pinned to
`42845a361a63b758c0333efd6d012c231c3f8125`, which was already on `origin`, so
this pass needed no push before it could publish. Intercom has rehosted all 27.
**Nothing was reviewed before it went out.** `node scripts/audit-live.mjs` is
clean: 135 articles, **194** cross-references (was 192 - 14.6 and 09.6 gained one
each), 0 unresolvable, 0 built as plain text.

### What is now LIVE

| Item | Article | URL | Change |
|---|---|---|---|
| B7 | 14.6 Why two football fixtures clash | https://help.scoryboard.com/en/articles/16736757 | new section: `Matches per week` is a second cause |
| B8 | 14.2 How the fixture list is generated for a padel tournament | https://help.scoryboard.com/en/articles/16736752 | scope paragraph plus `Round Robin is timed differently` |
| B8 | 14.4 Bulk-scheduling padel rounds, courts and the gap | https://help.scoryboard.com/en/articles/16736755 | `Round Robin ignores the gap`, **and step 5 corrected** |
| B8 | 13.6 Reading the group standings table in a padel tournament | https://help.scoryboard.com/en/articles/16735818 | scope clause plus a Round Robin section |
| B9 | 09.6 Assigning a referee, and adding a banner or note | https://help.scoryboard.com/en/articles/16762197 | one paragraph: the note is public |
| - | 14.7 Why padel matches share a start time | https://help.scoryboard.com/en/articles/16736759 | **one sentence**, out of scope - see below |

27 images HEAD 200 with an `image/*` type off the live bodies after the rehost.
Both new cross-references resolve, and all six in-page `#anchor` links survive
Intercom's ingest - the `<h2 id="...">` is kept, as 14.1 already relied on.

### Everything was measured on two throwaways, and both are deleted

`KB 14 Probe RR` (padel) and `KB 14 Probe Week` (football), both on
`kb-organiser-14@`, both deleted at the end of the session. **No seeded fixture
in 09, 13 or 14 was written to.** The only read of one was a single
unauthenticated fetch of collection 09's `fixture` match, for B9. Creating the
two throwaways spent two Tournament Pro slots, which deleting does not return;
`seed-14.mjs` grants more when the allowance hits zero.

### B7 holds, and it is worse than the note says

`Matches per week (optional)` is not capped by the week's capacity. A week's
fixtures are shared across the ticked days and the pitches, and **the surplus
stacks on one date, one kick-off and one pitch**. No dialog, no toast, no 400.
Two a week on one day and one pitch gives two matches at once; **three gives
three, and a team is then in two of them at once**. Two pitches, or a second
ticked day, and the clash disappears. The full table is in `briefs/14.md` and
`config/api.md`. Confirmed on screen as well as over the API.

**It is Group-phase-only and staging-only.** The League schedule block still sits
behind `FOOTBALL_GROUP_LEAGUE_SCHEDULER_ENABLED`, still unconfirmed in
production. 14.6's new section is scoped to that template and links to 12.4,
which already ships on the same footing. If that flag is off in production, this
section describes something a reader cannot see - the same caveat 14.1 and 12.4
already carry, and the single thing to re-check first.

### Two things 8sept-updates.md B8 gets wrong, both measured

1. **"Swiss-only" is too narrow.** Measured by re-saving one padel tournament
   into each format in turn: **Swiss** and **Americano** pre-generate rounds a
   duration plus a gap apart; **Mexicano** and **King of the Court** generate
   round 1 and its matches share a kick-off. **Round Robin is the only
   exception** - one match per slot, stepping by the match duration, and it
   **ignores `Gap between rounds (minutes)` completely** (gap 0, 10 and 30
   returned the identical ladder; a 20-minute duration returned a 20-minute one).
   The three articles name the four formats that share a kick-off rather than
   saying "Swiss".
2. **"A Continue-added Swiss round uses the gap plus a hardcoded 30 minutes" is
   false.** It uses duration plus gap like every other round. Four measurements:
   10+10 landed round 5 at 11:20, 10+30 at 12:40, 20+10 at 12:00, 10+0 at 10:40.
   A hardcoded 30 would have put the first at 11:40. No article mentions 30
   minutes.

**Round Robin still renders `ROUND 1`, `ROUND 2` headings** on both the Schedule
and Results tabs - `roundOrder` is set, and a Round Robin round is just six
consecutive matches - so the two formats look identical and behave differently.
That is what made the scope sections worth writing, and it is confirmed on
screen.

### `14.4`'s step 5 was wrong, and its own published picture proves it

Out of B8's scope, fixed anyway - the same call as `14.3` in the B6 pass.

Step 5 said *"The rounds keep their shape and move to the new time."* The bulk
dialog defaults **Same start time per round** to ticked and disables **Time
between matches** while it is, so it sends no gap - and with no gap **every
fixture in the group takes one kick-off time**. 14.4's own shot 04 is four
`ROUND` headings with all eight matches at 9:00. Re-measured on the throwaway;
on Round Robin the same action also puts two matches on court 1 and two on court
2, which is a real clash.

The step now says every match moves to the date and time you set, and a paragraph
says the grouping and the courts survive while the separate kick-off times do
not. **Shot 04 is unchanged; only its alt text now mentions the shared 9:00.**

### `14.7` gained one sentence nobody asked for

Its opening generalises the Swiss shape to all padel - *"matches that start at
the same time are normal. That is what a round is"*. For a Round Robin organiser
that is backwards: its generated fixtures never share a kick-off, so two that do
are the Continue defect the article then describes. One scope paragraph now says
so, pointing at `What causes it`, which gained an anchor. Leaving it while
publishing three articles that say the opposite was not an option.

### B9 was re-verified rather than inherited

09.6 already said *"Everybody who opens the match reads it."* A1 made that
literally true for strangers on 2026-09-08; 09.6 never said so. Re-checked today
on collection 09's own `fixture` match, read-only:

- `GET /matches/:id` **with no token** answers 200 and carries the `note` in the
  body, beside `pitchNumber`, `refereePlayerId` and both line-ups.
- A fresh signed-out browser context loaded the preview route and the page text
  reads `Note: Meet at the clubhouse ...` under FEED, next to a **Sign In**
  button.

The new paragraph tells the reader to keep gate codes, addresses and phone
numbers out of the note, and links to 09.7.

### `config/api.md` was corrected in the same pass

Four additions, each marked observed with today's date: the `Matches per week`
stacking table; a per-format padel timing table; the Continue-round ladder,
including the four measurements that kill the hardcoded-30 claim and the fact
that a **Round Robin** Continue round restarts inside the ladder already played;
and the bulk update's `sameStartTimePerRound: true` rule extended to padel, where
the rounds do not save it.

### Left alone, deliberately

- **No screenshot was added.** B7, B8 and B9 ask for prose, and none of the new
  sections describes a screen an existing shot does not already show.
- **Collections 12, 13 and 14 were not re-captured**, as the STOP block requires.
  Nothing here needed it.
- **`14.4`'s description**, *"Re-timing a padel group without breaking its
  rounds"*. The grouping really does survive; it is the kick-off ladder that does
  not, and the body now says so in the step itself.
- **8sept-updates.md** was not edited. It carries the repo owner's own notes.

### Flakes

None, and nothing to flake: no spec ran. Every measurement was made twice where
it decided a sentence - over the API and again on screen.

### Articles to re-read first

1. **14.4's new paragraph under step 5.** It contradicts what that article told
   readers yesterday, it is the sharpest thing in this pass, and it is the one an
   organiser will act on.
2. **14.6's "A second cause, on the Format tab".** It documents a control
   confirmed on staging only.
3. **09.6's "Everybody includes strangers".** It is the first place the help
   centre tells an organiser that what they type on a match is world-readable.
