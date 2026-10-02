import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contactInboxEmail } from "@/lib/inbox";
import { sendEmail } from "@/lib/email";
import { execute } from "@/lib/sql";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  company: z.string().min(1).max(200),
  checkSize: z.string().max(120).optional(),
  message: z.string().min(10).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    const { name, email, company, checkSize, message } = parsed.data;
    const inbox = contactInboxEmail();
    const id = crypto.randomUUID();

    try {
      await execute(
        `INSERT INTO "InvestorInterest" (id, name, email, company, "checkSize", message, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [id, name, email, company, checkSize?.trim() || null, message],
      );
    } catch (dbErr) {
      console.error("investor interest db insert failed:", dbErr);
    }

    const result = await sendEmail({
      to: inbox,
      subject: `[Crowvo Investors] ${name} — ${company}`,
      html: `
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company)}</p>
        ${checkSize ? `<p><strong>Check size / focus:</strong> ${escapeHtml(checkSize)}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
      text: `Investor inquiry\n\nName: ${name}\nEmail: ${email}\nCompany: ${company}\nCheck: ${checkSize ?? "—"}\n\n${message}`,
    });

    if (!result.ok) {
      if (result.reason === "not_configured") {
        return NextResponse.json(
          {
            error: `Email is not configured yet. Write to ${inbox} with subject "Investor inquiry".`,
            mailto: `mailto:${inbox}?subject=Investor%20inquiry`,
          },
          { status: 503 },
        );
      }
      console.error("investor send failed:", result.detail);
      return NextResponse.json({ error: "Could not send your request. Please try again or email us directly." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Thanks — we received your request and will follow up soon." });
  } catch (err) {
    console.error("investors route error:", err);
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
