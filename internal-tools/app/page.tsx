import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <div className="shell">
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <div className="pill cold" style={{ marginBottom: 18 }}>BetterClean Internal Tools</div>
          <h1 style={{ fontSize: 48, lineHeight: 1.02, margin: "0 0 12px", maxWidth: 820 }}>
            Simple CRM V1 for BetterClean lead handling, quoting, scheduling, and invoice follow-up.
          </h1>
          <p className="muted" style={{ maxWidth: 760, fontSize: 18, lineHeight: 1.7, marginBottom: 24 }}>
            This first version is intentionally focused. It gives BetterClean one operational view across the website,
            WhatsApp, Facebook, Instagram, and TikTok while staying easy to connect to Supabase later.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/admin/dashboard" className="button-primary">
              Open CRM dashboard
            </Link>
            <Link href="/admin/blueprint" className="button-secondary">
              Review V1 scope
            </Link>
          </div>
        </div>

        <div className="mini-grid">
          {[
            ["Lead inbox", "New leads from the site and social channels land in one shared queue."],
            ["Quotes", "Fast quote tracking with labour share ready for household deduction workflows."],
            ["Jobs", "See today’s schedule, recurring cleans, assigned team, and internal notes."],
            ["Finance", "Track invoices without needing full accounting software in V1."]
          ].map(([title, detail]) => (
            <section className="card" key={title} style={{ padding: 24 }}>
              <p className="kicker" style={{ margin: "0 0 10px" }}>{title}</p>
              <p style={{ margin: 0, lineHeight: 1.7 }}>{detail}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
