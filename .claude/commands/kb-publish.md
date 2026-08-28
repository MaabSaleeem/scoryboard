---
description: Step 2 - execute an approved brief and publish the collection
argument-hint: <collection-id>  e.g. 07
---

Target collection: **$ARGUMENTS**

This is step 2. It is supervised: run one stage, read its output, then move on.
Your inference here is for oversight, not authorship. Work on this collection only.

First, check the gate:

1. `state/progress.md` must show this collection as `brief approved`. If it does
   not, stop. Nothing publishes without an approved brief.
2. `briefs/$ARGUMENTS.md` must exist. Read it in full. It is the contract.
3. `config/intercom.yaml` must have a non-empty id for this collection. If it is
   empty, stop and ask.
4. Read `config/api.md` and the step 2 section of `docs/workflow.md`.

Then, per article in the brief, in this order and no other:

capture -> inspect every screenshot -> optimise -> commit -> push -> HEAD each URL
for 200 and `image/*` -> build the article JSON -> POST or PUT to Intercom ->
record the ID in `state/manifest.json`.

Publish is idempotent by article ID: if `state/manifest.json` already has an
Intercom ID, update instead of creating. The command is safe to re-run.

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
- an article whose approved content is now wrong
- anything that would change what the brief said

Never absorb a failure silently. Never add a screenshot the brief did not list.
Never rewrite content beyond what was approved. Never publish an article the brief
did not cover.

Finish by updating `state/progress.md` and reporting: what published with its
Intercom IDs, what differed from the brief, what was skipped and why, flakes seen,
and the commit SHA the image URLs are pinned to.
