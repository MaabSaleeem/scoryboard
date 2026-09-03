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

// --- reading a Scoryboard email as the email, for collection 20 ------------
//
// Collection 20's article 20.2 photographs four email bodies. Every one of them
// is read out of a yopmail inbox, and yopmail cannot be screenshotted directly:
//
//   - **it strips every `src` attribute out of the HTML view.** Not rewrites -
//     removes. `<img width="250" height="55" alt="ScoryBoard">` is what is
//     left of the logo, and the three social icons the same. Its own "Show
//     pictures" control cannot put them back, because the attribute is gone;
//     clicking it changes nothing, measured. A capture taken there is an email
//     with four broken images in it, which docs/style-guide.md would not have.
//   - **its reading pane carries its own chrome** - Deliverability, Reply,
//     Forward, Print, Delete, the subject line and the sender - none of which
//     belongs in a Scoryboard help centre article.
//
// yopmail does offer the raw message. The reading shell has a **Source** view,
// `window.affm('s')`, and that hands back the whole MIME message with the
// `src` attributes intact. So the pipeline is: open the inbox, open the mail,
// switch to Source, pull the `text/html` part out, decode it, and render it in
// a blank page at a mail-client width.
//
// That is not a doctored screenshot. It is the email's own HTML, rendered by a
// browser, exactly as a mail client would - and the whole of it is in the spec,
// so a re-run reproduces it. What it drops is yopmail: the frame around the
// message, and yopmail's habit of breaking the pictures.
//
// `window.affm` lives on the SHELL page, not on the mail page. Navigating
// straight to `.../en/mail?b=&id=` gives a page with no parent and no `affm`,
// and (on a cold context) yopmail's landing page instead of the message. The
// inbox has to be opened first, in the same context.

/** The mailbox name in a yopmail address. */
const boxOf = (email) => email.split('@')[0];

/**
 * Every message in a yopmail inbox: its row id, subject and time.
 *
 * The list is inside an iframe called `ifinbox` and each row is a `div.m`
 * whose id is `e_<hash>`; the message itself is addressed as `me_<hash>`.
 */
export async function inbox(page, email) {
  await page.goto(`https://yopmail.com/en/?${boxOf(email)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('iframe[name="ifinbox"]', { timeout: 20_000 });
  const frame = page.frames().find((f) => f.name() === 'ifinbox');
  if (!frame) throw new Error(`${email}: no yopmail inbox frame`);
  await frame.waitForSelector('div.m', { timeout: 20_000 });
  return frame.evaluate(() => [...document.querySelectorAll('div.m')].map((e) => ({
    id: e.id,
    from: e.querySelector('.lmf')?.textContent?.trim() ?? '',
    subject: e.querySelector('.lms')?.textContent?.trim() ?? '',
    time: e.querySelector('.lmh')?.textContent?.trim() ?? '',
  })));
}

/**
 * Decode a quoted-printable body.
 *
 * Scoryboard's mail is `Content-Transfer-Encoding: quoted-printable`, so soft
 * line breaks (`=` at end of line) have to be joined before `=XX` escapes are
 * turned back into bytes - otherwise a URL split across two lines comes out
 * with an `=` in the middle of it. The bytes are then read as UTF-8, which is
 * what the emoji in these subjects and headings need.
 */
export function decodeQuotedPrintable(text) {
  const joined = text.replace(/=\r?\n/g, '');
  const bytes = [];
  for (let i = 0; i < joined.length; i += 1) {
    if (joined[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(joined.slice(i + 1, i + 3))) {
      bytes.push(parseInt(joined.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(joined.charCodeAt(i) & 0xff);
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

/**
 * The `text/html` part of a raw MIME message, decoded.
 *
 * These messages are `multipart/alternative` with a plain-text part and an
 * HTML part. This finds the HTML part's headers, reads its encoding, and takes
 * everything up to the next boundary. `quoted-printable` is what Scoryboard
 * sends; base64 is handled because a mail server may re-encode.
 */
export function htmlPart(source) {
  const at = source.search(/Content-Type:\s*text\/html/i);
  if (at < 0) throw new Error('No text/html part in the message source');
  const headerEnd = source.indexOf('\n\n', at);
  const blank = headerEnd < 0 ? source.indexOf('\r\n\r\n', at) : headerEnd;
  if (blank < 0) throw new Error('Could not find the end of the text/html headers');
  const headers = source.slice(at, blank);
  const encoding = headers.match(/Content-Transfer-Encoding:\s*([a-z0-9-]+)/i)?.[1]?.toLowerCase();

  let body = source.slice(blank).replace(/^[\r\n]+/, '');
  // Stop at the next MIME boundary, whatever it is called.
  const boundary = body.search(/^--[-A-Za-z0-9_.=]{6,}/m);
  if (boundary > 0) body = body.slice(0, boundary);

  if (encoding === 'base64') return Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf8');
  if (encoding === 'quoted-printable') return decodeQuotedPrintable(body);
  return body;
}


/**
 * yopmail rate-limits by IP and answers with a CAPTCHA when it has had enough.
 *
 * The reading frame then renders "Complete the CAPTCHA to continue" in place of
 * the message and every mail-reading path in the project stops working at once
 * - lib/api.mjs records the same thing happening to collection 01. It is a
 * throttle, not a block: it clears on its own.
 *
 * **Nothing here ever attempts to answer it.** This turns the wall into a
 * legible failure rather than a selector timeout, so a later session knows to
 * wait and re-run instead of hunting for a changed DOM. Keeping the number of
 * yopmail page loads per run small is what avoids it, which is why
 * openEmailsFrom() reads every message a spec needs out of ONE inbox visit.
 */
function refuseOnCaptcha(text, email) {
  if (!/Complete the CAPTCHA/i.test(text ?? '')) return;
  throw new Error(
    `yopmail is showing a CAPTCHA instead of ${email}'s mail. It rate-limits by IP and this `
    + 'clears on its own - wait and re-run. Do NOT answer it. If it keeps happening, cut the '
    + 'number of yopmail page loads: openEmailsFrom() exists to read every message a spec '
    + 'needs out of a single inbox visit.',
  );
}

/** Whatever the reading frame is currently showing, as text. */
async function mailFrameText(page) {
  return page.evaluate(() => {
    const f = [...document.querySelectorAll('iframe')].find((x) => x.name === 'ifmail');
    return f?.contentDocument?.body?.innerText ?? '';
  });
}

/**
 * Open one inbox and read the raw MIME source of several messages out of it.
 *
 * ONE inbox navigation, however many messages are wanted, and that is the whole
 * point - see refuseOnCaptcha(). After the first message the inbox frame is
 * still on the shell page, so the next row is only another click.
 *
 * A row id is an unquoted-attribute nightmare - it ends in `==` - so it is
 * matched with `div.m[id="..."]` rather than `#...`, which Playwright refuses
 * to parse as a CSS selector.
 *
 * `patterns` are regular expressions against the subject line. Every one must
 * match, and the error lists the whole inbox when one does not.
 */
export async function messageSources(page, email, patterns) {
  const rows = await inbox(page, email);
  const frame = page.frames().find((f) => f.name() === 'ifinbox');
  const out = [];

  for (const pattern of patterns) {
    const hit = rows.find((r) => pattern.test(r.subject));
    if (!hit) {
      throw new Error(
        `${email}: no message matching ${pattern}. The inbox holds:\n  `
        + rows.map((r) => r.subject).join('\n  '),
      );
    }
    await frame.locator(`div.m[id="${hit.id}"]`).click();
    await page.waitForFunction(() => typeof window.affm === 'function', null, { timeout: 20_000 });

    // Wait for the message to be OPEN before switching view: the frame element
    // is on the page long before its document holds anything. The CAPTCHA text
    // is one of the accepted end states, so a throttled run fails on the guard
    // below with a sentence rather than on a timeout.
    await page.waitForFunction(
      () => {
        const f = [...document.querySelectorAll('iframe')].find((x) => x.name === 'ifmail');
        const t = f?.contentDocument?.body?.innerText ?? '';
        return !!f?.contentDocument?.querySelector('#mail') || /Complete the CAPTCHA/i.test(t);
      },
      null, { timeout: 25_000, polling: 250 },
    );
    refuseOnCaptcha(await mailFrameText(page), email);

    await page.evaluate(() => window.affm('s'));
    // The Source view replaces the frame's content. Wait for the headers to be
    // there rather than for a duration: a raw message always begins with them,
    // and the rendered view never contains "Content-Type: text/html".
    await page.waitForFunction(
      () => {
        const f = [...document.querySelectorAll('iframe')].find((x) => x.name === 'ifmail');
        const t = f?.contentDocument?.body?.innerText ?? '';
        return /Content-Type:\s*text\/html/i.test(t) || /Complete the CAPTCHA/i.test(t);
      },
      null, { timeout: 25_000, polling: 250 },
    );
    const source = await mailFrameText(page);
    refuseOnCaptcha(source, email);
    out.push({ subject: hit.subject, from: hit.from, source });

    // Back to the rendered view, so the next iteration starts from the state
    // this one assumed on entry.
    await page.evaluate(() => window.affm('m'));
  }
  return { messages: out, subjects: rows.map((r) => r.subject) };
}

/**
 * Render Scoryboard emails into pages of their own, one inbox visit per box.
 *
 * `width` is a mail-client column, not a browser viewport: these messages are a
 * fixed-width table layout and 760px is where they stop having a scrollbar.
 * Each page waits for every image - the logo, the three social icons and the
 * SendGrid open-tracking pixel, which is 1x1 and answers 200 - so no capture
 * lands on a half-painted logo. The viewport is then fitted to the message, so
 * an unclipped capture is the message and nothing else.
 *
 * The caller closes each returned page.
 */
export async function openEmailsFrom(context, email, patterns, { width = 760 } = {}) {
  const reader = await context.newPage();
  let messages;
  let subjects;
  try {
    ({ messages, subjects } = await messageSources(reader, email, patterns));
  } finally {
    await reader.close();
  }

  const emails = [];
  for (const message of messages) {
    const html = htmlPart(message.source);
    const page = await context.newPage();
    await page.setViewportSize({ width, height: 1400 });
    await page.setContent(
      '<!doctype html><meta charset="utf-8">'
      + '<style>html,body{margin:0;padding:0;background:#fff}'
      + '*,*::before,*::after{animation:none!important;transition:none!important}</style>'
      + html,
      { waitUntil: 'load' },
    );
    await page.waitForFunction(() => {
      const imgs = [...document.images].filter((i) => {
        const r = i.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      return imgs.every((i) => i.complete);
    }, undefined, { timeout: 30_000, polling: 250 });

    // Shrink first, then measure. `scrollHeight` is never less than the
    // viewport, so measuring against the tall viewport the page was rendered in
    // reports the viewport back and the resize is a no-op - which is what the
    // first version of this did, and every capture came out 1400 tall with 570
    // blank pixels under the footer.
    await page.setViewportSize({ width, height: 200 });
    const tall = await page.evaluate(() => Math.ceil(
      Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
    ));
    await page.setViewportSize({ width, height: Math.max(200, tall) });
    await page.waitForFunction(() => [...document.images].every((i) => i.complete),
      undefined, { timeout: 30_000, polling: 250 });

    emails.push({ page, subject: message.subject, html });
  }

  // `subjects` is every subject in the box, carried out of the ONE inbox visit
  // messageSources() made. Article 20.2 is a reference table of subject lines,
  // and a table nothing checks is a table that rots the first time one is
  // reworded - so its spec asserts every row against these. Getting them here
  // costs nothing; a second visit to fetch them would cost a yopmail page
  // load, which is the thing to be sparing with.
  return { emails, subjects };
}
