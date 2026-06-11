import { useState, useEffect } from "react";
import { api } from "../api";

const CATEGORIES = [
  { key: "performance",    label: "Performance"    },
  { key: "accessibility",  label: "Accessibility"  },
  { key: "best_practices", label: "Best Practices" },
  { key: "seo",            label: "SEO"            },
];

const DOCS_CATEGORY = {
  performance:    "performance",
  accessibility:  "accessibility",
  best_practices: "best-practices",
  seo:            "seo",
};

function learnMoreUrl(category, ruleId) {
  return `https://developer.chrome.com/docs/lighthouse/${DOCS_CATEGORY[category] ?? category}/${ruleId}/`;
}

function scoreColor(val) {
  if (val >= 90) return "#0cce6b";
  if (val >= 50) return "#ffa400";
  return "#ff4e42";
}

function ScoreCircle({ label, value }) {
  const color = scoreColor(value);
  return (
    <div className="score-circle">
      <svg viewBox="0 0 36 36" width="90" height="90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15.9" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${value} ${100 - value}`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
        <text x="18" y="20.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill={color}>
          {value}
        </text>
      </svg>
      <p>{label}</p>
    </div>
  );
}

function Screenshots({ screenshots }) {
  const [active, setActive] = useState("filmstrip");

  if (!screenshots?.length) return null;
  const page = screenshots[0];
  const scannedAt = new Date(page.scanned_at).toLocaleString();
  const filmstrip = page.filmstrip ?? [];

  const views = [
    ...(filmstrip.length ? [{ key: "filmstrip", label: "Filmstrip" }] : []),
    ...(page.screenshot_final    ? [{ key: "final",    label: "Final"     }] : []),
    ...(page.screenshot_full_page ? [{ key: "fullPage", label: "Full Page" }] : []),
  ];

  if (!views.length) return <p className="empty">No screenshots available.</p>;

  // ensure active tab is valid
  const validActive = views.find((v) => v.key === active) ? active : views[0].key;

  return (
    <div className="screenshots-block">
      <div className="screenshot-meta">
        <span className="screenshot-url">{page.page_url}</span>
        <span className="screenshot-time">Scanned at {scannedAt}</span>
      </div>

      <div className="screenshot-tabs">
        {views.map((v) => (
          <button
            key={v.key}
            className={`screenshot-tab ${validActive === v.key ? "active" : ""}`}
            onClick={() => setActive(v.key)}
          >
            {v.label}
            {v.key === "filmstrip" && filmstrip.length > 0 && (
              <span className="cat-count">{filmstrip.length}</span>
            )}
          </button>
        ))}
      </div>

      {validActive === "filmstrip" ? (
        <div className="filmstrip-grid">
          {filmstrip.map((frame, i) => (
            <div key={i} className="filmstrip-frame">
              <img src={frame.data} alt={`${frame.timing}ms`} className="filmstrip-img" />
              <span className="filmstrip-timing">{frame.timing} ms</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="screenshot-frame">
          <img
            src={validActive === "final" ? page.screenshot_final : page.screenshot_full_page}
            alt={validActive}
            className="screenshot-img"
          />
          <p className="screenshot-label">
            {validActive === "final" ? "Final screenshot" : "Full page screenshot"}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ScanResults({ website, summary, scanJobId, onBack }) {
  const [activeTab, setActiveTab] = useState("performance");
  const [issues, setIssues] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scanJobId) { setLoading(false); return; }
    Promise.all([
      api.getIssues(scanJobId),
      api.getScreenshots(scanJobId),
    ])
      .then(([iss, shots]) => {
        setIssues(iss);
        setScreenshots(shots);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [scanJobId]);

  const { scores, total_pages, passed_pages } = summary;

  const byCategory = {};
  for (const cat of CATEGORIES) byCategory[cat.key] = [];
  for (const issue of issues) byCategory[issue.category]?.push(issue);

  const activeIssues = byCategory[activeTab] ?? [];

  return (
    <div className="results-page">
      <header className="dash-header">
        <button className="btn-outline" onClick={onBack}>← Back</button>
        <div style={{ flex: 1 }}>
          <h1>{website.name}</h1>
          <a href={website.url} target="_blank" rel="noreferrer" className="site-url">
            {website.url}
          </a>
        </div>
      </header>

      <main className="results-main">
        {/* Scores */}
        <section className="scores-section">
          <h2>Scores</h2>
          <div className="score-grid">
            {CATEGORIES.map(({ key, label }) =>
              scores[key] ? (
                <ScoreCircle key={key} label={label} value={scores[key].avg} />
              ) : null
            )}
          </div>
          <p className="meta">{total_pages} page scanned · {passed_pages} passed</p>
        </section>

        {/* Issues + Screenshots by category */}
        <section className="issues-section">
          <h2>Issues by Category</h2>

          <div className="cat-tabs">
            {CATEGORIES.map(({ key, label }) => {
              const count = byCategory[key]?.length ?? 0;
              return (
                <button
                  key={key}
                  className={`cat-tab ${activeTab === key ? "active" : ""}`}
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                  {count > 0 && <span className="cat-count">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Screenshots — only in Performance tab */}
          {activeTab === "performance" && !loading && (
            <Screenshots screenshots={screenshots} />
          )}

          <div className="issues-list">
            {loading ? (
              <p className="empty">Loading...</p>
            ) : activeIssues.length === 0 ? (
              <p className="empty">No issues in this category.</p>
            ) : (
              activeIssues.map((issue) => (
                <div key={issue.id} className="issue-card">
                  <div className="issue-card-header">
                    <div className="issue-card-title">
                      <span
                        className="severity-badge"
                        style={{ background: issue.severity === "critical" ? "#dc2626" : "#d97706" }}
                      >
                        {issue.severity}
                      </span>
                      <h3>{issue.title}</h3>
                    </div>
                    {issue.display_value && (
                      <span className="display-value">{issue.display_value}</span>
                    )}
                  </div>

                  {issue.description && (
                    <p className="issue-description">{issue.description}</p>
                  )}

                  <div className="issue-footer">
                    {issue.item_count != null && (
                      <span className="issue-meta">{issue.item_count} items affected</span>
                    )}
                    {issue.wasted_ms != null && (
                      <span className="issue-meta">{Math.round(issue.wasted_ms)} ms wasted</span>
                    )}
                    <a
                      href={learnMoreUrl(issue.category, issue.rule_id)}
                      target="_blank"
                      rel="noreferrer"
                      className="learn-more"
                    >
                      Learn more →
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
