/**
 * Crowvo transactional emails.
 *
 * These are the door to the whole funnel — the invite code arrives here, not on the
 * site — so they are built to survive real mail clients rather than to look good in
 * a browser only:
 *
 *  - Tables, not flexbox. Outlook renders neither grid nor flex.
 *  - Every style inlined. Gmail strips <style> blocks on some clients.
 *  - No webfonts. System stack only; a missing font must not break the layout.
 *  - No SVG. Gmail strips it, so the lockup is live text, not an image.
 *  - Explicit bgcolor AND background on every table cell, so a dark card does not
 *    end up dark-text-on-dark when a client force-inverts.
 *  - A plain-text alternative for every message, because the code has to be
 *    copyable even when HTML is blocked.
 *
 * The code is rendered as large selectable text, never only as a button, so it
 * still works when links are rewritten or stripped by a corporate gateway.
 */

const BG = "#0E0E12";
const CARD = "#16161C";
const BORDER = "#2A2A32";
const FG = "#F2F2F3";
const MUTED = "#A8A8B3";
const FAINT = "#8A8A94";
const ACCENT = "#6D7CFF";

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type CrowvoEmail = { subject: string; html: string; text: string };

function shell(bodyRows: string, preheader: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>Crowvo</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
  <div style="display:none;font-size:1px;color:${BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BG}" style="background:${BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">
          <tr>
            <td style="padding:0 4px 22px 4px;">
              <span style="font-family:${FONT};font-size:21px;font-weight:800;letter-spacing:-0.04em;color:${FG};">Crowvo</span>
            </td>
          </tr>
          ${bodyRows}
          <tr>
            <td style="padding:26px 4px 0 4px;font-family:${FONT};font-size:13px;line-height:1.6;color:${FAINT};">
              Communities for what you are into, events that get you out the door, and a way to
              meet the people you pass there.
              <br><br>
              You are getting this because you asked for a place on the Crowvo waitlist at
              <a href="https://crow-vo.com" style="color:${FAINT};text-decoration:underline;">crow-vo.com</a>.
              If that was not you, ignore this email and nothing happens.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function card(inner: string) {
  return `<tr>
    <td bgcolor="${CARD}" style="background:${CARD};border:1px solid ${BORDER};border-radius:18px;padding:26px 24px;">
      ${inner}
    </td>
  </tr>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0;">
    <tr>
      <td bgcolor="${FG}" style="background:${FG};border-radius:999px;">
        <a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:700;color:${BG};text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function shareBlock(shareUrl: string) {
  return `<tr>
    <td style="padding:14px 4px 0 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-top:1px solid ${BORDER};padding-top:20px;font-family:${FONT};">
            <div style="font-size:15px;font-weight:700;color:${FG};">Bring your group</div>
            <div style="font-size:14px;line-height:1.6;color:${MUTED};padding-top:6px;">
              Anyone who joins through your link is placed with you, so your community opens
              together instead of one person at a time.
            </div>
            <div style="padding-top:12px;">
              <a href="${shareUrl}" style="font-family:${FONT};font-size:15px;color:${ACCENT};text-decoration:underline;word-break:break-all;">${shareUrl.replace(/^https?:\/\//, "")}</a>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** Sent when a place opens immediately and a code has been issued. */
export function inviteCodeEmail(opts: {
  code: string;
  joinUrl: string;
  communityType: string;
  shareUrl?: string | null;
}): CrowvoEmail {
  const inner = `
    <div style="font-family:${FONT};font-size:24px;font-weight:800;letter-spacing:-0.02em;color:${FG};">You are in.</div>
    <div style="font-family:${FONT};font-size:15px;line-height:1.6;color:${MUTED};padding-top:10px;">
      A place opened for ${escapeHtml(opts.communityType)}. This code is yours and works once.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
      <tr>
        <td bgcolor="${BG}" align="center" style="background:${BG};border:1px solid ${BORDER};border-radius:14px;padding:18px 12px;">
          <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:22px;font-weight:700;letter-spacing:0.08em;color:${FG};">${escapeHtml(opts.code)}</span>
        </td>
      </tr>
    </table>

    <div style="padding-top:20px;">${button(opts.joinUrl, "Open sign-up")}</div>
    <div style="font-family:${FONT};font-size:13px;line-height:1.6;color:${FAINT};padding-top:12px;">
      That link fills the code in for you. If it does not open, go to
      <a href="https://crow-vo.com/download" style="color:${FAINT};text-decoration:underline;">crow-vo.com/download</a>
      and paste it. Windows and the browser are both ready.
    </div>`;

  const html = shell(
    card(inner) + (opts.shareUrl ? shareBlock(opts.shareUrl) : ""),
    `Your invite code: ${opts.code}`,
  );

  const text = [
    "You are in.",
    "",
    `A place opened for ${opts.communityType}. This code is yours and works once.`,
    "",
    `Access code: ${opts.code}`,
    "",
    `Open sign-up: ${opts.joinUrl}`,
    "",
    "If that link does not open, go to https://crow-vo.com/download and paste the code.",
    opts.shareUrl ? `\nBring your group — anyone who joins through this link is placed with you:\n${opts.shareUrl}` : "",
    "",
    "You are getting this because you asked for a place at crow-vo.com.",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject: "Your Crowvo invite code", html, text };
}

/** Sent when the auto-invite batch is full and the signup is queued. */
export function waitlistQueuedEmail(opts: {
  communityType: string;
  shareUrl?: string | null;
}): CrowvoEmail {
  const inner = `
    <div style="font-family:${FONT};font-size:24px;font-weight:800;letter-spacing:-0.02em;color:${FG};">You are on the list.</div>
    <div style="font-family:${FONT};font-size:15px;line-height:1.6;color:${MUTED};padding-top:10px;">
      We noted ${escapeHtml(opts.communityType)}. Places open in batches — when yours opens we email
      a code that takes you straight into sign-up, so there is nothing to check back for.
    </div>
    <div style="font-family:${FONT};font-size:14px;line-height:1.6;color:${FAINT};padding-top:16px;">
      Nothing to install yet. The code email is the door.
    </div>`;

  const html = shell(
    card(inner) + (opts.shareUrl ? shareBlock(opts.shareUrl) : ""),
    "You are on the Crowvo waitlist.",
  );

  const text = [
    "You are on the list.",
    "",
    `We noted ${opts.communityType}. Places open in batches — when yours opens we email a code that takes you straight into sign-up.`,
    "",
    "Nothing to install yet. The code email is the door.",
    opts.shareUrl ? `\nBring your group — anyone who joins through this link is placed with you:\n${opts.shareUrl}` : "",
    "",
    "You are getting this because you asked for a place at crow-vo.com.",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject: "You are on the Crowvo waitlist", html, text };
}

/** Internal — kept plain on purpose, it only ever goes to the team inbox. */
export function adminSignupNotice(opts: {
  email: string;
  communityType: string;
  id: string;
  status: string;
  referred: boolean;
}): CrowvoEmail {
  const html = `<div style="font-family:${FONT};font-size:14px;line-height:1.6;">
    <p>New waitlist signup — <strong>${escapeHtml(opts.status)}</strong>${opts.referred ? " (via a group link)" : ""}.</p>
    <ul>
      <li>Email: ${escapeHtml(opts.email)}</li>
      <li>Group: ${escapeHtml(opts.communityType)}</li>
      <li>ID: ${escapeHtml(opts.id)}</li>
    </ul>
  </div>`;
  const text = `New waitlist signup (${opts.status})${opts.referred ? " via group link" : ""}\nEmail: ${opts.email}\nGroup: ${opts.communityType}\nID: ${opts.id}`;
  return { subject: `[Crowvo] ${opts.status}: ${opts.email}`, html, text };
}

/** Values come from user input, so escape before they reach the markup. */
function escapeHtml(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
