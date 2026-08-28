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
| 12 | Tournaments - setting one up | 10 | 65 | organiser | brief approved | [briefs/12.md](../briefs/12.md) | flag: TOURNAMENT_FEATURE_ENABLED. 3 articles retitled - no Draft state, no wizard, no fees. 9 open questions |
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
