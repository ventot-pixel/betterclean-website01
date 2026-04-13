import { mockLeads } from "@/lib/mock-data";

export default function LeadsPage() {
  return (
    <main>
      <div className="shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, marginBottom: 24 }}>
          <div>
            <div className="pill cold" style={{ marginBottom: 12 }}>Admin</div>
            <h1 style={{ fontSize: 36, margin: "0 0 8px" }}>Lead Inbox</h1>
            <p style={{ margin: 0, color: "#567556", maxWidth: 680 }}>
              Starter BetterClean lead dashboard. The first live integration target is the website form, then Facebook,
              Instagram, and TikTok attribution can follow.
            </p>
          </div>
        </div>

        <div className="grid stats" style={{ marginBottom: 24 }}>
          <div className="card stat-box">
            <p style={{ margin: 0, color: "#567556" }}>New leads today</p>
            <h2 style={{ margin: "8px 0 0", fontSize: 34 }}>3</h2>
          </div>
          <div className="card stat-box">
            <p style={{ margin: 0, color: "#567556" }}>Hot leads</p>
            <h2 style={{ margin: "8px 0 0", fontSize: 34 }}>1</h2>
          </div>
          <div className="card stat-box">
            <p style={{ margin: 0, color: "#567556" }}>Avg. score</p>
            <h2 style={{ margin: "8px 0 0", fontSize: 34 }}>71</h2>
          </div>
          <div className="card stat-box">
            <p style={{ margin: 0, color: "#567556" }}>Primary source</p>
            <h2 style={{ margin: "8px 0 0", fontSize: 34 }}>Website</h2>
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Source</th>
                <th>Service</th>
                <th>Requested date</th>
                <th>Value</th>
                <th>Score</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.fullName}</td>
                  <td>{lead.sourceChannel}</td>
                  <td>{lead.serviceType}</td>
                  <td>{lead.preferredDate}</td>
                  <td>{lead.estimatedPrice}</td>
                  <td>{lead.score}</td>
                  <td><span className={`pill ${lead.priority.toLowerCase()}`}>{lead.priority}</span></td>
                  <td>{lead.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
