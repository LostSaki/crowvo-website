type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Where replies go. Defaults to the contact inbox; see sendEmail. */
  replyTo?: string;
};

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; reason: "not_configured" | "send_failed"; detail?: string };

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function resendTestMode() {
  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? "";
  return from.includes("resend.dev") || from.includes("onboarding@");
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: "not_configured" };

  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Crowvo <onboarding@resend.dev>";
  const to = Array.isArray(input.to) ? input.to : [input.to];

  // crow-vo.com has no inbound mail: its only MX is Resend's bounce handler, so a reply
  // to the sending address disappears. People do reply to an invite email, so point
  // replies at a mailbox that exists.
  const replyTo =
    input.replyTo?.trim() ||
    process.env.RESEND_REPLY_TO?.trim() ||
    process.env.CONTACT_INBOX_EMAIL?.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, reason: "send_failed", detail };
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: true, id: data.id };
}

export function crowvoAppUrlForEmail() {
  return (process.env.NEXT_PUBLIC_CROWVO_APP_URL || "https://app.crow-vo.com").replace(/\/$/, "");
}
