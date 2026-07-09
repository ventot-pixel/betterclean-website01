import { AdminShell } from "@/components/admin-shell";
import { SectionCard } from "@/components/ui";

const v1Modules = [
  "Lead inbox across website and social channels",
  "Structured customer records with multiple properties",
  "Quote tracker with labour-share field",
  "Job schedule with cleaner notes and checklists",
  "Invoice status tracking",
  "Simple dashboard for daily priorities"
];

const supabaseMapping = [
  "Use `leads` for website form payloads and normalized social leads",
  "Use `customers` after a lead is won or manually qualified",
  "Use `properties` as a one-to-many child table under customers",
  "Use `quotes`, `jobs`, and `invoices` as linked operational tables",
  "Store inbound WhatsApp, Facebook, Instagram, and TikTok threads in a `channel_queue` table or view"
];

const nextUp = [
  "Replace mock data with Supabase queries and mutations",
  "Connect your existing lead-gen tool directly to the shared `leads` table",
  "Add status update forms and quick actions",
  "Add staff auth and role-based access if the team grows"
];

export default function BlueprintPage() {
  return (
    <AdminShell
      eyebrow="Blueprint"
      title="CRM V1 implementation plan"
      description="This page keeps the scope disciplined. We built a simple internal operations CRM first so BetterClean can validate the workflow before adding heavier automation."
      actions={
        <>
          <a className="button-primary" href="/admin/dashboard">Open dashboard</a>
          <a className="button-secondary" href="/admin/leads">Review lead model</a>
        </>
      }
    >
      <div className="three-col">
        <SectionCard title="What V1 includes">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
            {v1Modules.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </SectionCard>

        <SectionCard title="How Supabase should connect">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
            {supabaseMapping.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </SectionCard>

        <SectionCard title="What to build next">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
            {nextUp.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
