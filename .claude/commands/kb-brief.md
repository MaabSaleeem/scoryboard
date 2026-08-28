---
description: Step 1 - explore a collection and write its Category Brief
argument-hint: <collection-id>  e.g. 07
---

Target collection: **$ARGUMENTS**

This is step 1. You are autonomous here. Nothing you do in this command publishes
anything. Work on this collection only.

Before anything else, read in this order:

1. `state/progress.md` - confirm this collection is `not started` or
   `brief in progress`. If it is anything else, stop and say so.
2. The collection in `config/articles.yaml` - articles, flags, shots, personas.
3. `config/api.md` - endpoints. Never open the Postman JSON.
4. `config/personas.yaml` - the personas this collection needs.
5. `docs/workflow.md` (step 1 and the brief template) and `docs/style-guide.md`
   (screenshot conventions).

Then:

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
  and the seed calls that produced them; per article the numbered steps, the
  screenshot list and the preconditions found; which articles need dual Free/Pro
  capture; open questions; anything unreachable.
- Set this collection to `brief awaiting approval` in `state/progress.md`.

Do not capture screenshots for publication, do not commit, do not touch Intercom.
Stop when the brief is written and tell the human it is ready to read.
