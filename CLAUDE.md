# Scoryboard help centre

We are building an Intercom help centre for Scoryboard, a football team and
tournament management SaaS: 146 articles across 24 collections. Every article needs
step-by-step screenshots captured from the live staging app with Playwright, then
published through the Intercom Articles API.

**One collection per session.**

## How you work

One continuous run per collection. There is no stop in the middle.

- **Step 1 - plan. Autonomous.** Drive the staging API and the browser however you
  need to understand each flow. Build a helper in `lib/` when it is worth reusing;
  otherwise just do the work. Output: a Playwright spec per article under `specs/`,
  and one `briefs/<collection-id>.md`.
- **Step 2 - execute. Autonomous.** Run each stage, read its output, then move on.
  Your inference here is for oversight, not authorship: spot what went wrong, fix
  mechanical faults, stop on anything substantive.

Write the brief, then keep going. Nobody reads it before step 2, and it is still
mandatory: it is the plan you execute against, your memory across a long run, and
what lets a fresh session resume this collection after a crash.

**Everything publishes to Intercom as a draft.** The human reviews the drafts in
Intercom, with the real screenshots in front of them, and publishes from there.
That is the only review and it happens after the run.

**The specs are the source of truth.** We must be able to re-run them to regenerate
the screenshots when the product changes. Small differences between runs are fine -
a shifted pixel, a different hash. What is not fine is fixing a screenshot by hand
instead of fixing the spec. You supervise the run. You do not improvise it.

Full process, brief template and per-stage detail: [docs/workflow.md](docs/workflow.md).
Voice, structure and screenshot conventions: [docs/style-guide.md](docs/style-guide.md).

## Opening ritual

Every session, in this order:

1. Read [state/progress.md](state/progress.md) - what is done, what is in flight.
2. Read the target collection in [config/articles.yaml](config/articles.yaml) -
   the article list, flags, shot estimates and personas.
3. Read [config/api.md](config/api.md) - the endpoints. Never read the Postman JSON.

Then, for step 1 also read [config/personas.yaml](config/personas.yaml); for step 2
also read `briefs/<collection-id>.md` and
[config/intercom.yaml](config/intercom.yaml).

## Step 2 - fix it yourself, or stop and ask

Fix and carry on, then log it:

- a capture that came out blank, mid-animation, or obscured by a modal, toast or
  cookie banner
- a selector that resolved to the wrong element
- a missing fixture: re-seed and retry
- a broken or throttled image URL: re-push and re-verify
- a flaky step: retry, and note the flake

Stop and ask when you find:

- a documented step that no longer matches the app
- a screenshot the brief called for that cannot be produced
- an article whose planned content is now wrong
- anything that would change what the brief said

Stopping means stopping on that article. Finish the others, then report. Write what
happened into the brief so the record and the artifact agree.

## Never

- Never publish an article the brief did not cover, and never publish one with
  `state: "published"`. Drafts only - publishing is the human's action.
- Never run a destructive flow against unseeded data. Seed your own fixtures.
- Never absorb a failure silently. Log every deviation.
- Never commit anything from `local/`. It holds credentials and client material.
- Never work on a collection other than this session's target.
- Never add screenshots the brief did not list. If the brief was wrong, change the
  brief and say so in the report - do not diverge from it silently.
- Never call the admin migration or backfill endpoints. They are tenant-wide.

## Environment

- Staging API `https://staging-sb.api.scoryboard.com`, web app
  `https://staging-sb.app.scoryboard.com/`.
- Auth is Firebase; ID tokens last one hour. Mint your own through
  `POST /admins/generate-signin-token`. Never paste a token.
- Credentials come from `.env` only. See `.env.example`.
- Pro membership is free during beta - a self-serve toggle, no payment step. Only
  collections 16 and 17 touch real money, through Stripe.
- There are no push notifications and no shipped localisation. Document neither.
