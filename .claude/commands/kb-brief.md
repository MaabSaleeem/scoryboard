---
description: Run a collection end to end - explore, spec, capture, publish as drafts
argument-hint: <collection-id>  e.g. 07
---

Target collection: **$ARGUMENTS**

Run this collection from start to finish in one go. There is no approval step in the
middle. You write the brief, then you execute it. The human reviews the drafts in
Intercom afterwards.

Work on this collection only.

Before anything else, read in this order:

1. `state/progress.md` - confirm this collection is `not started` or `in progress`.
   If it is anything else, stop and say so.
2. The collection in `config/articles.yaml` - articles, flags, shots, personas.
3. `config/api.md` - endpoints. Never open the Postman JSON.
4. `config/personas.yaml` - the personas this collection needs.
5. `docs/workflow.md` (both steps and the brief template) and `docs/style-guide.md`
   (voice, structure, screenshot conventions).

## Step 1 - plan

- Sweep for coverage first: pull the route list out of the app bundle, and keep the
  network log on for the whole exploration. Mechanical passes find the screens you
  would not think to visit; your judgement is for what they mean.
- Seed the personas through the admin API. Record every call and every ID it
  returned. Re-seeding must be idempotent.
- Explore each flow in the live staging app. Find the real preconditions, the Free
  gates, the role differences, the empty states.
- Write one replayable Playwright spec per article under
  `specs/$ARGUMENTS/<article-id>.spec.ts`. Stable selectors, seeded fixtures,
  animations disabled, no waits on durations, no random data. A second run against
  unchanged UI must produce identical screenshots.
- Write `briefs/$ARGUMENTS.md` using the template in `docs/workflow.md`. It must
  cover: the article list with anything added or dropped and why; the personas used
  and the seed calls that produced them; the routes covered; per article the
  numbered steps, the screenshot list and the preconditions found; which articles
  need dual Free/Pro capture; open questions; anything unreachable.

Nobody reads that file before step 2. Write it anyway, and write it well - it is the
plan you are about to execute, it is your memory once this session's context gets
compacted, and it is how a fresh session resumes if this one dies.

## Step 2 - execute

Go straight on. Per article, in this order and no other:

capture -> inspect every screenshot -> optimise -> commit -> push -> HEAD each URL
for 200 and `image/*` -> build the article JSON -> POST or PUT to Intercom as a
**draft** -> record the ID in `state/manifest.json`.

Everything lands as `state: "draft"`. Publishing is the human's action, in Intercom,
after they have looked at it. Never send `state: "published"`.

Fix these yourself, then log the fix in the spec and in the report:

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

Stop means stop on that article. Finish the others, then report. Nobody vetted the
brief, so you are the only check between a step-1 misunderstanding and a draft that
documents the product wrongly. Changing the brief mid-run is fine; changing it
quietly is not.

## Finish

Update `state/progress.md` and report: which articles are now drafts in Intercom
with their IDs, what differed from the brief, what was skipped and why, anything you
were unsure about and where to look hard, flakes seen, and the commit SHA the image
URLs are pinned to. Say plainly that the drafts are unreviewed and nothing is
published.
