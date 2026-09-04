# Scoryboard staging API

Distilled from `local/important stuff/scoryboard-backend- Contractor Access.postman_collection.json`
(Postman collection "scoryboard-backend- Contractor Access", 218 requests).
Read this instead of the 308KB JSON. Every path here is copied from the collection.
Nothing is invented. Gaps are listed under [Not in the collection](#not-in-the-collection).

## Conventions

- Base URL: `https://staging-sb.api.scoryboard.com` (`$SCORYBOARD_API_BASE`).
  The collection writes it as `{{baseUrl}}`.
- Request bodies are always wrapped: `{"data": { ... }}`. Responses are wrapped too.
- `Content-Type: application/json` unless the row says multipart.
- Two auth schemes:
  - **User** - `Authorization: Bearer <firebase-id-token>`. The Firebase project on
    staging is `scoryboard-staging`. ID tokens expire after one hour; mint a fresh
    one per session (see [Session minting](#session-minting)).
  - **Admin** - `X-API-KEY: $SCORYBOARD_ADMIN_API_KEY`. Used by everything under
    `/admins/*`, all of `/bookings/*`, ~~`/matches/:id/facts`~~, `/padellevels/*`,
    `/marketings/*` and `/tournaments/create/centernet`. 36 endpoints in total.
    No user token needed.
    **(observed in app, 2026-08-31)** `/matches/:id/facts` is in that list because
    the Postman collection sends the admin key with it. It does not need one: the
    web app calls it with the signed-in user's bearer token on every match page.
- Pagination: `?skip=<n>&limit=<n>` on list endpoints.
- Images are versioned: `GET .../avatar?v=<version>` and `.../banner?v=<version>`.
  The version comes back on the parent entity. Omitting `v` may serve a cached image.
- Image upload is **two-phase**: POST the file to the upload endpoint, get a token
  back, then PUT the parent entity with `avatarToken` / `bannerToken` /
  `mediaTokens`. Some resources also accept a direct upload on the entity itself.
- Path params appear as either `{{teamId}}` or `:teamId` in the collection. Both are
  plain path segments; the difference is not meaningful.

## Session minting

Do not paste tokens. Mint them:

1. `POST /admins/users` - create the user (skips email verification).
2. `POST /admins/generate-signin-token` with `{"data":{"email":"..."}}`.

   **(observed in app, 2026-08-28)** It does not return a bare custom token. It
   returns a sign-in **URL**:

   ```
   {"status":"OK","data":"https://staging-sb.app.scoryboard.com/signin?token=<outer JWT>"}
   ```

   The outer JWT is HS256 and its payload carries the real Firebase custom token:

   ```
   {"customLoginToken":"<firebase custom token>","iat":...}
   ```

   Two ways to use it. For API seeding, base64url-decode the outer JWT payload and
   exchange `customLoginToken` at the Identity Toolkit (step 3). For browser
   capture, just navigate to the URL - the app signs itself in. `lib/api.mjs`
   does both (`mintSession`, `signinUrl`).
3. Exchange the custom token for an ID token through the Firebase Identity Toolkit,
   then send the `idToken` as `Authorization: Bearer`:

```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=$FIREBASE_WEB_API_KEY
Content-Type: application/json

{"token": "<custom-token>", "returnSecureToken": true}
```

The response carries `idToken` (valid one hour), `refreshToken` and `expiresIn`.
The Firebase web config for staging is `projectId: scoryboard-staging`,
`authDomain: scoryboard-staging.firebaseapp.com`. Its `apiKey` is in `.env` as
`FIREBASE_WEB_API_KEY`. That key is public by design - it ships in the web app
bundle - but read it from `.env`, never hardcode it in a spec.

A collection can take longer than an hour. Refresh rather than assume: keep the
`refreshToken` and exchange it at
`https://securetoken.googleapis.com/v1/token?key=$FIREBASE_WEB_API_KEY` with
`grant_type=refresh_token`, or simply mint a new signin token.

For pure UI capture there is a second route that needs no key: sign the persona in
through the app's own Firebase instance in the page, and let the app hold the
session. Use the REST exchange when you are seeding fixtures over the API, which is
most of step 1.

---

## Users

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/users` | Create the DB user after Firebase signup | `name`, `lastName`, `email`; optional `gender`, `dateOfBirth`, `position`, `sports[]`, `bio`, `avatarToken`, `defaultProfile` (`Player` or `Referee`), `isMarketingOpted`, `gclid`/`gbraid`/`wbraid`, `utm_*` |
| GET | `/users/me` | Current user, membership, flags | - |
| PUT | `/users/:userId` | Update own details | `name`, `lastName`, `gender`, `dateOfBirth`, `sports`, `position`; optional `bio`, `isMarketingOpted`, `avatarToken`, `bannerToken`. A 10-year minimum-age rule applies to `dateOfBirth`. **(observed in app, 2026-08-29)** It is a full REPLACE, not a patch - see below |
| DELETE | `/users/:userId` | Delete own account | - |
| POST | `/users/reset-password` | Send a password-reset email | `email` |
| POST | `/users/subscription` | Self-serve Free / Pro toggle | `membership`: `Free` or `Pro`. Pro is free during beta, no payment step. **(observed in app, 2026-08-29)** Both directions are one call from `/subscriptions` and **neither is confirmed**: "Upgrade to PRO" upgrades on the click and opens a Congratulations window, "Cancel subscription" downgrades on the click and says nothing. See [Membership, plans and the Free-plan limits](#membership-plans-and-the-free-plan-limits) |
| GET | `/users/banner/invite` | State of the "invite your team mates" banner | - |

**(observed in app, 2026-08-29)** `PUT /users/:userId` replaces rather than
patches, and it does not do it evenly:

- the required fields are **kept** when the body leaves them out - a body of only
  `{"avatarToken": "..."}` does not clear `gender` or `dateOfBirth`;
- the optional ones are **cleared** - the same body sets `bio` to `""`.

Sending only part of the profile also answers `400` on some paths: a body of
`{"avatarToken"}` alone was accepted, but `{"bio"}` alone answered
`"name is required", "lastName is required", "gender is required"`. Send the whole
profile every time.

**This is a live defect a reader will hit.** Changing your profile photo from
Profile settings deletes your bio. The page saves a new photo with
`PUT /users/:userId {"avatarToken": "..."}` and nothing else, so the bio is
cleared as a side effect. Isolated on staging 2026-08-29 by reading the bio, doing
nothing but choosing a photo and selecting Apply, and reading the bio again. The
banner behaves the same way. Article 02.5 warns about it and puts the bio step
last for that reason.

### Email verification

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/users/verify-email/request` | Send the first verification OTP | - |
| POST | `/users/verify-email/resend` | Resend the OTP | - |
| POST | `/users/verify-email` | Submit the OTP | `otp` |

**(observed in app, 2026-08-28)** The code is six digits and arrives by email, from
`noreply@scoryboard.com`, subject "Your ScoryBoard verification code". Nothing
returns it over the API, so a script that needs it has to read the inbox -
`lib/mail.mjs` does. `/users/verify-email/request` is fired by the app itself at
the end of the Personal information step, not by the code screen.

### Signing up - what the app actually calls

**(observed in app, 2026-08-28.)** Creating an account is three calls across two
systems, and the Scoryboard user does not exist until the second one.

| Step | Screen | Call |
|---|---|---|
| 1 | `/signup` | `POST identitytoolkit accounts:signUp` with `email`, `password`, `returnSecureToken`. Creates the **Firebase** user only |
| 2 | `/personalInfo` | `POST /users` with `name`, `lastName`, `email`, `gender`, `sports[]`, `position`, `isMarketingOpted`. Creates the **Scoryboard** user, its player, and two teams |
| 3 | `/personalInfo` | `POST /users/verify-email/request`, fired straight after step 2 when Firebase says the address is unverified |
| 4 | `/email-verification` | `POST /users/verify-email` with the six-digit `otp` |

Consequences worth knowing before seeding anything:

- **Between steps 1 and 2 the account has no Scoryboard row.**
  `POST /admins/generate-signin-token` answers `404 "User not found or unable to
  generate token"` for it, so `mintSession` cannot reach it and
  `DELETE /admins/user-delete/:id` has no id to take. Delete it through Firebase
  instead: `accounts:signInWithPassword` then `accounts:delete`. `lib/api.mjs`
  does both in `deleteAccount()`.
- **`POST /users` creates two teams**, named from the account: `Fresh K FC` and
  `Fresh K FC Away` for Fresh KB. A brand-new account is therefore never
  team-less.
- **`POST /admins/users` is not the same account.** It also creates
  `<Name>'s leaderboard`, and a Free account may hold exactly one leaderboard -
  so an admin-created account can never reach the create-leaderboard form. It
  also leaves `gender`, `sports` and `position` empty, which a real signup always
  fills in.
- **`DELETE /admins/user-delete/:id` removes the Firebase user too.** It answers
  `"User account deleted successfully and email anonymized"`, the password stops
  working, and the address on any team-player row the account left behind is
  rewritten to `<id>@scoryboard.com`.
- **`POST /users/reset-password` answers 200 for an address with no Firebase
  user, and sends nothing.** A person invited to a team by email is in exactly
  that state: they have a player row, not an account. The app still shows them
  "Check Your Email". Confirmed by watching the inbox - the invitation arrived,
  the reset never did.

### Onboarding routes, and the guard that orders them

**(observed in app, 2026-08-28.)** Read out of the app's own route enum and its
auth guard, then walked end to end.

| Route | Screen | Reachable when |
|---|---|---|
| `/signup` | Create your account | signed out |
| `/signin` | Sign in to Scoryboard | signed out. `?token=<jwt>` pre-fills the address - that is what a team invitation link opens |
| `/personalInfo` | **Step 1** Personal information | Firebase user exists and `playerId` does **not**. Once `POST /users` has run, the guard sends you to `/email-verification` and you can never see this screen again |
| `/email-verification` | the six-digit code | `isEmailVerified === false`. Once verified, the guard sends you on to `/createLeaderboard` |
| `/padel-level` | Padel self-rating | `sports` includes Padel and `rating7` is null. `?padelSkip=true` skips it |
| `/createLeaderboard` | Create Leaderboard | any time. `POST /leaderboards`, then pushes `/setupYourTeam` |
| `/setupYourTeam` | **Step 3** Set up your team | any time. Join -> `/team/join`, Setup -> `/match/create`, Skip -> `/` |
| `/selectClubLocation` | **Step 4** Select Club Location | any time by URL, but **nothing navigates to it** - the route name appears once in the bundle, in the enum that defines it |
| `/checkEmail`, `/resetPassword` | the password-reset pair | signed out or in; both are on the guard's allow-list |
| `/passwordUpdated` | "Password updated!" | never seen: `Reset Password` signs you in and lands on `/` |

The wizard's step labels are `Step 1`, `Step 3` and `Step 4` on screen. There is
no screen labelled Step 2, and the message catalogue defines `step1` to `step6`.

### Firebase auth messages the app shows

**(observed in app, 2026-08-28.)** Read off the bundle's error map and confirmed
on screen. Worth having written down because the first two are the same message:

| What the reader did | On screen |
|---|---|
| wrong password | `The credential is invalid or has expired.` |
| address with no account, or a deleted one | `The credential is invalid or has expired.` |
| address that is not an address | `Email must be valid.` (client-side, before Firebase) |
| signed up with an address already in use | `This email is already in use. Please use a different one.` |
| signed up with a password under six characters | `Password must be at least 6 characters` (client-side) |
| account disabled in Firebase | `This user account has been disabled.` - no endpoint reaches this state, so it cannot be produced on staging |

## Friends

| Method | Path | For | Body / notes |
|---|---|---|---|
| GET | `/friends` | List friends | - |
| POST | `/friends` | Add a friend | `name`; optional `email`, `playerId` |
| PUT | `/friends/:id` | Edit a friend, or merge into an existing player | `name`; optional `email`, `playerId`, `isReplaceAllow` (merge when the email clashes) |
| DELETE | `/friends/:id` | Remove a friend | - |
| GET | `/friends/invite-code` | Your global friend invite code | - |
| GET | `/friends/:id/shareCode` | Share code for one friend record | - |
| POST | `/friends/join/:shareCode` | Claim your own friend record from a code | - |

~~**(observed in app, 2026-08-29)** `GET /friends` excludes a friend who has
joined one of your teams, and the Free limit of 14 is measured against that same
filtered list.~~ **CORRECTED 2026-08-30 by collection 05 - see the next
paragraph.** `GET /friends` does not filter by team membership at all: a friend
added to one of your teams stays in the list, and so does a person added to a
team by name, whose friend record the team add creates. Isolated three ways -
adding an existing friend to a team by `playerId`, adding a new person by `name`,
and re-reading the list immediately, after four seconds and after nineteen. The
count never moved. What made the list drop by one in 2026-08-29's test is below,
and it was not the successful add.

**(observed in app, 2026-08-30)** **A refused `POST /team-players` on the Free
plan DELETES the friend.** On Free a friend may belong to one of your teams only.
Asking for a second answers
`400 {"errorCode":"ONE_FRIEND_PER_TEAM","reason":"On free plan, each friend can
only be added to one team."}` - and on the way out the server **soft-deletes the
friend record**. The person disappears from `GET /friends` while their team-player
row stays live on the team they were already on.

- Reproduced from the API and through the app. From the app it is worse, because
  the friends list is where the **Add To Team** button lives: the reader selects
  it on a row, gets a **Team Limit Reached** modal, closes it, and the row they
  started from is gone.
- The deletion is **soft**. `POST /friends {"playerId": <friendPlayerId>}`
  revives the SAME record id, and a revived record keeps its place in the list.
  Nothing in the app can do this - a reader can only type the name again, which
  makes a NEW placeholder player while the old one stays on the team.
- The **Add Player To Team** dialog hides any team the player is already on, so
  the only way to reach the refusal from the friends list is a friend who is on
  one team and an account that owns two. That is the fixture collection 05 seeds.
- This also settles collection 04's open question 1, which recorded
  `ONE_FRIEND_PER_TEAM` as apparently unreachable through the UI. It is
  reachable, from the friends list. `briefs/04.md` says 04.3 should get a ninth
  capture if a path is found; this is the path.

**Worth a ticket.** A refusal should not delete data.

**(observed in app, 2026-08-30)** **A friend row linked to a real account is
read-only.** Where a friend record's `isRegistered` is true:

- the row menu's **Edit** item is `aria-disabled="true"`; **Remove** is not;
- `GET /friends/:id/shareCode` answers
  `400 "Cannot generate share code for a friend who is already registered."`;
- the row's **Chat** button is enabled, and goes to
  `/chat?conversationId=direct_<uid>_<uid>`. On a placeholder it is `disabled`.

**(observed in app, 2026-08-30)** **`POST` and `PUT` treat a clashing email
differently.** `POST /friends` with an address that already belongs to a player
links the new record to that player silently - `friendPlayerId` comes back as
their playerId and the row carries their real name. `PUT /friends/:id` with the
same address answers `400 "A player with this email already exists."`, and the
app turns that into an **Email Already Exists** prompt whose Yes re-sends the
call with `isReplaceAllow: true`. The merge replaces the record's player, and
**the name you typed is discarded** - the row takes the account's own name.

**(observed in app, 2026-08-30)** **The two invitation links, and what they do.**

| Where | Code from | Link | Effect when accepted |
|---|---|---|---|
| Add Friend -> Generate invitation link | `GET /friends/invite-code` | `<app>/friendList?shareCode=<code>&playerId=<yours>` | adds the opener to your list as a NEW row |
| A friend row -> Edit -> Generate invitation link | `GET /friends/:id/shareCode` | the same shape | the opener TAKES OVER that record - it keeps its id and gains their name |

Both open the same **Friend List Invitation** dialog and the screen does not say
which is which. Both codes are stable: the same account and the same record
answer with the same code on every call. Accepting posts
`POST /friends/join/:shareCode`.

**Friendship is one-way.** The person who accepts is added to the inviter's list.
Nothing is added to theirs - checked on both accounts after a claim.

**A signed-out visitor loses the code.** Opening either link while signed out
lands on `/signin` with no query string, so signing in from there does not resume
the invitation. Sign in first, then open the link.

**(observed in app, 2026-08-30)** **A malformed email stops the Add Friend form
with no message.** Selecting **Add Friend** with `not-an-email` or `eve@` in the
email field sends no request and renders no error. The empty-name case does
render one - "This field is required." Duplicate names are accepted: two friends
may carry the same name and the list shows two identical rows.

A friend row carries two ids and they are not interchangeable:

| Field | What it is | Used by |
|---|---|---|
| `id` | the friend record | `PUT /friends/:id`, `DELETE /friends/:id` |
| `friendPlayerId` | the player behind it | `POST /team-players {"playerId": ...}`, `POST /friends {"playerId": ...}` to revive a deleted row |


## Teams

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/teams` | Create a team | `name`, `teamSize`, `defaultFormation.formation`; optional `bio`, `isPrivate`, `isSystem`, `avatarToken` |
| GET | `/teams` | Teams you manage (the match-creation list) | - |
| GET | `/teams?all=true` | Teams you are part of | also accepts `name` |
| GET | `/teams?name=<term>` | Global team search, used to pick an opponent | - |
| GET | `/teams/:teamId` | One team | - |
| PUT | `/teams/:teamId` | Update a team | `name`, `bio`, `avatarToken`, `bannerToken` |
| DELETE | `/teams/:teamId` | Delete a team | - |
| POST | `/teams/:teamId/claim` | Claim an unowned or dummy team | - |
| GET | `/teams/:teamId/players?includeFans=true` | Team members. Fans are excluded unless the flag is set. **(observed 2026-08-28)** It also returns removed members, flagged `isDeleted: true` - filter them or a seed script will keep re-deleting rows the API then answers `500 "not found or already deleted"` for | - |
| GET | `/teams/:teamId/matches` | Team fixtures | `limit`, `skip`, `scheduleType`, `includeIncomplete`, `startDate`, `endDate` |
| GET | `/teams/:teamId/shareCode` | The team join code | - |

**(observed in app, 2026-08-29)** Three things about `POST /teams` that the row
above does not say, all read off the Add Team dialog's own form and confirmed on
the wire.

- **The two checkboxes are named the opposite way round from their fields.**
  "Create a Dummy team" carries `id="isPrivate"` and sends `isPrivate: true`.
  "I don't want to own this team" carries `id="isSystem"` and sends
  `isSystem: true`. Do not infer either from the field name.
- **A dummy team (`isPrivate`) is in its owner's list and nobody else's.** Any
  other account opening `/teams/:id` gets a full-page "DUMMY TEAM - This team is
  dummy, and you don't have permission to view it." The app's own tooltip says it
  "is not searchable and you cannot invite real players ... use [it] to set up a
  match where you need an unranked opposing team", and `GET /teams?name=` does
  not return it.
- **An unowned team (`isSystem`) is in NO team list at all**, not even its
  creator's, so `GET /teams?all=true` cannot find it. `GET /teams?name=` can, and
  that is the only handle on one. Its page is headed **Unclaimed Team** and
  carries a **Claim Team** button. `POST /teams/:teamId/claim` turns it into an
  ordinary owned team and answers with a "Congratulations! You now own this team."
  success dialog in the UI.

**(observed in app, 2026-08-29)** `DELETE /teams/:teamId` is the Owner's alone.
An Administrator on the team gets `403 {"reason":"user does not have permission",
"permission":"Only team Owner can delete team"}`. The Edit Team page still renders
its DELETE TEAM section for an Administrator, with the button **disabled**, so the
UI and the API agree.

**(observed in app, 2026-08-29)** **There is no way to transfer ownership of a
team.** The role list the app offers is exactly
`[{label:"Player",value:"Player"},{label:"Administrator",value:"Administrator"}]`,
there is no Owner option anywhere, and the bundle holds no transfer mutation - its
team mutations are create, update, delete, claim, add/remove/update player,
remove-and-block, bulk invite, invite and join. A team changes hands only by being
created unowned and then claimed.

### Team appearance - the crest and the banner are both two calls

**(observed in app, 2026-08-29)** `POST /teams/:teamId/banner` does NOT store the
banner. It answers with a **token**, exactly as `POST /teams/avatar` does, and the
token has to be saved with `PUT /teams/:teamId {"bannerToken": "..."}`. Until it
is, the team object carries no `bannerVersion` and `GET /teams/:teamId/banner?v=`
answers 404. The table above described this endpoint as uploading "onto the team";
it does not.

`avatarVersion` and `bannerVersion` appear on the team object only once each image
exists, so their absence is the way to tell. The `v` query parameter is
**required** on both GET endpoints - omitting it is
`400 SCHEMA_VALIDATION_ERROR {"field":"v","message":"Required"}`, not a cache miss.

### Team stats and leaderboards

| Method | Path | For |
|---|---|---|
| GET | `/teams/:teamId/stats` | Team statistics |
| GET | `/teams/:teamId/top/players` | Top players in the team |
| GET | `/teams/:teamId/players/stats` | Per-player stats (`skip`, `limit`) |
| GET | `/teams/:teamId/leaderboards` | Leaderboards the team is in |
| GET | `/teams/:teamId/leaderboards/rank` | The team's rank in each |
| GET | `/teams/:teamId/leaderboards/available` | Leaderboards the team could join |
| POST | `/teams/:teamId/leaderboards/:leaderboardId` | Add the team to a leaderboard |
| DELETE | `/teams/:teamId/leaderboards/:leaderboardId` | Remove the team from a leaderboard |

### Team followers

| Method | Path | For |
|---|---|---|
| POST | `/teams/:teamId/follow` | Follow |
| DELETE | `/teams/:teamId/follow` | Unfollow |
| GET | `/teams/:teamId/follow` | Am I following this team |
| GET | `/teams/:teamId/followers` | Follower list (`limit`, `skip`) |

### Team crest and banner

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/teams/avatar` | Upload a crest, returns `avatarToken` | multipart, field `avatar` |
| GET | `/teams/:teamId/avatar?v=` | Fetch the crest | - |
| DELETE | `/teams/:teamId/avatar` | Remove the crest | - |
| POST | `/teams/:teamId/banner` | Upload a banner onto the team | multipart, field `banner` |
| GET | `/teams/:teamId/banner?v=` | Fetch the banner | - |
| DELETE | `/teams/:teamId/banner` | Remove the banner | - |

## Team players, roles and invitations

Roles: `Owner`, `Administrator`, `Player`, `Fan`.

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/team-players` | Add a player to a team | `teamId`, `name`; optional `email`, `playerId`, `role`. **(observed in app, 2026-08-29)** On the Free plan a friend may belong to exactly ONE of your teams: a second team answers `400 ONE_FRIEND_PER_TEAM`, "On free plan, each friend can only be added to one team" |
| PUT | `/team-players/:teamPlayerId` | Change a member's name, email or role | `teamId`, `name`, `email`, `role`; optional `isReplaceAllowed`, `resendInvite` |
| DELETE | `/team-players/:teamPlayerId?isBlocked=true` | Remove a member, optionally block them | - |
| GET | `/team-players/search` | Search players and teams | `query`, `searchType` (e.g. `referee`), `limit`, `skip`. **(observed in app, 2026-08-29)** The header search box sends `searchType=all&limit=20&skip=0` and gets back players, teams **and leaderboards** in one list. Fewer than three characters is refused client-side - "Please enter at least 3 characters" |
| POST | `/team-players/bulk-invite` | Invite many members by email | `invites[]` of `{teamPlayerId, email}` |
| POST | `/team-players/invite/:teamPlayerId` | Make an invite link for a member with no email | returns a `teamInvitationId` |
| POST | `/team-players/join-via-invite/:teamInvitationId` | Join from that link | - |
| POST | `/team-players/join/:shareCode` | Join using the team share code | - |
| GET | `/team-invitations` | Invitations addressed to me | - |
| POST | `/team-invitations/accept` | Accept one or many | `teamInvitationIds[]` |

**(observed in app, 2026-08-29)** What removing and blocking actually do, isolated
on staging with two accounts removed from the same team, one with the flag and one
without.

- **Neither is confirmed.** The member menu on the Edit Team page offers *Edit*,
  *Remove from team* and *Remove & Block*, and both removals fire on the click.
  There is no "are you sure" dialog for either.
- **A removed row is invisible in the app.** It stays in
  `GET /teams/:id/players` flagged `isDeleted: true` (and `isBlocked: true` where
  the flag was sent), keeping its name, role and email - anonymising the address
  is what deleting the ACCOUNT does, not what removing a member does - but no
  screen in the web app renders it. There is no blocked-members list.
- **The block only stops the person letting themselves back in.**
  `POST /team-players/join/:shareCode` answers `200` for somebody who was removed
  without the flag and `400 {"reason":"You are blocked from joining this team."}`
  for somebody who was removed with it.
- **The owner can still add a blocked person back.** `POST /team-players` with
  their address answers 200, and they are a member again with the block cleared.
- **A removal cannot be undone in place.** Re-adding makes a NEW row; the dead one
  stays. A seed that removes somebody on every run grows a new dead row each time.

**(observed in app, 2026-08-29)** **The Fan role exists in the API and not in the
app.** `POST /team-players` accepts `role: "Fan"` and stores it, and
`GET /teams/:id/players` hides those rows unless `?includeFans=true` is sent -
verified both ways on the same team. But the app's own `TeamRole` enum is
`Owner | Administrator | Player | Admin | Team | Referee | Padel`, with no Fan: the
role dropdown offers only Player and Administrator, nothing in the UI can create a
Fan, and a Fan row renders on the Edit Team page **with no role badge at all**.
Following a team does not create one either - `POST /teams/:teamId/follow` leaves
the member list untouched.

**(observed in app, 2026-08-29)** **`POST /team-players` with a `name` creates a
friend record as a side effect**, so on an account already at the Free friend
limit it answers `400 FRIEND_LIMIT_EXCEEDED` - "Limit reached: Free users can
only add up to 14 friends" - and no team limit is ever reached. To add somebody
who is already a friend, send `playerId` (their `friendPlayerId`) INSTEAD of
`name`: sending both answers `400 SCHEMA_VALIDATION_ERROR`, "You cannot provide
both playerId and name."

**(observed in app, 2026-08-29)** **There is no team-count limit on Free.** A
third team is accepted; the account is born with two.

**(observed in app, 2026-08-29)** On the **Free** plan `POST /team-players` with
`role: "Administrator"` answers
`400 {"errorCode":"TEAM_ADMIN_LIMIT_EXCEEDED","reason":"Free plan users cannot add
team admins. Upgrade to Pro to add admins."}`. The dialog offers Administrator
either way; the refusal arrives on submit, as a **Team Limit Reached** modal
carrying a FREE Upgrade (Beta) button.

**(observed in app, 2026-08-29)** The two "Generate invitation link" buttons make
**different** links.

| Where | Link | Made by |
|---|---|---|
| Add New Player / Invite Player dialog | `<app>/teams/:teamId?shareCode=<code>` | `GET /teams/:teamId/shareCode` |
| A name-only member's own **Invite** button | `<app>/teams/:teamId?inviteCode=<teamInvitationId>` | `POST /team-players/invite/:teamPlayerId` |

The first is the team's standing join code and works for anybody. The second binds
one existing team-player row to whoever opens it.

**(observed in app, 2026-08-29)** **"Select player from friend list" never lists
anybody.** The control on the Add New Player, Invite Player and Edit Player dialogs
opens to "No options available" on an account with 19 friends, on a team none of
them belong to, and with a friend that belongs to no team at all. The other two
paths on the dialog work. Worth a ticket.

**Qualified 2026-08-29 by collection 04.** The same control on an account with
**14** friends lists all fourteen and picking one works. So it is not simply
broken - something about the larger list is. It never offers a friend who is
already on one of your teams, because it reads `GET /friends`, which filters
those out. Both observations stand; the trigger is unknown.

**(observed in app, 2026-08-29)** A member added by email is on the team
immediately - the team is in their `/teams?all=true` straight away - but the
invitation stays pending until `POST /team-invitations/accept`. Signing in with one
outstanding lands the account on **`/team/join`**, "Join a team - Select a team
you're invited to join". With none outstanding that screen reads "You don't have
any pending team invites."

## Leaderboards

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/leaderboards` | Create a leaderboard | `name`; optional `avatarToken` |
| GET | `/leaderboards` | All leaderboards visible to me | - |
| GET | `/leaderboards/:leaderboardId` | One leaderboard | - |
| PUT | `/leaderboards/:leaderboardId` | Rename, set crest or banner | `name`, `avatarToken`, `bannerToken` |
| DELETE | `/leaderboards/:leaderboardId` | Delete | - |
| GET | `/leaderboards/:id/teams` | Teams in the league | - |
| GET | `/leaderboards/:id/teams/search?name=` | Find a team to add | - |
| POST | `/leaderboards/:id/teams` | Add a team | `teamId` |
| DELETE | `/leaderboards/:id/teams/:teamId` | Remove a team | - |
| POST | `/leaderboards/:leaderboardId/admin` | Add an admin | `email` or `playerId`. **(observed in app, 2026-08-29)** On Free it answers `400 LEADERBOARD_ADMIN_LIMIT_EXCEEDED`, "Free plan users cannot add leaderboard admins. Upgrade to Pro to add admins." |
| DELETE | `/leaderboards/:leaderboardId/admin` | Remove an admin | `email` |
| GET | `/leaderboards/:leaderboardId/players` | Players in the league | - |
| GET | `/leaderboards/:leaderboardId/matches` | League fixtures | `limit`, `skip`, `scheduleType`, `teamId`, `includeIncomplete` |
| GET | `/leaderboards/:leaderboardId/stats/teams` | The league table and team stats | - |
| GET | `/leaderboards/:leaderboardId/stats/players` | Player stats | `limit`, `skip`, `teamId` |
| POST | `/leaderboards/avatar` | Upload a crest, returns `avatarToken` | multipart, field `avatar` |
| GET | `/leaderboards/:leaderboardId/avatar?v=` | Fetch the crest | - |
| DELETE | `/leaderboards/:leaderboardId/avatar` | Remove the crest | - |
| POST | `/leaderboards/:leaderboardId/banner` | Upload a banner | multipart, field `banner` |
| GET | `/leaderboards/:leaderboardId/banner?v=` | Fetch the banner | - |
| DELETE | `/leaderboards/:leaderboardId/banner` | Remove the banner | - |

**(observed in app, not in collection, 2026-08-31)** Two more paths the board page
calls. Collection 08 found them on the wire.

| Method | Path | For |
|---|---|---|
| GET | `/profile-view/leaderboard/:leaderboardId/viewers` | `{viewCount, viewers[{viewedAt, userId, playerId, name, avatarVersion}]}` - this is what fills the **Views** tile in the board header |
| GET | `/profile-view/leaderboard/:leaderboardId/count` | `{viewCount}` only |

`GET /promo-campaigns/active?screen=Leaderboard` is also fired on every board page
load, so a campaign banner can appear over anything this collection photographs.

### What the leaderboard read endpoints actually answer

**(observed in app, 2026-08-31.)** Read off staging against a three-team league
with four played matches.

- `GET /leaderboards/:id/stats/teams` is the league table. Its fields are
  `rank`, `isRanked`, `teamId`, `teamName`, `teamSize`, `teamMembers`,
  `totalMatches`, `totalWins`, `totalLosses`, `goalScored`, `winStreak`,
  `cleanSheets`, `totalYellowCards`, `totalRedCards`. **There is no draws column,
  no goals-conceded column and no points column.** A drawn match shows up only as
  the gap between `totalMatches` and `totalWins + totalLosses`. The screen mirrors
  that: its columns are Rank, Teams, Members, Matches, Goals, Win/Loss.
- `GET /leaderboards/:id/stats/players` is the player grid: `rank`, `playerName`,
  `playerPosition`, `goals`, `assists`, `totalMatches`, `totalWins`,
  `totalYellowCards`, `totalRedCards`, `teams[]`, `isRegistered`. A friend added
  by name only comes back with the whole name in `playerName` and
  `playerLastName: null`.
- `GET /leaderboards/:id/teams` nests differently from everything else:
  `[{leaderboardTeamId, team{id, name, isSystem, teamSize}, stats{...}}]`.
- `GET /leaderboards/:id/teams/search?name=` searches **every team on the
  platform**, not just yours, and excludes the ones already in the leaderboard.
  `name=KB` returned 19 rows from four different collections; an empty `name`
  returned 853. The Add Team window on the settings screen only looks narrow
  because it lists your own addable teams until you type.

### Leaderboard roles, and what a non-member cannot read

**(observed in app, 2026-08-31.)** `GET /leaderboards/:id` answers `isOwner`,
`isAdmin` and `isMember`. Owner and Administrator both read `isMember: true`;
everybody else reads all three false, and then:

| Path | Owner / Administrator | Anybody else |
|---|---|---|
| `GET /leaderboards/:id` | 200 | 200 |
| `GET /leaderboards/:id/stats/teams` | 200 | **200** |
| `GET /leaderboards/:id/stats/players` | 200 | **200** |
| `GET /leaderboards/:id/matches` | 200 | **200** |
| `GET /comments?commentType=leaderboard` | 200 | **200** |
| `GET /leaderboards/:id/teams` | 200 | **403** |
| `GET /leaderboards/:id/players` | 200 | **403** |
| `POST /comments` on the leaderboard | 200 | **403** `"Only leaderboard members can comment on or like leaderboard content"` |

So the league table, the player grid and the fixture list are readable by anyone
signed in; the team list and the player list are not.

In the UI the same split shows as: no **Create Match**, no **Payment** tab and no
**Views** tile. `/leaderboards/:id/settings` does not render at all for a
non-owner - it fails to its error boundary, **"This page couldn't load / Reload to
try again, or go back"**, with no API call and no Access-denied screen.

The **External** badge on a team row is a separate thing and is easy to misread.
It does not mark a role: it marks a team that is not one of **your own**. The
Owner of a leaderboard holding their own teams sees no badge at all; an
Administrator looking at somebody else's teams sees one on every row, on both the
settings screen and the Team Stats table.

**It also appears on the owner's OWN teams, and stays there, until the account has
opened Manage Teams.** The badge is computed against the `teams` slice of the app's
persisted Redux store, and only `/teams` fills that slice. `/leaderboards` fires
`GET /teams?all=true` as well, but the result never reaches the slice - so an
account that has visited the Leaderboards list and gone straight to a leaderboard
sees every team it owns marked External, indefinitely. Open `/teams` once and the
badges go, and stay gone across a full page load, because the slice is persisted to
`localStorage`.

Collection 08's first capture of the settings screen caught that: all three of the
owner's own teams came out marked External. Its specs now open Manage Teams before
they photograph an owner's view of a leaderboard, and gate on the badge count
being zero. A reader who has used the app normally will have loaded that page; a
reader who signs in and goes straight to a leaderboard will not.

An **Administrator gets the whole settings screen**, Delete Leaderboard included.
The only differences from the Owner's view are that their own admin row carries no
Remove, and the team rows are badged External. In their own Leaderboards list the
board appears badged **Admin** rather than Owner.

`POST /leaderboards/:leaderboardId/admin` with `email` **links the account that
already holds that address** - the id that comes back in `admins[]` is that
account's own `playerId`, and they immediately read the board with
`isAdmin: true`. It still reports `isRegistered: false` on the `adminPlayers` row,
which is wrong; do not read anything into that field.

### The leaderboard style field is read-only

**(observed in app, 2026-08-31.)** `leaderboardSettingsSchema` and
`createLeaderboardSchema` both carry `leaderboardStyle`, and `Leaderboard style *`
is on screen at `/createLeaderboard` and on `/leaderboards/:id/settings`. On both
screens the input is **`disabled`**, pre-filled `Football leaderboard`, with a tick
icon rather than a chevron. There is no way to change it and no second option. The
in-app **Create New Leaderboard** window does not show the field at all - it has
exactly two controls, the logo and the name.

### Creating one on Free never reaches the API

**(observed in app, 2026-08-31.)** With one leaderboard already owned, selecting
**Create New Leaderboard** on Free opens **Leaderboard Limit Reached** - "Free plan
users can create only 1 leaderboard. Delete your current leaderboard or upgrade to
Pro Membership to create another." plus the usual **FREE Upgrade (Beta)** button -
and **no `POST /leaderboards` is sent**. The gate is client-side and fires instead
of the form, so the reader never sees the create window at all. Every account is
born with one leaderboard, so a Free account is at the limit from the moment it
exists.

### Two things that happen with no confirmation

**(observed in app, 2026-08-31.)**

- **Removing a team from a leaderboard is one click.** The **Remove** button on a
  team row in the settings screen fires `DELETE /leaderboards/:id/teams/:teamId`
  straight away. There is no dialog. Adding it back is `POST` with `{teamId}`, so
  it is recoverable - but the statistics the removed team contributed disappear
  from the table while it is out.
- Deleting the leaderboard **is** confirmed, from either entry point - the
  settings screen's DELETE LEADERBOARD section, or **Remove** on the card's kebab
  menu in the list. Both open the same window: **Delete Leaderboard** / "This
  action cannot be undone. This will permanently delete the leaderboard and remove
  all associated data." / Cancel / Delete Leaderboard.

### The "public link" is not public

**(observed in app, 2026-08-31.)** The card's share control opens **Share
Leaderboard**, which offers a read-only `Link` field, a copy button and a QR code,
under the words "People with this link can view your board but can't change it.
This is the link you should share on social media, on your website or elsewhere."
The link is just `<origin>/leaderboards/<id>`, and a **signed-out** visitor who
opens it is redirected to `/signin`. The recipient needs a Scoryboard account. The
QR code's own `<title>` reads "Scan the QR code to view this tournament" on a
leaderboard.

### Comments on a leaderboard

**(observed in app, 2026-08-31.)** Three things collection 08 had to learn the
hard way.

- `GET /comments` returns **top-level comments only**. A reply is invisible to that
  listing - the parent carries a `replyCount` and nothing else - and lives behind
  `GET /comments/:commentId/replies`. A seed that dedupes against the top-level
  list alone will post every reply again on every run.
- `DELETE /comments/:commentId` **exists** and is not in the Postman collection.
  It answers `401 "Unauthorized to delete this comment"` even to the account that
  wrote the comment, so in practice a comment cannot be taken back. The only way
  to clear a thread is to delete the entity it hangs off.
- The composer is a `textarea` with the placeholder `Write your comment...`, beside
  an **Add Media** button and a **Comment** submit.

### A match with no venue is Incomplete, not Scheduled

**(observed in app, 2026-08-31.)** `POST /matches` without `clubLocationId`
answers a match whose status is **`Incomplete`**, and the Matches tab shows it with
a **Finish Setup** button instead of a fixture card. `PUT /matches/:id` with
`{clubLocationId}` turns it `Scheduled`, and the card then reads the venue name and
offers **Match Settings**. A future match can still be edited this way; a match
whose date has passed cannot. Collection 09 owns the article.

**Completed by collection 09, 2026-08-31.** The venue is one of **seven** fields,
not the only one. Isolated by posting a full body and dropping one field at a
time; each of these on its own leaves the match `Incomplete`:

`homeTeam`, `awayTeam`, `leaderboardId`, `clubLocationId`, `date`, `duration`,
`teamSize`.

Two are **not** required: `tag` (it defaults to `friendly`) and the line-ups (a
match with two empty `players[]` arrays goes `Scheduled`).

The `leaderboardId` requirement is the surprising one - **a friendly with no
league still has to be attached to a leaderboard** before the app calls it
Scheduled. And the change is one-way: `PUT {clubLocationId: null}` and
`{leaderboardId: null}` are both refused ("Invalid input"), `{clubLocationId: ""}`
answers "Invalid ObjectId". A Scheduled match can never be pushed back to
Incomplete.

### Leaderboard app routes

**(observed in app, 2026-08-31.)**

| Route | Screen |
|---|---|
| `/leaderboards` | **Your Leaderboards (n)** - the list, with Create New Leaderboard and a per-card share control and kebab menu (Edit, Remove) |
| `/leaderboards/:id` | the board. Team Stats is the bare path |
| `/leaderboards/:id/playerStats` | the Player Stats grid, with a Pro-gated **Compare** |
| `/leaderboards/:id/matches` | Past Matches / Upcoming Matches (`role="tab"`, Upcoming selected by default) and a **Select teams** filter |
| `/leaderboards/:id/payment` | the leaderboard's payment requests - collection 17, not 08 |
| `/leaderboards/:id/settings` | **Edit Leaderboard - &lt;name&gt;**: Profile Appearance, Basic Information, Roles, Teams, Delete Leaderboard |
| `/createLeaderboard` | the onboarding Create Leaderboard step. Continue / Skip, and the only screen that shows the style field |

The board's Comments section is not a route: **Comments** scrolls to a panel that
sits below every tab.

## Comments and likes

One comment API serves every entity. The Postman collection only shows
`leaderboard`.

**(observed in app, 2026-09-02, by collection 19. Closes the TODO that stood
here.)** `commentType` is a five-value enum and the API names it in its own
validation error: `leaderboard | team | match | player | tournament`. All five
are accepted and stored, and the value is case-sensitive - `Leaderboard` is
refused.

**Only two of the five have a screen.** A comment panel is rendered on the
**team** page and the **leaderboard** page and nowhere else. A match page fires
no `/comments` request at all - its FEED is the match event list - a player
profile fires none, and no tournament tab fires one either, organiser board or
public page. So a comment posted with `commentType` `match`, `player` or
`tournament` is invisible to every screen in the web app.

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/comments` | Post a comment or a reply | `entityId`, `commentType`, `comment`; optional `mediaTokens[]`, `parentCommentId`, `tagUserId` |
| GET | `/comments` | Comments on an entity | `entityId`, `commentType`; optional `commentId` |
| GET | `/comments/:commentId/replies` | Replies to a comment | `entityId`, `commentType`, `limit`, `skip` |
| GET | `/comments/stats` | Comment counts for an entity | `entityId`, `commentType` |
| POST | `/comments/media` | Upload an attachment, returns a token | multipart, field `media` |
| GET | `/comments/:commentId/media/:filename` | Fetch an attachment | - |
| POST | `/comments/:commentId/like` | Like | - |
| DELETE | `/comments/:commentId/like` | Unlike | - |
| GET | `/comments/:commentId/like/count` | Like count | - |

Comment edit and delete are not in the collection.

**(observed in app, 2026-09-02, by collection 19.)** Four more things, and the
first two decide what can be written about comments at all.

- **`PUT /comments/:commentId` exists and works.** It takes `comment` and
  answers the updated row. **Nothing in the app calls it.** There is no
  `editComment` mutation anywhere in the bundle, and a comment row carries
  exactly three controls: **Reply**, a thumbs-up with the like count, and a
  speech bubble with the reply count.
- **`DELETE /comments/:commentId` still answers `401 "Unauthorized to delete
  this comment"`**, to the author included - confirmed again on this build. So a
  comment is permanent in the app and permanent over the API. The only way to
  clear a thread is to delete the entity it hangs off, which is why
  `scripts/seed-19.mjs` rebuilds its team and its leaderboard on every run.
- **`POST /comments/:id/like` twice answers `409 "Comment already liked"`.**
  `DELETE` takes it back and the count returns. The thumbs-up icon changes
  shape as well as colour - outline and `text-gray-600` unliked, filled and
  `text-blue-600` liked - so a locator pinned to one SVG path finds the button
  before a like and loses it after.
- **An attachment is not an `<img>`.** `GET /comments/:id/media/:filename`
  needs the bearer token, so the app fetches it itself, makes a `blob:` URL and
  paints it as a CSS `background-image` on a bare div. The composer's file
  input is `accept="image/*"` - images only, no video.

**(observed in app, 2026-09-02, by collection 19.)** **Commenting is
members-only, and the app disables rather than hides.** A non-member sees the
whole panel with the textarea, **Comment**, **Add Media** and every **Reply**
button `disabled`, and no message explaining why. The API agrees:
`403 "Only team members can comment on or like team content"`.

**Leaderboard membership is wider than
[Leaderboard roles](#leaderboard-roles-and-what-a-non-member-cannot-read) says.**
That section records `POST /comments` as 403 for anybody who is not the Owner
or an Administrator. A player on a team that is **in** the leaderboard may
comment too - measured with an account that was neither owner nor admin, only a
squad member of a member team. Collection 08's own article 08.5 already said so;
this reference was the part that was behind.

**Add Media on a comment is NOT Pro-gated.** There are two Add Media buttons in
the bundle and they are different components. The **match feed**'s checks
`membership === Pro` and otherwise opens the upgrade modal - that is the gate
[The two Free gates on the match page](#the-two-free-gates-on-the-match-page)
records. The **comment composer**'s checks nothing, and `POST /comments/media`
answers 200 to a Free account.

See [Not in the collection](#not-in-the-collection).

## Ratings

`entityType`: `match`, `player`, `team`, `referee`. `rating`: 1 to 5.

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/ratings` | Rate an entity | `entityType`, `entityId`, `rating`; optional `comment` |
| PUT | `/ratings/:id` | Change a rating | `entityType`, `entityId`; optional `rating`, `comment` |
| DELETE | `/ratings/:id` | Remove a rating | - |
| GET | `/ratings` | Ratings on an entity | `entityType`, `entityId`, `limit`, `skip` |
| GET | `/ratings/:entityType/:entityId/summary` | Average, count and distribution | - |
| GET | `/ratings/:entityType/:entityId/average` | Average only | - |
| GET | `/ratings/:entityType/:entityId/my-rating` | My rating for it | - |

**(observed in app, 2026-09-02, by collection 19.)**

- **Rating happens in one place: the Rate button on a Finished match.** It opens
  a chooser - **Match**, **Player**, **Team**, **Referee** - and the Referee row
  is `hidden` unless the match carries a referee. A team page and a player page
  show the average and open a read-only review list; neither has a Rate control,
  and there is no referee page at all (`/referee/:id`, `/referees/:id` and
  `/referees` are all Page not found).
- **`POST /ratings` from an account that has already rated that entity replaces
  its rating.** `totalCount` does not move; the distribution does. One rating
  per person per thing, enforced by overwrite rather than refusal.
- **A rating can be changed and removed, and the control is easy to miss.** The
  Rate panel itself offers only **Post**, **Update** and **Close**. What edits and
  deletes is a kebab in the read-only **reviews list**, on **your own** review row
  and no other, carrying **Edit** and **Delete**. It has no accessible name and
  its icon is a plain vertical ellipsis, so it reads as noise in an accessibility
  tree. **Edit** reopens the rating panel in Update mode; **Delete** calls
  `DELETE /ratings/:id` and is not confirmed. The panel's button reads **Post** on
  something you have not rated and **Update** on something you have, with your
  stars lit and your review pre-filled.
- **You cannot rate yourself.** The form is disabled when the subject is your own
  player record, on the Player and Referee targets.
- `averageRating` is rounded to two decimals in the response and to **one** in
  the UI: 4.666... answers `4.67` and the header reads `4.7`. The count's label
  is singular at one - `1 review`, `2 reviews` - and the count is a real
  `<button class="text-blue-400 underline">` that opens the review list.
- `distribution` in the summary response is a five-key histogram **repeated once
  per rating** - three ratings answer an array of three identical objects. It
  looks like a defect in the response shape. **Nothing in the web app renders the
  distribution at all**; the review list is what a reader sees instead.
- **The star row lights on hover.** A capture taken with the pointer resting over
  the row shows a rating nobody chose. Park the pointer before reading or
  photographing an open rating panel.

## Matches

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/matches` | Create a match | `homeTeam{teamId, formation, players[{teamPlayerId, position}]}`, `awayTeam{...}`, `date` (ISO), `duration` (e.g. `"60 min"`); optional `clubLocationId`, `teamSize` (e.g. `"5 VS 5"`), `bookingId`, `tag` (e.g. `friendly`, `league`) |
| PUT | `/matches/:matchId` | Update anything on the match | any of `date`, `clubLocationId`, `leaderboardId`, `duration`, `teamSize`, `homeTeam`, `awayTeam` (lineup and formation), `bannerToken` |
| DELETE | `/matches/:matchId` | ~~Delete a match~~ **Cancel** a match. **(observed in app, 2026-08-31)** It does not delete: it answers `{"message":"Match cancelled successfully"}` and sets `status: "Cancelled"`. The row survives and still answers 200 by id - it simply stops appearing in the calendar, in a team's match lists and in a leaderboard's. It is what the gear menu's **Cancel Match** does, and it is a clean way for a spec to dispose of a match it created. `PUT /matches/:id {"status":"Cancelled"}` does the same and works on an Incomplete match, which `POST /status` refuses | - |
| POST | `/matches/:matchId/status` | Start, pause, finish | `status`: `Scheduled`, `Live`, `Paused`, `Finished`. **(observed in app, 2026-08-31)** There is a sixth status, `Cancelled`, and this endpoint cannot set it - see `DELETE` below. It also refuses everything while a match is `Incomplete`: "Cannot update status of a Incomplete match". A `Cancelled` match *can* be revived with `{"status":"Scheduled"}`, but no control in the web app does that. **(observed in app, 2026-08-29)** A **Finished match is permanent**: this answers "Cannot update status of a Finished match", `PUT` answers "Cannot update match of a Finished match", and `DELETE` answers "Date must be at least one hour ahead of the current time" for any match whose date has passed. A player's statistics survive even the deletion of the team the match was played for. There is no way to undo a played match |
| GET | `/matches/:matchId/Calendar` | Calendar entry (capital C, as in the collection) | - |
| GET | `/matches/:matchId/league` | League table for a league match | - |
| GET | `/matches/:id/facts` | Match facts and insights. ~~admin key~~ **(observed in app, 2026-08-31)** the app calls it with the signed-in **user's** bearer token, on every match page. 200 for a player in the lineup. See [The Facts tab](#the-facts-tab---what-the-two-panels-actually-are) | - |
| GET | `/matches/:matchId/facts-stats` | Detailed fact stats. Called on the same page, same auth | - |
| POST | `/matches/:matchId/banner` | Upload a match banner | multipart, field `banner` |
| GET | `/matches/:matchId/banner?v=` | Fetch the banner | - |
| PUT | `/matches/:matchId` | Save an uploaded banner | `bannerToken` |

**(observed in app, 2026-08-29)** **A match that is not in a leaderboard writes no
statistics at all.** Isolated on staging with two finished matches between the same
two teams and the same line-ups, one carrying `leaderboardId` and one not. The one
without left `GET /teams/:id/stats` answering with no `data` key and every player on
zero; the one with it read `matches: 1, wins: 1, goals: 1` within seconds. Any
collection that photographs team or player statistics has to put its match in a
leaderboard.

`GET /teams/:teamId/stats` answers `data.stats`:
`{goals, conceded, matches, wins, draws, losses, cleanSheets, winStreak, redCards,
yellowCards, playerOfMatch}`. That is a different shape from the PLAYER stats
endpoint, which nests its record under `winLossDraws`.

### Match events

Every event is `POST /matches/:matchId/events` with a `type`:

| `type` | Required | Optional |
|---|---|---|
| `GoalAwarded` | `teamId`, `teamPlayerId` | `teamType`, `assistedTeamPlayerId` |
| `GoalRevoked` | `teamId` | `teamPlayerId`, `teamType`, `assistedTeamPlayerId` |
| `YellowCard` | `teamId`, `teamPlayerId`, `teamType` | - |
| `RedCard` | `teamId`, `teamPlayerId`, `teamType` | - |
| `PlayerOfMatch` | `teamId`, `teamPlayerId`, `teamType` | - |
| commentary | `minute`, `description` | `mediaTokens[]` |

**(observed in app, 2026-08-29)** `teamType` is `HomeTeam` or `AwayTeam`; `home`
and `away` are refused. Events are only accepted while the match is Live or
Paused - anything else answers "Match must be live or paused to add events" - and
a match created with a date in the past **starts itself** a second or two after
`POST /matches` answers. A seed that writes events immediately loses the first
ones, permanently, because the match cannot be reopened. Poll
`GET /matches/:id` for `status === "Live"` first. `scripts/seed-02.mjs` does.

The positions a lineup takes are the app's own enum, not the labels the profile
form shows: `Goalkeeper`, `CenterBack`, `LeftBack`, `RightBack`,
`CentralMidfielder`, `LeftMidfielder`, `RightMidfielder`, `AttackingMidfielder`,
`LeftWinger`, `RightWinger`, `Striker`, and `Substitute-1` to `Substitute-5`.
"Centerback" and "Central Midfielder" are refused.

Player statistics are written **asynchronously** after a match finishes. Reading
`GET /players/:id/stats` a second after posting `Finished` returned all zeroes;
the same call a minute later returned the right numbers.

~~TODO: the collection names the commentary request "comment" but does not show its
`type` value, and there is no request for a penalty.~~ **Answered 2026-09-01 by
collection 10.** Commentary is `type: "Comment"`. There is no penalty request
because an ordinary match has no penalties - they belong to a tournament knockout.
See [Match events - what the app actually sends](#match-events---what-the-app-actually-sends).

| Method | Path | For | Body / notes |
|---|---|---|---|
| PUT | `/matches/:matchId/events/:eventId` | Correct an event | `teamPlayerId`, `teamId`, `teamType`, `description`, `assistedTeamPlayerId` |
| DELETE | `/matches/:matchId/events/:eventId` | Delete an event | - |
| POST | `/matches/:id/events/media` | Upload feed media, returns a token | multipart, field `media` |
| GET | `/matches/:matchEventId/media/:filename` | Fetch feed media | - |

### Match app routes, and what the match page shows whom

**(observed in app, 2026-08-31, by collection 09.)** Recorded by wrapping
`window.fetch` in the page for a whole exploration, and by opening the same match
as four accounts.

| Route | Screen |
|---|---|
| `/matches/:id` | the match page. **`/matches` with no id is Page not found** |
| `/match/:id/preview` | the "public link" the Share window hands out |
| `/schedule` | **Scheduled Matches** - the calendar. Three views: Day (`lucide-list`), Week (`lucide-columns2`), Month (`lucide-grid3x3`, the default and the only one labelled) |
| `/match/create` | in the route enum, **dead**. Create Match posts a match and goes to `/matches/:id` |
| `/match/invite` | in the route enum, **dead**. Renders the match-page shell with empty tabs. Nothing in the bundle navigates to it |
| `/match/congratulations` | in the route enum, never reached |

The heading is the role tell:

| Who | Heading | Header controls | Gear menu | START MATCH |
|---|---|---|---|---|
| Owner | Match Settings | Add to Calendar, Show Tour, gear | Configure appearance / Edit / Cancel Match | yes |
| team Administrator | Match Settings | same | same | yes |
| assigned referee | *(no heading)* | Add to Calendar, Show Tour, **no gear** | **none - there is no gear** | yes. No PAYMENT tab |
| anybody else | **Match Preview (View Only)** | none | none | no |

Two things about that header. **Add to Calendar and Show Tour appear only once the
match is Scheduled** - an Incomplete match has the gear alone, so a half-built
match can still be cancelled from the app. And **none of the three has an id, an
aria-label or a test id**; the only stable handles are `#show-tour-button` (which
is absent while the match is Incomplete) and the `lucide-calendar` icon on the Add
to Calendar button.

**A team the reader does not own renders as a placeholder** until the app has
loaded `/teams` once in that session. Open `/matches/:id` straight from the
address bar as somebody who is not the owner of both sides and the page reads
"Add Away Team", "Not set" for the leaderboard and the referee, and "Location not
set" for the venue - over data `GET /matches/:id` returns perfectly. Going to
`/teams` and back renders every one of them. Proved twice each way with a
plain-Player account. Collection 08 hit the same store slice, where it showed up
as a wrongly applied **External** badge.

**The public link is not public.** A signed-out visitor at `/match/:id/preview`
gets a **Sign In** button, five empty tab labels and grey skeletons that never
resolve - held 20 seconds, no console error. `/matches/:id` signed out redirects
to `/signin`. The Share window meanwhile says "People with this link can view your
board but can't change it. This is the link you should share on social media, on
your website or elsewhere." Second of two: collection 08 found the same class of
defect on a leaderboard's share link.

**Nobody has to be invited to a match.** Every account in either line-up gets a
`MatchInvitation` notification when the match is created - verified, two of them
on a squad member who was sent nothing by hand. The **referee is not notified at
all**.

### Endpoints the collection lacks, observed on the wire

| Method | Path | Where |
|---|---|---|
| POST | `/matches` with body `{"status":"Incomplete"}` | what **Create Match** sends. From a team page it also carries `homeTeam{teamId, formation, players:[]}` and `teamSize` |
| GET | `/players/:playerId/matches?includeIncomplete=true&startDate=&endDate=` | `/schedule` - the calendar's own source, and the only listing that carries Incomplete rows |
| GET | `/teams?name=<query>` | the Add Team window's search box. Teams already on the match are filtered out |
| GET | `/team-players/search?query=&searchType=referee&tournamentSelectionOnly=true&limit=&skip=` | the match **Referee** field. See below |
| GET | `/matches/:id/payment-requests?teamIds=&limit=&skip=` | the match page's PAYMENT panel |
| GET | `/matches/:id/payments?teamIds=&limit=&skip=` | same |
| GET | `/promo-campaigns/active?screen=Match` | every match page load |
| PATCH | `/players/:playerId/referee-settings` | requires `saveForFutureTournaments`; answers 403 "user does not have permission" to anybody but that player |
| PUT | `/users/:id {"isTourCompleted": true}` | **Skip Tour** on the match page's guided tour. A full replace, so it clears the account's `bio` as a side effect - the same defect this file records for the profile photo |

**The match Referee field can only offer referees you have saved.**
`tournamentSelectionOnly=true` narrows the search to your own saved referees, and
the only call that saves one is `POST /tournaments/:id/referee` with
`saveForFutureTournaments: true`. Drop that parameter and the same endpoint
searches every referee on the platform, which is presumably why it is there. So a
football manager with no tournament reads **"No results found"** whatever they
type. `isReferee` lives on the player record and is settable through nothing a
user can reach: `PUT /users/:id {isReferee: true}` is ignored, `defaultProfile:
"Referee"` sets a different field, and the PATCH above is self-only.

`PUT /matches/:id {refereePlayerId}` accepts **any** playerId, referee or not, so
a seed can put somebody on a match that a reader could never choose.

### PUT /matches/:matchId - the fields the collection does not list

**(observed in app, 2026-08-31.)** Beyond `date`, `clubLocationId`,
`leaderboardId`, `duration`, `teamSize`, `homeTeam`, `awayTeam` and `bannerToken`:

| Field | Notes |
|---|---|
| `pitchNumber` | free text. `""` clears it. Only in the gear menu's **Edit** dialog - the inline MATCH DETAILS form has no pitch field |
| `note` | up to 250 characters, with a counter. `""` clears it. Editable both in the Edit dialog and in place on the **FEED** panel (**Add Note** when empty, **Edit** when set, then an **Edit Note** window with **Save**) |
| `refereePlayerId` | any playerId, as above |
| `status` | `"Cancelled"` works here. **(corrected 2026-09-02, by collection 19)** and it is not the only place: `POST /matches/:id/status {"status":"Cancelled"}` answers 200 on a match the server **auto-finished** (`autoFinished: true`), and only on that. On a match finished by an explicit `POST /status` it answers "Cannot update status of a Finished match", and this `PUT` is then what works |
| `tag` | full enum: `friendly`, `league`, `cup`, `tournament`, `pre season`, `casualBooking`, `party`, `camp`, `onlineBooking`, `blockBooking`, `bubbleFootball`, `leagueFixture`, `function`, `transferMarket`. The **Game type** dropdown offers seven of them and **all seven work** - the label-to-value map is not a plain lower-case ("Pre Season" stores `pre season` with a space, "Casual Booking" stores `casualBooking`), so sending a lower-cased label by hand is refused and reads like an app bug when it is not |

The line-up positions accept a **suffixed** variant the enum in
[Match events](#match-events) does not list: saving the inline form sent
`CenterBack-1` alongside `CenterBack`, and it was accepted.

### The match lifecycle - what starts a match and what ends it

**(observed in app, 2026-09-01, by collection 10.)** Isolated on staging one match
at a time. This is the whole of match day, and none of it is in the collection.

**A match starts itself when its date arrives.** `POST /matches` with a date a few
minutes in the past answers `status: "Scheduled"`, and the row is `Live` about two
seconds later with `autoStarted: true` and a server-set `startedAt`. Nothing has to
be open in a browser for that to happen.

**A match that would already have ended is created finished.** The rule, isolated
across three durations: a match is auto-finished at creation when
**`date + duration` is more than 24 hours in the past**. It arrives `Finished`,
`autoFinished: true`, `0-0`, and nothing can ever be written to it.

**The app says this out loud once a match reaches full time.** The countdown in
the MATCH DETAILS card changes from "Match starts in" to **"Match auto-ends in"**
and runs for 24 hours. So the 24-hour figure is not an inferred threshold - it is
the same grace period the screen advertises, seen from the other side. A manager
who forgets to press END MATCH has a day to enter the score before the match ends
itself at 0-0; a manager recording a match that finished more than a day ago has
already missed it.

| `date` | `duration` | ended | result |
|---|---|---|---|
| now - 24h | 60 min | 23h ago | Live |
| now - 24.75h | 60 min | 23.75h ago | Live |
| now - 25.13h | 60 min | 24.13h ago | **Finished** |
| now - 25.5h | 120 min | 23.5h ago | Live |
| now - 26.5h | 120 min | 24.5h ago | **Finished** |
| now - 24.5h | 90 min | 23h ago | Live |
| now - 26h | 90 min | 24.5h ago | **Finished** |

That is what article 10.9 is about, and it cost this collection's first seed six of
seven events: a fixture dated twelve days back was Live for one `POST /events` and
`Finished` by the second.

**A future match can be forced Live.** `POST /matches/:id/status {"status":"Live"}`
on a Scheduled match answers 200 and it stays Live. That is what **START MATCH**
does, and it is how a spec gets a Live match at a kick-off time it chose.

**A Live match cannot be edited.** `PUT /matches/:id` with any configuration field
answers `403`, `"permission": "Cannot update match configuration fields when match
is Live"`. Date, venue, duration, team size and line-up all lock at kick-off.

**But `status` is not a configuration field, and a Finished match CAN be
cancelled.** `PUT /matches/:id {"status":"Cancelled"}` answers 200 on a match that
is Live, Paused **or Finished**, and the row then stops appearing in every listing.
`DELETE` still refuses anything whose date has passed - "Date must be at least one
hour ahead of the current time" - so PUT is the only disposal that works on a match
that has kicked off. Collection 10 believed the opposite for half a run, on the
strength of the "Cannot update match of a Finished match" message this file records
for `PUT`: that message is about the other fields. **What a Finished match refuses
is being reopened or rewritten** - `POST /status` with any other value, and any
configuration change - not being cancelled.

**Pause and resume are the same endpoint**, and the app sends a **Firestore
timestamp** through the REST API:

```
POST /matches/:id/status {"status":"Paused","pausedAt":{"type":"firestore/timestamp/1.0","seconds":...,"nanoseconds":...},"pauseDurationSeconds":0}
POST /matches/:id/status {"status":"Live","pauseDurationSeconds":1}
```

`pauseDurationSeconds` accumulates on the match and the timer subtracts it.
**END MATCH** sends `{"status":"Finished","finishedAt":{firestore timestamp}}` and
asks nothing first.

**Fields on the match object the collection does not list.** Read off
`GET /matches/:id` on 2026-09-01:

| Field | Notes |
|---|---|
| `homeTeamTotalGoals` / `awayTeamTotalGoals` | the score. **Not** on the team objects, which carry only `formation` and `players` |
| `startedAt`, `finishedAt`, `statsCalculatedAt` | see [statsCalculatedAt](#statscalculatedat-and-how-long-the-numbers-take) |
| `autoStarted` / `autoFinished` | whether the two rules above did it, rather than a person |
| `pausedAt`, `pauseDurationSeconds` | the timer's own state |
| `hasScoreEntry`, `hasSourceUpdatedGoals` | **tournament only** - see below |
| `isPenalty`, `winnerTeamId` | **tournament only** - see below |
| `captainPlayerId`, `isEdited`, `isDateOnly`, `queueName`, `isMatchManager` | - |

**Penalties and typed score entry are tournament-only.** `isPenalty` and
`hasScoreEntry` are read in the bundle behind `y.tournamentMatchId`, and the copy
around them is "Enter a deciding score for ... to proceed with the next round of the
tournament". An ordinary match has neither control: its score is the two `+` / `-`
steppers, and a 0-0 ends as a **DRAW** with no prompt of any kind. Confirmed by
ending one on staging.

### Match events - what the app actually sends

**(observed in app, 2026-09-01, by collection 10.)** Three corrections to
[Match events](#match-events) above.

- **`teamPlayerId` is not required on a goal.** The `+` stepper sends
  `{"teamId","teamType","type":"GoalAwarded"}` and nothing else, and the feed then
  reads "Mo awarded a goal" with an **+ Add Player** link beside it. The scorer is
  attached afterwards through an **Edit Goal** window that also takes the assist.
  `GoalRevoked` is the `-` stepper and carries no player either.
- **Commentary is `type: "Comment"`.** The collection names the request "comment"
  and does not show its type; posting `{minute, description}` without one answers
  `400 SCHEMA_VALIDATION_ERROR`, `field: "type", message: "Required"`. That answers
  the TODO under [Match events](#match-events).
- **The full feed-item enum**, from the bundle and seen on screen: `GoalAwarded`,
  `GoalRevoked`, `YellowCard`, `RedCard`, `PlayerOfMatch`, `Comment`,
  `SystemEvent`, `PastMatch`. A match created from a past date is given a
  `SystemEvent` reading **"Match was created from the past date"**.

**`GET /matches/:id/events` answers 404.** There is no REST read for the feed. The
match page subscribes to **Firestore** instead - `onSnapshot` on the `matches/{id}`
document and on its `events` subcollection ordered by `timestamp`. That is why a
second device sees a goal appear with no reload, which is what article 10.10 is
about, and it is why a spec cannot assert the feed over the API.

**A line-up position that repeats has to carry its index.** `Goalkeeper`,
`CenterBack-1`, `CenterBack-2`, `CentralMidfielder`, `Striker`. Two players both
posted on plain `CenterBack` are accepted and stored intact, and the pitch then
draws **an empty `+` slot for each centre-back and neither player** - the board keys
its slots by position and the two collide. Cost collection 10 a rebuild.

### The match page on match day - controls by role and status

**(observed in app, 2026-09-01, by collection 10.)** Extends the table under
[Match app routes](#match-app-routes-and-what-the-match-page-shows-whom).

There are **six** tabs, not five: MATCH DETAILS, FEED, FACTS, LINEUP, PAYMENT and
**KEYS**. KEYS is a legend - Player, Player Online, Player Offline, Spectator,
Referee, Yellow Card, Red Card, Player Of The Match, Captain, Registered,
Registered & Accepted - and the other panels each carry a **VIEW KEYS** button that
jumps to it. All six panels are in the DOM at once; the tabs scroll to anchors
(`#match-details`, `#feed`, `#facts`, `#lineup`, `#payment`, `#keys`).

| Status | What sits beside the tab strip |
|---|---|
| Incomplete / Scheduled | **START MATCH** |
| Live | the timer pill, counting **down** from the duration, with a pause icon |
| Paused | the same pill with a play icon |
| Live, timer at 00:00 | **END MATCH** |
| Finished | nothing. The heading changes to **Match Result**, a **Rate** control appears, the winner gets a trophy, and the card reads **MATCH ENDED / The match has ended and cannot be edited.** |

| Who | Heading | Timer / END | Score steppers | Yellow, Red, PotM | Comment | Show Tour | PAYMENT tab |
|---|---|---|---|---|---|---|---|
| Owner | Match Settings | yes | yes | yes | yes | yes | yes, with Request Payment |
| team Administrator | Match Settings | yes | yes | yes | yes | yes | yes, no Request Payment |
| **assigned referee** | *(none)* | yes | **yes** | **yes** | yes | yes | **no tab at all** |
| a team player | Match Preview (View Only), `display:none` at desktop width | no | no | no | yes | no | yes |
| anybody else | Match Preview (View Only), visible | no | no | no | yes | no | no |

**CORRECTED 2026-09-03, by collection 21.** The referee row said **no** to score
steppers and **no** to the card buttons, and both were wrong. Re-measured three
ways on the same Live match, side by side with the Owner:

- the stepper row is **identical** for the two of them - one blue-bordered pill
  holding four 32px buttons, both minus buttons `disabled` at zero and both plus
  buttons enabled;
- clicking the referee's plus fires `POST /matches/:id/events
  {"type":"GoalAwarded"}` and it answers **200**. The score moved 0-0 to 1-0;
- **Yellow Card, Red Card and Player of Match are on the referee's FEED** the
  moment the match is Live, exactly as they are on the Owner's.

`isReferee` has nothing to do with any of it. A plain account that has never been
made a referee, named on the match with `PUT /matches/:id {refereePlayerId}`, gets
byte-for-byte the same page: five tabs, no heading, the steppers, the card
buttons, Show Tour and the timer. **What the match page reads is
`refereePlayerId`, not the referee flag.** That is presumably how the old row came
about - collections 09 and 10 both used an account that was only named on a match.

**The referee has NO gear menu.** Also corrected: the row under
[Match app routes](#match-app-routes-and-what-the-match-page-shows-whom) says the
referee's gear menu is the same as the Owner's, and `briefs/09.md` says the
referee "gets the gear and can edit the note". Measured on a Scheduled match, the
Owner has three `button[aria-haspopup="menu"]` and the referee has **two** - Add
to Calendar and the footer's language picker. There is no
Configure appearance / Edit / Cancel Match for a referee.

What the referee's own token may do, isolated on a throwaway match:

| Call | Answer |
|---|---|
| `POST /matches/:id/status` - `Live`, `Paused`, `Live`, `Finished` | **200** each |
| `POST /matches/:id/events` - goal, card, Player of the Match | **200** |
| `PUT /matches/:id` - `pitchNumber`, `note`, `date`, `status:"Cancelled"` | **403** `"Only match managers can update match settings"` |
| `DELETE /matches/:id` | **403** `"Only match managers can cancel match"` |

So the boundary is: **a referee runs the match and cannot change the match.**

**Worth a ticket: the referee's Add Note is a silent no-op.** The FEED panel gives
a referee **Add Note**, the dialog opens ("Add Note", a 250-character box, Save and
Close), Save sends `PUT /matches/:id {note}`, the API answers the 403 above - and
the dialog closes with **no message on screen** and the note still reads "No Note
added." Article 21.3 warns about it.

The gear menu offers **Configure appearance / Edit / Cancel Match** on a Live match
exactly as on a Scheduled one - but Edit's save is refused by the 403 above.

**The FEED panel carries a live viewer count** - a green pill reading
`ONLINE <n>` - which went from 1 to 2 the moment a second account opened the same
match, with no reload on either side. Article 10.10.

### The guided tour on the match page

**(observed in app, 2026-09-01, by collection 10.)** It is **Shepherd.js**. Three
steps, each a `<dialog class="shepherd-element">` with a `data-shepherd-step-id`:

| `data-shepherd-step-id` | Target | Text | Buttons |
|---|---|---|---|
| `match-details-section` | `#match-details` | Check your Home and Away teams, match details and the scores. | Skip Tour, Next |
| `feed-section` | `#feed` | Add comments with other players and see match updates like who scored. | Back, Next |
| `lineup-section` | `#lineup` | Manage your team and formations. Do not forget to invite your mates by adding their email address! | Back, Finish |

It covers neither FACTS, nor PAYMENT, nor KEYS. `#show-tour-button` reopens it and
carries the accessible name **Show Tour**. Note that `innerText` on a
`shepherd-text` reads empty - the dialog is outside the layout the way `innerText`
measures it - so a spec has to read `textContent`.

**Finishing the tour clears the account's bio**, exactly as Skip Tour does. Both
fire `PUT /users/:id {"isTourCompleted": true}`, which is a full replace. Verified
by reading the bio, selecting **Finish**, and reading it again: `""`. Third
instance of this defect in this file, after the profile photo and the banner.

### The two Free gates on the match page

**(observed in app, 2026-09-01, by collection 10.)** Both are client-side, both are
keyed off the **signed-in user's** membership rather than the team owner's, and
neither has an error code - so neither is in the `MembershipLimits` table under
[MembershipLimits](#membershiplimits---the-eight-error-codes).

| Where | Modal title | Message |
|---|---|---|
| the fourth substitute slot, **SUB-4**, on the LINEUP panel | **Add More Subs** | Upgrade to Pro Membership to add more substitutes to your lineup. |
| **Add media** in the match feed's comment window | **Add Media** | You need a Pro membership to add videos and images to your match feed. |

Both carry the usual second line, "Pro (Beta) is **FREE**. Tap FREE Upgrade to get
started.", and the usual **FREE Upgrade (Beta)** button. SUB-1 to SUB-3 open the
**Select Player** window normally on Free; only SUB-4 is gated, and it is drawn in
violet where the first three are blue.

### The Facts tab - what the two panels actually are

**(observed in app, 2026-08-31.)** Read off the wire and off the screen together,
by collection 11. Two endpoints back one card on the match page.

`GET /matches/:id/facts` answers already-written sentences, five per team:

```json
{"status":"OK","data":{
  "homeTeam":[{"text":"KB 11 Rovers has scored  2 consecutive goals in its last 5 games","teamName":"KB 11 Rovers"}, ...],
  "awayTeam":[ ... ]}}
```

The five are: consecutive goals scored, goals conceded, days since the last game,
the formation used most, and cards received - each "in its last 5 games". The app
renders the strings as it receives them, double space and all. The **Insights**
panel is exactly this, coloured by side: `bg-sky-50` for `homeTeam`, `bg-rose-50`
for `awayTeam`, whatever the sentence says.

`GET /matches/:id/facts-stats` answers the match, the leaderboard, and a block per
team:

```json
{"match":{...,"startedAt":...,"finishedAt":...,"statsCalculatedAt":...,"queueName":"..."},
 "leaderboard":{"name":"KB 11 Sunday League","id":"..."},
 "homeTeam":{"details":{...},
   "stats":{"totalWins":2,"totalLosses":1,"totalMatches":4,"goalScored":8,
            "winStreak":2,"cleanSheets":1,"totalYellowCards":1,"totalRedCards":0,
            "teamMembers":5,"isRanked":true,"rank":1},
   "biggestWin":{...},"biggestLoss":{...}},
 "awayTeam":{ ... }}
```

The **Statistics so far** panel is exactly that, two columns. Three things follow,
and all three matter to anyone writing about this screen.

- **It is not a head-to-head record.** Each column is that team's whole record in
  the leaderboard. Proved on staging with a third team: on a Rovers v City page
  the columns read 4 matches and 3, and Rovers' *Biggest win* was **4-0 against a
  team that is not City**.
- **There is no `conceded` figure and no draw count.** So *Goals conceded per
  match* renders as a dash for both teams, always, and *Drawn* is computed in the
  browser as `totalMatches - totalWins - totalLosses`. The conceded figure does
  exist on `GET /teams/:id/stats`; it is simply not in this payload.
- **`rank` is the leaderboard position** shown at the top of the panel.

**Both panels are empty exactly when the match has no `leaderboardId`.** `facts`
answers two empty arrays and `facts-stats` answers no team `stats`, and the screen
reads "No insights available yet" and "No statistics available yet". Isolated
against the match `tag`, which was the other candidate:

| `tag` | `leaderboardId` | insights |
|---|---|---|
| `league` | set | 5 per team |
| `friendly` | set | 5 per team |
| `league` | absent | none |
| `friendly` | absent | none |

The Facts tab is **identical before and after a match**. A future-dated match
between the same two teams showed the same five insights and the same statistics.

### statsCalculatedAt, and how long the numbers take

**(observed in app, 2026-08-31.)** The match object carries `startedAt`,
`finishedAt`, `statsCalculatedAt` and `queueName`. Measured across collection 11's
four matches, `statsCalculatedAt - finishedAt` was **1.6, 5.7, 6.4 and 6.8
seconds**. That is the lag the note under [Match events](#match-events) describes
and the subject of article 11.3. Nothing in the app announces it: the screen shows
the old numbers, then the new ones.

### What the statistics endpoints actually count

**(observed in app, 2026-08-31.)** Four rules, each isolated on staging by
collection 11's fixture - three teams, one leaderboard, four played matches.

1. **A clean sheet is not simply conceding nothing.** A **0-0 draw scored no
   clean sheet for either team**; a 4-0 win scored one. Read off
   `GET /teams/:id/stats` both times. So the count behaves like "won without
   conceding" - stated as an observation, because no endpoint documents the rule.
2. **A player is counted for matches they were in the LINEUP for.** A team that
   played four matches with one member left out of one of them reads
   `matches: 4`, and that member's `winLossDraws.totalMatches` reads 3. Wins,
   losses and draws follow the lineup too.
3. **`GET /players/:id/matches` does not agree with that.** It returned the match
   the player was left out of - it lists their teams' fixtures, not the ones they
   played. So the Matches list on Home and the Matches tile beside it count
   different things.
4. **`POST /matches` accepts a short or an empty `players[]`.** A one-player and
   an empty home lineup were both accepted on a `5 VS 5` match, and the match
   played and wrote statistics normally.

And one small thing that catches a seed out:

- **A future-dated match is born `Incomplete`, not `Scheduled`.** Only a match
  whose date is at least an hour ahead can be `DELETE`d, so a future-dated match
  is the only throwaway match a spec can clean up after itself.

## Players

| Method | Path | For |
|---|---|---|
| GET | `/players/:playerId?all=true` | Public player profile |
| GET | `/players/:playerId/stats` | Player statistics |
| GET | `/players/:playerId/stats/leaderboards` | Per-league stats (`limit`, `skip`) |
| GET | `/players/:playerId/teams` | Teams joined |
| GET | `/players/:playerId/teams/rank` | Teams with rank |
| GET | `/players/:playerId/matches` | Match history (`limit`, `skip`, `scheduleType`, `includeBooking`, `includeIncomplete`, `startDate`, `endDate`) |
| POST | `/players/avatar` | Upload a profile photo, returns `avatarToken` (multipart, field `avatar`). **WebP only** - see below |
| GET | `/players/:playerId/avatar?v=` | Fetch the photo |
| DELETE | `/players/:playerId/avatar` | Remove the photo |
| POST | `/players/:playerId/banner` | Upload a profile banner (multipart, field `banner`) |
| GET | `/players/:playerId/banner?v=` | Fetch the banner |
| DELETE | `/players/:playerId/banner` | Remove the banner |

**(observed in app, 2026-08-29)** Both image endpoints - `POST /players/avatar`
and `POST /players/:playerId/banner` - accept **WebP and nothing else**. A PNG is
refused with `415 {"error":"Unsupported file type"}`, which is not the API's usual
`{"status":"FAILED"}` envelope, and so is a JPEG. The settings page says "JPG, GIF
or PNG. 3MB max." because its cropper re-encodes to WebP in the browser before
uploading: the caption describes what you may CHOOSE, not what the API takes.
`lib/api.mjs`'s `upload()` sets the MIME type on the part; without one, fetch
sends `application/octet-stream` and the answer is 415 whatever the file is.

Both also answer with a token rather than storing the image themselves. Store it
with `PUT /users/:userId {"avatarToken"}` or `{"bannerToken"}` - and read the note
under Users first, because that PUT clears the bio.

**The page's cropper does not upload the file it was given.** Its crop window is a
fixed box in the middle of the image, so what it stores is a zoomed centre band.
A direct API upload stores the whole image. Two different pictures from one file.

### Profile views

**(observed in app, 2026-08-29.)** Not in the Postman export. `/profile-view` is
an API path in the app's own `ApiEndPoints` enum, **not** an app route - an
earlier sweep for this collection mistook it for a screen.

| Method | Path | For |
|---|---|---|
| GET | `/profile-view/player/:playerId/viewers` | Who has opened your profile |

It backs the **Views** counter in the profile header, which appears only on your
own profile (`isSelfProfile` in the bundle). Selecting the counter opens a panel:

- **Pro** - "Profile Views", the list of viewers. Empty state: "No profile views
  yet."
- **Free** - "Unlock Profile Views", the Pro gate: "Profile views are available
  for Pro members only." Same shape as the Compare gate in 02.8.

So the viewers list is a `free_pro` feature. 02.1 names it in prose. Nothing
photographs it yet.

### Following

| Method | Path | For |
|---|---|---|
| POST | `/players/:playerId/follow` | Follow a player |
| DELETE | `/players/:playerId/follow` | Unfollow |
| GET | `/players/:playerId/follow` | Am I following this player |
| GET | `/players/:playerId/followers` | Followers |
| GET | `/players/:playerId/following/players` | Players I follow |
| GET | `/players/:playerId/following/teams` | Teams I follow (`limit`, `skip`, `tab`) |

~~Following a tournament has no endpoint in the collection.~~
**(observed in app, 2026-08-31)** It does, and it is the same shape as the other
two:

| Method | Path | For |
|---|---|---|
| POST | `/tournaments/:id/follow` | Follow a tournament |
| DELETE | `/tournaments/:id/follow` | Unfollow |
| GET | `/tournaments/:id/follow` | `{followerCount, isFollowing}` |

All three kinds answer `{"message": "Successfully followed ...", "followId": ...}`
on the POST, and all three are driven by the **same control** in the app - one
button on the entity's own header, beside its counters, reading **Follow** or
**Unfollow**. A player profile, a team page and a tournament page each carry it.
There is no confirmation step and nothing is sent to the person followed.

**A followed tournament is enumerated nowhere.** The Following window on your own
profile has a Players tab and a Teams tab and no third one; its heading count
excludes tournaments; the Tournament screen lists only tournaments you own; and
there is no `/following/tournaments`. The only handle on one is
`GET /tournaments/:id/follow` for an id you already have. Article 05.5 tells the
reader to go back to the tournament's own page to unfollow.

**Following is one-way and ungated.** It does not create a friend record, does
not add anybody to a team, and works on Free. Your own **profile** has no Follow
control - you cannot follow yourself - but your own **teams and tournaments do**.

**(observed in app, 2026-08-31)** `GET /team-players/search` with
`searchType=all` also returns **tournaments**, which the 2026-08-29 note above
does not mention: searching a tournament title returns it labelled `Tournament`.
So the header search reaches players, teams, leaderboards and tournaments.

## Referees

| Method | Path | For |
|---|---|---|
| GET | `/referees/:id/matches?scheduleType=` | Matches assigned to a referee. `Upcoming` \| `Past` |
| GET | `/referees/:id/matches?includeIncomplete=&startDate=&endDate=` | the same list by date range. **(observed in app, 2026-09-03)** what `/schedule` calls |
| GET | `/referees/:playerId/stats` | Referee statistics |
| GET | `/referees/:refereePlayerId/stats/leaderboards` | Per-league referee stats (`page`, `limit`) |

**(observed in app, 2026-09-03, by collection 21.)** Everything below was read off
the wire and off the live API. The TODO that stood here - "find the real
referee-registration call for 21.1" - is answered: **there is none.**

### There is no referee route and no referee sign-up

`/referees` is an `ApiEndPoints` value, not an app route. The app's own `Routes`
enum holds 36 paths and none of them is a referee screen; `/referees` answers
**404 from the server**. Everything a referee sees is the ordinary player profile
in a different role - see below.

### `POST /tournaments/:id/referee` - the whole shape, and `createMode`

The row under [Tournaments](#tournaments) was incomplete in a way that makes the
call fail. **`createMode` is required**, and it selects one of the dialog's three
tabs:

| `createMode` | Body | Tab |
|---|---|---|
| `single` | `name` (required), `lastName`, `email`, `avatarToken`, `saveForFutureTournaments`, `canStartEndMatches` | **Single referee** |
| `global` | `playerId`, `canStartEndMatches` | **Saved referees** |
| `multiple` | `refereeList` (newline-separated names), `saveForFutureTournaments`, `canStartEndMatches` | **Multiple referees** |

Three things follow, and the first two are defects.

**Sent without `createMode` the call answers `400 "Referee not found"` - after it
has already flipped the target user.** `isReferee: true` and
`defaultProfile: "Referee"` are written to the user before the request is
validated. So a malformed add leaves an account marked as a referee, on no
tournament and in nobody's saved list. Worth a ticket.

**`createMode: "multiple"` cannot work as the app sends it.** The client posts
`{createMode, refereeList, saveForFutureTournaments, canStartEndMatches}` and the
server answers `400 SCHEMA_VALIDATION_ERROR, {"field":"name","message":"Required"}`.
The **Multiple referees** tab is therefore broken. Worth a ticket. This also
corrects the note under [Tournaments](#tournaments) that said the tab "fires one
POST per line": it fires one POST with the lines joined by `\n`.

**`createMode: "single"` with an `email` that belongs to an existing account is
the only path that produces a referee a reader can be.** It answers with that
user's whole record showing `isReferee: true` and `defaultProfile: "Referee"`.
With a `name` and no `email` it creates a bare **unregistered** player record
(`isRegistered: false`, `isReferee: true`) that nobody can ever sign in to.
An account that is already a referee **can** be added to a second tournament by
email; that answers 200.

`PATCH /tournaments/:id/referee/:refereePlayerId` edits a referee row - the
dialog's **Edit referee** mode. Not previously recorded.

### The saved-referee list is separate from the tournament

`saveForFutureTournaments` lives on the **player** record and outlives the
tournament row. `DELETE /tournaments/:id/referee/:playerId` takes somebody off the
tournament and leaves them in the organiser's saved list.

- `GET /team-players/search?searchType=referee&savedOnly=true` reads that list.
  **`savedOnly` is a new parameter** - not on the `/team-players/search` row above.
  It and `tournamentSelectionOnly` both answer only the caller's own saved
  referees; with neither, the search returns every referee on the platform.
- `PATCH /players/:playerId/referee-settings {saveForFutureTournaments:false}` is
  what removes one, and it is the dialog's "Remove from saved list".
  **CORRECTED: it answers 200 to the tournament OWNER**, on another player's
  record. The 2026-08-31 note below saying it is 403 to anybody but that player is
  wrong.

### `GET /referees/:playerId/stats` - and the tile that can never move

```json
{"totalMatches":1,"totalGoals":0,"totalAssists":0,
 "totalRedCards":0,"totalYellowCards":0,"totalPlayerOfTheMatch":0}
```

**There is no `totalFouls`, and the profile draws a TOTAL FOULS tile from it.**
So that tile reads 0 for every referee on the platform. Worth a ticket.

The other five are the referee's own **player** figures, and a referee is not in
the line-up she officiates, so only `totalMatches` ever moves. It is calculated
asynchronously after the match finishes, like player statistics - zero
immediately after `POST /status {"status":"Finished"}` and 1 within a minute.

`GET /referees/:id/stats/leaderboards` answers one row per leaderboard:
`{leaderboardId, leaderboardName, totalMatches, goals, assists, redCards,
yellowCards, playerOfMatchCount}`.

### Being added as a referee notifies nobody

`POST /tournaments/:id/referee` sends **no notification and no email**. Measured
on an account holding zero notifications before and zero after. None of the
eighteen notification types is referee-related, there is no accept endpoint for a
referee anywhere in the bundle, and `refereePlayers[]` carries no pending or
accepted state - only `isRegistered`, `saveForFutureTournaments` and
`canStartEndMatches`. **A referee is added, never invited.** That is why article
21.2 is not called "Accepting an invitation".

The tournament does appear in the referee's own `GET /tournaments`, with
`isReferee: true` and `canRefereeStartEndMatches` set from the dialog's toggle -
so the Tournaments list is where a referee finds out.

### Where a referee's assigned matches are on screen

Three places, and the first one is smaller than it looks.

1. **The player profile in the Referee role.** `GET /players/:playerId` and the
   profile's match lists switch endpoint by role: the component sends
   `slug: profileRole === TeamRole.Referee ? "referees" : "players"`. So the
   REFEREED MATCHES panel is `GET /referees/:playerId/matches?scheduleType=`.
   **The panel renders only the nearest row of each tab** - one Upcoming card and
   one Past card - and its **See All button does nothing at all**: clicking it
   changes no URL, fires no request and adds no card. Worth a ticket. Empty, the
   panel reads "No matches yet, stay tuned!" and the See All button is absent.
2. **`/schedule`, the calendar.** It calls
   `GET /players/:playerId/matches?includeIncomplete=true&startDate=&endDate=`
   **and** `GET /referees/:playerId/matches` with the same parameters, and merges
   them. This is the only complete list of a referee's assignments in the product.
3. **The match page** itself, whose detail strip prints the referee's name first.

`GET /players/:playerId/matches` on its own returns **0 rows** for a referee who
is in neither line-up, so a referee's matches are not on the player endpoint.

Note the shape difference: `GET /referees/:id/matches` answers a **summary** whose
`homeTeam.players[]` lists every team member at `Substitute-1..n` regardless of
the real line-up. `GET /matches/:id` carries the actual positions.

### The referee profile: a role switch, a second bio, and a default

`isReferee` adds a blue pill switch to the top right of the player profile - a
radix toggle group, `role="radiogroup"`, holding `role="radio"` buttons in the
order **Referee, Player, Padel** (Padel only when the account plays padel; the
label renders only on the selected one, so the reliable handle is the
`<img alt="Referee profile">` / `alt="Football profile"` inside). In the Referee
role the profile swaps four things:

| Player role | Referee role |
|---|---|
| `bio` | `refereeBio` |
| `leaderboardCount` | `refereeLeaderboardCount` |
| player stats: Matches, Won, Lost, Drawn, Goals, Assists, cards, PotM | **MATCHES, RED CARD, YELLOW CARD, TOTAL FOULS, NO. OF LEAGUES, AVERAGE RATING** |
| `GET /players/:id/matches` and `/stats/leaderboards` | `GET /referees/:id/matches` and `/referees/:id/stats/leaderboards` |

Teams and rankings are **not** switched - both roles show the player's teams.

`profileRole` comes from the `?profileRole=` search parameter and defaults to the
account's `defaultProfile`. `POST /tournaments/:id/referee` sets that to
`"Referee"`, so **a new referee's profile opens on the referee side.**

`PUT /users/:userId` takes `refereeBio` (150 characters, 5 lines, same schema as
`bio`) and `defaultProfile` (`Player` | `Referee` | `Padel`). Profile settings
renders the **Referee Bio** box at `#referee-bio` and a **"Select your default
profile"** toggle, both only when `isReferee` is true, and counts a missing
referee bio in the sidebar's "Complete your profile (n)".

The collection's "Create" referee request has an empty URL, and
`defaultProfile: "Referee"` on `POST /users` sets the default only - it does not
make a referee.

**(observed in app, 2026-08-31, by collection 09.)** Narrowed, but not solved.
`isReferee` is a field on the **player** record, and nothing a user can reach sets
it:

- `PUT /users/:userId {"isReferee": true}` answers 200 and leaves it `false`.
- `PUT /users/:userId {"defaultProfile": "Referee"}` sets `defaultProfile` and
  leaves `isReferee` `false`.
- `PATCH /players/:playerId/referee-settings` (the app's own
  `updatePlayerRefereeSettings`) requires `saveForFutureTournaments`, answers 200
  to the player themselves and ~~403 "user does not have permission" to anybody
  else~~ - and still leaves `isReferee` `false`.
  **The 403 half is wrong; corrected 2026-09-03.** It answers **200** to the
  tournament owner on another player's record, which is how the Add referee
  dialog's "Remove from saved list" works. See
  [The saved-referee list](#the-saved-referee-list-is-separate-from-the-tournament).

The only call in the whole bundle that *creates* a referee is
`POST /tournaments/:id/referee`, which is where the app's own "Referee added" toast
comes from. **SOLVED 2026-09-02, by collection 19.** `POST /tournaments/:id/referee` sets
`isReferee: true` **and** `defaultProfile: "Referee"` on the target account,
and answers with the whole user record showing both. Sent with
`saveForFutureTournaments: true` it also puts that person in the match Referee
field's own search (`GET /team-players/search?searchType=referee&
tournamentSelectionOnly=true`), so the two halves of this puzzle are one call.
`scripts/seed-19.mjs` holds a tournament for no other reason.

So **there is still no way to become a referee outside a tournament** - the
finding that stood here was right about the shape and wrong only about there
being no call at all. A manager who has never run a tournament cannot fill the
match Referee field. Collection 21 owns the article; collection 09 documents the
empty field.

## Notifications

| Method | Path | For | Body / notes |
|---|---|---|---|
| GET | `/notifications` | List | `limit`, `skip`, `type`; ~~`isRead`~~ - see below. Answers a **bare array**, no counters |
| PATCH | `/notifications/mark-read` | Mark some read or unread | `ids[]`, `isRead`. Answers `{updatedCount}` |
| PATCH | `/notifications/mark-all-read` | Mark all read | - |
| DELETE | `/notifications/:notificationId` | Delete one | - |

There are no push-notification endpoints. Do not document push.

**(observed in app, 2026-09-03, by collection 20.)** Six things, and the first
three decide what can be written about notifications at all.

### There is no filter in the app

Notifications are a **modal**, not a route: `/notifications` answers **404 from
the server**, and so do `/home` and `/activities`. The bell that opens it sits
in the sidebar identity row.

The modal's own hook only ever sends `{limit: 10, skip: n}`, and the modal
carries exactly three controls - **Mark all as read** in its header, and per row
a **Mark as read** tick and a trash button. No chips, no dropdown, no tabs.
Nothing in the app sends `type` and nothing sends `isRead`.

**`isRead` does not work.** `?isRead=false`, `true`, `0`, `1` and `False` all
answer an empty list on an account holding sixteen unread rows. `type` does
work.

### The full `type` enum - eighteen values, and one the app cannot render

The API prints the list in its own validation error:

```
MatchLive | FriendAdded | PlayerJoinedTeam | PlayerTeamInvitation |
MatchInvitation | MatchSummary | MatchReviewRequest | LeaderboardAdminAdded |
TournamentUpdate | PlayerFollow | TeamFollow | LeaderboardComment |
CommentReply | CommentLike | ChatMessageSummary | PaymentRequested |
PaymentReceived | PaymentFailed
```

The web app's renderer has a case for seventeen of them and **none for
`PaymentFailed`**, which therefore falls through to the default row, "You have a
new notification."

`ChatMessageSummary` and `MatchReviewRequest` were never produced: two chat
messages were sent and a match was finished, and twenty minutes later neither
notification existed. Both look like scheduled digests.

### The badge is Firestore, and it is a running tally that drifts

`GET /notifications` has no counters. The bell badge and the modal title read
`{totalCount, unreadCount, notificationIds}` off an `onSnapshot` listener on the
Firestore document `notifications/<firebase uid>`. It is readable over
Firestore's REST API with the user's own ID token:

```
GET https://firestore.googleapis.com/v1/projects/scoryboard-staging
      /databases/(default)/documents/notifications/<uid>
Authorization: Bearer <firebase-id-token>
```

`unreadCount` is arithmetic, not a count of anything, and it is **not clamped**:

- `PATCH /notifications/mark-all-read` **sets** it to 0;
- `PATCH /notifications/mark-read {ids, isRead: false}` puts every row back to
  unread and **leaves the tally alone**. Measured at list-unread 16 with the
  badge absent and the modal titled plain "Notifications";
- `DELETE /notifications/:id` on an **unread** row subtracts one, so clearing a
  list whose tally is already 0 drives it negative. One account read
  `{totalCount: 11, unreadCount: -21}`. A negative tally renders no badge and no
  Mark all as read link - both are gated on `unreadCount > 0`, and the link is
  rendered as an EMPTY button rather than removed.

The sequence that heals it is mark-all-read **then** delete, which leaves the
tally at 0 while `totalCount` falls to 0. `scripts/seed-20.mjs` does that and
asserts the document afterwards. `notificationIds` is left holding stale ids by
any delete; nothing in the app reads it.

**Worth a ticket.** A reader who marks all read and then deletes a few unread
rows gets a badge that will not appear again until as many new notifications
arrive as they deleted.

### What sends what

| Type | Sent by | Reaches |
|---|---|---|
| `FriendAdded` | `POST /friends` with an email | the person added. A second POST makes a SECOND row, not a refusal |
| `TeamFollow` | `POST /teams/:id/follow` | the team's **owner**, not its members |
| `PlayerFollow` | `POST /players/:id/follow` | the person followed - **once per pair, for ever.** See below |
| `PlayerTeamInvitation` | `POST /team-players` with an email | the person invited |
| `PlayerJoinedTeam` | `POST /team-invitations/accept` | the team's Owner **and its Administrators** |
| `LeaderboardAdminAdded` | `POST /leaderboards/:id/admin` | the new Administrator |
| `LeaderboardComment` | `POST /comments` on a leaderboard | the owner and every Administrator, **never the commenter** |
| `CommentReply` | `POST /comments` with a `parentCommentId` | the parent comment's author |
| `CommentLike` | `POST /comments/:id/like` | the comment's author |
| `MatchInvitation` | `POST /matches` | every player in either line-up |
| `MatchLive` | `POST /matches/:id/status {"status":"Live"}` **only** | every player in either line-up |
| `MatchSummary` | `POST /matches/:id/status {"status":"Finished"}` | every player in either line-up, and people who follow one of them |

**`MatchLive` needs the explicit status POST.** The automatic start a passed
date causes - see
[The match lifecycle](#the-match-lifecycle---what-starts-a-match-and-what-ends-it)
- notifies nobody. A past-dated match therefore yields MatchInvitation and
MatchSummary and never MatchLive; a Scheduled one can be walked Scheduled ->
Live -> Finished by hand and all three arrive.

**A follow notifies once per pair of accounts, for ever.** `DELETE
/players/:id/follow` then `POST` again answers 200 with the **same** `followId`
and sends nothing: the record is soft-deleted and revived, the way a friend
record is (see [Friends](#friends)). A first-ever follow from an account that
has never followed that player does notify, with a new `followId`. A **team**
follow is not affected where the team itself is rebuilt, because the record is
then new.

### Two team-player findings this turned up

**`ONE_FRIEND_PER_TEAM` is wider than
[Team players](#team-players-roles-and-invitations) records.** That section says
"a friend already on one of your teams". On the Free plan, `POST /team-players`
was refused for a registered player who was on **none** of the caller's teams -
measured by email, by `playerId` after adding him as a friend first, and again
after removing him from the only other team he had ever been added to. Every
account is born owning two teams, so on Free the refusal is effectively
unconditional for a real account. Each refusal also soft-deleted the caller's
friend record for him, which is collection 05's finding holding again.

**Worth a ticket**, and worth re-reading `briefs/05.md` against.

**`PUT /team-players/:teamPlayerId` re-issues the invitation.** It requires
`name` and `email` in its body even when all it changes is `role`, and sending
them produces a second `PlayerTeamInvitation`. This section lists `resendInvite`
as an option on that call; it evidently does not need to be asked for. Invite
straight in with the role you want instead.

### Every notification is emailed too

Fifteen distinct subjects were collected out of four inboxes. The table is in
`briefs/20.md` and the article is 20.2. The sender is
`Staging Scoryboard <noreply@scoryboard.com>` - the address is production's, the
display name is not. Mail goes through SendGrid, so every link is a
click-tracking redirect on `url1680.scoryboard.com` and each message carries a
1x1 open-tracking pixel.

`POST /contacts` sends to support and **nothing to the sender**.

## Chat and messaging

**(observed in app, not in collection, 2026-09-02.)** Every path below was read out
of the web app's own bundle by collection 18 and then exercised against staging
with an ordinary bearer token. None of them is in the Postman collection, which
holds only the admin chat-report resolver.

This settles the open question this file carried under
[Not in the collection](#not-in-the-collection): **chat is not a separate service
and it is not socket-only.** Writes are plain REST on `staging-sb.api.scoryboard.com`.
Reads happen twice over - once through the REST endpoints below, and again through
a Firestore listener the chat page opens at
`firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel`, which is
what makes a transcript update without a refresh. The Realtime Database socket
(`wss://scoryboard-staging-default-rtdb.europe-west1.firebasedatabase.app`) carries
presence only, under `/online/users/:uid`, and is what puts the green dot on an
avatar.

So chat fixtures are seeded over the API, not through the UI. `scripts/seed-18.mjs`
builds a group, three members, a seven-message transcript, a reaction, an edit and
a deletion in about twenty-six writes.

### The conversation list

| Method | Path | For | Body / notes |
|---|---|---|---|
| GET | `/chats` | Every conversation you are in | `limit`. Answers `{conversations: [...]}`. A row carries `id`, `type` (`direct` or `group`), `title`, `memberUidList`, `participantProfiles`, `groupAdminUidList`, `memberState[uid].lastReadAt`, `lastMessage`, `lastMessageAt`, and `tournamentId` where the group belongs to a tournament |
| POST | `/chats/conversations` | Start one | Direct: `{"type":"direct","targetUid":"<firebase uid>"}`. Group: `{"type":"group","title":"...","memberUids":["..."]}`, optional `avatarToken`. **`targetUid` and `memberUids` are Firebase uids, not playerIds** - read `uid` off `GET /users/me`, or off `participantProfiles` |
| DELETE | `/chats/conversations/:conversationId` | Leave the conversation in your own list | Removes it for the CALLER only; the other members keep it. The app's own wording: "This will remove the chat from your list and clear your chat history here. If new messages arrive later, the chat will appear again with those new messages." |
| PATCH | `/chats/conversations/:conversationId/read` | Mark it read | `{}`. Sets your `memberState.lastReadAt` |

**A direct conversation's id is derived, not allocated.** It comes back as
`direct_<uidA>_<uidB>` with the two uids sorted, so `POST` for a pair that already
has one returns the same row rather than a second. Group ids are ordinary
Firestore ids.

### Messages

| Method | Path | For | Body / notes |
|---|---|---|---|
| GET | `/chats/conversations/:id/messages` | The transcript | `limit`, `cursor`. Answers `{messages[], nextCursor, memberUidList, memberState}` |
| POST | `/chats/conversations/:id/messages` | Send | `text`; optional `mediaTokens[]`, `replyToMessageId` |
| GET | `/chats/conversations/:id/messages/:messageId` | One message in full | This is the call the Pro gate sits on |
| PATCH | `/chats/conversations/:id/messages/:messageId` | Edit your own | `{"text": "..."}`. The message then renders with an `edited` tag beside its time |
| PATCH | `/chats/conversations/:id/messages/:messageId/delete` | Delete | `{"scope":"self"}` or `{"scope":"everyone"}`. **`self`, not `me`** - `me` answers `400 SCHEMA_VALIDATION_ERROR`, "Expected 'self' \| 'everyone'" |
| PATCH | `/chats/conversations/:id/messages/:messageId/reactions` | Toggle a reaction | `{"emoji":"👍"}`. Sending the same emoji twice removes it |
| POST | `/chats/conversations/:id/messages/:messageId/forward` | Forward | `{"targetConversationIds":["..."]}` |
| POST | `/chats/conversations/:id/messages/:messageId/report` | Report | `{"reason": "spam"\|"abuse"\|"harassment"\|"scam"\|"other", "note": "<=300 chars"}` |
| GET | `/chats/conversations/:id/messages/:messageId/media/:filename` | Download an attachment | Returns the file; the app turns it into a blob URL |
| POST | `/chats/media` | Upload an attachment, returns a media token | multipart. Up to 5 files per message |

The reaction picker offers six and only six: 👍 ❤️ 😂 😮 😢 🙏.

**Deleting a message is not confirmed.** *Delete for me* and *Delete for everyone*
both fire on the click; there is no "are you sure" dialog for either, and there is
no undo. Verified on staging 2026-09-02 by choosing *Delete for everyone* on an own
message - it left the transcript immediately.

What each scope does, measured on a throwaway conversation:

| Scope | The person who deleted it | Everybody else |
|---|---|---|
| `self` | the message is **not returned at all** by `GET .../messages` | unchanged, and readable; their copy carries the deleter's uid in `deletedForUids` |
| `everyone` | the message is gone from their own view entirely - no tombstone | `isDeleted: true`, `text: ""`, `deleteType: "everyone"`, rendered as *This message was deleted* |

So a sender never sees a tombstone for their own message, whichever scope they
chose. Only the other people in the conversation do, and only for `everyone`.

### Groups

| Method | Path | For | Body / notes |
|---|---|---|---|
| PATCH | `/chats/conversations/:id/group` | Rename, re-describe, re-avatar, announcement-only | `title`, `description`, `avatarToken`, `announcementOnly` |
| DELETE | `/chats/conversations/:id/group` | Delete the group for everyone | Admin only |
| GET | `/chats/conversations/:id/group/members` | The member list | `{members: [{uid, name, lastName, playerId, avatarVersion, isAdmin}]}` |
| POST | `/chats/conversations/:id/group/members` | Add members | `{"memberUids":["..."]}` |
| DELETE | `/chats/conversations/:id/group/members/:uid` | Remove a member, or leave | Admin only for somebody else. Your own uid is what **Leave group** sends |
| PATCH | `/chats/conversations/:id/group/admins/:uid` | Grant or revoke admin | `{"action":"grant"}` or `{"action":"revoke"}`. **Not** `promote`/`demote` - those answer `400 SCHEMA_VALIDATION_ERROR`, "Expected 'grant' \| 'revoke'" |

**Announcement-only is not a tournament feature.** `GET /tournaments/:id/chat/settings`
made it look like one. An ordinary group chat has the same switch in its **Group
Info** dialog - "Announcement only / Only group admins can send messages when this
is enabled." - and it is stored on the conversation, not the tournament.

**The only admin cannot leave.** The **Leave group** button is disabled with the
note "Leave group is disabled because you are the only admin." Grant somebody else
admin first, or delete the group.

### The Pro gate, measured

`CHAT_PRO_REQUIRED` is listed under
[MembershipLimits](#membershiplimits---the-eight-error-codes) as "reading an
incoming message in full". **(observed 2026-09-02)** It is wider than that:

- `GET .../messages` returns somebody else's message as its **first ten characters
  plus an ellipsis**, with `isContentLocked: true`, `canViewFullText: false` and
  `previewText` carrying the same stub. Your own messages come back whole. The
  conversation list's `lastMessage` preview is truncated the same way.
- **Replying to an incoming message is refused**, and so is reacting to one:
  `403 {"reason":"Upgrade to Pro to access the full message content"}`. The gate is
  on the message, not on the verb.
- Sending, starting a conversation and creating a group are all fine on Free.

In the app every incoming bubble carries an **Unlock with Pro** button under the
stub. It opens the standard membership modal, titled **Unlock full chat with Pro**:
"You can start conversations and send messages on Free, but reading full incoming
messages and opening attachments is a Pro feature." with the usual **FREE Upgrade
(Beta)** button.

### Chat app routes

| Route | What it is |
|---|---|
| `/chat` | The chat page. Three columns: sidebar, the conversation list, the open conversation |
| `/chat?conversationId=<id>` | Opens one conversation directly. The friends list's **Chat** button builds `direct_<uid>_<uid>` this way |
| `/chats` | Present in the route table; the app never links to it |

The **Start New Chat** dialog is a wizard, and its steps carry these headings:
*Start New Chat* (Select Chat Type) -> *Start Chat* or *Select Players* (Find Player
From: Leaderboards, Teams, Friends, Anyone) -> the player list -> *Create Group
Chat* (Group Details) for a group. A group name is optional and capped at 80
characters; leaving it blank names the group after its first two members.

## Venues (club locations)

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/club-locations` | Create a venue | `name`, `location`; optional `avatarToken`, `isTournament`, `saveForFutureTournaments`, `tournamentId` (attaches the new venue to that tournament on creation). **Upserts by name** - see below |
| ~~POST~~ **PUT** | `/club-locations/:id` | Update a venue | same fields. **(observed in app, 2026-09-04)** The app's edit form sends `PUT /club-locations/:id`; `PATCH` answers 404. The Postman row saying update reuses POST was wrong - POST with an existing name answers the existing row and changes nothing |
| GET | `/club-locations/:id` | One venue. **Answers `data: null`, not 404, for a deleted one** | - |
| DELETE | `/club-locations/:id` | Delete a venue. Soft: `isDeleted`. A second DELETE answers 404 "Club location not found" | - |
| GET | `/club-locations` | **Your** ordinary venues (`isTournament` false). What the match form's Location Club list shows before you type | - |
| GET | `/club-locations?query=` | Search: your ordinary venues **plus the partner venues**, matched on name or address. `query` must be **3 characters or more** - shorter answers 400 SCHEMA_VALIDATION_ERROR | `tournamentSelectionOnly=true` returns your venues with `isTournament` AND `saveForFutureTournaments` both true - the Create Tournament picker |
| GET | `/club-locations?tournamentId=` | The venues on one tournament, whoever added them | **(observed in app, 2026-09-04)** the tournament settings page and the fixture dialog |
| POST | `/club-locations/avatar` | Upload a venue logo, returns the token as a bare string in `data` | multipart, field `avatar`, WebP. Then `PUT /club-locations/:id {avatarToken}`; the row gains `avatarVersion` |
| GET | `/club-locations/:clubLocationId/avatar?v=` | Fetch the logo. **Public** - answers 200 `image/webp` with no token | - |

**(observed in app and measured over the API, 2026-09-04, by collection 22.)**
The venue model, in full:

- **A venue belongs to the account that created it**, and only that account may
  change it: `PUT` and `DELETE` from anybody else answer
  `403 "Club location can only be modified by its creator"`. That holds inside a
  tournament too - the tournament's Owner cannot edit a venue its Admin added,
  nor the Admin the Owner's. The app's Edit form prints the message under the
  Location field. Any signed-in account can `GET` any venue by id.
- **The lists are per account and disjoint by flag.** A fresh account's
  `GET /club-locations?query=Ast` answers `[]` although a dozen `KB 09 Astro`-style
  venues exist on other accounts. Collection 09's brief said the search "covers
  every venue on the platform"; it covers *yours* plus the partner rows below.
- **Partner venues are ownerless and global.** Rows with `source: "Powerleague"`
  and a `sourceId` (14 of them on staging - Powerleague Battersea, Mill Hill,
  Milton Keynes ...) come back to every account from `?query=`, and nobody can edit
  them (403 as above). They are the only venues a search finds that you did not
  make.
- **A tournament-only venue** is `isTournament: true, saveForFutureTournaments:
  false`. It answers to `?tournamentId=` and to nothing else: not `GET
  /club-locations`, not `?query=`, not `?tournamentSelectionOnly=true`. Profile
  settings' Locations list is the union of the plain list and the saved list, with
  the saved rows badged **Saved**; a tournament-only venue is therefore invisible
  everywhere but on its tournament.
- **`POST /club-locations` upserts by name**, case-insensitively, within (owner,
  `isTournament`). Posting a name you already hold answers the existing row - its
  old location and logo included, the new location ignored. The same name with
  `isTournament: true` makes a second row. So a reader who "adds" a venue twice
  gets one.
- **A logo cannot be removed.** `PUT` without `avatarToken` keeps the current
  `avatarVersion`; `avatarToken: null` answers 400 "Expected string, received
  null" and `""` answers 400 "Invalid token format". It can only be replaced.
- **Deleting a venue does not touch matches at it.** A Scheduled match keeps its
  `clubLocationId` and its page still prints the venue's name (measured on a match
  page before and after the DELETE). The match's Edit dialog can move it to
  another venue; it cannot be left with none (see "A match with no venue is
  Incomplete").
- Validation: `name` at least 1 character, `location` required, no other rules.
  Duplicate names across accounts are fine. The forms disable Continue until both
  fields hold something.
- **`PUT` can flip the flags.** A plain venue turned `isTournament: true,
  saveForFutureTournaments: true` leaves `GET /club-locations` and appears in
  `?tournamentSelectionOnly=true`. The app never does this; the Edit form on
  Profile settings shows the Save box only on a venue that is already saved.

### Where venues are made and edited in the app

**(observed in app, 2026-09-04.)** The Postman collection has no UI notes; these
are the surfaces, all of them driving one shared form (`CreateClubModal`: Upload
Club Logo, Club name, Location, optional Save for future tournaments, Continue).

| Surface | Route | Lists | Adds | Edits | Removes |
|---|---|---|---|---|---|
| **Profile settings -> Leaderboards, Teams and Locations -> Locations** | `/profile-settings` | plain + saved (badged **Saved**) | **Add Location** -> "Add new club location" (no Save box) | row kebab -> **Edit** -> "Edit club location" | row kebab -> **Remove** - `DELETE` on the click, **no confirmation** |
| Match form, **Location Club** | `/match/create`, and the Update your match dialog | plain, before typing; plain + partner after 3 letters | **Create club location** at the top of the list | - | - |
| Create Tournament, **Create or Select Clubs** | `/tournaments` | saved only | the **+** in the Location Club popover -> "Add new club location" **with** the Save box | - | - |
| Tournament settings, **LOCATION** | `/tournaments/:id/settings` | `?tournamentId=` - every venue on it, Owner's and Admins' | **+ Location** -> "Add Location / Add a club location for this tournament", with the Save box | row kebab -> **Edit** -> "Edit Location" (creator only) | **none** - a venue cannot be taken off a tournament from the UI |
| Fixture dialog (collection 14) | tournament schedule | `?tournamentId=` | "Create Club Location / Add a club location for this tournament group" | - | - |
| Tournament **public Info tab** | `/tournaments/:id/info` | **NO. OF LOCATIONS** and one named LOCATION row per venue, whoever added them | - | - | - |
| Onboarding **Step 4** | `/selectClubLocation` | `?query=mil` on open (a hard-coded search) | **Add your club location** | - | - |

The logo control opens the same round cropper as a profile photo ("Edit Your
Avatar", zoom slider, Cancel, Apply); Apply puts the crop in the form and
Continue saves it with `PUT {avatarToken}`. The `/selectClubLocation` route is
reachable by URL only (collection 01, open question 1) and is not documented.

**(observed in app, 2026-09-04.)** `/tournaments/:id/settings` for a signed-in
account with **no role** on the tournament redirects to
**`/tournaments/:id/info`** - the tournament's own public tab - not to `/`.
Measured by removing a tournament admin, loading the page as them, and putting
the admin row straight back. `briefs/12.md` (open question 5) and
`briefs/24.md`'s route table both record a silent redirect **to `/`** for
`/tournament/:id/settings`, the **singular** route; that one was not re-tested
here, so treat the two spellings as two different findings rather than
correcting either.

Worth knowing with it: that Info tab shows **NO. OF LOCATIONS** and names every
venue on the tournament, whoever created it. A tournament's venues are public
even though its settings page is not.

**(observed in app, 2026-08-28.)** Two things the table above does not say.

- `POST /club-locations` also takes `saveForFutureTournaments` (boolean) and
  `isTournament` (boolean). The tournament wizard's club picker calls
  `GET /club-locations?tournamentSelectionOnly=true` with **no** `query`
  parameter, and a venue only appears in that list when it was created with
  **both** flags true. A venue created without them is invisible to the wizard.
- The two listings are **disjoint**. `?query=<term>` returns only venues with
  `isTournament` false; `?tournamentSelectionOnly=true` returns only those with it
  true. Searching for a venue by name will not find a tournament venue.

## Payments (Stripe Connect) - REAL MONEY

Only collection 17 touches these. Stripe test mode only. (Collection 16 was
retired into 04; its Tournament Pro billing calls are under
[Buying it, and where Scoryboard stops](#buying-it-and-where-scoryboard-stops).)

**(Rewritten 2026-09-01, by collection 17, off the wire and the app bundle.)** The
Postman export had three of these wrong or missing: the status read is a GET not a
POST and takes no body, and create, edit, cancel and the two listing endpoints
were absent entirely.

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/payments/stripe/account` | Create the payout (Connect) account, or return the existing one | - |
| GET | `/payments/stripe/account/status` | Payout account status | **GET, no body.** The Postman collection lists `POST ... {name}`; that path answers 404. A 404 from the API is normalised by the app's RTK layer to `{"status":"OK","data":null}`, and `data: null` means no account at all |
| POST | `/payments/stripe/account-session` | Session for the embedded onboarding UI. Returns `{clientSecret}` | - |
| POST | `/payments` | **Create a payment request** | see below |
| GET | `/payments/:id` | One request | - |
| PUT | `/payments/:id` | Edit a request. Title and description only | `title`, `description` |
| DELETE | `/payments/:id` | Cancel a request. Does not delete it | - |
| GET | `/payments/my/requests` | Requests I have sent (`skip`, `limit`) | - |
| GET | `/payments/my/pays` | Requests I have to pay (`skip`, `limit`) | - |
| GET | `/payments/:id/transactions` | The per-player rows behind one request | - |
| POST | `/payments/:id/reminders` | Send reminders | `playerIds[]` |
| POST | `/payments/transaction/:id/pay` | Start a payment. Returns `{clientSecret, transactionId}` - a Stripe PaymentIntent | - |
| POST | `/payments/transaction/:id/verify` | Verify a payment | - |
| GET | `/teams/:teamId/payment-requests` | the team PAYMENT tab (`limit`, `skip`) | - |
| GET | `/leaderboards/:id/payment-requests` | the leaderboard PAYMENT tab (`limit`, `skip`) | - |
| GET | `/matches/:id/payment-requests` | the match PAYMENT panel | - |

### POST /payments - the body

```json
{"data": {
  "title": "KB 17 Pitch hire",
  "description": "Sunday league pitch hire, March.",
  "baseAmount": 1000,
  "participantPlayerIds": ["<playerId>", "..."],
  "feeAllocation": "PassThrough",
  "dueDate": "2026-09-30T12:00:00.000Z",
  "entity": "Team",
  "teamId": "<teamId>"
}}
```

- `baseAmount` is in **pence**, not pounds.
- `feeAllocation` is `PassThrough` or `Absorb`. Anything else is refused with
  `SCHEMA_VALIDATION_ERROR`, "Invalid enum value. Expected 'PassThrough' | 'Absorb'".
- `entity` is `Match`, `Team`, `Leaderboard` or `Direct`, and carries the matching
  id: `matchId`, `teamId`, `leaderboardId`. **`Direct` is what the Friends source
  sends** and it carries no entity id.
- `participantPlayerIds` must hold at least one id.
- `dueDate` is optional to the schema, and required by the form.

The form's own limits, from the zod schema in the bundle: title 1-40 characters,
description 0-100, `basePrice` 0.01-200. The i18n string
"Description must be 150 characters or fewer" is stale - the counter and the
schema both say 100.

### Nothing works without a connected payout account

**(observed 2026-09-01.)** `POST /payments` answers
`500 {"message":"internal error","reason":"","status":"FAILED"}` for every account
whose payout account is not live. The body is validated first - a bad
`feeAllocation` or an empty `participantPlayerIds` is refused with a 400 schema
error - so a 500 here means Stripe, not the request.

Confirmed against three accounts: one with `onboardingStatus: "Pending"`, one with
`"Restricted"`, and two with no Stripe account at all. All 500. **There is no
admin endpoint that enables a payout account**, so the only way to a working one
is Stripe's own onboarding.

### Where Scoryboard ends, both ways

Two handoffs, and no spec crosses either.

- **Setting up a payout account.** `Request Payment` on an account with no live
  payout account does not open a form. It fires `POST /payments/stripe/account`,
  then `POST /payments/stripe/account-session`, and renders Stripe's
  `stripe-connect-account-onboarding` embedded component in a Scoryboard dialog.
  Its one control, **Add information**, opens a **new browser window** at
  `connect.stripe.com`. Everything from there is Stripe's.
- **Paying.** `Pay Now` fires `POST /payments/transaction/:id/pay` and swaps the
  dialog for **Stripe Elements** - card number, expiry, security code,
  country - plus a Google Pay frame. Confirmed by reading the frame list:
  `js.stripe.com/v3/elements-inner-*`.

**Both are CAPTCHA-gated.** Stripe's signup raises an hCaptcha challenge on
submit (`uax.hcaptcha.challenge.open`, and a visible
`newassets.hcaptcha.com/...#frame=challenge`), and the payment form loads
`hcaptcha-invisible`. Neither can be driven from a spec. The payout account on
`kb-manager-pro-17@` was connected by a human, once, in test mode.

### The transaction fee, and who pays it

There is no endpoint that quotes the fee. The arithmetic is done in the browser:

```
b     = round(basePrice * 100)        // pence
v     = round(b * 2 / 100)            // Scoryboard's 2%
total = ceil((b + v + 20) / 0.985) / 100
fee   = total - basePrice
```

The `+20` is 20p; the `/0.985` grosses up Stripe's 1.5%. At a £10 base that is a
56p fee and a £10.56 total, which is what the form and the payer's list both show.

`feeAllocation` decides who carries it:

- `PassThrough` - the payer is charged `total`. The form shows a breakdown:
  **You will receive** / **Transaction fee** / **Total price**.
- `Absorb` - the payer is charged the base price and the fee comes out of the
  payout. **The breakdown disappears entirely**, so the organiser is never shown
  what they will actually receive.

The connected account carries `applicationFeeType: "Percentage"` and
`applicationFeeValue: null`.

### Statuses

Two levels, and they are not the same enum.

| Level | Values |
|---|---|
| Request, **on the wire** | `Active`, `Completed`, `Cancelled` |
| Request, **on screen** | `Pending`, `Completed`, `Cancelled` |
| Transaction (one per participant) | `Pending`, `Processing`, `Paid`, `Failed`, `Cancelled` |

**The request enum is not the same in both places.** `GET /payments/my/requests`
answers `status: "Active"` for a live request and the table renders it as
**Pending**. Do not assert `Pending` against the API or `Active` against the
screen. Observed 2026-09-01.

Transaction colours, from the bundle: Paid `#10B981` green, Pending `#F59E0B`
amber, Processing blue, Failed red, Cancelled `#EF4444` red. A cancelled request
overrides its transactions' status in the display.

### What may be done to a request, and when

The Payment Details window says only "Some actions may be disabled based on
payment status and due date". The real rules, from the bundle:

```
someonePaid = totalParticipants > 0 && totalParticipants !== unpaidCount
allPaid     = totalParticipants > 0 && unpaidCount === 0
overdue     = dueDate <= now

canCancelRequest          = !someonePaid && !cancelled && !completed
canUpdateParticipants     = !overdue && !cancelled && !completed && !allPaid
canUpdateTitleDescription = !someonePaid && !overdue && !cancelled && !completed
```

So a request can never be cancelled or retitled once one person has paid, and
participants cannot be added after the due date.

### Two defects worth a ticket

**(observed 2026-09-01, by collection 17.)**

1. **"You're all set to receive payments!" is shown when the account is not set
   up.** The app's `payment.onboarding.success` dialog fires when the Stripe
   window closes, not when the account becomes chargeable. An account left
   `Restricted` with `chargesEnabled: false` gets the same congratulation as a
   completed one. Reproduced twice.
2. **Select Team and Select Leaderboard are empty until `/teams` has been
   visited.** Opening `Request Payment` on a fresh page load and choosing
   **Teams** shows "Your Teams (0) / No teams found where you are the owner."
   even for an owner of two teams. Visiting `/teams` once fills the persisted
   Redux `teams` slice and the list appears. Same root cause as the **External**
   badge recorded under
   [Leaderboard app routes](#leaderboard-app-routes).

### Payment app routes

| Route | Screen |
|---|---|
| `/payment` | the hub. **REQUESTED** and **PAY** tabs, and **Request Payment** |
| `/payment?tab=pay` | the PAY tab directly |
| `/teams/:teamId/payment` | the team's requests. Owner only gets **Requests** and **Request Payment**; Administrator and Player get **Pay** alone |
| `/leaderboards/:id/payment` | the same, for a leaderboard |
| `/matches/:id` `#payment` | the match PAYMENT panel, headed "You can only see your own payment details." |

The hub's empty state is a three-step explainer: **Setup Your Account**,
**Request & Make Payments**, **Track & Remind**. It renders whenever the account
has sent no requests, whether or not a payout account exists.

**Dead copy.** The bundle carries a Scoryboard-side onboarding panel -
`payment.onboarding.heroTitle` "Get paid quickly and securely", `heroDescription`,
`setUpAccount`, `continueSetup`, `statusMessagePrefix` "To request payments, you
need a connected account. Onboarding is ..." - and **none of it renders**. Only
`creating` and `success` are referenced in code. Do not document those screens.

## Tournaments

Feature flag: `TOURNAMENT_FEATURE_ENABLED`.

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/tournaments` | Create a tournament | `title`, `startDate`, `endDate`, `isOnline`; optional `description` |
| GET | `/tournaments/:tournamentId/config` | Read the setup state | - |
| PATCH | `/tournaments/:tournamentId/config` | Wizard steps 1 and 2 | `startDate`, `endDate`, `clubLocationIds[]`, `teamIds[]`, `teamCount`, `format` (e.g. `RoundRobin`), `groupCount`, `teamsPerGroup`, `matchesPerTeam`, `isComplete` |
| GET | `/tournaments/:tournamentId/schedule` | The fixture list | - |
| PATCH | `/tournaments/:tournamentId/schedule` | Set or bulk-update fixtures | `matches[]` of `{matchId, clubLocationId, date, startTime, duration, teamSize, status, homeTeam, awayTeam}` |
| GET | `/tournaments/:tournamentId/stats/teams` | Standings and team stats | - |
| POST | `/tournaments/create/centernet` | Partner-created tournament (**admin key**) | `email`, `cnetTournamentId`, `tournamentName`, `startDate`; optional `name`, `lastName` |

The collection's "Get Tournament Matches" request points at `/stats/teams`. That is
a copy-paste error in the source, not a second endpoint.

### Tournament setup - what the app actually calls

**(observed in app, 2026-08-28, while writing the collection 12 brief.)**

Two rows above are wrong for this build. `GET /tournaments/:id/config` returns
**404** - the path does not exist. The wizard does not `PATCH .../config` either;
it `PUT`s the tournament itself. Read the table below in preference to the two
`config` rows, which are kept only because they are in the Postman export.

| Method | Path | For | Body / notes |
|---|---|---|---|
| GET | `/tournaments` | Your tournaments, newest first | Each row carries `isOwner`, `isAdmin`, `isMember`, `isReferee`, `pricingPlan`, `publicSlug`, `config{}` |
| GET | `/tournaments/:id` | One tournament, with `teams[]`, `clubLocations[]`, `groups[]`, `brackets[]`, `phases[]` | - |
| POST | `/tournaments` | Create. The **Create Tournament** modal sends exactly this | `title`, `gameType` (`Football`\|`Padel`\|`Other Sports`), `startDate` (`YYYY-MM-DD`), `duration` (`"10 min"`), `clubLocationIds[]`, `isAutoStartEnable`, `startTime` (`"HH:MM"`, 24-hour), `timeZone` (IANA, **read from the browser** - pin it in a spec) |
| PUT | `/tournaments/:id` | Save the format, and save the settings page | Format save sends `teamCount`, `teamSize`, `teamIds[]`, `isComplete`, `format` (`RoundRobin`\|`GroupAndKnockout`\|`KnockoutOnly`), `groupCount`, `teamsPerGroup`, `matchesPerTeam`, `autoScheduleMatchesNextDay`, `status` |
| POST | `/tournaments/:id/teams/bulk` | Add tournament teams by name | `teamNames[]`. Creates **new** teams with `isTournament: true` and `teamLifecycle: "TournamentDraft"`; it does not link existing teams |
| GET | `/tournaments/:id/participants` | Teams, players and referees on the tournament | - |
| DELETE | `/tournaments/:id` | Delete a tournament | Answers `{"message":"Tournament deleted successfully"}` |
| POST | `/tournaments/:id/admin` | Add a tournament admin | `email` |
| DELETE | `/tournaments/:id/admin` | Remove a tournament admin | `email` |
| POST | `/tournaments/:id/referee` | Add one referee | **`createMode` is REQUIRED** - `single` \| `global` \| `multiple`. Then `name`, `lastName`, `email`, `avatarToken`, `playerId`, `refereeList`, `saveForFutureTournaments`, `canStartEndMatches` depending on the mode. ~~The Multiple referees tab fires one POST per line~~ - it fires one POST with the lines joined, and the server refuses it. See [Referees](#referees) for the whole shape and two defects |
| PATCH | `/tournaments/:id/referee/:refereePlayerId` | Edit a referee row | the dialog's **Edit referee** mode. **(observed in app, 2026-09-03)** |
| DELETE | `/tournaments/:id/referee/:playerId` | Remove a referee | leaves `saveForFutureTournaments` alone - see [Referees](#referees) |
| GET | `/tournaments/:id/follow` | Am I following this tournament | - |
| GET | `/tournaments/:id/chat/settings` | Tournament chat settings | - |
| GET | `/tournament-phases?tournamentId=&includeCompletion=false` | Phases | - |
| GET | `/tournament-groups?tournamentId=` | Groups | - |

Notes worth keeping:

- A new tournament is created with `status: "Published"`. There is **no `Draft`
  status** in this build - the string does not appear in the app bundle.
- `PUT /tournaments/:id {"status":"Live"}` answers `200` but does not change the
  status. Before the format is saved it answers `400 "Tournament config is
  incomplete"`. Live is reached by running a match, not by setting a field.
- Adding a tournament team owner reuses `POST /team-players` with
  `{name, email, teamId, role: "Owner"}`.
- `GET /tournaments/:id` carries the role lists the settings page renders:
  `ownerUser`, `adminPlayers[]`, `refereePlayers[]` (each with `canStartEndMatches`
  and `saveForFutureTournaments`), plus the caller's own `isOwner`, `isAdmin`,
  `isReferee` and `canRefereeStartEndMatches`.
- Uploading a tournament crest and uploading a tournament banner still have **no
  captured request**. The bundle names hooks for them
  (`useDeleteTournamentAvatarMutation`, `useDeleteTournamentBannerMutation`) but a
  hook name is not a path. Do not write one down until it is seen on the wire.

Route literals found in the app bundle but not yet exercised, listed as evidence of
existence only: `/tournaments/:id/selection-label-variant`, `/tournaments/token`,
`/tournaments/:id/presentation/:x/:filename`, `/tournament-subscription/*`
(cancel, portal, resume, finalize-session, payment-method/setup-intent,
payment-method/finalize), `/tournament-phases/:id/king-next-round`,
`/tournament-phases/:id/king-playoffs`, `/tournament-phases/:id/padel-next-round`
(the three padel and King-of-the-Court round runners), and
`/tournament-brackets/:id/schedule`.

### Groups, brackets and phases

**(observed in app, 2026-08-28, while writing the collection 13 brief.)** Every
row below was read off the wire on the tournament Format and Results tabs. They
are what the format board and the phase banner call.

| Method | Path | For | Body / notes |
|---|---|---|---|
| GET | `/tournament-groups?tournamentId=&phaseId=` | Groups in one phase | - |
| POST | `/tournament-groups` | Add a group to a phase | the board's **Group** button |
| PUT | `/tournament-groups/:groupId` | Edit a group, and set its draw | `name`, `teamCount`, `encounters`, `phaseId`, `order`, `teamIds[]`, `teamSources[]`, plus three that only appear from the padel board: `autofillStrategy` (`StrongestFirstCourt`\|`EvenlyMatched`\|`Random`), `replaceExistingDraw`, `clearAssignments`, each sent with `applyToPhase: true` |
| DELETE | `/tournament-groups/:groupId` | Delete a group and its matches | - |
| POST | `/tournament-brackets` | Add a bracket to a phase | the board's **Bracket** button |
| PUT | `/tournament-brackets/:bracketId` | Rename a bracket, change its size | `name`, `teamCount` (2, 4 or 8) |
| DELETE | `/tournament-brackets/:bracketId` | Delete a bracket and its matches | - |
| PATCH | `/tournament-brackets/:bracketId/matches/:tournamentMatchId/participants` | Fill or clear one bracket slot | `{"homeTeamId":"<id>"}` for a real team, `{"homeTeamId":""}` to clear, or `{"homeSource":{...}}` for a placeholder. `awayTeamId` / `awaySource` for the other side |
| PATCH | `/tournament-brackets/:bracketId/matches/:tournamentMatchId/title` | Rename a knockout match | the **Edit match title** dialog |
| GET | `/tournament-phases?tournamentId=&includeCompletion=true` | Phases, with `started` and `canEndPhase` | `canEndPhase` is true when every match in that phase has a score |
| POST | `/tournament-phases` | Add a phase | one click, no dialog. There is no undo - delete the phase instead |
| PUT | `/tournament-phases/:phaseId` | Rename a phase | `name` |
| DELETE | `/tournament-phases/:phaseId` | Delete a phase | only the last phase offers a Delete control in the UI |
| POST | `/tournament-phases/:phaseId/next-phase-preview` | What the next phase would look like | answers `{tieBreakPoints[], assignments[], groupAssignments[]}` |
| POST | `/tournament-phases/:phaseId/start-next-phase` | Start the next phase | - |
| POST | `/tournament-phases/:phaseId/undo-next-phase-start` | Undo that start | restores the placeholder slots and blocks score entry again |
| POST | `/tournament-phases/:phaseId/end-phase` | End the last phase | marks every match in the phase finished |
| GET | `/tournaments/:id/schedule?phaseId=` | Standings for one phase | array of groups, each with `teams[]` carrying `played`, `won`, `points`, `goalsFor` ... and `phaseStarted`, `phaseEnded`, `canEditScores` |
| GET | `/tournaments/:id/schedule/groups/:groupId/matches` | The matches of one group | - |

The `homeSource` object a placeholder slot sends, copied from the wire:

```json
{"homeSource":{"type":"GroupRank","label":"1st Group A","groupId":"<id>",
  "groupName":"Group A","groupLabel":"Group A","rank":1,
  "phaseOrder":0,"groupOrder":1,"swapKey":"rank-1","swapCategory":"group"}}
```

### Recording a tournament result

**(observed in app, 2026-08-28.)**

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/matches/:matchId/status` | Move a match on | `{"status":"Live"}`, then `{"status":"Finished"}` |
| PUT | `/matches/:matchId/score` | Record the score | `homeTeamTotalGoals`, `awayTeamTotalGoals`. Answers `400 "Match must be Live or Finished before tournament results can be entered"` on a Scheduled match, so set the status first |

### The padel format save - it is not a separate endpoint

**(observed in app, 2026-08-28.)** Collection 12 recorded that the two-step padel
Format screen "was never captured on the wire" and left its seed unable to build a
padel fixture. It is a plain `PUT /tournaments/:id`, the same call football's
format save uses, with the padel fields instead:

```json
{"teamIds":[],"teamCount":4,"isComplete":true,
 "padelFormat":"Swiss","padelStandingType":"Team","padelScoringPoints":24,
 "padelRestingPoints":0,"padelWinPoints":3,"padelLossPoints":0,"padelDrawPoints":2,
 "padelMinPlayers":8,"padelMaxPlayers":8,
 "padelRoundCount":4,"padelCourtCount":4,"padelRoundGapMinutes":10}
```

`teamIds` is empty on a first save: the server generates one pair per two players
from `padelMinPlayers` and names them "Player 1 & Player 2" and so on. Re-sending
the same call with different values is what the **Padel Configuration** dialog
does, and it resets and regenerates the scheduled matches.

### The fixture schedule

**(observed in app, 2026-08-28, while writing the collection 14 brief.)** Every
row below was read off the wire on the tournament Schedule tab.

| Method | Path | For | Body / notes |
|---|---|---|---|
| GET | `/tournaments/:id/schedule/brackets/:bracketId/matches` | One bracket's fixtures | answers `{matches:[...]}`. The group equivalent, `.../schedule/groups/:groupId/matches`, answers a bare array |
| GET | `/tournaments/:id/schedule/groups/:groupId/matches?export=true` | The same list, for the fixture export | **EXPORT FIXTURES** refetches every ticked section this way and builds the file in the browser. `?export=true` works on the bracket path too |
| PUT | `/tournament-groups/:groupId` | Bulk-update a group's fixtures | see the payload below. This is the same path that edits a group's name and draw |
| PUT | `/tournament-brackets/:bracketId` | Bulk-update a bracket's fixtures | the same payload. Also the path that renames a bracket |
| PUT | `/matches/:matchId` | Change one fixture | `{"date":"<ISO>"}` from a card's own date or time cell; `pitchNumber` and `refereePlayerId` from the other two cells |
| DELETE | `/matches/:matchId` | Delete a match | in the bundle as `deleteMatch`, behind a **Cancel Match** action on the GENERAL match card. **Not reachable from a tournament fixture**: the Schedule tab's cards have no menu and `/match/:id/preview` is view-only |

The bulk update payload, copied from the wire:

```json
PUT /tournament-groups/6a91aea7c7fe1975d4a61ad8
{"data":{"date":"2026-09-25T23:00:00.000Z","startTime":"09:00",
  "timeZone":"Europe/London","duration":"15 min","timeBetweenMatches":"20 min",
  "sameStartTimePerRound":false}}
```

Every field is optional and only the ones sent are applied; sending none answers
*"Update at least one field before saving fixtures."* The full set is `date`,
`startTime`, `endTime`, `timeZone`, `duration`, `timeBetweenMatches`, `teamSize`,
`clubLocationId`, `refereePlayerId`, `pitchNumber`, `isAutoStartEnable`,
`sameStartTimePerRound`, and `matchIds[]` when the update came from **SELECT
MATCH TO UPDATE** rather than **BULK MATCH UPDATE**. Both buttons open the same
dialog; only `matchIds` differs.

How the times come out:

- **`sameStartTimePerRound: false`** - each kick-off is the previous one plus
  `duration` + `timeBetweenMatches`.
- **`sameStartTimePerRound: true` with a `timeBetweenMatches`** - every match in a
  round shares a kick-off and the next round starts one gap later. The duration is
  not added.
- **`sameStartTimePerRound: true` with no gap** - **every** fixture in the group
  gets the same kick-off time. A football group has no rounds, so the whole group
  counts as one.
- **`endTime`** is a per-day ceiling: when the next kick-off would pass it,
  scheduling moves to the next day and restarts at `startTime`.

**A UI defect worth knowing before you read that table.** The dialog defaults
`sameStartTimePerRound` to **true** and disables both `duration` and
`timeBetweenMatches` while it is true. So the second case above - the one the
checkbox's own help text describes - cannot be reached through the app, only over
the API. Through the UI, ticking the box always produces the third case.

Court and pitch numbers are assigned per match by the **generator**. The bulk
update's `pitchNumber` writes a **single** value across every match it touches, so
it cannot restore a distributed set; only regenerating the format can. Re-sending
an identical padel configuration does not regenerate - a value has to change.

### Team app routes

**(observed in app, 2026-08-29.)** Note the plural: the team pages are all under
`/teams`, while `/team/*` holds the three interstitials.

| Route | Screen |
|---|---|
| `/teams` | **Manage Teams** - your team list, with Add Team and a per-row Invite and menu |
| `/teams/:teamId` | the team page. Tabs are routes: `/player-stats`, `/matches`, `/payment`, `/comments`; Team Info is the bare path |
| `/teams/:teamId/settings` | **Edit Team** - appearance, details, players, leaderboards, delete |
| `/teams/:teamId?shareCode=` | what the team's invitation link opens |
| `/teams/:teamId?inviteCode=` | what one member's own invitation link opens |
| `/team/join` | **Join a team** - the invitations addressed to you |
| `/team/create` | in the route enum; the app creates teams from a dialog on `/teams` |
| `/team/congratulations` | in the route enum; claiming shows a Success dialog in place instead |

The team page's tab labels are upper case by CSS, so their accessible names are
`Team Info`, `Player Stats`, `Matches`, `Payment`, `Comments` - the same
text-transform trap collections 14 and 01 hit on GROUP A and DELETE ACCOUNT.

Somebody who is not on the team sees the page headed **External Team**, with no
Create Match and no Invite Player. An unclaimed team is headed **Unclaimed Team**
and carries **Claim Team**.

### App routes - singular and plural are different pages

**(observed in app, 2026-08-28.)** This trips you up if you skim.

- `/tournaments` - your tournament list.
- `/tournaments/:id/<tab>` - the **organiser board**. Tabs: `participants`,
  `format`, `schedule`, `results`, `leaderboard`, `sponsor`, `presentation`,
  `prizes`, `chat`, plus `settings`, which has no tab and is reached by URL.
- `/tournament/:id/<tab>` - the **public page**. Tabs: `info`, `participants`,
  `standings`, `matches`, `leaderboard`, `chat`. Signed-out visitors land here.

### Publishing, the public page and the presentation

**(observed in app, 2026-09-01, while writing the collection 15 brief.)**

**There is nothing to publish.** `GET /tournaments` returns `isPublic: true` on
every row and no screen in the app carries a control for it. A tournament's
public page exists from the moment the tournament exists - the same shape as
collection 12's finding that there is no `Draft` status.

The public page is genuinely public: a signed-out visitor loading
`/tournament/:id/info` gets the whole page, with `Sign In` where the sidebar
would be. That is unlike the leaderboard and match "public links", which send a
signed-out visitor to `/signin` (see [The "public link" is not
public](#the-public-link-is-not-public) and collection 09).

| Method | Path | For | Body / notes |
|---|---|---|---|
| PUT | `/tournaments/:tournamentId` | Save the whole `presentation` object | `{"presentation":{"website":{...},"slideshows":[...]}}`. **Both** Presentation sub-tabs send the whole object, so neither Save can wipe the other's half by omission |
| POST | `/tournaments/:tournamentId/presentation/gallery` | Upload one info-page picture | multipart, field **`picture`**. Answers the entry to put in `website.gallery` |
| POST | `/tournaments/:tournamentId/presentation/attachments` | Upload one info-page attachment | multipart, field **`attachment`**. Answers the entry to put in `website.attachments`. Any MIME type - a PDF goes through |
| GET | `/tournaments/:tournamentId/presentation/attachments/:filename?download=1` | What an attachment link on the public Info tab points at | the `gallery` path is the same shape |
| GET | `/tournaments/:tournamentId/chat/settings` | Chat settings | answers `{conversationId, announcementOnly, chatEnabled}` |
| PATCH | `/tournaments/:tournamentId/chat/settings` | Announcement-only chat | `{"announcementOnly": true}`. Sent by the CHAT card on the settings page |
| GET | `/tournaments/:tournamentId/follow` | Am I following, and how many do | answers `{followerCount, isFollowing}` |
| POST | `/tournaments/:tournamentId/follow` | Follow | no body. A second call answers `409 {"reason":"Already following this tournament"}`, so read the GET first |

The `presentation` object, copied from the wire:

```json
{"presentation":{
  "website":{"visiblePublicTabs":["info","participants","standings","leaderboard","matches","chat"],
             "infoBody":"","attachments":[],"gallery":[]},
  "slideshows":[{"id":"...","name":"Slide show 1","active":true,
    "showTournamentName":true,"showCurrentTime":false,
    "backgroundColor":"#0f172a","componentBackgroundColor":"#ffffff",
    "slides":[{"id":"...","title":"Welcome","active":true,"durationSeconds":10,
      "components":[{"id":"...","type":"text","text":"...","sponsorIds":[]}]}]}]}}
```

A `gallery` or `attachments` entry, as the upload hands it back. The `id` and the
hex prefix on `filename` are generated by the server, so a seed cannot write
these deterministically - it has to upload, and should therefore only upload when
the list is empty:

```json
{"id":"8a32179ecb8b4997","filename":"b4e59b35_astro-sports.webp",
 "originalFilename":"astro-sports.webp","mimeType":"image/webp","size":17636}
```

- **`visiblePublicTabs`** are the six switches on the Website sub-tab. Unticking
  one and saving removes that tab from the public tab strip - verified both ways.
- **`infoBody`, `gallery` and `attachments` are edited too**, on a second screen
  that is easy to miss: the **Info** row of the Website sub-tab carries a 16-pixel
  pencil whose only accessible name is `aria-label="Edit info page"`. There is no
  visible text on it and `getByText` finds nothing. It replaces the card in place
  (it is not a dialog) with **Page with tournament information**:
  - **Description** - a textarea, `maxlength=200`, placeholder "Welcome your
    visitors with a custom introduction." This is `infoBody`.
  - **Pictures** - "Images shown on the public website." with **Add a picture**
    over a hidden `input[type=file][accept="image/*"]`. This is `gallery`.
  - **Attachments** - "Files available for download on the public site." with
    **Add an attachment** over a hidden `input[type=file]` with **no accept
    filter at all**, so it takes any type.

  All three land on the public Info tab, above the info tiles: the description as
  a line of prose, then a **Gallery** section, then an **Attachments** section
  whose entries are download links (the filename renders upper case by CSS).
- **The component `type` enum**, quoted back by the server's own validator:
  `'text' | 'group' | 'bracket' | 'sponsor' | 'ranking' | 'qrCode' |
  'upcomingMatches'`. Note the singular **`sponsor`** - the editor's button reads
  Sponsors and sending `"sponsors"` is refused with `SCHEMA_VALIDATION_ERROR`.
- Required extra fields per type: `text` needs `text` (the textarea is
  `maxlength=200`), `group` needs `groupId` and `displayMode` (`both`), `bracket`
  needs `bracketId`, `sponsor` needs a non-empty `sponsorIds`. The editor refuses
  to save the whole slideshow while any one component is missing its own, and
  names them - *"Slide show 1, slide 1, component 5 needs a group."*
- Slide and component ids are generated in the browser from a timestamp and a
  random suffix. A seed writing this object directly should use fixed strings
  instead; the server takes whatever it is given.
- A tournament with no saved slideshow still shows a **draft** "Slide show 1"
  with one empty Text slide in the editor. It is client-side only: until Save,
  `slideshows` is `[]`.

App routes this section adds:

| Route | Screen |
|---|---|
| `/tournament/:id/slideshow` and `/tournament/:id/slideshow/:n` | the public fullscreen slide show. `:n` picks which slide show. With none saved it reads "No active slides available." |
| `/tournaments/:id/info` | where a signed-in **non**-owner is redirected off the board - the same six-tab public page, inside the signed-in shell |
| `/tournaments/token/:token` | a tournament access link. Anything that is not a real token renders **"This tournament access link is invalid or expired."** No screen in the organiser board produces one - see `briefs/15.md`, "Unreachable" |

The public page's own auth guard, read out of the app bundle, allows these tabs
with no session:
`info|participants|matches|standings|leaderboard|chat|teams|players|referees|slideshow(/:n)`.
`teams`, `players` and `referees` are the Participants sub-tabs.

### Recording a tournament result, from the Results tab

**(observed in app, 2026-09-01.)** [Recording a tournament
result](#recording-a-tournament-result) above gives the two calls. This is what
the Results tab does with them, and it settles the "score entry is UNVERIFIED"
note `config/articles.yaml` carries against 15.8.

A fixture card on **Results** has three states:

1. **Scheduled** - the badge reads `Scheduled`, the two teams are separated by
   `VS`, and the card carries **START** and **View**. There are no score boxes.
2. **Live** - after START (`POST /matches/:id/status {"status":"Live"}`) the badge
   reads `Live`, the button becomes **END**, and `VS` is replaced by two empty
   score boxes.
3. **Ended** - after END (`{"status":"Finished"}`) the badge reads `Ended` and a
   trophy marks the winner. The score boxes stay editable.

Typing in a score box fires `PUT /matches/:matchId/score` on its own - there is
no Save button and no confirmation, and neither START nor END is confirmed
either.

**Ending the PHASE is what closes score entry.** After
`POST /tournament-phases/:phaseId/end-phase` the cards lose their score boxes
entirely (the score becomes plain text), START and END are gone, and the phase
banner disappears. `GET /tournament-phases?...&includeCompletion=true` marks the
phase with `endedAt` and `canEditScores: false`; there is **no `ended` boolean**,
and a phase's id is keyed `_id`, not `id`.

**A played fixture cannot be put back.**
`POST /matches/:id/status {"status":"Scheduled"}` answers
`400 {"reason":"Cannot update status of a Finished match"}`, and there is no
reset endpoint in the collection or on the wire. What does work is making the
generator rebuild the group: `PUT /tournament-groups/:groupId {teamCount}` to one
more and straight back regenerates its matches, and they come back with the same
teams, the same pairings in the same order, the same kick-off times, and every
card Scheduled with no score. That is how a spec that scores a fixture puts it
back.

Padel differs on Results in one visible way: the fixtures are grouped under
`ROUND 1`, `ROUND 2` ... and the page carries a **RULES AND REGULATIONS** panel
listing the format's rules. Football's Results tab has no such panel.

### The Prizes tab is a Winner panel, and its picker does not work

**(observed in app, 2026-09-01.)** The board tab labelled **PRIZES** holds no
prizes. It is headed **Winner** - *"Choose the team that should be saved as the
tournament winner."* - with a `CURRENT WINNER` panel reading *"No winner has been
selected yet."* and a **Set Winner** button. The app's own i18n for this tab
carries `setWinner`, `changeWinner`, `resetWinner`, `selectWinner`, `saveWinner`,
`unranked` and `noTeams`. There is no prize string anywhere in it.

**Set Winner opens a dialog whose picker records nothing.** *Select winner* holds
one Radix Select of the tournament's teams, in standings order. Clicking an
option leaves the trigger reading "Select a team", leaves the hidden native
select's value empty, and leaves **Save Winner** disabled - so a winner can never
be saved. Established rather than guessed:

- the option receives a full, trusted event sequence -
  `pointermove, pointerdown, mousedown, pointerup, mouseup, click`, every one
  `isTrusted: true` - and the listbox does not even close;
- the items are not disabled (`data-disabled` is null on every one);
- it fails the same way on a tournament with real standings as on one with none;
- **the control test passes**: the Group component's own "Select group" Radix
  Select, on the same board, in the slideshow editor, takes the identical click
  and moves from "Select group" to "Group A".

`GET /tournaments/:id` carries `winnerTeam: null`. No request is made when Save
Winner is pressed, because it cannot be pressed, so **the call that saves a
winner has never been seen** - do not write one down.

### Tournament sponsors

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/tournaments/:tournamentId/sponsors` | Add a sponsor | `name`; optional `description`, `link`, `bannerToken` |
| PATCH | `/tournaments/:tournamentId/sponsors/:sponsorId` | Edit a sponsor | same fields, all optional |
| GET | `/tournaments/:tournamentId/sponsors` | List sponsors | - |
| DELETE | `/tournaments/:tournamentId/sponsors/:sponsorId` | Remove a sponsor | - |
| POST | `/tournaments/:tournamentId/sponsors/banner` | Upload a sponsor banner, returns a token | multipart, field `banner` |
| GET | `/tournaments/:tournamentId/sponsors/banner?v=` | Fetch the sponsor banner | - |

## Membership, plans and the Free-plan limits

**(observed in app, 2026-08-29.)** Everything in this section was read off the
live staging app and confirmed one call at a time. Collection 04 documents it.

### The plans screen

`/subscriptions` is an app route with two tabs.

| Tab | What it is | Who documents it |
|---|---|---|
| **Platform Pro** | the account's own membership: BASIC (free) and PRO (free with Beta) | collection 04 |
| **Tournament Pro** | per-tournament plans, in real money - GBP 19.99 / 215, EUR 22.99 / 248, USD | collection 16 |

Read the two tabs as separate products. "Pro is free" is true of Platform Pro and
false of Tournament Pro.

The card content is **not** served by the Scoryboard API. The app fetches it from
its own Next route, `GET /api/prismic/subscription-plans` on `$SCORYBOARD_APP_BASE`,
which answers `{platformPlans, tournamentPlansByCurrency}` from Prismic. So the
plan copy can change without a deploy. `lib/fixtures-04.mjs` pins every line and
collection 04's specs assert against it.

The free plan is called **BASIC** on this screen and **Free** everywhere else in
the app and the API (`membership: "Free"`). The Pro card's price is
`FREE (with Beta)`; the active-plan strip renders `Pro`, `Free with`, `Beta`
in mixed case and upper-cases them with CSS - the same text-transform trap as
GROUP A and DELETE ACCOUNT.

### Upgrading and cancelling

Both directions are `POST /users/subscription` and **neither asks for
confirmation**.

- **Upgrade to PRO** turns the account Pro on the click and opens a
  Congratulations window: "Congratulations, you are now a Pro member! Enjoy all
  the cool features for FREE while we are still in Beta." The Pro card's button
  then reads "You are now a Pro member" and is spent.
- **Cancel subscription** appears in the active-plan strip once you are Pro. It
  downgrades on the click, with no dialog and no toast.
- The sidebar's Subscriptions item gains a small Pro mark while the account is Pro.

There is no payment step in either direction while the beta lasts.
`POST /admins/change-user-membership/:id` does the same thing with the admin key,
which is the only way a spec can put an upgraded account back.

### MembershipLimits - the eight error codes

The app's own `MembershipLimits` enum, complete:

| Error code | Raised by | Modal title |
|---|---|---|
| `USER_FREE_LIMIT_EXCEEDED` | `POST /friends` at 14 | Friend Limit Reached |
| `FRIEND_LIMIT_EXCEEDED` | `POST /team-players` with a `name` at 14 | Friend Limit Reached |
| `ONE_FRIEND_PER_TEAM` | `POST /team-players` for a friend already on one of your teams | Team Limit Reached |
| `ADMIN_TEAM_OWNER_FRIEND_LIMIT_EXCEEDED` | the team owner is over their own limit | Team Limit Reached |
| `TEAM_ADMIN_LIMIT_EXCEEDED` | `POST /team-players` with `role: "Administrator"` | Team Limit Reached |
| `LEADERBOARD_CREATION_LIMIT_EXCEEDED` | `POST /leaderboards` when you already own one | Leaderboard Limit Reached |
| `LEADERBOARD_ADMIN_LIMIT_EXCEEDED` | `POST /leaderboards/:id/admin` | Leaderboard Admin Limit Reached |
| `CHAT_PRO_REQUIRED` | reading an incoming message in full | Unlock full chat with Pro |

**The modal does not show the API's wording.** It is keyed off the error code and
renders the app's own i18n string, and the two differ - the API says "upgrade to
Pro", the modal says "upgrade to **Pro Membership**". Quote the modal: that is
what the reader sees. Every one of these modals carries the same
**FREE Upgrade (Beta)** button, which upgrades the account in place.

Three more Pro gates are client-side and have no error code: **Unlock Compare
with Pro**, **Unlock Profile Views** and the substitute and match-media limits.

### The Free limits themselves

| Limit | Free | Pro |
|---|---|---|
| Friends in your friends list | 14 | unlimited |
| The same friend on more than one of your teams | one team each | any number |
| Teams you own | no limit | no limit |
| Administrators on a team | none, Owner only | more than one |
| Leaderboards you own | 1 | unlimited |
| Administrators on a leaderboard | none, Owner only | more than one |
| Substitutes in a lineup | 3 | unlimited |
| Compare your stats with another player | blocked | yes |
| The list of who viewed your profile | blocked, the count only | yes |
| Reading incoming chat in full, and attachments | blocked | yes |
| Photos and video on a match feed | blocked | unlimited |
| Adverts | shown | none |

A **new account is born with one leaderboard and two teams** (`<First>'s
leaderboard`, `<First> K FC`, `<First> K FC Away`; the team names gain a date
suffix when they clash). So the leaderboard limit is already reached the moment
an account exists.

### Profile views

`GET /players/:playerId` **as somebody else records a profile view.** The count
went 0 to 1 on the first such read and stayed at 1 on the second, so it dedupes
by viewer. That is the only way found to seed one.

| Method | Path | For |
|---|---|---|
| GET | `/profile-view/player/:playerId/count` | `{viewCount}` - readable on Free |
| GET | `/profile-view/player/:playerId/viewers` | the list. On Free: `400 "user does not have permission"`, `permission: "Pro membership is required to view profile viewers"` |

The counter in the profile header is a control only on your **own** profile and
only while the count is above zero - the bundle gates the click on
`isSelfProfile && (isPro || viewCount)`. At 1440 wide the clickable target is the
**Views** tile in the counters row; the small "N views" button beside the rating
is the narrow-layout copy and has a zero-sized box.

### Tournament Pro - a different product on the same screen

**(observed in app, 2026-08-29.)** REAL MONEY. Collection 16 was retired into
collection 04 on the same day; 04.4 to 04.6 document this, and every capture
stops before the payment gateway.

**The Basic team limit is 8, and the plan card says 5.** The BASIC card
advertises "Up to 5 teams". What the app enforces is:

- `Tournament Pro is required to add more than 8 teams to a group.`
- `Tournament Pro is required to add more than 8 teams to a bracket.`

Basic is stopped at two more places, each with its own message:

- `Tournament Pro is required to manage sponsors.`
- `Tournament Pro is required to export fixtures.`

Prices are quoted **per currency**, not converted at checkout. From
`GET /api/prismic/subscription-plans`:

| Plan | Covers | GBP | EUR | USD |
|---|---|---|---|---|
| Basic | every tournament, always | free | free | free |
| Pro | one tournament | 19.99 | 22.99 | 24.99 |
| Annual | unlimited tournaments for a year | 215 | 248 | - |

Two Pro lines carry a "Coming soon" marker and are not shipped: "Request joining
fee" and "Registration".

The currency control is a dropdown **menu**, not a select: its items are
`menuitemradio`, not `option`.

### Buying it, and where Scoryboard stops

| Method | Path | For |
|---|---|---|
| POST | `/tournaments/:tournamentId/billing/checkout-session` | Start a Pro checkout for ONE tournament. Body `{plan, currency, returnUrlBase}` |
| POST | `/tournaments/:tournamentId/billing/finalize-session` | Finish it. Body `{sessionId}` |
| POST | `/users/tournament-subscription/checkout-session` | Start an Annual checkout. Body `{currency}` |
| POST | `/users/tournament-subscription/cancel` | Cancel Annual |
| POST | `/users/tournament-subscription/resume` | Resume a cancelled Annual |
| POST | `/users/tournament-subscription/payment-method/setup-intent` | Change the card on Annual |
| POST | `/users/tournament-subscription/payment-method/finalize` | Finish that. Body `{setupIntentId}` |

**Pro is bought for one named tournament.** Selecting "Start with PRO" opens
**Choose a Tournament for PRO**, which lists only tournaments whose
`pricingPlan` is `Basic`, with a search box and a New Tournament button. With
none it reads "No Basic tournaments available / Create a tournament to continue
with the Tournament Pro upgrade." **Annual** is bought from its card with nothing
to pick, because it covers every tournament while active.

**Both hand off to Stripe, and that is where this project stops.**
"Continue with PRO" posts the checkout session above; "Start with ANNUAL" swaps
the plans area for a Stripe `embedded-checkout` iframe inside a Scoryboard panel
headed "Tournament Pro", with "Back to plans" and "All upgrades are subject to
our terms of use." Everything inside that panel is Stripe - confirmed by reading
the frame list. No spec selects either control.

The four Annual management calls are recorded here because the bundle names
them. **The screens that carry them were never seen**: they only render once an
Annual subscription is active, which needs a completed payment.

### Free Tournament Pro slots

`POST /admins/users/tournament-free-pro/grant` (admin key) replaces the paywall
with an allowance panel on the Tournament Pro tab:

> **Free Tournament Pro slots remaining**
> Your next N tournaments will automatically get Tournament Pro at no extra cost.

**Confirmed on staging 2026-08-29**, by creating a tournament on an account with
two slots and then putting it back:

- `POST /tournaments` answers `pricingPlan: "Pro"` immediately. There is no
  checkout, no session and no upgrade call - the tournament is Pro from the
  moment it exists;
- `freeTournamentProAllowanceRemaining` drops on that create, 2 to 1;
- **deleting the tournament does NOT return the slot.** It stayed at 1;
- the panel renders `...Remaining`, not `...Total`: after topping the account
  back up the total read 3 and the panel still said 2.

So a slot is spent by CREATING, never by upgrading, and the spend is one-way.
`GET /users/me` reports `freeTournamentProAllowanceTotal` and
`freeTournamentProAllowanceRemaining`. The grant is additive and there is no
revoke, so an account that has ever held one can never show the paywall again -
seed the two cases into two addresses.

### A tournament's own plan

`GET /tournaments` returns `pricingPlan` on each row: `Basic`, `Pro` or `Annual`.
A new tournament is `Basic`. `PATCH /tournaments/:id/config` as written in this
file answers **404 "Cannot PATCH"** on a tournament that has not been through the
wizard - collections 12 to 15 own that flow; collection 04 never touched it.

### Routes this section adds

| Route | Screen |
|---|---|
| `/subscriptions` | Subscriptions - Platform Pro and Tournament Pro |
| `/leaderboards/:leaderboardId/settings` | Edit Leaderboard - appearance, roles, teams, delete |
| `/subscriptions` (Tournament Pro tab) | the paid, per-tournament plans |

## Partner bookings (Powerleague / CentreNet) - admin key

A booking made on a partner system becomes a Scoryboard match.

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/bookings` | Create a booking, returns the Scoryboard redirect URL | `bookingId`, `teamSize`, `duration`, `date`, `tag`, `club{name, location, sourceId}`, `homeTeamName`, `awayTeamName`, `homeTeamSourceId`, `awayTeamSourceId`, `leagueName`, `leagueId`, `gameId`, `refereeId`, `user{name, lastName, email}`, `sourcePlatform{type, version}` |
| GET | `/bookings/:bookingId` | Read a booking | - |
| PUT | `/bookings/:bookingId` | Change date, venue, duration or team size | `date`, `club{...}`, `duration`, `teamSize` |
| DELETE | `/bookings/:bookingId` | Cancel a booking | - |
| PUT | `/bookings/:bookingId/goals` | Referee-entered score | `TeamScore` (home), `VisitingTeamScore` (away) |
| PUT | `/bookings/:bookingId/goals/migrate` | Backfill goals | same fields |

Two partner-side URLs also appear in the collection, on
`centrenet.preprod.powerleague.com` rather than our API:
`POST /CentreNetWS/web/WebService/Referee/:id/Scores` and
`GET /CentreNetExt/web/Webservice/League/:leagueId/Tables`. Do not call these.

## Activity feed

| Method | Path | For |
|---|---|---|
| GET | `/activities` | Trending and activity feed. `page`, `limit`; filters `referenceType`, `teamId`, `leaderboardId`, `tournamentId` |

**(observed in app, 2026-09-03, by collection 20.)**

**Paging is `page` and `limit`, not `skip`** - the strip fetches ten at a time
and appends. `referenceType` is an eight-value enum the API names in its own
error: `match | team | player | leaderboard | user | friend | comment |
tournament`.

**Nothing in the app sends any of the four filters.** The feed is the
**Trending** strip, rendered by one component that takes a `query` prop which
becomes those parameters - and no caller passes one. Swept across 65 chunks
pulled from every route in the app's own `Routes` enum, the component is used
twice and both times as
`<Trending containerClassName="rounded-lg border bg-white p-3" />`: once in the
football profile layout, once in the padel one. There is no filter control on
any screen. `/activities` is not an app route either; it answers 404.

**The feed is platform-wide.** Every team created and every match finished on
staging is in it, other collections' fixtures and other people's accounts
included, and there is no "mine only" parameter. A spec that photographs it has
to narrow it - collection 02's article 02.1 and collection 20's 20.4 both route
the request and keep only their own rows.

**The strip scrolls itself every 2.5 seconds.** A `setTimeout` in the carousel
hook calls `scrollTo` on the list, advances its own `activeIndex` and
reschedules, and it keeps doing that under a frozen `Date.now()`. Measured:
scrollLeft 0, 399, 797, 1196 over three intervals. `lib/kb.ts`'s
`stopTrendingAutoAdvance()` drops timers asked for at exactly that delay; 2500
appears once in the whole bundle.

An activity type has an emoji: `MatchLive` ⚽, `MatchInvitation` 📣,
`MatchSummary` 📊, `MatchFinished` 🏁, `MatchTeamWon` 🏆, `PlayerJoinedTeam` 🤝,
`TeamCreated` 🆕, `TournamentCreated` 🏟️, `UserJoinedPlatform` 🚀,
`PlayerOfMatch` ⭐, `PlayerFollow` 👤, `TeamFollow` ⭐.

Feature flag: `TRENDING_FEATURE_ENABLED`, and it is **`true`**. The component
renders `null` when it is not.

## In-app promotional campaigns

User side:

| Method | Path | For | Body / notes |
|---|---|---|---|
| GET | `/promo-campaigns/active?screen=` | Campaigns for one screen | `screen`: `Home`, `Profile`, `Leaderboard`, `Match`, `Player`, `Team`, `Tournament` |
| POST | `/promo-campaigns/:id/interactions` | Record a dismiss or an enter | `action`: `Dismiss` or `Enter`; `screen` |
| GET | `/promo-campaigns/:id/image?v=` | Campaign image | - |

Admin side (**admin key**): `POST /admins/promo-campaigns`,
`PUT /admins/promo-campaigns/:id`, `DELETE /admins/promo-campaigns/:id`,
`POST /admins/promo-campaigns/image` (multipart, field `banner`),
`GET /admins/promo-campaigns/report` (`campaignId`, `status`, `startDate`,
`endDate`, `format`).

## Admin and back-office - admin key

These four are the seeding surface this project depends on:

| Method | Path | For | Body |
|---|---|---|---|
| POST | `/admins/users` | Create a persona, skipping email verification | `name`, `lastName`, `email`. **(observed 2026-09-03)** It also creates **two teams and a leaderboard**, sends a "Welcome to Scoryboard, set your password" email, and sets `isMarketingOpted: true` and `isEmailVerified: true`. Team names gain a date suffix when they clash - `Ollie K FC 0309` |
| POST | `/admins/generate-signin-token` | Mint a session for any user | `email` |
| POST | `/admins/change-user-membership/:id` | Flip that user Free / Pro | `membership`: `Free` or `Pro` |
| POST | `/admins/users/tournament-free-pro/grant` | Grant Tournament Pro, no Stripe | `email`, `plan` (`Pro`), `quantity`. **(observed 2026-08-28)** The grant is **additive, not a set** - calling it twice with `quantity: 2` leaves an allowance of 4. There is no revoke. Read `freeTournamentProAllowanceRemaining` from `GET /users/me` and only top up the shortfall |

Also available:

| Method | Path | For | Body / notes |
|---|---|---|---|
| DELETE | `/admins/user-delete/:id` | Delete any user | - |
| POST | `/admins/users/tournament-annual/whitelist` | Whitelist Tournament Annual | `plan`, `expiryDate`, `emails[]` |
| POST | `/admins/tournaments/backfill-pro` | Backfill Pro tournaments | `dryRun` |
| POST | `/admins/chat/reports/:reportId/delete-message` | Resolve a chat report | `status`: `resolved` or `rejected`; `resolutionNote` |
| GET | `/admins/users-team-match-report` | Users, teams and matches report | - |
| GET | `/admins/manage-my-team-report` | Manage-my-team report | `startDate`, `endDate`, `format` (`csv`) |
| GET | `/admins/conversions` | Signup conversions | `since`, `format` |

Migrations and backfills - **destructive and tenant-wide. Never run these**:
`PUT /admins/update-missing-tags`, `POST /admins/migrate-leaderboard-team`,
`POST /admins/migrate-team-mates-invites`, `POST /admins/migrate-default-teams`,
`POST /admins/migrate-user-membership-pro`,
`POST /admins/remove-multiple-team-ownership`,
`POST /admins/migrate-team-players-to-team-owner-friend-list`,
`POST /admins/backfill-team-size`,
`POST /admins/tournaments/backfill-created-activities`,
`POST /admin/backfill-chat-summary-is-hidden` (note the singular `/admin`, as in
the collection).

## Troubleshooting and policies

**(observed in app, 2026-09-04, by collection 24.)** Everything here was read off
the wire and off the screen. Nothing is new endpoints; it is what the existing
ones do at their edges.

### Language filtering - a server-side mask

There is no word filter in the browser: the bundle swept from every route holds
no word list and no filter library. The API does it, and it **masks rather than
refuses**. Every write below answered `200` and stored the word as asterisks, one
per letter, and every read returns the masked form:

| Write | Sent | Stored |
|---|---|---|
| `POST /comments` | `This is fucking shit, you bastard` | `This is ****ing ****, you *******` |
| `PUT /teams/:id {name}` | `Shit FC` | `**** FC` |
| `PUT /teams/:id {bio}` | `fuck off wankers` | `**** off ****ers` |
| `PUT /users/:id {bio}` | `shit fuck damn` | `**** **** damn` |
| `POST /friends {name}` | `Fucker McShit` | `****er Mc****` |
| `POST /chats/conversations/:id/messages {text}` | `you fucking shit` | `you ****ing ****` |

"damn" and "bloody hell" pass. The list is the server's and is not published.
The UI shows the stored form as soon as the write answers, so a reader who types
a swear word into a comment sees the asterisks come back on Comment.

### Upload limits - the server's, measured

The page caption reads "JPG, GIF or PNG. 3MB max." under every picture control,
the cropper re-encodes to WebP and checks 3MB, and the server has its own limit
that the caption does not know about. Bisected with incompressible lossless
WebPs on Marc's account:

| Endpoint | Largest accepted | Smallest refused | Limit |
|---|---|---|---|
| `POST /players/avatar`, `POST /teams/avatar` | 66KB | 117KB | **~100KB** |
| `POST /players/:id/banner`, `POST /teams/:id/banner` | 2.98MB | 3.10MB | **3MB** |
| `POST /comments/media` | 1.92MB | 2.02MB | **2MB** |

The refusal is `413 {"error":"File too large"}`. `POST /comments/media` with an
8MB file answers `500 "Internal Server Error"` instead - worth a ticket. A PNG on
`/players/avatar` is still `415 "Unsupported file type"` (WebP only, as recorded
under Players); `/comments/media` takes PNG.

The browser's own checks, read off the bundle and confirmed on screen:

- **The comment composer** (team and leaderboard pages, `accept="image/*"`,
  multiple) and **the match feed's Add comment window** (`accept="image/*,video/*"`,
  multiple, Pro only) share one uploader. It divides the size by 1048576 and
  refuses at **3 for an image and 200 for a video**, before any request, with
  `File exceeds 3 MB: <name>` / `File exceeds 200 MB: <name>`. Whether a file is
  a video is decided from its MIME type or its extension (`m4v mov mp4 qt webm`).
  A file that passes is POSTed, and a server refusal is printed as the server's
  own words: **"File too large"**, **"Unsupported file type"**. So on a comment a
  **2.5MB photo passes the browser and fails the server** - a gap a reader hits
  with an ordinary phone photo.
- **The crest and banner croppers** (`getCroppedImg` to `image/webp`, banners at
  1728 x 613 or 1728 x 672) check the WebP they produce against 3MB and say
  "Image size must be less than 3MB". The avatar crop normally comes out far
  under the server's 100KB, which is why that limit is rarely seen.
- **The match banner's cropper checks 3MB and says "Image size must be less than
  1MB."** A copy defect; the real limit is 3MB on both sides.
- **`uploadImageFile`** in the bundle refuses 1MB for anything whose field is
  not `banner`. Every live caller - tournament banner, sponsor banner, match
  banner - uploads a banner, so the 1MB branch is dead code. It is where the
  map's "1MB avatars and logos" came from; the number is not enforced anywhere
  a reader can reach.
- The presentation slideshow's background (collection 15) has its own check:
  "Please upload a JPG, PNG, WEBP, or GIF image." / "Image size must be less
  than 3MB."

### The screens a refusal produces

| Where | What renders | Underneath |
|---|---|---|
| `/teams/:id/settings`, not Owner or Administrator | **Access Denied** / "You are not allowed to edit this team." / "Only team owners and administrators can access team settings." Inside the normal frame, no redirect | no write; the app decides from `GET /teams/:id` (`isTeamManager: false`) |
| `/teams/:id`, a dummy team you do not own | **DUMMY TEAM** / "This team is dummy, and you don't have permission to view it." / Back to Teams. Replaces the whole team page; the name is not shown | `GET /teams/:id` answers 200 with `isPrivate: true` |
| `/teams/:id/settings` as an Administrator | the whole Edit Team page, **Delete Team `disabled`** | `DELETE /teams/:id` -> `403 "Only team Owner can delete team"` |
| `/matches/:id`, on neither team's staff | headed **Match Preview (View Only)**; no START MATCH, Add Note, Request Payment or PAYMENT tab. The list-card button reads **Match Preview** | reads only |
| `/leaderboards/:id/settings`, no role | **the error boundary** - "This page couldn't load" (U+2019) / "Reload to try again, or go back." / Reload / Back, on a bare page (`html#__next_error__`, no sidebar, no footer) | `GET /leaderboards/:id/teams` -> `403 "Only leaderboard administrators can view teams in this leaderboard"`, unhandled |
| a route the app does not have | **Page not found** / "The page you are looking for does not exist." / Go back to the homepage. Header and footer, no sidebar | the `notFound` catalogue entry |
| `/teams/:id`, `/leaderboards/:id`, `/tournament/:id`, `/player/:id` with an id nothing has | **Team / Leaderboard / Tournament / Player Not Found**, "The <thing> you are looking for does not exist.", a Back button, inside the normal frame | the entity GET answers 404 (`/tournaments/:id/follow` also answers **500**) |
| `/matches/:id` with an id nothing has | **nothing** - the match shell with its tab strip and empty cards. No Not Found state. Worth a ticket | `GET /matches/:id` -> 404, unhandled |
| `/tournament/:id/settings`, no role | silent redirect to `/` (briefs/12.md) | - |

The error boundary's other string, "A server error occurred. Reload to try
again.", is rendered when the boundary catches a server component error; it was
not produced on staging.

### The legal links

`scoryboardLegalInfo` in the bundle: `privacyPolicy: https://scoryboard.com/privacy-policy/`,
`tandc: https://scoryboard.com/terms/`, `faq: https://scoryboard.com/faq/`. All
three answer 200. The footer of every page, signed in or out, links the first two
as **Privacy Policy** and **Terms of Service**; the `/personalInfo` sign-up step
links them as "Scoryboard Terms of Conditions" and "Privacy Policy." under its
consent tick box ("You must accept the Terms and Conditions and Privacy Policy."
when left unticked). `GET /users/me` carries `isTNCAccepted`, `true` on every
admin-created account.

## Misc

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/contacts` | Contact-us email | `name`, `email`, `subject`, `message` |
| GET | `/padellevels/results?days=` | Padel Levels results (**admin key**) | - |
| GET | `/marketings/conversions` | Conversions for the marketing team (**admin key**) | `since`, `format` |
| POST | `/webhooks/prismic/deploy` | Prismic deploy trigger, header `x-prismic-webhook-secret` | - |

---

## Not in the collection

Read this section correctly: these features have **no request in the Postman
collection**. That is a fact about the collection, not about the product. The
collection is a contractor-access working set - 218 hand-curated requests, not a
generated route list - and the app plainly calls endpoints it does not contain.
Three found by reading the web app bundle, none of them in the collection:
`/online/users/:uid/...`, `/tournaments/:id/selection-label-variant`,
`/tournaments/token`.

So the job here is recovery, not invention. In step 1, drive the flow in the
browser with the network log recording, and read the real method, path and body off
the wire. Then append what you observed to the relevant group above, marked
`(observed in app, not in collection)` with the date. An observed request is
evidence. A path you reasoned your way to is not - never write one down.

One likely exception. The bundle references `firestore.googleapis`, `WebSocket`,
`wss://` and a Firebase Realtime Database URL, and `/online/users/:uid` has the
shape of an RTDB presence path. Chat may therefore have no REST surface at all -
Firestore for messages, RTDB for presence - which would explain why the collection
holds only the admin chat-report resolver. **Answered 2026-09-02, and the guess
was half right.** Firestore does carry the live message read and the RTDB does
carry presence - but there is also a full REST surface for every write, so chat
fixtures are seeded over the API, not through the UI. See
[Chat and messaging](#chat-and-messaging).

- ~~**Chat and messaging** (collection 18)~~ - found 2026-09-02. Nineteen
  `/chats` endpoints, all ordinary bearer-token REST, recovered from the app
  bundle and exercised against staging. They are recorded under
  [Chat and messaging](#chat-and-messaging). Chat is neither a separate service
  nor socket-only: Firestore carries the live read, the Realtime Database carries
  presence, and every write is REST. **Still missing:** nothing marks a message
  as read per person - `memberState[uid].lastReadAt` is the whole of it, and
  there is no per-message read receipt in the API or on any screen.
- **Tournament plans and payment** (collection 16) - Basic, Pro, Annual; upgrade
  and subscription management. Only the admin grant and whitelist exist.
- ~~**Tournament publishing and running** (collection 15)~~ - mostly found
  2026-09-01. There is no publish call because there is nothing to publish
  (`isPublic` is already true), the share dialog builds its link and QR code in
  the browser, and the presentation editor, the slide shows and the public tab
  switches are all one `PUT /tournaments/:id {presentation}`. Follow, chat
  settings and the Results tab's score entry are all recorded above. **Still
  missing:** the call that saves a tournament WINNER - its picker cannot be
  completed, so no request has ever been seen (see [The Prizes
  tab](#the-prizes-tab-is-a-winner-panel-and-its-picker-does-not-work)) - and
  whatever mints a `/tournaments/token/:token` access link. Neither is written
  down, because neither has been observed.
- **Tournament groups, brackets and phases** (collection 13) - group edit and
  delete, bracket rounds, phase preview, start, end and undo. Only `PATCH /config`
  and `PATCH /schedule` exist.
- ~~**Fixture PDF export**~~ - found 2026-08-28. There is no export endpoint: the
  app refetches each section with `?export=true` and builds the PDF or Excel file
  in the browser. See [The fixture schedule](#the-fixture-schedule).
- ~~**Payment request creation and editing** (17.4 to 17.7)~~ - found 2026-09-01.
  `POST /payments`, `PUT /payments/:id` and `DELETE /payments/:id`, with the body
  and the fee arithmetic, are all recorded under
  [Payments](#payments-stripe-connect---real-money). **Still missing:** nothing
  refunds a payment. There is no refund endpoint in the bundle and no refund
  control on any screen, so 17.9 documents refunds as a support request rather
  than a self-serve action.
- **Comment edit and delete** (19.2).
- ~~**Match penalties and final-score entry** (10.6).~~ Found 2026-09-01: there is
  nothing to find. An ordinary match has no penalty control and no typed score
  field - the score is the `+` / `-` steppers, and both `isPenalty` and
  `hasScoreEntry` are tournament-match fields. See
  [The match lifecycle](#the-match-lifecycle---what-starts-a-match-and-what-ends-it).
- ~~**Notification filters and the unread badge** (collection 20)~~ - answered
  2026-09-03. `type` works, `isRead` does not, nothing in the app sends either,
  and the badge is a Firestore document rather than an endpoint. All of it is
  under [Notifications](#notifications). **Still missing:** nothing produces
  `ChatMessageSummary` or `MatchReviewRequest` on demand - both look like
  scheduled digests - and `TournamentUpdate` needs a tournament phase ended with
  the "notify followers" option, which is collections 13 and 15.
- **Referee registration and availability** (21.1, 21.4).
- **Global search** across players and teams (02.2). Only `/team-players/search`
  and the per-resource searches exist.
- **Embeddable trending-matches widget** (02.6).
- ~~**Upload limits** (24.2) - enforced server-side; no endpoint states them.~~
  Measured 2026-09-04 by bisection. See
  [Troubleshooting and policies](#troubleshooting-and-policies).
