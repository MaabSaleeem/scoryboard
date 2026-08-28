# Style guide

Two halves: how an article reads, and how a screenshot is made. The second half is
mechanical and non-negotiable - it is what keeps the artifacts deterministic.

---

## Voice

Write for someone who is stuck, on their phone, at a pitch, in the rain.

- Short sentences. One idea per sentence. About 20 words maximum.
- Active voice, present tense. "Tap **Create team**", not "the team can be created".
- One instruction per step.
- Second person. "You", not "the user".
- Use the simplest precise word, and use each word with one meaning.
- No filler, no idioms, no jokes, no marketing.
- British English. Football terms as the product uses them: match, fixture, pitch,
  kick-off, leaderboard, tournament.

### Product nouns

Match the app exactly, including case. Leaderboard (not league table - that is the
table *inside* a leaderboard). Team. Tournament. Friend. Team player. Referee.
Free and Pro (capitalised). Owner, Administrator, Player, Fan for roles. Basic, Pro,
Annual for tournament plans.

### Article structure

1. **Title** - as written in `config/articles.yaml`. Do not rewrite titles.
2. **One-line answer.** What this article gets you, in a sentence. A reader who
   only reads this line should know whether to keep going.
3. **Before you start** - only if there is a real precondition (a role, a plan, an
   existing team). Omit the heading when there is none.
4. **Steps** - numbered. One action per step. The screenshot follows the step it
   illustrates, never before it.
5. **What you will see** - the result state, when it is not obvious.
6. **If it does not work** - the two or three real failure modes, each with the fix.
   Take these from the preconditions and gates found in step 1, not from imagination.
7. **Related** - links to sibling articles.

### Free and Pro

Articles flagged `free_pro` show both states. Name the plan in the sentence, not
just in the screenshot: "On Free you will see ...". Never imply Pro costs money -
it is free during beta, a self-serve toggle. Collection 04 holds the canonical
limits table; other articles link to it instead of repeating limits.

### Roles and permissions

Articles flagged `role` state who can do the thing, in the first two lines. Use the
exact role names. If a reader without the role sees a different screen, show that
screen too.

### Money

Articles flagged `money` (collections 16 and 17) describe real payments. State the
currency and who pays the fee. Never invent an amount - screenshot what the app
actually shows in Stripe test mode.

### Do not write

- push notifications - none exist
- other languages or a language switcher - nothing is shipped
- anything about the internal back-office (deferred collection 25)

---

## Screenshot conventions

These settings live in the Playwright config and in each spec. They are not
per-capture judgement calls.

### Viewport and scale

- Desktop: `1440 x 900`, `deviceScaleFactor: 2`.
- Mobile, only for articles that document a mobile-only flow (for example 02.3,
  installing the app): `390 x 844`, `deviceScaleFactor: 2`, `isMobile: true`.
- Never resize mid-spec. One viewport per spec.
- Full-page captures only when the article documents a whole page. Otherwise clip
  to the element under discussion, with enough surrounding chrome to orient the
  reader.

### Determinism

Every one of these is required:

- `animations: 'disabled'` and `caret: 'hide'` on every capture.
- `reducedMotion: 'reduce'` on the context.
- Fixed timezone and locale: `Europe/London`, `en-GB`.
- Freeze the clock where the screen shows a date or a countdown. A match timer, a
  "2 minutes ago", a calendar's today marker will otherwise differ every run.
- Wait for a condition, never for a duration. No bare `waitForTimeout`.
- Dismiss the cookie banner, any in-app promo campaign and any toast before
  capturing. Assert they are gone.
- Fixture data is seeded by the spec with fixed names. No random names, no
  timestamps in fixture names, no faker.
- One capture per state. Never capture the same element twice hoping one comes out.

### Naming

`screenshots/<collection-id>/<article-id>/<nn>-<slug>.<hash8>.png`

- `<nn>` - two digits, the order the article shows them in.
- `<slug>` - kebab-case, describes the state, not the action:
  `team-settings-roles-open`, not `click-roles`.
- `<hash8>` - first 8 hex characters of the file's SHA-256. A changed image gets a
  new filename and therefore a new URL, so a cached copy can never stand in for it.
- Dual capture appends the plan: `04-limit-modal-free.<hash>.png` and
  `04-limit-modal-pro.<hash>.png`.

### Masking dynamic data

Mask with Playwright's `mask` option, which paints a solid block. Mask:

- the signed-in user's avatar and full name in the header
- absolute dates and times that are not the point of the screenshot
- unread counts and notification badges
- IDs, share codes, invite codes, QR codes and access tokens
- anything that identifies a real person or a real venue booking
- Stripe account numbers, last-four digits and payout amounts that are not the
  subject of the article

Do not mask the thing the article is about. If a share code is the subject, seed a
fixed one and show it.

### Annotation overlay

Annotations are drawn by the spec, in the page, before the capture. Never in an
image editor afterwards - a hand-edited image cannot be regenerated.

- One annotation per screenshot. Two only when the step genuinely has two targets.
- A rectangle outline around the target: 3px, `#E5202A`, 4px corner radius, no
  fill.
- A numbered circle only when the article's step numbers must be visible in the
  image: 28px, same red, white text.
- No arrows, no text labels, no blur-and-spotlight, no drop shadows. The prose
  carries the words.
- Never annotate a masked region.

### What must not appear

- browser chrome, URL bar, devtools, OS chrome
- the Playwright test runner
- another persona's data
- a spinner, skeleton or half-rendered chart
- a scrollbar mid-scroll
- an error toast that is not the subject of the article
