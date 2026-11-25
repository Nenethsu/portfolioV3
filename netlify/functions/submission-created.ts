// Netlify runs a function named "submission-created" after every verified Netlify Forms
// submission (spam is already filtered out). This one emails the contact form message
// through Resend with the designed template in netlify/lib/contact-email.ts.
//
// Netlify env vars (Site configuration > Environment variables, scope: Functions):
//   RESEND_API_KEY      required
//   CONTACT_TO_EMAIL    optional, defaults to the address on the Contact page
//   CONTACT_FROM_EMAIL  optional, defaults to Resend's test sender (only delivers to
//                       the Resend account's own email until a domain is verified)

import {
  contactHtml,
  contactSubject,
  contactText,
  type ContactMessage,
} from "../lib/contact-email";

interface NetlifyEvent {
  body: string | null;
}

interface SubmissionPayload {
  form_name?: string;
  created_at?: string;
  data?: Record<string, unknown>;
}

const DEFAULT_TO = "kennethsanpedro1108@gmail.com";
const DEFAULT_FROM = "Portfolio <onboarding@resend.dev>";

const field = (data: Record<string, unknown>, key: string) =>
  typeof data[key] === "string" ? (data[key] as string) : "";

export const handler = async (event: NetlifyEvent) => {
  let payload: SubmissionPayload;
  try {
    payload = JSON.parse(event.body ?? "{}").payload ?? {};
  } catch {
    return { statusCode: 400, body: "Bad payload" };
  }

  // Only the contact form; other forms keep Netlify's default handling.
  if (payload.form_name !== "contact") {
    return { statusCode: 200, body: "Ignored: not the contact form" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set; contact email not sent.");
    return { statusCode: 500, body: "Email not configured" };
  }

  const data = payload.data ?? {};
  // The honeypot should already stop bots, but never email a filled one.
  if (field(data, "bot-field")) {
    return { statusCode: 200, body: "Ignored: honeypot" };
  }

  const createdAt = payload.created_at ? new Date(payload.created_at) : new Date();
  const msg: ContactMessage = {
    name: field(data, "name").slice(0, 200),
    email: field(data, "email").slice(0, 320),
    message: field(data, "message").slice(0, 10000),
    receivedAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
  };

  const replyTo = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(msg.email.trim())
    ? msg.email.trim()
    : undefined;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
      to: [process.env.CONTACT_TO_EMAIL || DEFAULT_TO],
      subject: contactSubject(msg),
      html: contactHtml(msg),
      text: contactText(msg),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    console.error(`Resend failed: ${response.status} ${await response.text()}`);
    return { statusCode: 502, body: "Email send failed" };
  }

  return { statusCode: 200, body: "Sent" };
};
