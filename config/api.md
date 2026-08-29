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
    `/admins/*`, all of `/bookings/*`, `/matches/:id/facts`, `/padellevels/*`,
    `/marketings/*` and `/tournaments/create/centernet`. 36 endpoints in total.
    No user token needed.
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

**(observed in app, 2026-08-29)** **`GET /friends` excludes a friend who has
joined one of your teams**, and the Free limit of 14 is measured against that
same filtered list. So adding a friend to a team frees a slot: an account with
14 in the list plus one on a team accepts a fifteenth friend record. Isolated on
staging by adding a friend to a team, watching `GET /friends` drop from 14 to 13,
and then adding another successfully.

A friend row carries two ids and they are not interchangeable:

| Field | What it is | Used by |
|---|---|---|
| `id` | the friend record | `PUT /friends/:id`, `DELETE /friends/:id` |
| `friendPlayerId` | the player behind it | `POST /team-players {"playerId": ...}` |


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

## Comments and likes

One comment API serves every entity. The only `commentType` the collection shows is
`leaderboard`. TODO: confirm the values for match, team, player and tournament
before writing collection 19.

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

Comment edit and delete are not in the collection. See
[Not in the collection](#not-in-the-collection).

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

## Matches

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/matches` | Create a match | `homeTeam{teamId, formation, players[{teamPlayerId, position}]}`, `awayTeam{...}`, `date` (ISO), `duration` (e.g. `"60 min"`); optional `clubLocationId`, `teamSize` (e.g. `"5 VS 5"`), `bookingId`, `tag` (e.g. `friendly`, `league`) |
| PUT | `/matches/:matchId` | Update anything on the match | any of `date`, `clubLocationId`, `leaderboardId`, `duration`, `teamSize`, `homeTeam`, `awayTeam` (lineup and formation), `bannerToken` |
| DELETE | `/matches/:matchId` | Delete a match | - |
| POST | `/matches/:matchId/status` | Start, pause, finish | `status`: `Scheduled`, `Live`, `Paused`, `Finished`. **(observed in app, 2026-08-29)** A **Finished match is permanent**: this answers "Cannot update status of a Finished match", `PUT` answers "Cannot update match of a Finished match", and `DELETE` answers "Date must be at least one hour ahead of the current time" for any match whose date has passed. A player's statistics survive even the deletion of the team the match was played for. There is no way to undo a played match |
| GET | `/matches/:matchId/Calendar` | Calendar entry (capital C, as in the collection) | - |
| GET | `/matches/:matchId/league` | League table for a league match | - |
| GET | `/matches/:id/facts` | Match facts and insights (**admin key**) | - |
| GET | `/matches/:matchId/facts-stats` | Detailed fact stats | - |
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

TODO: the collection names the commentary request "comment" but does not show its
`type` value, and there is no request for a penalty. Confirm both in the app before
writing 10.6 and 10.8.

| Method | Path | For | Body / notes |
|---|---|---|---|
| PUT | `/matches/:matchId/events/:eventId` | Correct an event | `teamPlayerId`, `teamId`, `teamType`, `description`, `assistedTeamPlayerId` |
| DELETE | `/matches/:matchId/events/:eventId` | Delete an event | - |
| POST | `/matches/:id/events/media` | Upload feed media, returns a token | multipart, field `media` |
| GET | `/matches/:matchEventId/media/:filename` | Fetch feed media | - |

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

Following a tournament has no endpoint in the collection.

## Referees

| Method | Path | For |
|---|---|---|
| GET | `/referees/:id/matches?scheduleType=` | Matches assigned to a referee |
| GET | `/referees/:playerId/stats` | Referee statistics |
| GET | `/referees/:refereePlayerId/stats/leaderboards` | Per-league referee stats (`page`, `limit`) |

The collection's "Create" referee request has an empty URL. The only API trace of
becoming a referee is `defaultProfile: "Referee"` on `POST /users`. TODO: find the
real referee-registration call for 21.1.

## Notifications

| Method | Path | For | Body / notes |
|---|---|---|---|
| GET | `/notifications` | List | `isRead`, `type`, `limit`, `skip` |
| PATCH | `/notifications/mark-read` | Mark some read or unread | `ids[]`, `isRead` |
| PATCH | `/notifications/mark-all-read` | Mark all read | - |
| DELETE | `/notifications/:notificationId` | Delete one | - |

There are no push-notification endpoints. Do not document push.

## Venues (club locations)

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/club-locations` | Create a venue | `name`, `location`; optional `avatarToken` |
| POST | `/club-locations` | Update a venue - the collection reuses POST | same fields. TODO: confirm whether update is POST or PUT |
| DELETE | `/club-locations/:id` | Delete a venue | - |
| GET | `/club-locations?query=` | Search venues | `tournamentSelectionOnly=true` returns the venues offered during tournament setup |
| POST | `/club-locations/avatar` | Upload a venue logo, returns `avatarToken` | multipart, field `avatar` |
| GET | `/club-locations/:clubLocationId/avatar?v=` | Fetch the logo | - |

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

Only collections 16 and 17 touch these. Stripe test mode only.

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/payments/stripe/account` | Create the payout (Connect) account | - |
| POST | `/payments/stripe/account/status` | Payout account status | `name`; optional `email`, `playerId` |
| POST | `/payments/stripe/account-session` | Session for the embedded onboarding UI | - |
| GET | `/payments/my/requests` | Requests I have sent (`skip`, `limit`) | - |
| GET | `/payments/my/pays` | Requests I have to pay (`skip`, `limit`) | - |
| GET | `/payments/:id/transactions` | Transactions on one request (`skip`, `limit`) | - |
| POST | `/payments/:id/reminders` | Send reminders | `playerIds[]` |
| POST | `/payments/transaction/:id/pay` | Pay a transaction | - |
| POST | `/payments/transaction/:id/verify` | Verify a payment | - |

Creating, editing and cancelling a payment request are not in the collection.

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
| POST | `/tournaments/:id/referee` | Add one referee | `name`, `canStartEndMatches`; the dialog's "Save for future tournaments" toggle maps to `saveForFutureTournaments`. The **Multiple referees** tab fires one POST per line, not a bulk call |
| DELETE | `/tournaments/:id/referee/:playerId` | Remove a referee | - |
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

### Routes this section adds

| Route | Screen |
|---|---|
| `/subscriptions` | Subscriptions - Platform Pro and Tournament Pro |
| `/leaderboards/:leaderboardId/settings` | Edit Leaderboard - appearance, roles, teams, delete |

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
| GET | `/activities` | Trending and activity feed. Filters: `referenceType` (e.g. `match`), `teamId`, `leaderboardId`, `tournamentId` |

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
| POST | `/admins/users` | Create a persona, skipping email verification | `name`, `lastName`, `email` |
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
holds only the admin chat-report resolver. Confirm before writing collection 18.
It changes how chat fixtures get seeded: through the UI, not the API.

- **Chat and messaging** (collection 18) - conversations, group chats, group
  admins, messages, attachments, reactions, read receipts, reporting. Only the
  admin chat-report resolver exists. TODO: is chat a separate service or a socket
  transport?
- **Tournament plans and payment** (collection 16) - Basic, Pro, Annual; upgrade
  and subscription management. Only the admin grant and whitelist exist.
- **Tournament publishing and running** (collection 15) - publish, public page,
  share link, QR code, access tokens, presentation editor, gallery, slideshow,
  chat room, participants, followers, completing a tournament.
- **Tournament groups, brackets and phases** (collection 13) - group edit and
  delete, bracket rounds, phase preview, start, end and undo. Only `PATCH /config`
  and `PATCH /schedule` exist.
- ~~**Fixture PDF export**~~ - found 2026-08-28. There is no export endpoint: the
  app refetches each section with `?export=true` and builds the PDF or Excel file
  in the browser. See [The fixture schedule](#the-fixture-schedule).
- **Payment request creation and editing** (17.4 to 17.7) - create, edit, cancel a
  request; fee handling.
- **Comment edit and delete** (19.2).
- **Match penalties and final-score entry** (10.6).
- **Referee registration and availability** (21.1, 21.4).
- **Global search** across players and teams (02.2). Only `/team-players/search`
  and the per-resource searches exist.
- **Embeddable trending-matches widget** (02.6).
- **Upload limits** (24.2) - enforced server-side; no endpoint states them.
