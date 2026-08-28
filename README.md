# Scoryboard help centre

Screenshot capture and Intercom publishing for the Scoryboard help centre: 146
articles across 24 collections, each with step-by-step screenshots captured from
the live staging app with Playwright and published through the Intercom Articles
API.

The work is done by Claude Code sessions, one collection at a time. A session runs
end to end without stopping, and leaves every article in Intercom as a draft. You
review the drafts there, where the screenshots are rendered, and publish the ones
you are happy with. The screenshots are regenerable: the Playwright specs are the
source of truth, so when the product changes the affected specs are re-run rather
than re-shot by hand.

## How to run a session

One command, one collection:

```bash
claude
```

Then, inside the session:

- `/kb-brief 07` - the whole collection. Claude seeds personas, explores the flows,
  writes a Playwright spec and a brief per article, then captures, commits, pushes,
  verifies every image URL, and drafts each article into Intercom. No stop in the
  middle.
- **You review the drafts in Intercom** and publish what you are happy with. That
  click is the approval; nothing goes live without it.
- `/kb-publish 07` - step 2 on its own, to resume a run that died or to re-capture
  after the product changes. Safe to re-run.

`briefs/07.md` exists for Claude, not for you - it is the plan and the memory that
survives a long run. You never have to open it. Everything you need is in the
end-of-session report in [state/progress.md](state/progress.md).

Start by reading [state/progress.md](state/progress.md) to see where the project
is. The full process is in [docs/workflow.md](docs/workflow.md); the house style
and screenshot rules are in [docs/style-guide.md](docs/style-guide.md).

## Layout

| Path | What |
|---|---|
| `CLAUDE.md` | Loaded every session: how the agent works, and the never-list |
| `docs/` | The process in full, and the style guide |
| `config/articles.yaml` | The article map: 24 collections, 154 articles, flags, shot estimates, personas |
| `config/api.md` | Every staging endpoint, grouped by resource. Read this, not the Postman JSON |
| `config/personas.yaml` | The six seeded accounts and the calls that produce them |
| `config/intercom.yaml` | Collection name to Intercom collection ID |
| `lib/` | Shared helpers, built as needed |
| `scripts/` | One-off bootstraps, e.g. creating the Intercom collections |
| `specs/` | Generated Playwright specs, one per article |
| `briefs/` | One Category Brief per collection - the plan Claude executes against |
| `articles/` | Article JSON as sent to Intercom |
| `screenshots/` | Committed captures, served to Intercom from jsDelivr |
| `state/progress.md` | Status of all 24 collections, plus the session log |
| `state/manifest.json` | article id to Intercom article id, for idempotent re-publish |

## Credentials

Nothing secret is in this repo. It is public.

- `local/` is gitignored and holds the client's source material and the
  credentials. **Never commit anything from it.**
- Copy `.env.example` to `.env` and fill it from `local/important stuff/`.
  `.env` is gitignored.
- Firebase ID tokens are minted per session through the admin API. Never paste a
  token into a file.

## Image hosting

Screenshots are committed here and served to Intercom from jsDelivr, pinned to a
commit SHA:

```
https://cdn.jsdelivr.net/gh/MaabSaleeem/scoryboard@<sha>/screenshots/<path>
```

`raw.githubusercontent.com` is the fallback; it throttles bursts by IP. Intercom
rehosts images on publish, so these URLs are transitional - but they must resolve
at publish time. A 404 at fetch time becomes a permanently broken article, which
is why step 2 pushes and verifies before it publishes. Filenames carry a content
hash, so a changed image always gets a new URL.

## Setup

```bash
npm install && npx playwright install chromium
```

Nothing is installed yet - this repo is scaffolded but the harness is not built.
