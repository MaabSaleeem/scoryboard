# The workflow

Two steps per collection. One human gate between them. One collection per session.

The rule that governs everything below: **the specs are the source of truth, and the
artifacts must be deterministic.** Step 1 decides what a screenshot shows and writes
that decision into a spec. Step 2 runs the spec. A second run against unchanged UI
must produce byte-identical screenshots. If a capture depends on something you typed
in the moment rather than on something the spec encodes, the spec is wrong - fix the
spec, not the screenshot.

---

## Step 1 - produce a Category Brief

Autonomous. No approval needed for anything in this step, because nothing here is
published and nothing here is destructive to real data.

1. **Read the target collection** in `config/articles.yaml`. Note the article list,
   `persona_default`, per-article `persona` overrides, flags and shot estimates.
   - `free_pro` - the article needs both a Free and a Pro capture.
   - `tourn_plan` - behaviour depends on the tournament plan (Basic / Pro / Annual).
   - `role` - behaviour depends on team or tournament role.
   - `money` - real money. Stripe test mode only.
2. **Seed the personas** the collection needs, through the admin API in
   `config/api.md`. Follow `config/personas.yaml`. Record the exact calls you made
   and the IDs they returned - the brief must carry them so the run is reproducible.
3. **Sweep for coverage before you explore.** Two mechanical passes, so you do
   not miss a screen you never thought to visit. Neither needs judgement, and
   both are cheap:
   - **Route sweep.** Fetch `$SCORYBOARD_APP_BASE`, pull the
     `/_next/static/chunks/*.js` references out of the HTML, download them and
     grep for quoted path literals. That yields the app's own route names and
     often API paths the Postman export lacks - `/chat`, `/tournaments/token`
     and `/online/users/:uid` were all found this way. The app is code-split, so
     follow chunk references one level down for the routes you care about.
   - **Network log.** Left on for the whole exploration, see the next step.
   Write the routes this collection owns into the brief. A route with no article
   against it is either an open question or a missing article - say which.
4. **Explore each flow in the live app.** Use the browser freely. Find the real
   preconditions: what must exist before the screen looks right, what gates appear
   on Free, which roles see which buttons, what empty states look like.
   **Record the network log while you do it.** `config/api.md` is distilled from a
   partial Postman export, so a flow you are documenting may well call an endpoint
   that is not in it. Read the method, path and body off the wire, and append them
   to `config/api.md` marked `(observed in app, not in collection)` with the date.
   Observed traffic is evidence and belongs in the reference. A path you inferred
   is not - leave it out and raise it as an open question in the brief.
5. **Write a replayable Playwright spec per article** under
   `specs/<collection-id>/<article-id>.spec.ts`. Each spec:
   - seeds or asserts its own preconditions; never depends on another spec's leftovers
   - authenticates as the persona the brief names, using a freshly minted token
   - uses stable selectors (`getByRole`, `getByTestId`, accessible names) - not
     nth-child, not coordinates
   - captures the screenshots the brief lists, in order, with the names the brief
     gives them
   - obeys the capture settings in `docs/style-guide.md`
6. **Write one file, `briefs/<collection-id>.md`,** using the template below.
7. Stop. Tell the human the brief is ready. Do not start step 2.

If a flow turns out to be unreachable, do not quietly drop the article. Write it in
the brief under "Unreachable" with what blocked you.

### Brief template

```markdown
# Collection <id> - <name>

Persona default: <persona>   Feature flag: <flag or none>
Articles in map: <n>   Articles in brief: <n>   Screenshots planned: <n>

## Article list

| ID | Title | Flags | Shots (map) | Shots (planned) | Status |
|----|-------|-------|-------------|-----------------|--------|
| 07.1 | Creating a team | - | 8 | 8 | as mapped |
| 07.x | <added article> | - | - | 4 | ADDED - <why> |
| 07.y | <dropped article> | - | 5 | - | DROPPED - <why> |

Anything added or dropped needs a reason here. The human is approving this table.

## Personas used

| Persona | Email | State it must be in | Seed calls |
|---------|-------|--------------------|------------|
| manager_pro | kb-manager-pro@... | Pro, owns 1 team with 6 players | POST /admins/users; POST /admins/change-user-membership/<id> {"membership":"Pro"}; POST /teams ... |

Give the actual calls and the IDs they returned. A later session must be able to
rebuild this state without guessing.

## Routes covered

From the route sweep. Every route this collection owns, and the article that
documents it. A route with nothing against it is an open question or a gap.

| Route | Article | Notes |
|-------|---------|-------|
| /tournaments/:id/setup | 12.2 | wizard, steps 1-2 |
| /tournaments/token | - | OPEN - what is this screen |

## Fixtures

Named entities the specs depend on, with IDs and how they were created.

## Per article

### <id> <title>

- Persona: <persona>. Plan / role state: <...>
- Preconditions found: <what must exist, what must not>
- Dual capture: yes/no. If yes, what differs between Free and Pro.
- Steps:
  1. <one instruction per step>
  2. ...
- Screenshots:
  | Name | Shows | Masking / annotation |
  |------|-------|----------------------|
  | 01-team-list-empty | Empty Teams screen with the Create button | mask: user avatar |
- Spec: `specs/<collection-id>/<id>.spec.ts`

## Dual Free/Pro capture

The articles that need both, and the membership flip each one needs.

## Open questions

Numbered. Each one names the question and what you assumed in the meantime.

## Unreachable

What you could not get to, and why.
```

---

## GATE

The human reads `briefs/<collection-id>.md` and approves it. One file, one decision.

Approval covers exactly what the brief says: those articles, those steps, those
screenshots. Anything beyond it needs a new approval.

Record the approval in `state/progress.md` before starting step 2.

---

## One-off setup, before the first publish

The Intercom workspace starts empty. Once, before any collection is published:

1. Create all 24 collections with `POST /help_center/collections`
   (`{"name": ..., "help_center_id": 5705778}`) and write each returned id into
   `config/intercom.yaml`. Commit that file.
2. Decide what happens to the five draft articles already in the workspace (four
   are API tests, one is Intercom's own starter article). None sits in a collection.
   Leaving them as drafts is harmless; deleting them needs a human's say-so.
3. Turn the help centre on when the client is ready. `website_turned_on` is
   currently `false`, so nothing is publicly visible yet - which is convenient
   while the first collections land.

---

## Step 2 - execute the approved brief, supervised

Run each stage, read the output, and only then move on. Never chain stages blindly.

Per article, in order:

1. **Capture.** Run the spec. Screenshots land in
   `screenshots/<collection-id>/<article-id>/`.
2. **Inspect.** Look at every screenshot. Check it shows what the brief said it
   shows. Blank frames, half-open modals, cookie banners, toasts, a spinner instead
   of content, the wrong element highlighted - all of these are yours to fix.
3. **Optimise.** Compress losslessly. Keep the dimensions the spec produced.
4. **Filename.** Each file carries a content hash:
   `<nn>-<slug>.<hash8>.png`. A changed image gets a new URL, so a stale CDN copy
   can never be served in its place.
5. **Commit and push.** Screenshots for one article, one commit. Push before the
   next stage - an unpushed image cannot be fetched.
6. **Verify each URL.** `HEAD` every image URL. It must return `200` and a
   `image/*` content type. Pinned to the commit SHA you just pushed:
   `https://cdn.jsdelivr.net/gh/MaabSaleeem/scoryboard@<sha>/screenshots/<path>`
   `raw.githubusercontent.com` is the fallback; it throttles bursts by IP, so retry
   with a delay before you decide a URL is broken. **A 404 at fetch time becomes a
   permanently broken article.** Do not skip this stage. Intercom rehosts images on
   publish, so these URLs are transitional - but they must resolve at publish time.
7. **Build the article JSON** under `articles/<article-id>.json`.
8. **Publish to Intercom.** POST to the Articles API with `author_id`,
   `parent_id` (the collection id from `config/intercom.yaml`),
   `parent_type: "collection"` and `state: "published"` - articles default to
   `draft`, and an article outside a collection is invisible in the help centre.
   If the article already has an Intercom ID in `state/manifest.json`, PUT instead
   of POST. **Idempotent by article ID. Safe to re-run.**
9. **Record the ID** in `state/manifest.json`.

Order matters and does not bend: capture, inspect, optimise, commit, push, verify,
build, publish, record.

### Fix it yourself, then log it

- a capture that came out blank, mid-animation, or obscured by a modal, toast or
  cookie banner
- a selector that resolved to the wrong element
- a missing fixture: re-seed and retry
- a broken or throttled image URL: re-push and re-verify
- a flaky step: retry, and note the flake

A fix goes into the spec, not into a one-off manual capture. If you cannot express
the fix in the spec, that is a substantive problem - stop.

### Stop and ask

- a documented step that no longer matches the app
- a screenshot the brief called for that cannot be produced
- an article whose approved content is now wrong
- anything that would change what the brief said

Stop means stop on that article. Finish the others, then report.

### Never

- Never silently absorb a failure.
- Never add a screenshot the brief did not list.
- Never rewrite content beyond what was approved.
- Never publish an article the brief did not cover.

### End-of-session report

Write it into `state/progress.md` and say it in chat:

- what published, with Intercom IDs
- what differed from the brief, and why
- what was skipped, and why
- flakes seen, and which specs they were in
- the commit SHA the image URLs are pinned to
