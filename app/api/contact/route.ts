import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contactInboxEmail } from "@/lib/inbox";
import { sendEmail } from "@/lib/email";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check your name, email, and message." }, { status: 400 });
    }

    const { name, email, message } = parsed.data;
    const inbox = contactInboxEmail();

    const result = await sendEmail({
      to: inbox,
      subject: `[Crowvo Contact] ${name}`,
      html: `
        <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    if (!result.ok) {
      if (result.reason === "not_configured") {
        return NextResponse.json(
          {
            error: `Email is not configured yet. Write to ${inbox} directly.`,
            mailto: `mailto:${inbox}`,
          },
          { status: 503 },
        );
      }
      console.error("contact send failed:", result.detail);
      return NextResponse.json({ error: "Could not send your message. Please try again or email us directly." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Thanks — we received your message and will reply soon." });
  } catch (err) {
    console.error("contact route error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
