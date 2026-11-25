// HTML + plain-text email for a contact form submission.
// Email clients ignore <style> blocks and modern CSS, so the layout is tables with inline styles.
// Every value from the form is escaped: visitors write it, not us.

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
  receivedAt: Date;
}

const SITE_URL = "https://kennethsanpedro.netlify.app";
const SITE_LABEL = "kennethsanpedro.netlify.app";

const BLUE = "#2563eb";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const PAGE = "#f1f5f9";
const SOFT = "#f8fafc";
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Loose check, only to decide whether a mailto: reply button makes sense.
const looksLikeEmail = (value: string) => /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(value);

const oneLine = (value: string) => value.replace(/\s+/g, " ").trim();

const formatReceived = (date: Date) =>
  `${new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)} (PHT)`;

export const contactSubject = ({ name }: ContactMessage) =>
  `New message from ${oneLine(name).slice(0, 60) || "your portfolio"}`;

export const contactText = (msg: ContactMessage) =>
  [
    `New message from your portfolio`,
    ``,
    `From: ${oneLine(msg.name)} <${oneLine(msg.email)}>`,
    `Received: ${formatReceived(msg.receivedAt)}`,
    ``,
    msg.message.trim(),
    ``,
    `---`,
    `Sent by the contact form on ${SITE_LABEL}`,
  ].join("\n");

export const contactHtml = (msg: ContactMessage) => {
  const name = oneLine(msg.name) || "Someone";
  const email = oneLine(msg.email);
  const firstName = name.split(" ")[0];
  const initial = escapeHtml(name.charAt(0).toUpperCase());
  const safeName = escapeHtml(name);
  const safeFirst = escapeHtml(firstName);
  const safeEmail = escapeHtml(email);
  const body = escapeHtml(msg.message.trim() || "(empty message)").replace(
    /\r?\n/g,
    "<br>",
  );
  const preheader = escapeHtml(oneLine(msg.message).slice(0, 110));
  const received = escapeHtml(formatReceived(msg.receivedAt));

  const replyHref = looksLikeEmail(email)
    ? `mailto:${email}?subject=${encodeURIComponent(
        "Re: your message on my portfolio",
      )}`
    : null;

  const replyButton = replyHref
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
        <tr>
          <td style="border-radius:10px;background:${BLUE};">
            <a href="${escapeHtml(replyHref)}" style="display:inline-block;padding:13px 22px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Reply to ${safeFirst} &rarr;</a>
          </td>
        </tr>
      </table>`
    : "";

  const emailLine = replyHref
    ? `<a href="mailto:${safeEmail}" style="color:${BLUE};text-decoration:none;">${safeEmail}</a>`
    : `<span style="color:${MUTED};">${safeEmail || "No email given"}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(contactSubject(msg))}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

        <tr>
          <td style="padding:0 4px 18px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="36" height="36" align="center" valign="middle" style="width:36px;height:36px;border-radius:10px;background:${BLUE};font-family:${FONT};font-size:13px;font-weight:700;color:#ffffff;">KS</td>
                <td style="padding-left:12px;font-family:${FONT};">
                  <div style="font-size:14px;font-weight:700;color:${INK};">Kenneth San Pedro</div>
                  <div style="font-size:12px;color:${MUTED};">Portfolio contact form</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;border:1px solid ${LINE};border-radius:16px;overflow:hidden;">
            <div style="height:4px;background:${BLUE};line-height:4px;font-size:0;">&nbsp;</div>
            <div style="padding:32px 32px 34px;font-family:${FONT};">
              <div style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${BLUE};">New message</div>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:30px;font-weight:700;color:${INK};">${safeName} sent you a message</h1>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};">
                <tr>
                  <td width="44" valign="middle" style="padding:16px 0;">
                    <div style="width:40px;height:40px;line-height:40px;border-radius:20px;background:#eff6ff;color:${BLUE};text-align:center;font-size:16px;font-weight:700;">${initial}</div>
                  </td>
                  <td valign="middle" style="padding:16px 0 16px 12px;">
                    <div style="font-size:15px;font-weight:600;color:${INK};">${safeName}</div>
                    <div style="font-size:13px;margin-top:2px;">${emailLine}</div>
                  </td>
                </tr>
              </table>

              <div style="margin-top:24px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${MUTED};">Message</div>
              <div style="margin-top:10px;padding:18px 20px;background:${SOFT};border-left:3px solid ${BLUE};border-radius:8px;font-size:15px;line-height:24px;color:#334155;word-break:break-word;">${body}</div>

              ${replyButton}

              <div style="margin-top:28px;font-size:12px;color:${MUTED};">Received ${received}</div>
            </div>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:20px 16px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">
            Sent by the contact form on <a href="${SITE_URL}" style="color:${MUTED};text-decoration:underline;">${SITE_LABEL}</a>.<br>
            Spam is filtered by Netlify Forms before this email is sent.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
};
