import { NextResponse } from "next/server";
import { betterCleanLeadSchema } from "@/lib/lead-schema";
import { buildAutoReply } from "@/lib/email";
import { createLead } from "@/lib/lead-repository";

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

  const result = await createLead(parsed.data);
  const autoReply = buildAutoReply(parsed.data);

  return NextResponse.json({
    ok: true,
    message: result.mode === "database" ? "Lead stored successfully" : "Lead accepted in mock mode",
    lead: parsed.data,
    leadId: result.leadId,
    persistenceMode: result.mode,
    score: result.score,
    autoReplyPreview: autoReply,
    nextSteps: [
      "Review lead in the CRM inbox",
      "Assign owner and status",
      "Send BetterClean auto-reply email",
      "Trigger internal team notification or channel assignment"
    ]
  });
}
