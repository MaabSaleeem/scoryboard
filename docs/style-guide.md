# Style guide

Two halves: how an article reads, and how a screenshot is made. The second half is
mechanical - settle it once in the spec rather than deciding it per capture.

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
   illustrates, never before it, and sits *inside* that step's `<li>`. See
   [Numbered steps and their screenshots](#numbered-steps-and-their-screenshots).
5. **What you will see** - the result state, when it is not obvious.
6. **If it does not work** - the two or three real failure modes, each with the fix.
   Take these from the preconditions and gates found in step 1, not from imagination.
7. **Related** - links to sibling articles.

### Numbered steps and their screenshots

One procedure is one `<ol>`. Put each screenshot inside the `<li>` of the step it
illustrates:

```html
<ol>
  <li>Open <strong>Game type</strong>. It starts on Football.
    {{shot:01|The Game type field outlined, showing Football.}}
  </li>
  <li>Choose <strong>Padel</strong>.
    {{shot:02|The Game type list open.}}
  </li>
</ol>
```

Never break the list to place a screenshot between two `<ol>` blocks, and never
carry the count with `start="2"`. **Intercom strips the `start` attribute**, so a
split procedure renders as 1. 2. 1. 2. 1. rather than 1. to 5. Nested images
survive intact - Intercom rewrites each `<li>` into its own paragraph and image
container and keeps the numbering unbroken. Verified against the rendered help
centre on 2026-08-28.

`scripts/build-article.mjs` refuses to build an article that carries `<ol start=`,
or that has two `<ol>` blocks with no heading between them.

Two consequences worth knowing before you write:

- **A list cannot span a heading.** Wanting an `<h2>` mid-procedure means choosing
  between the heading and unbroken numbering. Prefer the numbering, and fold the
  heading's sense into the step text.
- **Restarting at 1 is right when the procedures are genuinely separate.** 12.5 has
  two: adding teams, then giving a team an owner. Two lists, each from 1, one
  heading each.

Prose that belongs to a step - a note, a second screenshot - goes inside the same
`<li>`. Prose that belongs to the article goes outside the list.

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

### Stability

These settings keep a capture stable enough to trust. They are not a demand for
byte-identical output: two runs may differ by a pixel or an antialiased edge, and
that is fine. **Never re-run a spec to compare its screenshots against the last
run's, and never retry a capture hoping for a closer match.** If a screenshot is
wrong, fix the spec. If it is merely different, ship it.

Every one of these is still required:

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

### Actions you can only do once

Accepting an invite, transferring ownership, upgrading to Pro, deleting a team:
the app will not let you do them twice, so a spec that performs one works on the
first run and fails on every run after.

- **Photograph the dialog, do not submit it.** The confirm screen is the article's
  subject; the click is not.
- **Take the "after" state from a second fixture** that is already in that state.
- **A spec that consumes or mutates a fixture puts it back itself** - do not leave
  it to the seed. Other specs photograph the same screens.
- **A `free_pro` article gets two seeded accounts**, one Free and one Pro. Never
  one account flipped between captures: the specs then only work in one order.

Where the app has no undo, the seed provides the reset - delete and recreate the
account, re-issue the invite, set the membership back to Free.

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
