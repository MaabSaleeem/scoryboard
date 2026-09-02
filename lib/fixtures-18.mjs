// The accounts and fixtures collection 18 runs on, in one place.
//
// `scripts/seed-18.mjs` builds them and the specs read them, so a spec cannot
// drift from what the seed produced.
//
// Collection 18 is "Chat & messaging" - conversations, direct messages, group
// chats, and what you can do to a message once it is sent.
//
// --- The one thing to understand before reading further -------------------
//
// **On Free you can send, but you cannot read.** `CHAT_PRO_REQUIRED` is listed
// in config/api.md as "reading an incoming message in full". Measured on
// staging 2026-09-02, it is wider than that and it bites hard:
//
//   - `GET /chats/conversations/:id/messages` returns somebody else's message
//     as its first **10 characters plus an ellipsis**, with
//     `isContentLocked: true` and `canViewFullText: false`. Your own messages
//     come back whole.
//   - Replying to an incoming message is `403 {"reason":"Upgrade to Pro to
//     access the full message content"}`. So is reacting to one. The gate is on
//     the message, not on the verb, so every action in 18.3 that targets
//     somebody else's message is Pro-only.
//
// A Free reader therefore sees a transcript of ten-character stubs. That is a
// true screenshot and a useless one, so the capture persona for this collection
// is the **Pro** account, and the Free account is used deliberately, in 18.1,
// to photograph the gate. See briefs/18.md, "Personas used".
//
// --- Chat has a REST surface after all ------------------------------------
//
// config/personas.yaml said to seed the group chat through the UI, because the
// Postman collection holds only the admin chat-report resolver. It was wrong.
// Reading the app bundle on 2026-09-02 turned up nineteen `/chats` endpoints,
// all of them ordinary bearer-token REST, and every fixture below is built with
// them. Nothing here needs a browser. The endpoints are now in config/api.md.
//
// Messages also arrive over a Firestore listener - the app opens
// `firestore.googleapis.com/.../Listen/channel` on the chat page - so the
// transcript updates live. That is a read path only; every write is REST.
//
// --- Five accounts, all addressed to this collection ----------------------
//
// config/personas.yaml, account_isolation. Collection 18 never signs in to
// another collection's account.
//
//   kb-18-pro           Pru KB. PRO. The capture persona. Creates the group and
//                       is its only admin. Reads incoming messages in full.
//   kb-manager-free-18  Marc KB. FREE. The map's persona_default. A plain
//                       member of the group, and the account 18.1 photographs
//                       the Pro gate on. **Must stay Free.**
//   kb-18-member        Milo KB. Free. Group member, and the other end of both
//                       direct chats. Sender of the message 18.3 replies to,
//                       reacts to, forwards and reports.
//   kb-18-outsider      Otto KB. Free. NOT in the seeded group. He is who 18.2
//                       picks when it builds a throwaway group, and who proves
//                       the member list is not the whole team.
//   kb-18-empty         Ellie KB. Free. No conversations at all, ever. She is
//                       the only way to photograph the "No chats yet" empty
//                       state once the other four have chatted.
//
// --- Why the chat fixtures are rebuilt, not reconciled --------------------
//
// Accounts, teams, the leaderboard and the friends lists are reconciled: the
// seed looks each one up and writes only what is missing. The conversations are
// not. `seed-18.mjs` deletes every conversation these accounts hold and builds
// the three below from nothing on every run.
//
// A transcript is append-only. There is no endpoint that reorders it, and a run
// that fails halfway leaves messages that the next run would append to rather
// than replace - so the fifth run photographs a transcript nobody planned. The
// specs never hardcode a conversation id or a message id; they look both up by
// text. Rebuilding costs about twenty writes and makes the transcript exact.

export const ACCOUNTS = {
  pro: 'kb-18-pro@yopmail.com',
  free: 'kb-manager-free-18@yopmail.com',
  member: 'kb-18-member@yopmail.com',
  outsider: 'kb-18-outsider@yopmail.com',
  empty: 'kb-18-empty@yopmail.com',
};

export const PROFILES = {
  pro: { name: 'Pru', lastName: 'KB', membership: 'Pro' },
  free: { name: 'Marc', lastName: 'KB', membership: 'Free' },
  member: { name: 'Milo', lastName: 'KB', membership: 'Free' },
  outsider: { name: 'Otto', lastName: 'KB', membership: 'Free' },
  empty: { name: 'Ellie', lastName: 'KB', membership: 'Free' },
};

// Every account is born with two teams and one leaderboard, named after its
// owner (config/api.md, "The Free limits themselves"). The seed RENAMES the born
// rows rather than creating more, the way collection 17 does, so the counts the
// "Choose Team" and "Choose Leaderboard" screens show stay at what the account
// was born with. The born names gain a date suffix when they clash with another
// account's, so match them on a prefix and never on the whole string.
export const BORN_TEAMS = {
  chat: /^Pru K FC(?! Away)/,
  chatAway: /^Pru K FC Away/,
  free: /^Marc K FC(?! Away)/,
};

export const TEAMS = {
  chat: 'KB Chat FC',
  chatAway: 'KB Chat FC Away',
  free: 'KB Free FC',
};

export const LEADERBOARD = 'KB Chat League';

// Who is on KB Chat FC. Added by email, so each row links to the real account
// and the chat wizard can resolve a uid from the playerId it lists.
export const SQUAD = [
  { key: 'free', role: 'Player' },
  { key: 'member', role: 'Player' },
  { key: 'outsider', role: 'Player' },
];

// Pru's friends list, so the wizard's "Friends" source is not empty.
export const FRIENDS = ['free', 'member', 'outsider'];

// --- The three conversations ---------------------------------------------
//
// GROUP is the one every article but 18.2 photographs. Pru is its only admin,
// which is what makes 18.4's "Leave group is disabled because you are the only
// admin." reachable without a second grant.
export const GROUP = {
  title: 'KB Sunday Squad',
  admin: 'pro',
  members: ['free', 'member', 'outsider'],
};

// A direct conversation between the Pro persona and Milo. 18.1 photographs its
// "Direct message" header; 18.3 forwards into it.
export const DIRECT_PRO = { a: 'pro', b: 'member' };

// A direct conversation between the FREE persona and Milo. This is the one 18.1
// photographs the Pro gate on: every message Milo sends arrives as a
// ten-character stub.
export const DIRECT_FREE = { a: 'free', b: 'member' };

/**
 * The seeded transcript, in order.
 *
 * Fixed text, no dates, no names outside this collection. Three of these rows
 * exist so that 18.3 can photograph an "after" state without performing the
 * action that produces it (docs/style-guide.md, "Actions you can only do
 * once"):
 *
 *   - `reactTo`   Milo's message, which the seed then reacts to as Pru. It
 *                 carries the reaction pill 18.3 shot 05 is about.
 *   - `edited`    Pru's own message, which the seed edits. It carries the
 *                 "Edited" tag.
 *   - `replied`   Pru's reply, which quotes `reactTo` in the transcript.
 *   - `deleted`   Milo's message, deleted for everyone, leaving the tombstone.
 *
 * **The reply has to come from the Pro account.** Marc sent it in the first
 * draft of this file and the seed stopped on
 * `403 {"reason":"Upgrade to Pro to access the full message content"}`. Replying
 * to somebody else's message is gated on reading it, so a Free member cannot do
 * it at all. Same for reacting. 18.3 documents that.
 *
 * `from` is a key of ACCOUNTS. `replyTo` names an earlier row by its own key.
 */
export const GROUP_TRANSCRIPT = [
  { key: 'opener', from: 'pro', text: 'Sunday kick-off is 10:00 at the Astro.' },
  { key: 'reactTo', from: 'member', text: 'I am in. I will bring the bibs.' },
  { key: 'replied', from: 'pro', text: 'Good man. I will bring the water.', replyTo: 'reactTo' },
  { key: 'deleted', from: 'member', text: 'Ignore that, wrong chat.', deleteForEveryone: true },
  { key: 'edited', from: 'pro', text: 'Meet at the car park at 09:45, not 09:30.', editedFrom: 'Meet at the car park at 09:30.' },
  { key: 'marcs', from: 'free', text: 'I will be there.' },
  { key: 'last', from: 'outsider', text: 'I cannot make Sunday. Away with work.' },
];

/** Pru reacts to Milo's message with this, so shot 05 has a pill to show. */
export const REACTION = { on: 'reactTo', by: 'pro', emoji: '👍' };

export const DIRECT_PRO_TRANSCRIPT = [
  { from: 'member', text: 'Are we still on for Thursday training?' },
  { from: 'pro', text: 'Yes. Same pitch, 19:00.' },
];

export const DIRECT_FREE_TRANSCRIPT = [
  { from: 'free', text: 'Can you pick the bibs up on the way?' },
  { from: 'member', text: 'Yes, they are in my car already.' },
];

/**
 * What a Free account sees instead of an incoming message.
 *
 * Measured, not guessed: the API truncates to ten characters and appends an
 * ellipsis. 18.1's gate capture asserts this string is on screen, so a change
 * in the truncation length fails the spec rather than quietly publishing a
 * screenshot of something else.
 */
export const lockedPreview = (text) => `${text.slice(0, 10)}...`;

/**
 * The group 18.2 builds and then throws away. Never seeded; the spec makes it,
 * photographs it and deletes it in its own teardown.
 *
 * Named like a group somebody would really make, not like a fixture: it is on
 * screen in four of 18.2's six captures.
 */
export const SPEC_GROUP = { title: 'KB Thursday Training', members: ['member', 'outsider'] };

/**
 * Frozen wall clock for every 18 spec.
 *
 * A transcript stamps every row with a time and the conversation list shows a
 * relative one. Both move on every run without this.
 */
export const FROZEN_NOW = '2026-09-02T09:20:00.000Z';

/** The report dialog's reasons, in the order the app lists them. */
export const REPORT_REASONS = ['Spam', 'Abusive content', 'Harassment', 'Scam or fraud', 'Other'];
