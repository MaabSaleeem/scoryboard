// Collection 05 - "Friends". The accounts, the names and the wording that
// `scripts/seed-05.mjs` writes and the specs read, so a spec cannot drift from
// what the seed produced.
//
// Accounts are isolated per collection (config/personas.yaml,
// account_isolation). Nothing outside the four addresses below is written to.
//
// --- the one thing to read before changing anything here --------------------
//
// A REFUSED "Add To Team" DELETES THE FRIEND. On the Free plan a friend may
// belong to one of your teams only. Asking for a second answers
// 400 ONE_FRIEND_PER_TEAM - and the server soft-deletes the friend record on
// the way out, so the person vanishes from your friends list while staying on
// the team they were already on. Reproduced from the API and through the app,
// 2026-08-30, and recorded in config/api.md.
//
// 05.1 photographs that refusal, so its spec destroys a friend every run. The
// record is soft-deleted, not gone: POST /friends {"playerId": <friendPlayerId>}
// revives the SAME id. The spec restores it in a finally, and this file names
// the friend it is allowed to spend - GATE_FRIEND - so nothing else uses it.

export const ACCOUNTS = {
  // The reader. Free, and it stays Free - the Free gate in 05.1 disappears the
  // moment the account is Pro, and nothing in this collection needs Pro.
  free: 'kb-manager-free-05@yopmail.com',
  // A real Scoryboard account that IS in the reader's friends list. It is what
  // a friend row looks like once it is linked to a person: Chat is enabled and
  // Edit is greyed out. 05.2's last capture and 05.3's "after".
  mate: 'kb-05-mate@yopmail.com',
  // A real Scoryboard account that is NOT in the reader's friends list. 05.3
  // types this address into a friend's email field, which is what raises
  // "Email Already Exists". It must stay out of the list or the clash the
  // article is about is a different clash.
  player: 'kb-05-player@yopmail.com',
  // The person who opens an invitation link. 05.4 signs in as this account,
  // accepts, and then the run puts the placeholder back. Nothing is left on
  // this account afterwards - claiming adds a row to the INVITER's list, never
  // to the claimer's.
  //
  // NOT `kb-05-claimer@`, which was the first address used for this and is
  // burnt. Deleting an account does not free its PLAYER: the player row
  // survives with its name blanked and its address rewritten to
  // `<userId>@scoryboard.com`, and an account created again at the same email
  // is handed the same playerId back. Any friend record that pointed at that
  // player is still there, soft-deleted - and `POST /friends/join/:shareCode`
  // revives THAT record instead of taking over the one whose link was used,
  // leaving a nameless row on the list and the placeholder deleted. Both
  // behaviours are in config/api.md. A claimer has to be an address that has
  // never been deleted.
  claimer: 'kb-05-invitee@yopmail.com',
};

export const PROFILES = {
  free: { name: 'Marc', lastName: 'KB' },
  mate: { name: 'Cara', lastName: 'KB' },
  player: { name: 'Pete', lastName: 'KB' },
  claimer: { name: 'Nate', lastName: 'KB' },
};

// Two teams with fixed names.
//
// Every account is born with two teams named after the account - "Marc K FC"
// and "Marc K FC Away" - and those names gain a DATE suffix when they clash:
// this account's read "Marc K FC 3008". 05.1 photographs the Select Team
// dropdown, so a date in a team name would be a date in a screenshot. The seed
// deletes every team the account owns that is not one of these two.
export const TEAMS = {
  main: 'KB 05 FC',
  other: 'KB 05 Athletic',
};

// The friends list, in the order the seed creates them. GET /friends comes back
// in record-creation order, so this array is the order of the rows on screen.
//
// `email` on a row that is not an account is just text on the record: it does
// not invite anybody and it does not make them a Scoryboard user.
export const FRIENDS = [
  // 05.2 opens this one's row menu and its Edit dialog; 05.3 types a clashing
  // address into its email field and stops at the confirm.
  { name: 'Ade Nwosu' },
  // A name-only friend carrying an email. Nothing in the app treats it
  // differently from Ade - which is the point 05.2 makes in one line.
  { name: 'Bo Lindqvist', email: 'kb-05-bo@yopmail.com' },
  // The linked row. Its player IS ACCOUNTS.mate, so Chat is enabled and Edit is
  // disabled. Seeded by playerId, never by email, so the seed never has to
  // answer the "Email Already Exists" prompt itself.
  { name: 'Cara KB', account: 'mate' },
  // 05.1's sacrificial friend. On TEAMS.main, so asking for TEAMS.other is
  // refused - and the refusal deletes this record. Its position is safe
  // wherever it sits: reviving by playerId brings back the SAME record, and a
  // revived record keeps its place in the list (checked on staging).
  { name: 'Sam Ruiz', team: 'main' },
  // 05.4's placeholder, and it has to be LAST.
  //
  // The claim leaves the record in place under the claimer's name, so the row
  // does not move during the run. But the restore cannot revive it - the record
  // now belongs to a real account - so it deletes the row and creates a new
  // placeholder, and a new record lands at the END of the list. Anywhere else
  // in this array and one run of 05.4 would reorder every other article's
  // capture of the list.
  { name: 'Nia Halvorsen' },
];

/** The friend 05.1 is allowed to spend on the Free gate, and put back. */
export const GATE_FRIEND = 'Sam Ruiz';
/** The friend 05.3 edits. Name only, so its Edit control is live. */
export const MERGE_FRIEND = 'Ade Nwosu';
/** The friend 05.4 hands over. Name only, so it has a share code. */
export const CLAIM_FRIEND = 'Nia Halvorsen';
/** The linked row. Edit is greyed out on it and Chat is live. */
export const LINKED_FRIEND = 'Cara KB';
/** The friend 05.1 adds to a team. On no team, so both teams are offered. */
export const FREE_FRIEND = 'Ade Nwosu';

// The one friend 05.2 creates and then removes inside its own run. It must not
// be in FRIENDS: the article's procedure is add, edit, remove, and the fixture
// has to be back to five rows at the end of it.
export const NEW_FRIEND = { name: 'Eve Marsh', email: 'kb-05-eve@yopmail.com' };

// --- wording, read off the screen 2026-08-30 --------------------------------

export const LIST_HEADING = 'Friends';
export const ADD_BUTTON = 'Add Friend';
export const EMPTY_LIST = 'No friends found. Click "Add friend" to get started.';

export const ADD_DIALOG = {
  title: 'Add Friend',
  nameLabel: 'Enter a name *',
  emailLabel: 'Enter an email',
  submit: 'Add Friend',
  generate: 'Generate invitation link',
  nameRequired: 'This field is required.',
};

export const EDIT_DIALOG = {
  title: 'Edit Friend',
  submit: 'Update Friend',
  generate: 'Generate invitation link',
};

export const REMOVE_DIALOG = {
  title: 'Remove Friend',
  message:
    'Removing this user from your Friend List will also remove them from any teams you’ve added them to. This action can’t be undone.',
  confirm: 'Remove',
  cancel: 'Cancel',
};

export const MERGE_DIALOG = {
  title: 'Email Already Exists',
  // The address is interpolated into the sentence, so the spec matches the two
  // halves rather than the whole line.
  messageStart: 'This email',
  messageEnd: 'is already in use by another player.',
  question: 'Do you want to update the player with this email address?',
  yes: 'Yes',
  no: 'No',
};

export const INVITE_PANEL = {
  title: 'Send Invitation',
  lead: 'Share this link to send an invitation.',
  note: 'By clicking the link, anyone can accept after signing in.',
  shareVia: 'Share this link via',
  copy: 'Copy link',
  back: 'Back',
};

export const INVITATION_DIALOG = {
  title: 'Friend List Invitation',
  // "You've received a Friends list invitation from Marc KB." - the inviter's
  // name is the subject of the sentence and is NOT masked in the capture.
  //
  // A STRAIGHT apostrophe here, and a curly one in REMOVE_DIALOG.message. The
  // two dialogs really do differ: the removal warning renders U+2019 and this
  // one renders U+0027. Matched as written, both times.
  lead: "You've received a Friends list invitation from",
  ask: 'Please Accept or Reject the invite.',
  accept: 'Accept',
  reject: 'No, thanks',
  done: 'Request completed successfully.',
};

export const ADD_TO_TEAM = {
  trigger: 'Add To Team',
  title: 'Add Player To Team',
  lead: 'Add a player and choose their role within your team.',
  teamLabel: 'Select Team *',
  teamPlaceholder: 'Choose a team...',
  roleLabel: 'Role *',
  submit: 'Add to Team',
};

// The Free gate that 05.1 photographs. Its title is the app's own and is about
// teams, not about friends - the same "Team Limit Reached" modal collection 04
// documents. Its wording here is the friends-list variant.
export const TEAM_LIMIT_GATE = {
  title: 'Team Limit Reached',
  message: 'This player is part of another team. Remove them from that team before adding them to this team.',
  detail: 'With a Free account, a friend can be added to only one team. Upgrade to Pro Membership to add the same friend to multiple teams.',
  upgrade: 'FREE Upgrade (Beta)',
};

export const ROW_MENU = { edit: 'Edit', remove: 'Remove' };
export const CHAT_BUTTON = 'Chat';
