const modules = [
  "Website lead intake",
  "Structured lead storage",
  "Deterministic scoring",
  "Auto-reply templates",
  "Internal lead dashboard",
  "Later: Facebook, Instagram, TikTok source ingestion"
];

const deterministic = [
  "Lead validation",
  "Source tagging",
  "Scoring thresholds",
  "Priority labels",
  "Status transitions",
  "Internal notifications"
];

const aiLater = [
  "Summaries for vague social DMs",
  "Suggested next actions",
  "Quote narrative drafting",
  "Conversation classification"
];

export default function BlueprintPage() {
  return (
    <main>
      <div className="shell">
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <div className="pill warm" style={{ marginBottom: 12 }}>Blueprint</div>
          <h1 style={{ fontSize: 36, margin: "0 0 12px" }}>BetterClean MVP plan</h1>
          <p style={{ margin: 0, color: "#567556", maxWidth: 760, lineHeight: 1.7 }}>
            Build the deterministic backbone first. The website will be the first real source. Social channels will plug
            into the same `Lead` model once the core workflow is stable.
          </p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <section className="card" style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>V1 modules</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
              {modules.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section className="card" style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Deterministic core</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
              {deterministic.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section className="card" style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>AI after the core</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
              {aiLater.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
