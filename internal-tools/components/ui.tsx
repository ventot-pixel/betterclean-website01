import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="card stat-card">
      <p className="muted" style={{ margin: 0 }}>{label}</p>
      <h3 style={{ margin: "10px 0 6px", fontSize: 34 }}>{value}</h3>
      <p className="muted" style={{ margin: 0 }}>{detail}</p>
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="card section-card">
      <div className="section-head">
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: 22 }}>{title}</h3>
          {subtitle ? <p className="muted" style={{ margin: 0 }}>{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Badge({
  tone,
  children
}: {
  tone: "green" | "amber" | "red" | "slate";
  children: ReactNode;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
