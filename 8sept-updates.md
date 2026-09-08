# 8 Sept updates

Work the live help centre needs. Every article id here is the real one - check it
against `config/articles.yaml` before you edit, and remember 13, 14 and 15 are split
by sport, so a football change never belongs in a padel article.

Run `node scripts/audit-live.mjs` before you start and after you publish.

## STOP - before re-capturing anything in collections 12, 13 or 14

Gates the re-capture work in A15, B4, B5 and B8.

- **Collections 12, 13 and 14 have no date guard and no `--rebuild`.** Zero
  `Date.now()` calls in all three seeds. Today's fixtures survive only because the
  seeds are ensure-only and the tournaments already exist. A rebuild from nothing
  creates past-dated tournaments whose matches auto-finish 0-0 and can never be
  scored. **13 and 14 are not re-capturable** until every date moves forward - which
  changes every date visible in `13.5`, `13.11`, `14.1`, `14.2`, `14.5`, `14.6` and
  `14.7`. Fixed dates fall on **12 and 19 Sept**; KB 13 Sunday League expired 5 Sept.
- **`scripts/seed-15.mjs`'s guard is dead.** It compares two literals
  (`earliest = '2026-10-17'` against `TODAY = '2026-09-01'`), so `state/progress.md`'s
  claim that it refuses to run once its dates pass is false. On 18 Oct it builds the
  unscoreable board it was written to prevent. One-line fix: use `Date.now()`, as six
  other seeds do.
- Collection **12** carries a standing do-not-re-run from 2026-08-28. A5 needs it
  reopened for that one article.

---

## A. Wrong for readers now

Live and publicly readable. These say things that are false today.

### A1. `09.7` Inviting people, sharing a preview and the matches calendar

A match is now readable by anyone with the link, signed out. `GET /matches/:id`
returns 200 with no auth token and includes both line-ups. The sitemap publishes
~36,500 match pages as `index, follow`.

- [ ] Delete: *"Whoever opens it has to be signed in to Scoryboard. A visitor who is
  not gets a Sign In button and nothing else."*
- [ ] Delete the whole troubleshooting entry: *"Somebody says your link shows them
  nothing..."*
- [ ] Fix the article's `description` field - it repeats the claim.
- [ ] Add what the link exposes: score, full feed with named scorers and cards, Player
  of the Match, both line-ups by name, referee, pitch, organiser's note.
- [ ] Add that the link now unfurls on social with the fixture, venue town and date.
- [ ] Re-capture `09.7/02-preview-signed-out`. The old page no longer renders.
- [ ] **Deadline: 24 Sept**, when collection 09's seed date guard fires.
- [ ] **Do NOT harmonise `08.5` with this.** Leaderboard share links are **still**
  sign-in only - `GET /leaderboards/:id` returns 401 and the page redirects to
  `/signin`. `08.5` is correct as written. Only the *match* preview changed.
- [ ] **Leave `02.6`'s signed-out claim alone** too: `/player/:id`, `/matches/:id` and
  `/leaderboards/:id` all still redirect. `robots.txt` allows only `/tournament/` and
  `/match/`.
- [ ] **Leave `15.1`, `15.2` and `15.5` alone.** They already say the tournament page
  is public, correctly.
- [ ] Read collection **19** before closing this. `19.4` says the average rating
  appears in the header of a finished match, which is now a public surface, and
  `/ratings` answers 200 with no token. Nobody has checked it.

### A2. `14.5` Rescheduling fixtures, and rolling them onto the next day

`Last allowed match start time` no longer exists. It is now `End time`, with new help
text: *"If the next match would finish past this time, scheduling moves to the next
day."* The cutoff counts the whole match, not just its start. **On this article's own
fixture (round-robin football) the field is gone entirely** - it survives only on
group-and-knockout.

- [ ] Rewrite the "Rolling fixtures onto the next day" procedure. Step 3 names a
  control that does not exist.
- [ ] Rewrite "What you will see" - the finish-inclusive rule changes the arithmetic.
- [ ] Fix the troubleshooting entry *"Everything landed on one day."*
- [ ] `14.5/05-last-allowed-start-time` is **unproducible**. Either scope the section
  to group-and-knockout, or re-fixture the article.
- [ ] Fix `specs/14/14.5.spec.ts:111` - the selector for the dead label.
- [ ] **Stop-and-ask** under CLAUDE.md: a documented step no longer matches the app and
  a called-for screenshot cannot be produced. Raise it before you rewrite.

### A3. `10.10` Live viewers, and following a match from another device

Same change as A1, aimed at the signed-out spectator.

- [ ] Delete: *"The share link needs a Scoryboard account. Sending the match to
  somebody who is not signed in gets them a sign-in screen, not the match."*
- [ ] Delete the troubleshooting entry: *"They get a sign-in screen instead of the
  match. They need a Scoryboard account. Invite them to the team."*
- [ ] Add that the viewer panel now shows `Anonymous User` rows.
- [ ] **Keep** the viewer-count sentence ("Not only your squad"). Still correct.

### A4. `14.1` How the fixture list is generated for a football tournament

Saved at the wizard's own defaults, the **group-phase-only** template now dates 0 of 6
fixtures. All arrive Incomplete, under an empty `WEEK 1` heading and a full
`UNSCHEDULED` band. Group-and-knockout still dates everything.

- [ ] Scope by format. *"Scoryboard builds the whole fixture list for you when you
  save the format"*, *"each match already has a date and a kick-off time"* and *"Group
  matches are Scheduled"* are all false for round-robin.
- [ ] Add the `WEEK` and `UNSCHEDULED` headings. The article never mentions them.
- [ ] **Prose only, no re-capture.** The images photograph KB 14 Cup
  (group-and-knockout), so they are safe.

### A5. `12.4` Choosing a format for a football tournament

Step 4's overflow Yes/No control is gone from "Group phase only" - a League schedule
block stands in its place. It survives on the other two templates, which this article
says ask only about knockout counts. So the article puts a control where it is not and
omits it where it is.

- [ ] Rewrite that section, scoped per template.
- [ ] `12.4/06-overflow-matches-toggle` is **unproducible**.
- [ ] Fix `specs/12/12.4.spec.ts` shot 06.
- [ ] **Keep** *"Other Sports tournaments work exactly the same way"* - verified true.
- [ ] **Blocked on a decision.** Collection 12's do-not-re-run has to be reopened for
  this article. Reopening means accepting that the shared `kb-organiser@` account now
  holds four tournaments, not the two its published shots show.

### A6. `14.7` Why padel matches share a start time, and when that is a clash

Padel round-robin now advances one round at a time, via a `Continue <format>` banner.
The first generated round double-books a court **and** a pair - three matches at 09:20
all reading "Player 1 & Player 2".

- [ ] Fix *"The fixture generator will never double-book a court on its own."* and
  *"Only one thing does: a Court number typed into BULK MATCH UPDATE."*
- [ ] **Urgent.** The article's prescribed remedy - *"Save the configuration to
  rebuild the fixtures"* - deletes the Continue-added round and reverts played
  results. `13.10` carries that warning; this article does not. Add it.

### A7. `13.10` Changing a padel format after you have saved it

Football and Other Sports now both carry a Configuration button. It opens a dialog
titled `Football Configuration`.

- [ ] Fix *"There is no Configuration button. Your tournament is football or Other
  Sports. Those have no such dialog."*
- [ ] Fix the identical note on 13.10 in `config/articles.yaml`: *"Football has no such
  tab."*

### A8. `07.10` `09.4` `11.2` `11.3` The leaderboard statistics rule

Four articles say only leaderboard matches count. False - tournament matches count
too. Team "KB 15 Reds" has 0 leaderboards and 3 tournament fixtures with no
`leaderboardId`, and shows MATCHES 3 / WIN 1 / LOSS 2 on screen.

- [ ] `07.10`: fix *"Only matches played in a leaderboard count."*, *"A friendly that
  was not attached to a leaderboard leaves every tile on this page at zero"*, and the
  diagnosis *"Every tile reads 0 but you have played matches..."*
- [ ] `09.4`: fix *"A match outside a leaderboard records no statistics at all - no
  table, no goals, nothing on anybody's profile."*
- [ ] `11.2`: fix *"Both sets of figures come from matches in a leaderboard. A match
  that is not in a leaderboard is never counted."*
- [ ] `11.3`: fix *"Everything reads zero. The matches are not in a leaderboard."*
- [ ] Check four more that repeat the rule: `02.7`, `08.4`, `10.1`, `11.1`.
- [ ] **On `08.4`, check the leaderboard-stats claim only.** Leave *"No points column,
  and no draws."* alone - still true, and a leaderboard table has no points to
  configure. Editing it would invent a column.
- [ ] **Settle the player half first.** Confirmed for *team* statistics. For *player*
  statistics, run one tournament match with a filled line-up and read
  `/players/:id/stats`. The test team's players all read zero, but both line-ups were
  empty, so that proves nothing. The answer decides whether `02.7`, `10.1` and `11.1`
  are wrong too.

### A9. `21.1` Becoming a referee, and your referee profile

A padel player who is not a referee now sees a two-pill switch (`Football profile` /
`Padel profile`), so the article tells them it means somebody made them a referee.

- [ ] Fix *"Your **two** profiles hold different bios, different statistics and
  different match lists."*
- [ ] Fix *"Your profile has no Referee switch. Nobody has added you yet, or they used
  a different email address."*

### A10. `02.6` `02.7` Your public profile, teams and match history

The padel profile layout has no Matches panel, no Leaderboards table, six different
tiles, plus LEVEL and PADEL TOURNAMENTS. A football-only reader who opens a padel
account whose `defaultProfile` is Padel lands on that layout, so this is not a
padel-reader-only problem.

- [ ] `02.6`: fix *"every profile is laid out the same way"* and *"Open another
  player's profile instead; the layout is identical."*
- [ ] `02.7`: add a padel section. *"Four panels ... Teams, Team rank, Matches and the
  leaderboards table"* is wrong for a Padel-default account.
- [ ] Re-capture the padel-layout shots for both.

### A11. `01.4` `01.6` The setup wizard, and the profile checklist

A padel signup has no Preferred position field. It has a required `Best hand *`
instead, and gains a `/padel-level` step.

- [ ] `01.4`: add a padel section. *"Choose your Preferred position. Football offers
  Goalkeeper through to Substitute."* sends a padel reader to a field that is not
  there, and never names the one they must fill.
- [ ] `01.6`: add a padel section. It names the two outstanding fields as Date of birth
  and Bio; on a padel account they are Best hand and Padel Bio. The total is still
  two, so both tinted-field captions are wrong.

### A12. `02.8` Comparing your stats with other players

Compare shows the football ten on a padel profile, where the tiles are different.

- [ ] Add a padel section. Fix *"The ten rows are the same statistics as the tiles on a
  profile"* and *"Both columns are all zeroes... Compare reads the same statistics as
  your profile"*.

### A13. `14.3` Bulk-scheduling a football group, and the gap between matches

- [ ] Fix the troubleshooting entry *"Fixtures moved to another day. You set a **Last
  allowed match start time**."* - dead label, see A2.
- [ ] Add the `WEEK 1` and `UNSCHEDULED` headings now on the Schedule tab.
- [ ] Re-capture `14.3/05`.

### A14. `09.2` Match statuses, and why a match is stuck on Incomplete

- [ ] Fix *"...so a Scheduled match cannot go back to Incomplete."* - false over the
  API (`PUT {date:null}` returns it to Incomplete).
- [ ] **Low priority.** No reader-reachable control clears an ordinary match's date, so
  a reader following the article still gets the right outcome. The venue and
  leaderboard half holds.

### A15. Stale standings screenshots - `13.5` x2, `13.11` x4, `15.9` x1

The football draw default moved from 1 point to 2, applied at read time even to
tournaments whose stored config carries no points fields, so historical standings
recomputed themselves. `13.5/02-standings-columns` shows 7/5/3/1; the same fixture
returns 8/7/3/2 today with identical W/D/L/GF/GA.

- [ ] **Confirm on production first.** This one was measured on staging only. Do not
  spend seven re-captures until it is confirmed.
- [ ] Re-capture all seven. Ranking order is unchanged, so brackets and trophy rows
  survive. Both specs assert no numbers, so these are clean re-captures.
- [ ] Add one provenance line to `13.5` - see B4.
- [ ] **Read the STOP block above before touching 13 or 14.**

### A16. `config/api.md` and `config/articles.yaml`

`config/api.md` is the only endpoint reference a future session may read - CLAUDE.md
forbids the Postman JSON. Left alone, it re-teaches the old behaviour. Fix in the same
pass as the articles, not after.

- [ ] Fix the `endTime` cutoff rule: *"`endTime` is a per-day ceiling: when the next
  kick-off would pass it..."* It now counts the whole match.
- [ ] Fix *"The 'public link' is not public"* - true for leaderboards, false for
  matches. Split the claim.
- [ ] Fix *"A Scheduled match can never be pushed back to Incomplete."*
- [ ] Fix the `/padellevels/*` "(admin key)" label. The admin key is refused there.
- [ ] Fix line 91 - `GET /users/me` returns no `flags` key at all.
- [ ] Fix `config/articles.yaml`'s note on 13.10 - see A7.

---

## B. Gaps - nothing false, something missing

### B1. NEW - The football Configuration dialog (collection 13)

Undocumented end to end. Mirror `13.10`, which does the same job for padel.
**Split this article: write the points half now, hold the scheduling half.**

- [ ] Labels, read off screen: `League type *`, `Match duration (minutes) *`,
  `Win points *`, `Draw points *`, `Loss points *` (0-99 integers), group questions,
  `Encounters *`.
- [ ] Then the League schedule block: `Scheduling mode`, `Number of pitches/venues`,
  `Schedule duration (weeks)`, `Matches per week (optional)`, `Daily schedule start
  time`, `Preferred match day(s)` Mon-Sun.
- [ ] Must carry: saving **resets and recreates every fixture**. The app's own confirm
  says *"Changing the configuration will reset the current scheduled matches ... the
  current match setup will be lost."*
- [ ] Must carry the two dialogs that block the save with no inline error:
  `Schedule capacity exceeded` and `Schedule weeks exceed requirement`.
- [ ] Must say the points values are **inert on knockout-only**.
- [ ] `Scheduling mode` offers only two options on screen: `Custom schedule` and
  `Generate fixtures without dates`. Write only those two - never the words Weekly,
  Custom or Manual as a set, which a reader never sees.
- [ ] `Schedule duration (weeks)` is a capacity multiplier, not a gap between rounds.
  Slots = weeks x ticked days x pitches.
- [ ] ~6-8 shots.
- [ ] **The League schedule half is BLOCKED.** It sits behind
  `FOOTBALL_GROUP_LEAGUE_SCHEDULER_ENABLED` and nobody has confirmed that flag in
  production. It is unreadable from the app: absent from every bundle, no config path
  answers, and `/users/me` returns no flags in either environment. **Needs someone with
  backend or infra access.** The points half is not flagged.
- [ ] Do not write a weekly-league article. `Weekly` has no reachable UI, so it has no
  capturable entry point. Blocked until product says how it is reached.

### B2. NEW - Setting up your padel profile (collection 02)

Padel is a third profile type alongside Player and Referee.

- [ ] Write side: `Best hand *`, `Court position`, `Match type`, `Preferred time`, a
  second `Padel Bio` box, `Select your default profile`.
- [ ] Read side: LEVEL, ten different tiles, TEAM RANK, TEAMS, PADEL TOURNAMENTS.
- [ ] ~6-8 shots.
- [ ] **Plan the statistics half only.** PADEL TOURNAMENTS cannot be populated from
  here - pairs are server-generated placeholders (`isRegistered: false`, "Player 1"),
  and every real account returns `[]`. Try `PUT /team-players/:id`, or ask product for
  the enrolment route.

### B3. NEW - The padel rating questionnaire (collection 01)

`/padel-level` is a nine-screen wizard with finished copy. It names PadelLevels to the
reader twice.

- [ ] Entry point: Profile settings -> `Complete The Padel Rating Questionnaire` ->
  `Add Rating`.
- [ ] Cover the Self-rated / Provisional / Validated states.
- [ ] The wizard's own copy answers when ratings update: *"once you play matches
  against players with established levels"*.
- [ ] ~8-10 shots.
- [ ] **Do not document failure behaviour.** There is no sync status, no provider badge
  and no error copy anywhere in the app, so "why didn't my level change" is
  unanswerable. Needs product input. Cover the questionnaire and the states only.

### B4. `13.5` Reading the group standings table in a football tournament

PTS has no provenance, and the values are now configurable.

- [ ] Add a section. Reuse `13.6`'s padel wording verbatim, including *"A draw is worth
  2 by default, not 1."*

### B5. `13.11` Tournament phases - preview, start, end and undo

Its inventory of Results-tab controls omits the `Continue <format>` banner, which
renders in the same strip, above `End Group Phase`.

- [ ] Add it: *"Complete the current round to create the next player combinations."*
  plus a `Continue` button. Failure shows a toast `Unable to create the next round`.
- [ ] King of the Court adds `Create Playoffs` and a modal `Round cannot continue`.
- [ ] Every padel format except King of the Court shows the banner. **Swiss is
  untouched** - it still pre-generates all rounds.

### B6. `14.5` Drag a fixture to Unscheduled

Round-robin football only, and only while the `UNSCHEDULED` band exists. This is the
only way a reader can unschedule a fixture.

- [ ] Add a section. The toast reads `Match moved to Unscheduled`.
- [ ] Warn about the reverse drag: it lands the fixture on the tournament start date at
  midnight and renders `0:00`.
- [ ] ~2-3 shots.

### B7. `14.6` Why two football fixtures clash

- [ ] Add one line: `Matches per week` is a new cause. It can put two fixtures on one
  pitch at one kick-off.

### B8. `14.2` `14.4` `13.6` Padel round timing is Swiss-only

The duration-plus-gap rule and *"Matches in one round share a kick-off time"* hold for
Swiss only. Round-robin padel gives each match its own slot and ignores the gap.

- [ ] Add a scope section to each of the three.
- [ ] A Continue-added Swiss round uses the gap plus a hardcoded 30 minutes.

### B9. `09.6` Assigning a referee, and adding a banner or note

- [ ] Add one line. *"Everybody who opens the match reads it."* is now literally true
  for strangers with the link.

---

## Known product defects

Not documentation work. Do not write around them; pass them on.

- A football points value of 100 is refused `400` server-side with **no on-screen
  message at all**. The 0-99 client check covers only the padel fields.
- `Best hand *` is asterisked but not enforced. Saving without it succeeds and leaves
  four tiles reading N/A.
- The padel profile's W/L RATIO tile is wired to the **football** stats query. It reads
  `0:0` beside MATCHES 2 / WIN RATE 100%.
- A partial `PUT /tournaments/:id` wipes the tournament's groups and all fixtures.
- Dragging an unscheduled fixture into a week band writes `00:00Z`, the server marks it
  Scheduled, and the card renders `0:00`.
- An Other Sports tournament's dialog is titled `Football Configuration`.
- Padel `Continue` double-books a pair on every generated round. King of the Court
  `Continue` produces Incomplete matches that cannot be started.
