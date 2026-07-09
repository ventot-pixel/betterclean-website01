import { AdminShell } from "@/components/admin-shell";
import { Badge, SectionCard, StatCard } from "@/components/ui";
import {
  crmActivities,
  crmJobs,
  crmSnapshot,
  crmQuotes,
  getCustomer,
  getProperty
} from "@/lib/mock-data";
import { getLeadInbox } from "@/lib/lead-repository";

export default async function DashboardPage() {
  const { leads, source } = await getLeadInbox();
  const hotLeads = leads.filter((lead) => lead.priority === "HOT").length;
  const quotesWaiting = leads.filter((lead) => lead.status === "QUOTE_SENT").length;

  return (
    <AdminShell
      eyebrow="Overview"
      title="Operations dashboard"
      description={`A lightweight daily view for BetterClean. It shows what needs attention first, what is already booked, and where revenue is waiting. Lead source: ${source}.`}
      actions={
        <>
          <a className="button-primary" href="/admin/leads">Open lead queue</a>
          <a className="button-secondary" href="/admin/jobs">See schedule</a>
        </>
      }
    >
      <div className="grid stats">
        <StatCard label="Jobs today" value={String(crmSnapshot.jobsToday)} detail="Scheduled or running now" />
        <StatCard label="Hot leads" value={String(hotLeads)} detail="High-value or urgent requests" />
        <StatCard label="Quotes waiting" value={String(quotesWaiting)} detail="Need approval follow-up" />
        <StatCard label="Overdue invoices" value={String(crmSnapshot.overdueInvoices)} detail="Needs payment reminder" />
      </div>

      <div className="two-col">
        <SectionCard
          title="Priority queue"
          subtitle="The fastest path to revenue today."
        >
          <div className="list-stack">
            {leads.slice(0, 3).map((lead) => (
              <div className="list-item" key={lead.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong>{lead.fullName}</strong>
                    <div className="muted">
                      {lead.serviceType} · {lead.sourcePlatform} · {lead.estimatedPrice || "Custom quote"}
                    </div>
                  </div>
                  <span className={`pill ${lead.priority.toLowerCase()}`}>{lead.priority}</span>
                </div>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{lead.nextAction}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Today’s schedule"
          subtitle="Cleaner handoff and on-the-day notes."
        >
          <div className="list-stack">
            {crmJobs.filter((job) => job.scheduledDate <= "2026-04-25").map((job) => {
              const customer = getCustomer(job.customerId);
              const property = getProperty(job.propertyId);
              return (
                <div className="list-item" key={job.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <strong>{customer?.fullName || "Unknown customer"}</strong>
                      <div className="muted">{job.timeWindow} · {property?.address}</div>
                    </div>
                    <Badge tone={job.status === "IN_PROGRESS" ? "amber" : "green"}>{job.status}</Badge>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.6 }}>{job.internalNotes}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="three-col">
        <SectionCard title="Recent activity">
          <div className="list-stack">
            {crmActivities.map((activity) => (
              <div className="list-item" key={activity.id}>
                <strong>{activity.title}</strong>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{activity.detail}</p>
                <div className="muted">{activity.channel} · {activity.time}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Quotes in motion">
          <div className="list-stack">
            {crmQuotes.map((quote) => {
              const customer = getCustomer(quote.customerId);
              return (
                <div className="list-item" key={quote.id}>
                  <strong>{customer?.fullName || "Unknown customer"}</strong>
                  <p style={{ margin: 0 }}>{quote.lineSummary}</p>
                  <div className="muted">{quote.total} · valid until {quote.validUntil}</div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Why this V1 works">
          <div className="list-stack">
            {[
              "Website and social leads share one structure",
              "Quotes and jobs stay attached to the same customer record",
              "No heavy automation before the workflow is proven"
            ].map((item) => (
              <div className="list-item" key={item}>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
