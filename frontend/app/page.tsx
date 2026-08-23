"use client";

import { useMemo, useState } from "react";

type RequestStatus = "Draft" | "For review" | "Approved" | "Printing";
type ExamRequest = {
  id: string; subject: string; code: string; exam: string;
  sections: string; copies: number; date: string; status: RequestStatus;
};

const initialRequests: ExamRequest[] = [
  { id: "EX-2026-018", subject: "General Biology", code: "BIO 101", exam: "Midterm Examination", sections: "STEM 11-A · STEM 11-B", copies: 86, date: "Aug 26, 2026", status: "For review" },
  { id: "EX-2026-014", subject: "Statistics & Probability", code: "STAT 201", exam: "Quarterly Assessment", sections: "HUMSS 12-A", copies: 42, date: "Aug 24, 2026", status: "Approved" },
  { id: "EX-2026-009", subject: "Earth and Life Science", code: "ELS 110", exam: "Unit Examination", sections: "STEM 11-C", copies: 45, date: "Aug 23, 2026", status: "Printing" },
];

const statusClass: Record<RequestStatus, string> = {
  Draft: "status status-draft",
  "For review": "status status-review",
  Approved: "status status-approved",
  Printing: "status status-printing",
};

export default function Home() {
  const [requests, setRequests] = useState(initialRequests);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");

  const visibleRequests = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return requests;
    return requests.filter((request) =>
      `${request.subject} ${request.code} ${request.id}`.toLowerCase().includes(needle),
    );
  }, [query, requests]);

  function createRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextNumber = String(19 + requests.length).padStart(3, "0");
    const request: ExamRequest = {
      id: `EX-2026-${nextNumber}`,
      subject: String(data.get("subject") || "Untitled examination"),
      code: String(data.get("code") || "SUBJ 101").toUpperCase(),
      exam: String(data.get("exam") || "Examination"),
      sections: String(data.get("sections") || "Section pending"),
      copies: Number(data.get("copies") || 1),
      date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date()),
      status: "Draft",
    };
    setRequests((current) => [request, ...current]);
    setShowForm(false);
    setNotice(`${request.id} was saved as a draft.`);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">TQ</div>
          <div><strong>ExamWorks</strong><span>Faculty portal</span></div>
        </div>
        <nav aria-label="Main navigation">
          <a className="nav-item active" href="#dashboard"><span>⌂</span>Overview</a>
          <a className="nav-item" href="#requests"><span>▤</span>My requests</a>
          <a className="nav-item" href="#templates"><span>▦</span>TOS templates</a>
          <a className="nav-item" href="#archive"><span>□</span>Question bank</a>
        </nav>
        <div className="sidebar-spacer" />
        <div className="help-card">
          <span className="help-icon">?</span><strong>Need a hand?</strong>
          <p>Read the faculty guide or contact the examination office.</p>
          <button type="button">Open guide</button>
        </div>
        <div className="profile">
          <div className="avatar">JA</div>
          <div><strong>Jessan A.</strong><span>Faculty member</span></div>
          <button aria-label="Profile menu" type="button">•••</button>
        </div>
      </aside>

      <section className="content" id="dashboard">
        <header className="topbar">
          <button className="mobile-brand" type="button" aria-label="Open menu">TQ</button>
          <label className="search">
            <span>⌕</span>
            <input aria-label="Search examination requests" placeholder="Search requests, subjects, or codes"
              value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications" type="button">♢<i /></button>
            <button className="primary-button" type="button" onClick={() => setShowForm(true)}><span>＋</span> New request</button>
          </div>
        </header>

        <div className="page-body">
          {notice && <div className="notice" role="status">✓ {notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
          <div className="welcome-row">
            <div><p className="eyebrow">Sunday, August 23</p><h1>Good evening, Jessan.</h1><p>Here’s what’s happening with your examination requests.</p></div>
            <div className="term-pill"><span /> First semester · SY 2026–2027</div>
          </div>

          <section className="stats-grid" aria-label="Request summary">
            <article className="stat-card"><div className="stat-icon amber">▤</div><div><span>Awaiting review</span><strong>4</strong><small><b>2</b> due this week</small></div></article>
            <article className="stat-card"><div className="stat-icon green">✓</div><div><span>Approved</span><strong>12</strong><small>Ready for printing</small></div></article>
            <article className="stat-card"><div className="stat-icon blue">▥</div><div><span>In production</span><strong>3</strong><small>Est. completion Aug 25</small></div></article>
            <article className="stat-card accent-card"><div><span>Total this term</span><strong>28</strong><small>1,246 copies requested</small></div><div className="mini-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div></article>
          </section>

          <section className="workspace-grid">
            <div className="panel request-panel" id="requests">
              <div className="panel-heading"><div><h2>Recent requests</h2><p>Track the status of your latest submissions.</p></div><a href="#requests">View all <span>→</span></a></div>
              <div className="request-list">
                {visibleRequests.length ? visibleRequests.map((request) => (
                  <article className="request-row" key={request.id}>
                    <div className="subject-badge">{request.code.slice(0, 2)}</div>
                    <div className="request-main"><div className="request-title"><strong>{request.subject}</strong><span>{request.code}</span></div><p>{request.exam} · {request.sections}</p></div>
                    <div className="request-meta"><span>Copies</span><strong>{request.copies}</strong></div>
                    <div className="request-meta"><span>Submitted</span><strong>{request.date}</strong></div>
                    <span className={statusClass[request.status]}>{request.status}</span>
                    <button className="row-menu" aria-label={`Options for ${request.subject}`} type="button">•••</button>
                  </article>
                )) : <div className="empty-state">No requests match “{query}”.</div>}
              </div>
            </div>

            <aside className="panel activity-panel">
              <div className="panel-heading"><div><h2>Activity</h2><p>Latest updates</p></div></div>
              <div className="timeline">
                <div className="timeline-item"><span className="dot green-dot">✓</span><div><p><strong>Statistics & Probability</strong> was approved.</p><small>Today · 4:32 PM</small></div></div>
                <div className="timeline-item"><span className="dot blue-dot">↗</span><div><p><strong>Earth and Life Science</strong> moved to printing.</p><small>Today · 10:18 AM</small></div></div>
                <div className="timeline-item"><span className="dot amber-dot">!</span><div><p>A reviewer left a note on <strong>General Biology</strong>.</p><small>Yesterday · 3:05 PM</small></div></div>
                <div className="timeline-item"><span className="dot gray-dot">＋</span><div><p>You created <strong>Physics 1 – Unit Exam</strong>.</p><small>Aug 21 · 1:47 PM</small></div></div>
              </div>
              <button className="activity-button" type="button">View activity log</button>
            </aside>
          </section>

          <section className="quick-start" id="templates">
            <div><span className="eyebrow">Quick start</span><h2>Build your next assessment with confidence.</h2><p>Use a standards-aligned TOS template and submit your printing request in one guided flow.</p></div>
            <button type="button" onClick={() => setShowForm(true)}>Create from template <span>→</span></button>
          </section>
        </div>
      </section>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowForm(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading"><div><span className="eyebrow">New printing request</span><h2 id="modal-title">Examination details</h2></div><button aria-label="Close" onClick={() => setShowForm(false)}>×</button></div>
            <form onSubmit={createRequest}>
              <label>Subject name<input name="subject" required placeholder="e.g. General Mathematics" autoFocus /></label>
              <div className="form-grid"><label>Subject code<input name="code" required placeholder="MATH 101" /></label><label>Number of copies<input name="copies" type="number" min="1" max="1000" required placeholder="40" /></label></div>
              <label>Assessment type<select name="exam" defaultValue="Quarterly Examination"><option>Quarterly Examination</option><option>Midterm Examination</option><option>Unit Examination</option><option>Final Examination</option></select></label>
              <label>Sections<input name="sections" required placeholder="e.g. STEM 11-A · STEM 11-B" /></label>
              <div className="modal-actions"><button type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit">Save draft</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
