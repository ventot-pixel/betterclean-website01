import Link from "next/link";

const sources = [
  { label: "Website", detail: "First connected source for structured lead capture.", status: "In progress" },
  { label: "Facebook", detail: "Planned for page messages and lead ads after website MVP.", status: "Planned" },
  { label: "Instagram", detail: "Planned for DMs and profile-led quote requests.", status: "Planned" },
  { label: "TikTok", detail: "Planned for attribution and CTA routing before deeper inbox automation.", status: "Planned" }
];

export default function HomePage() {
  return (
    <main>
      <div className="shell">
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <div className="pill cold" style={{ marginBottom: 18 }}>BetterClean MVP</div>
          <h1 style={{ fontSize: 44, lineHeight: 1.05, margin: "0 0 12px", maxWidth: 760 }}>
            Internal lead system for BetterClean website inquiries and future social channel routing.
          </h1>
          <p style={{ maxWidth: 760, fontSize: 18, lineHeight: 1.7, color: "#496549", marginBottom: 24 }}>
            This app is the first foundation for BetterClean operations: structured lead intake, deterministic scoring,
            auto-reply preparation, and one internal dashboard instead of scattered inboxes.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/admin/leads" className="card" style={{ padding: "14px 18px", fontWeight: 700, borderColor: "transparent", background: "var(--green)", color: "#fff" }}>
              Open Lead Dashboard
            </Link>
            <Link href="/admin/blueprint" className="card" style={{ padding: "14px 18px", fontWeight: 700 }}>
              View MVP Blueprint
            </Link>
          </div>
        </div>

        <div className="grid stats" style={{ marginBottom: 24 }}>
          {sources.map((source) => (
            <div className="card stat-box" key={source.label}>
              <p style={{ margin: "0 0 8px", fontWeight: 800 }}>{source.label}</p>
              <p style={{ margin: "0 0 12px", color: "#567556", lineHeight: 1.6 }}>{source.detail}</p>
              <span className={`pill ${source.status === "In progress" ? "warm" : "cold"}`}>{source.status}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
