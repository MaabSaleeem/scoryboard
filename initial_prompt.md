Scaffold a working directory for a documentation-automation project. Create the
minimum set of files that lets a fresh Claude Code session pick up the work and
follow the same process every time. Do not build the harness itself.

WORKING DIRECTORY
C:\Users\maab\Documents\scoryboard
Already a git repo. Remote: https://github.com/MaabSaleeem/scoryboard (public).
`local/` is gitignored and holds credentials and client source material.
NEVER commit anything from local/. 

WHAT THE PROJECT IS
Build an Intercom help centre for Scoryboard, a football team and tournament
management SaaS. 146 articles across 24 collections.
Every article needs step-by-step screenshots captured from the live staging app
with Playwright, then published to Intercom via its Articles API.

HOW THE AGENT WORKS
Step 1 is autonomous. The agent drives the staging API and the browser however
it needs to understand a flow. Build helpers in lib/ when something is worth reusing; otherwise just
do the work.

Step 2 is supervised. The agent runs the pipeline and reviews the output of each
stage before moving to the next. Inference here is for oversight, not authorship:
spot what went wrong, fix mechanical faults, stop on anything substantive.

The hard requirement is that the artifacts stay deterministic even though a model
is watching the run. The specs are the source of truth. Re-running them against
unchanged UI must produce the same screenshots on Tuesday that it produced on
Monday, so the whole suite can be regenerated when the product changes. The agent
supervises the run; it does not improvise it.

SOURCE MATERIAL IN local/important stuff/
- kb-articles-trimmed.yaml
    The article map: 24 collections, 146 articles, each with flags
    (free_pro / tourn_plan / role / money), a screenshot estimate and a target
    persona. Copy it to config/articles.yaml and track it in git.
- scoryboard-backend- Contractor Access.postman_collection.json
    262 staging endpoints. Distil this into config/api.md (see below).
- api key.txt, token.txt, working curl.txt
    Credentials. Reference only through .env.
- Scoryboard Knowledge Base Map.html
    The client's original 380-article audit. Background reading; articles.yaml
    supersedes it.

ENVIRONMENT
- Staging API: https://staging-sb.api.scoryboard.com
- Staging web app: https://staging-sb.app.scoryboard.com/
- Auth is Firebase. Email/password plus Google and Apple SSO. ID tokens last
  one hour, so the harness mints its own rather than reusing a pasted token.
- Seeding runs through four admin endpoints:
    POST /admins/users                            create a persona
    POST /admins/generate-signin-token            mint a session for any user
    POST /admins/change-user-membership/:id       flip Free <-> Pro
    POST /admins/users/tournament-free-pro/grant  grant Tournament Pro, no Stripe
  Together these mean the agent seeds its own state. No manual account setup.
- Pro membership is FREE during beta — a self-serve toggle with no payment step.
  Only collections 16 and 17 touch real money, through Stripe.
- No push notifications exist. No shipped localisation. Document neither.

IMAGE HOSTING
Screenshots are committed to this public repo under screenshots/ and served to
Intercom from jsDelivr, pinned to a commit SHA:
  https://cdn.jsdelivr.net/gh/MaabSaleeem/scoryboard@<sha>/screenshots/<path>
raw.githubusercontent.com is the fallback; it throttles bursts by IP.
Intercom rehosts images on publish, so these URLs are transitional. The order
still matters: capture -> commit -> push -> HEAD each URL for 200 and image/*
-> publish. A 404 at fetch time becomes a permanently broken article.
Screenshot filenames carry a content hash so a changed image gets a new URL.

THE WORKFLOW — two steps per collection, one human gate

  STEP 1  Produce a Category Brief.
          Read the target collection in config/articles.yaml.
          Seed the personas it needs through the admin API.
          Explore each flow in the live app.
          Generate a replayable Playwright spec per article under specs/.
          Write one file, briefs/<collection-id>.md, containing:
            - the article list, with anything added or dropped and why
            - the personas used and the seed calls that produced them
            - per article: numbered steps, screenshot list, preconditions found
            - which articles need dual Free/Pro capture
            - open questions and anything unreachable

  GATE    The human reads that one markdown file and approves it.
          Nothing publishes before that.

  STEP 2  Execute the approved brief, supervised.
          The agent runs each stage, reads the output, and only then moves on.

          Per article:
            capture -> inspect the screenshots -> optimise -> commit -> push
            -> verify each URL returns 200 and image/*
            -> build the article JSON -> POST to Intercom
            -> record the ID in state/manifest.json

          The agent may fix these on its own and carry on:
            - a capture that came out blank, mid-animation, or obscured by a
              modal, toast or cookie banner
            - a selector that resolved to the wrong element
            - a missing fixture: re-seed and retry
            - a broken or throttled image URL: re-push and re-verify
            - a flaky step: retry, and note the flake

          The agent must stop and ask when it finds:
            - a documented step that no longer matches the app
            - a screenshot the brief called for that cannot be produced
            - an article whose approved content is now wrong
            - anything that would change what the brief said

          Never silently absorb a failure, add screenshots the brief did not
          list, rewrite content beyond what was approved, or publish an article
          the brief did not cover.

          Log every deviation. End the session with a report: what published,
          what differed from the brief, what was skipped and why.

          Idempotent by article ID. Safe to re-run.

One collection per session.

FILES TO CREATE

  CLAUDE.md
    Short — it loads every session, so bloat costs context. Cover: how the agent
    works (autonomous in step 1, supervised in step 2, artifacts deterministic
    throughout); the two steps and the gate; the opening ritual (read
    state/progress.md, then the target collection in config/articles.yaml, then
    config/api.md); what step 2 may fix on its own versus what it must stop and
    ask about; and a short "never" list — never publish without an approved
    brief, never run a destructive flow against unseeded data, never absorb a
    failure silently, never commit local/, never work on a collection other than
    this session's target. Link to docs/workflow.md instead of inlining it.

  docs/workflow.md      the two-step process in full, with the brief template
  docs/style-guide.md   article voice and structure; screenshot conventions —
                        viewport, deviceScaleFactor 2, animations disabled,
                        masking dynamic data, annotation overlay rules

  config/articles.yaml  copied from local/important stuff/kb-articles-trimmed.yaml
  config/api.md         distilled from the Postman collection: every endpoint
                        grouped by resource, with method, path, what it is for,
                        and required body fields. This is what sessions read
                        instead of the 308KB JSON. Accuracy here matters — take
                        the paths from the collection, do not invent any.
  config/personas.yaml  fresh, player, manager_free, manager_pro, organiser,
                        referee — each with the state it must be in and the
                        exact API calls that produce it
  config/intercom.yaml  collection name -> Intercom collection ID, empty to start

  .env.example          SCORYBOARD_API_BASE, SCORYBOARD_ADMIN_API_KEY,
                        INTERCOM_ACCESS_TOKEN, GITHUB_REPO — names only
  package.json          Playwright and whatever step 2 needs

  lib/README.md         one paragraph: shared helpers live here, built as needed,
                        not a fixed interface
  specs/.gitkeep        generated Playwright specs, one per article
  briefs/.gitkeep
  articles/.gitkeep
  screenshots/.gitkeep
  state/manifest.json   empty article-id -> intercom-id map, with a schema comment
  state/progress.md     table of all 24 collections, each marked "not started"

  .claude/commands/kb-brief.md    step 1 for a named collection
  .claude/commands/kb-publish.md  step 2 once a brief is approved

  README.md             replace the placeholder: what this repo is, how to run a
                        session, where credentials live

CONSTRAINTS
- Scaffold only. Do not install dependencies, run Playwright, or call the API.
- Do not invent endpoints. config/api.md comes from the Postman collection.
- Do not commit. Leave everything staged for review.
- Where a fact is genuinely unknown, write a TODO naming the question.

When done, list the files created and any open TODOs in one short summary.