import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import {

  approveWaitlistSignup,

  findWaitlistById,

  listWaitlistSignups,

} from "@/lib/waitlist-store";

import { requireAdmin } from "@/lib/admin-auth";

import { crowvoAdminFetch } from "@/lib/crowvo-admin-api";

import { crowvoAppUrlForEmail, sendEmail } from "@/lib/email";



export async function GET(req: NextRequest) {

  try {

    await requireAdmin(req);

    const signups = await listWaitlistSignups(100);

    return NextResponse.json({ signups });

  } catch (err) {

    const message = err instanceof Error ? err.message : "Unauthorized";

    return NextResponse.json({ error: message }, { status: 401 });

  }

}



const approveSchema = z.object({ id: z.string() });



export async function POST(req: NextRequest) {

  try {

    await requireAdmin(req);

    const parsed = approveSchema.safeParse(await req.json());

    if (!parsed.success) return NextResponse.json({ error: "Invalid id." }, { status: 400 });



    const signup = await findWaitlistById(parsed.data.id);

    if (!signup) return NextResponse.json({ error: "Not found." }, { status: 404 });

    if (signup.status === "auto_invited" && signup.inviteCode) {

      return NextResponse.json({ signup, message: "Already invited." });

    }



    const res = await crowvoAdminFetch("/access-codes", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({

        singleUse: true,

        maxUses: 1,

        tier: "USER",

        label: `Waitlist approve: ${signup.email}`,

        note: signup.communityType ?? "",

        createdByLabel: "admin-approve",

      }),

    });

    const payload = (await res.json()) as { code?: { id: string; code: string }; error?: string };

    if (!res.ok || !payload.code) {

      return NextResponse.json({ error: payload.error ?? "Could not create code." }, { status: 502 });

    }



    const updated = await approveWaitlistSignup(signup.id, payload.code.code, payload.code.id);



    const appUrl = crowvoAppUrlForEmail();

    const joinUrl = `${appUrl}/join?code=${encodeURIComponent(payload.code.code)}`;

    await sendEmail({

      to: signup.email,

      subject: "Your Crowvo invite code",

      html: `<p>Your spot opened up.</p><p>Access code: <strong>${payload.code.code}</strong></p><p><a href="${joinUrl}">Create your account</a></p>`,

    });



    return NextResponse.json({ signup: updated });

  } catch (err) {

    const message = err instanceof Error ? err.message : "Request failed";

    const status = message === "Unauthorized" ? 401 : 500;

    return NextResponse.json({ error: message }, { status });

  }

}


