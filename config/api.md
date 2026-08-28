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
| PUT | `/users/:userId` | Update own details | any of `name`, `lastName`, `bio`, `gender`, `dateOfBirth`, `isMarketingOpted`. A 10-year minimum-age rule applies to `dateOfBirth` |
| DELETE | `/users/:userId` | Delete own account | - |
| POST | `/users/reset-password` | Send a password-reset email | `email` |
| POST | `/users/subscription` | Self-serve Free / Pro toggle | `membership`: `Free` or `Pro`. Pro is free during beta, no payment step |
| GET | `/users/banner/invite` | State of the "invite your team mates" banner | - |

### Email verification

| Method | Path | For | Body / notes |
|---|---|---|---|
| POST | `/users/verify-email/request` | Send the first verification OTP | - |
| POST | `/users/verify-email/resend` | Resend the OTP | - |
| POST | `/users/verify-email` | Submit the OTP | `otp` |

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
| POST | `/team-players` | Add a player to a team | `teamId`, `name`; optional `email`, `playerId`, `role` |
| PUT | `/team-players/:teamPlayerId` | Change a member's name, email or role | `teamId`, `name`, `email`, `role`; optional `isReplaceAllowed`, `resendInvite` |
| DELETE | `/team-players/:teamPlayerId?isBlocked=true` | Remove a member, optionally block them | - |
| GET | `/team-players/search` | Search players and teams | `query`, `searchType` (e.g. `referee`), `limit`, `skip` |
| POST | `/team-players/bulk-invite` | Invite many members by email | `invites[]` of `{teamPlayerId, email}` |
| POST | `/team-players/invite/:teamPlayerId` | Make an invite link for a member with no email | returns a `teamInvitationId` |
| POST | `/team-players/join-via-invite/:teamInvitationId` | Join from that link | - |
| POST | `/team-players/join/:shareCode` | Join using the team share code | - |
| GET | `/team-invitations` | Invitations addressed to me | - |
| POST | `/team-invitations/accept` | Accept one or many | `teamInvitationIds[]` |

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
| POST | `/leaderboards/:leaderboardId/admin` | Add an admin | `email` or `playerId` |
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
| POST | `/matches/:matchId/status` | Start, pause, finish | `status`: `Scheduled`, `Live`, `Paused`, `Finished` |
| GET | `/matches/:matchId/Calendar` | Calendar entry (capital C, as in the collection) | - |
| GET | `/matches/:matchId/league` | League table for a league match | - |
| GET | `/matches/:id/facts` | Match facts and insights (**admin key**) | - |
| GET | `/matches/:matchId/facts-stats` | Detailed fact stats | - |
| POST | `/matches/:matchId/banner` | Upload a match banner | multipart, field `banner` |
| GET | `/matches/:matchId/banner?v=` | Fetch the banner | - |
| PUT | `/matches/:matchId` | Save an uploaded banner | `bannerToken` |

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
| POST | `/players/avatar` | Upload a profile photo, returns `avatarToken` (multipart, field `avatar`) |
| GET | `/players/:playerId/avatar?v=` | Fetch the photo |
| DELETE | `/players/:playerId/avatar` | Remove the photo |
| POST | `/players/:playerId/banner` | Upload a profile banner (multipart, field `banner`) |
| GET | `/players/:playerId/banner?v=` | Fetch the banner |
| DELETE | `/players/:playerId/banner` | Remove the banner |

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
- **Fixture PDF export** (14.5).
- **Payment request creation and editing** (17.4 to 17.7) - create, edit, cancel a
  request; fee handling.
- **Comment edit and delete** (19.2).
- **Match penalties and final-score entry** (10.6).
- **Referee registration and availability** (21.1, 21.4).
- **Global search** across players and teams (02.2). Only `/team-players/search`
  and the per-resource searches exist.
- **Embeddable trending-matches widget** (02.6).
- **Upload limits** (24.2) - enforced server-side; no endpoint states them.
