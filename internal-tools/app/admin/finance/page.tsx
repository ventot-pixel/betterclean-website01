import { AdminShell } from "@/components/admin-shell";
import { Badge, SectionCard, StatCard } from "@/components/ui";
import { crmInvoices, crmQuotes, getCustomer } from "@/lib/mock-data";

export default function FinancePage() {
  return (
    <AdminShell
      eyebrow="Finance"
      title="Quotes and invoices"
      description="V1 finance stays operational instead of accounting-heavy. The team can see what was quoted, what labour share to retain for household deduction records, and what invoices still need payment."
      actions={
        <>
          <a className="button-primary" href="/admin/dashboard">Back to dashboard</a>
          <a className="button-secondary" href="/admin/leads">Check leads</a>
        </>
      }
    >
      <div className="grid stats">
        <StatCard label="Sent quotes" value={String(crmQuotes.filter((quote) => quote.status === "SENT").length)} detail="Waiting for customer decision" />
        <StatCard label="Approved quotes" value={String(crmQuotes.filter((quote) => quote.status === "APPROVED").length)} detail="Ready for scheduling or billing" />
        <StatCard label="Overdue invoices" value={String(crmInvoices.filter((invoice) => invoice.status === "OVERDUE").length)} detail="Needs reminder today" />
        <StatCard label="Draft invoices" value={String(crmInvoices.filter((invoice) => invoice.status === "DRAFT").length)} detail="Pending job completion" />
      </div>

      <div className="two-col">
        <SectionCard title="Quote tracker" subtitle="Built to match BetterClean pricing and labour-share tracking.">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Status</th>
                <th>Total</th>
                <th>Labour share</th>
                <th>Valid until</th>
              </tr>
            </thead>
            <tbody>
              {crmQuotes.map((quote) => (
                <tr key={quote.id}>
                  <td>{getCustomer(quote.customerId)?.fullName || getCustomer(quote.customerId)?.companyName}</td>
                  <td>
                    <strong>{quote.serviceType}</strong>
                    <div className="muted">{quote.lineSummary}</div>
                  </td>
                  <td>{quote.status}</td>
                  <td>{quote.total}</td>
                  <td>{quote.labourShare}</td>
                  <td>{quote.validUntil}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Invoice tracker" subtitle="Enough for operational follow-up without replacing accounting software.">
          <div className="list-stack">
            {crmInvoices.map((invoice) => {
              const customer = getCustomer(invoice.customerId);
              return (
                <div className="list-item" key={invoice.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <strong>{customer?.companyName || customer?.fullName}</strong>
                      <div className="muted">Due {invoice.dueDate} · {invoice.paymentMethod}</div>
                    </div>
                    <Badge
                      tone={
                        invoice.status === "PAID" ? "green" :
                        invoice.status === "OVERDUE" ? "red" :
                        invoice.status === "SENT" ? "amber" :
                        "slate"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.6 }}>
                    Total {invoice.total} · Labour portion {invoice.labourPortion}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
