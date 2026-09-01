---
description: Re-run or resume step 2 for a collection whose brief already exists
argument-hint: <collection-id>  e.g. 07
---

Target collection: **$ARGUMENTS**

Step 2 on its own. Use this to resume a collection whose brief and specs already
exist - a session that died partway, a re-capture after the product changed, or a
re-publish after fixing an article. For a collection that has not been started,
use `/kb-brief` instead; it runs both steps.

Work on this collection only.

First:

1. `briefs/$ARGUMENTS.md` must exist. Read it in full. It is the plan.
2. `config/intercom.yaml` must have a non-empty id for this collection. If it is
   empty, stop and ask.
3. Read `state/manifest.json` to see which articles already have Intercom IDs.
   Those get updated, not recreated.
4. Read `config/api.md` and the step 2 section of `docs/workflow.md`.

Then, per article in the brief, in this order and no other:

Phase A, every article: capture -> inspect every screenshot -> optimise -> content-hash
the filename.

Then STOP once. Stage with `git add -A`, write the commit message, and give the
human one command to run - `git commit -m "..." && git push origin master`. You
cannot commit or push; the project settings deny both, and nothing downstream works
until the images are on `origin`.

Phase B, every article: HEAD each URL for 200 and `image/*` -> build the article
JSON -> POST or PUT to Intercom as a **draft** -> record the ID in
`state/manifest.json`.

Publish is idempotent by article ID: if `state/manifest.json` already holds an
Intercom ID, update instead of creating. Safe to re-run.

Everything lands as `state: "draft"`. Publishing is the human's action, in Intercom.
Never send `state: "published"` - including for an article that is already published,
where a re-run would otherwise silently overwrite live content. If an article needs
re-publishing rather than re-drafting, say so in the report and let the human do it.

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

Never absorb a failure silently. Never add a screenshot the brief did not list.
Never publish an article the brief did not cover.

Finish by updating `state/progress.md` and reporting: which articles are drafts in
Intercom with their IDs, what differed from the brief, what was skipped and why,
anything you were unsure about, flakes seen, and the commit SHA the image URLs are
pinned to.
