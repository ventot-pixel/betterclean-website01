import { AdminShell } from "@/components/admin-shell";
import { Badge, SectionCard, StatCard } from "@/components/ui";
import { crmCustomers, crmProperties, crmSnapshot } from "@/lib/mock-data";

export default function CustomersPage() {
  return (
    <AdminShell
      eyebrow="Customers"
      title="Customers and properties"
      description="Keep one clean customer record, allow multiple properties, and store the operational details cleaners actually need."
      actions={
        <>
          <a className="button-primary" href="/admin/jobs">Schedule a visit</a>
          <a className="button-secondary" href="/admin/leads">Back to leads</a>
        </>
      }
    >
      <div className="grid stats">
        <StatCard label="Active customers" value={String(crmSnapshot.activeCustomers)} detail="Residential and commercial" />
        <StatCard label="Recurring properties" value={String(crmSnapshot.recurringCustomers)} detail="Biweekly or weekly service" />
        <StatCard label="English-speaking" value={String(crmCustomers.filter((customer) => customer.language === "en").length)} detail="Language preference tracked" />
        <StatCard label="Commercial accounts" value={String(crmCustomers.filter((customer) => customer.segment === "commercial").length)} detail="Supported in same CRM" />
      </div>

      <div className="two-col">
        <SectionCard title="Customer records" subtitle="This is the core account view for office operations.">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Jobs</th>
                <th>Quotes</th>
                <th>Balance</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {crmCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.companyName || customer.fullName}</strong>
                    <div className="muted">{customer.email || customer.phone || "No contact info"}</div>
                  </td>
                  <td>
                    <Badge tone={customer.segment === "commercial" ? "slate" : "green"}>
                      {customer.segment}
                    </Badge>
                  </td>
                  <td>{customer.totalJobs}</td>
                  <td>{customer.activeQuotes}</td>
                  <td>{customer.outstandingBalance}</td>
                  <td>{customer.leadSource}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Property details" subtitle="Access notes, pets, parking, and frequency are part of the CRM, not lost in chat threads.">
          <div className="list-stack">
            {crmProperties.map((property) => {
              const customer = crmCustomers.find((item) => item.id === property.customerId);
              return (
                <div className="list-item" key={property.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <strong>{property.label}</strong>
                      <div className="muted">{customer?.fullName || customer?.companyName} · {property.address}, {property.city}</div>
                    </div>
                    <Badge tone={property.frequency === "One-off" ? "amber" : "green"}>
                      {property.frequency}
                    </Badge>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.6 }}>
                    Access: {property.accessNotes}
                  </p>
                  <p style={{ margin: 0, lineHeight: 1.6 }}>
                    Parking: {property.parkingNotes} · Pets: {property.pets}
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
