// Reading a yopmail inbox.
//
// Three flows in collection 01 finish in the reader's inbox: the signup
// verification code, the password-reset link, and the invitation a team owner
// sends. Every persona in this project uses yopmail (config/personas.yaml), and
// yopmail gives a public inbox with no login, so a spec can read it.
//
// Nothing here waits on a duration. `poll` re-fetches until the mail is there,
// which is a condition, not a sleep - the mail is sent by the app and arrives
// when it arrives.
//
// Scoryboard sends through SendGrid, so every link in a Scoryboard email is a
// click-tracking redirect on url1680.scoryboard.com. The reset link is the
// FIRST such link in the body; the ones after it are Need Help, the social
// icons and the footer. Following it lands on /resetPassword?oobCode=...

const BOX = (email) => email.split('@')[0];

/**
 * The open mail's HTML, or null when the inbox has nothing yet.
 *
 * yopmail opens the newest mail into an iframe called `ifmail`. The iframe
 * element is in the page before its document has anything in it, so this waits
 * for the mail body itself (`#mail`) rather than for the frame.
 */
export async function readLatest(page, email) {
  await page.goto(`https://yopmail.com/en/?${BOX(email)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('iframe[name="ifmail"]', { timeout: 15_000 }).catch(() => null);
  const frame = page.frames().find((f) => f.name() === 'ifmail');
  if (!frame) return null;
  const body = await frame.waitForSelector('#mail', { timeout: 8_000 }).catch(() => null);
  if (!body) return null;
  return frame.content();
}

/**
 * Re-read the inbox until `extract` returns something truthy.
 *
 * The loop waits for a CONDITION - the mail existing - and stops the moment it
 * does. The gap between reads is backoff against yopmail, not a timed wait on
 * the app's UI, which is what docs/style-guide.md forbids. `attempts` bounds the
 * retries so a mail that never arrives fails loudly instead of hanging.
 */
export async function poll(page, email, extract, attempts = 20, backoffMs = 2000) {
  for (let i = 0; i < attempts; i += 1) {
    const html = await readLatest(page, email);
    const value = html ? extract(html) : null;
    if (value) return value;
    await new Promise((r) => setTimeout(r, backoffMs));
  }
  throw new Error(`Nothing matched in ${email}'s inbox after ${attempts} reads`);
}

/** The 6-digit verification code out of "Your ScoryBoard verification code". */
export async function verificationCode(page, email) {
  return poll(page, email, (html) => {
    if (!/verification code/i.test(html)) return null;
    return html.match(/letter-spacing:\s*6px[^>]*>\s*(\d{6})\s*</)?.[1] ?? null;
  });
}

/** The tracked reset link out of "We received a password reset request". */
export async function passwordResetLink(page, email) {
  return poll(page, email, (html) => {
    if (!/password reset/i.test(html)) return null;
    return html.match(/href="(http:\/\/url1680[^"]+)"/)?.[1]?.replace(/&amp;/g, '&') ?? null;
  });
}

/** The first tracked link in whatever mail is open. */
export async function firstLink(page, email, subjectPattern) {
  return poll(page, email, (html) => {
    if (subjectPattern && !subjectPattern.test(html)) return null;
    return html.match(/href="(http:\/\/url1680[^"]+)"/)?.[1]?.replace(/&amp;/g, '&') ?? null;
  });
}

/**
 * Delete every mail in a yopmail inbox.
 *
 * Used before a flow that is about to send one, so the mail that is then read
 * back is unambiguously the one this run caused. Without it, a second run finds
 * the previous run's message first and uses a reset code that has already been
 * spent - which the app reports as "An unknown error occurred during password
 * reset."
 *
 * yopmail's own Delete-all control lives in a menu that is not on screen, so its
 * handler is called directly. That is the same function the button calls.
 */
export async function emptyInbox(page, email) {
  await page.goto(`https://yopmail.com/en/?${BOX(email)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.suppr_all === 'function', null, { timeout: 15_000 });
  await page.evaluate(() => window.suppr_all());
  // Prove it: a re-read must find no mail body at all.
  const left = await readLatest(page, email);
  if (left) throw new Error(`${email}'s inbox still has mail after Delete all`);
}
