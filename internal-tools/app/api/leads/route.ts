import { NextResponse } from "next/server";
import { betterCleanLeadSchema } from "@/lib/lead-schema";
import { scoreBetterCleanLead } from "@/lib/scoring";
import { buildAutoReply } from "@/lib/email";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = betterCleanLeadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation failed",
        issues: parsed.error.flatten()
      },
      { status: 422 }
    );
  }

  const score = scoreBetterCleanLead(parsed.data);
  const autoReply = buildAutoReply(parsed.data);

  return NextResponse.json({
    ok: true,
    message: "Lead accepted for processing",
    lead: parsed.data,
    score,
    autoReplyPreview: autoReply,
    nextSteps: [
      "Persist the lead to Postgres",
      "Create a lead event log entry",
      "Send BetterClean auto-reply email",
      "Trigger internal team notification"
    ]
  });
}
