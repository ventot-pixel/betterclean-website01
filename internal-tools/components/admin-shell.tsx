"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/blueprint", label: "Blueprint" }
];

export function AdminShell({
  title,
  eyebrow,
  description,
  actions,
  children
}: {
  title: string;
  eyebrow: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="app-frame">
      <aside className="sidebar card">
        <div>
          <div className="brand-mark">BetterClean</div>
          <h1 style={{ margin: "18px 0 8px", fontSize: 28 }}>CRM V1</h1>
          <p className="muted" style={{ margin: 0 }}>
            One place for website, WhatsApp, Facebook, Instagram, and TikTok leads.
          </p>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                className={`nav-link ${active ? "active" : ""}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <p style={{ margin: "0 0 8px", fontWeight: 800 }}>V1 design choice</p>
          <p className="muted" style={{ margin: 0 }}>
            Keep workflows simple now. Connect live Supabase tables after the team is happy with the screens and data shape.
          </p>
        </div>
      </aside>

      <section className="content-shell">
        <header className="page-header">
          <div>
            <div className="pill cold" style={{ marginBottom: 12 }}>
              {eyebrow}
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 40 }}>{title}</h2>
            <p className="muted" style={{ margin: 0, maxWidth: 760 }}>
              {description}
            </p>
          </div>
          {actions ? <div className="header-actions">{actions}</div> : null}
        </header>

        {children}
      </section>
    </main>
  );
}
