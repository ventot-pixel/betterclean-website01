import { AdminShell } from "@/components/admin-shell";
import { Badge, SectionCard, StatCard } from "@/components/ui";
import { channelQueue } from "@/lib/mock-data";
import { getLeadInbox } from "@/lib/lead-repository";

export default async function LeadsPage() {
  const { leads, source } = await getLeadInbox();
  const hotLeads = leads.filter((lead) => lead.priority === "HOT").length;
  const awaitingReply = leads.filter((lead) => ["NEW", "AWAITING_REPLY", "CONTACTED"].includes(lead.status)).length;
  const quotesWaiting = leads.filter((lead) => lead.status === "QUOTE_SENT").length;

  return (
    <AdminShell
      eyebrow="Lead inbox"
      title="Lead and channel queue"
      description={`This screen keeps lead capture simple: one structured table for qualified leads and one live queue for WhatsApp, Facebook, Instagram, and TikTok conversations that still need action. Data source: ${source}.`}
      actions={
        <>
          <a className="button-primary" href="/admin/customers">Convert won leads</a>
          <a className="button-secondary" href="/admin/blueprint">Supabase mapping</a>
        </>
      }
    >
      <div className="grid stats">
        <StatCard label="Total leads" value={String(leads.length)} detail="Structured V1 records" />
        <StatCard label="Hot leads" value={String(hotLeads)} detail="Prioritize these today" />
        <StatCard label="Awaiting reply" value={String(awaitingReply)} detail="Needs contact or follow-up" />
        <StatCard label="Quotes waiting" value={String(quotesWaiting)} detail="Sent, not approved yet" />
      </div>

      <div className="two-col">
        <SectionCard
          title="Structured lead records"
          subtitle="Supabase website intake and social-source normalization should both land in this shape."
        >
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Channel</th>
                <th>Service</th>
                <th>Request</th>
                <th>Assigned</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong>{lead.fullName}</strong>
                    <div className="muted">{lead.phone || lead.email || "No contact details"}</div>
                  </td>
                  <td>
                    <strong>{lead.sourcePlatform}</strong>
                    <div className="muted">{lead.sourceChannel}</div>
                  </td>
                  <td>
                    <strong>{lead.serviceType}</strong>
                    <div className="muted">{lead.estimatedPrice || "Custom quote"}</div>
                  </td>
                  <td>
                    <strong>{lead.preferredDate || "No date yet"}</strong>
                    <div className="muted">{lead.nextAction}</div>
                  </td>
                  <td>{lead.assignedTo || "Unassigned"}</td>
                  <td><span className={`pill ${lead.priority.toLowerCase()}`}>{lead.priority}</span></td>
                  <td>{lead.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard
          title="Channel queue"
          subtitle="Unstructured social messages that still need a reply or qualification."
        >
          <div className="list-stack">
            {channelQueue.map((item) => (
              <div className="list-item" key={item.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong>{item.contactName}</strong>
                    <div className="muted">{item.platform} · {item.handle}</div>
                  </div>
                  <Badge
                    tone={
                      item.status === "Ready to quote" ? "green" :
                      item.status === "Waiting on customer" ? "slate" :
                      "amber"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{item.summary}</p>
                <div className="muted">
                  {item.linkedLeadId ? `Linked lead: ${item.linkedLeadId}` : "Not yet converted into a structured lead"}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
