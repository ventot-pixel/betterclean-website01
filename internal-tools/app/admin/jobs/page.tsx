import { AdminShell } from "@/components/admin-shell";
import { Badge, SectionCard, StatCard } from "@/components/ui";
import { crmJobs, getCustomer, getProperty } from "@/lib/mock-data";

export default function JobsPage() {
  return (
    <AdminShell
      eyebrow="Jobs"
      title="Schedule and delivery"
      description="V1 keeps dispatch straightforward: scheduled date, time window, assigned team, recurring flag, and a short checklist for reliable service."
      actions={
        <>
          <a className="button-primary" href="/admin/finance">Open finance</a>
          <a className="button-secondary" href="/admin/customers">See properties</a>
        </>
      }
    >
      <div className="grid stats">
        <StatCard label="Scheduled" value={String(crmJobs.filter((job) => job.status === "SCHEDULED").length)} detail="Upcoming visits" />
        <StatCard label="In progress" value={String(crmJobs.filter((job) => job.status === "IN_PROGRESS").length)} detail="Happening right now" />
        <StatCard label="Recurring jobs" value={String(crmJobs.filter((job) => job.recurring).length)} detail="Repeat revenue" />
        <StatCard label="Assigned teams" value={String(new Set(crmJobs.map((job) => job.assignedTeam)).size)} detail="Current crew coverage" />
      </div>

      <SectionCard title="Operational schedule" subtitle="A light dispatch board that is easy to scan on desktop or mobile.">
        <div className="list-stack">
          {crmJobs.map((job) => {
            const customer = getCustomer(job.customerId);
            const property = getProperty(job.propertyId);
            return (
              <div className="list-item" key={job.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong>{job.scheduledDate} · {job.timeWindow}</strong>
                    <div className="muted">
                      {customer?.fullName || customer?.companyName} · {property?.address}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge tone={job.status === "IN_PROGRESS" ? "amber" : job.status === "COMPLETED" ? "green" : "slate"}>
                      {job.status}
                    </Badge>
                    {job.recurring ? <Badge tone="green">Recurring</Badge> : null}
                  </div>
                </div>
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                  Team: {job.assignedTeam}
                </p>
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                  Internal notes: {job.internalNotes}
                </p>
                <div className="muted">Checklist: {job.checklist.join(" · ")}</div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </AdminShell>
  );
}
