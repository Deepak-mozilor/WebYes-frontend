import { useState } from "react";

const CATEGORIES = [
  { key: "performance",    label: "Performance"    },
  { key: "accessibility",  label: "Accessibility"  },
  { key: "best-practices", label: "Best Practices" },
  { key: "seo",            label: "SEO"            },
];

const DOCS_CATEGORY = {
  "performance":    "performance",
  "accessibility":  "accessibility",
  "best-practices": "best-practices",
  "seo":            "seo",
};

const METRIC_DEFINITIONS = [
  { key: "first-contentful-paint",  label: "First Contentful Paint",  abbr: "FCP", thresholds: [1800, 3000],  format: (v) => `${(v/1000).toFixed(1)} s` },
  { key: "largest-contentful-paint",label: "Largest Contentful Paint", abbr: "LCP", thresholds: [2500, 4000],  format: (v) => `${(v/1000).toFixed(1)} s` },
  { key: "total-blocking-time",     label: "Total Blocking Time",      abbr: "TBT", thresholds: [200, 600],    format: (v) => `${Math.round(v)} ms`       },
  { key: "cumulative-layout-shift", label: "Cumulative Layout Shift",  abbr: "CLS", thresholds: [0.1, 0.25],  format: (v) => v.toFixed(3)                },
  { key: "speed-index",             label: "Speed Index",              abbr: "SI",  thresholds: [3400, 5800],  format: (v) => `${(v/1000).toFixed(1)} s` },
  { key: "interactive",             label: "Time to Interactive",      abbr: "TTI", thresholds: [3800, 7300],  format: (v) => `${(v/1000).toFixed(1)} s` },
];

function scoreColor(val) {
  if (val >= 90) return "#0cce6b";
  if (val >= 50) return "#ffa400";
  return "#ff4e42";
}

function metricColor(value, thresholds) {
  if (value <= thresholds[0]) return "#0cce6b";
  if (value <= thresholds[1]) return "#ffa400";
  return "#ff4e42";
}

function ScoreCircle({ label, value }) {
  const color = scoreColor(value);
  return (
    <div className="score-circle">
      <svg viewBox="0 0 36 36" width="90" height="90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${value} ${100 - value}`} strokeLinecap="round" transform="rotate(-90 18 18)" />
        <text x="18" y="20.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill={color}>{value}</text>
      </svg>
      <p>{label}</p>
    </div>
  );
}

function NodeDetail({ node }) {
  if (!node || typeof node !== "object") return null;
  return (
    <div className="item-node">
      {node.nodeLabel  && <p className="item-node-label">{node.nodeLabel}</p>}
      {node.snippet    && <code className="item-snippet">{node.snippet}</code>}
      {node.selector   && <p className="item-selector">{node.selector}</p>}
      {node.explanation && <p className="item-explanation">{node.explanation}</p>}
    </div>
  );
}

function IssueItems({ items }) {
  if (!items?.length) return null;
  return (
    <div className="issue-items">
      <table className="items-table">
        <tbody>
          {items.map((item, i) => {
            if (item.url) return (
              <tr key={i}>
                <td className="item-url" title={item.url}>{item.url}</td>
                {item.wastedMs    != null && <td className="item-num">{Math.round(item.wastedMs)} ms</td>}
                {item.wastedBytes != null && <td className="item-num">{Math.round(item.wastedBytes / 1024)} KB</td>}
                {item.totalBytes  != null && <td className="item-num">{Math.round(item.totalBytes / 1024)} KB</td>}
              </tr>
            );
            if (item.node && typeof item.node === "object") return (
              <tr key={i}>
                <td>
                  <NodeDetail node={item.node} />
                  {item.subItems?.items?.length > 0 && (
                    <div className="item-subitems">
                      {item.subItems.items.map((sub, j) => (
                        <NodeDetail key={j} node={sub.relatedNode ?? sub.node ?? sub} />
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
            if (item.snippet || item.selector) return (
              <tr key={i}><td><NodeDetail node={item} /></td></tr>
            );
            return (
              <tr key={i}>
                <td className="item-raw">
                  {Object.entries(item).filter(([,v]) => typeof v !== "object").map(([k, v]) => (
                    <span key={k}><strong>{k}:</strong> {String(v)}{" "}</span>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function IssueCard({ issue, severity, category }) {
  const [open, setOpen] = useState(false);
  const items = issue.items ?? [];
  const learnMoreUrl = `https://developer.chrome.com/docs/lighthouse/${DOCS_CATEGORY[category] ?? category}/${issue.id}/`;

  return (
    <div className="issue-card">
      <div className="issue-card-header">
        <div className="issue-card-title">
          <span className="severity-badge" style={{ background: severity === "critical" ? "#dc2626" : "#d97706" }}>
            {severity}
          </span>
          <h3>{issue.title}</h3>
        </div>
        {issue.displayValue && <span className="display-value">{issue.displayValue}</span>}
      </div>

      {issue.description && <p className="issue-description">{issue.description}</p>}

      <div className="issue-footer">
        {issue.itemCount  != null && <span className="issue-meta">{issue.itemCount} items affected</span>}
        {issue.wastedMs   != null && <span className="issue-meta">{Math.round(issue.wastedMs)} ms wasted</span>}
        <a href={learnMoreUrl} target="_blank" rel="noreferrer" className="learn-more">Learn more →</a>
      </div>

      {items.length > 0 && (
        <div className="issue-items-toggle">
          <button className="items-toggle-btn" onClick={() => setOpen((o) => !o)}>
            {open ? "▲ Hide" : "▼ Show"} affected elements ({items.length})
          </button>
          {open && <IssueItems items={items} />}
        </div>
      )}
    </div>
  );
}

export default function GuestResults({ url, strategy, data }) {
  const [activeTab, setActiveTab] = useState("performance");

  const scores = data.scores ?? {};
  const metrics = data.metrics ?? {};
  const byCategory = data.byCategory ?? {};
  const screenshots = data.screenshots ?? {};
  const filmstrip = screenshots.filmstrip ?? [];

  const activeData = byCategory[activeTab] ?? {};
  const critical    = activeData.critical    ?? [];
  const nonCritical = activeData.nonCritical ?? [];
  const allIssues   = [...critical.map(i => ({ ...i, sev: "critical" })), ...nonCritical.map(i => ({ ...i, sev: "non_critical" }))];

  const issueCount = (cat) => {
    const d = byCategory[cat] ?? {};
    return (d.critical?.length ?? 0) + (d.nonCritical?.length ?? 0);
  };

  return (
    <div className="results-page">
      <section className="scores-section">
        <div className="result-header-row">
          <div>
            <h2>Results</h2>
            <a href={url} target="_blank" rel="noreferrer" className="site-url">{url}</a>
            <span className="strategy-badge">{strategy === "mobile" ? "📱 Mobile" : "🖥 Desktop"}</span>
          </div>
        </div>
        <div className="score-grid" style={{ marginTop: 16 }}>
          {CATEGORIES.map(({ key, label }) =>
            scores[key] ? <ScoreCircle key={key} label={label} value={scores[key].score} /> : null
          )}
        </div>
      </section>

      {/* Core Web Vitals */}
      {activeTab === "performance" && (
        <section className="scores-section">
          <h2>Core Web Vitals</h2>
          <div className="metrics-grid">
            {METRIC_DEFINITIONS.map(({ key, label, abbr, thresholds, format }) => {
              const m = metrics[key];
              if (!m) return null;
              const color = metricColor(m.value, thresholds);
              return (
                <div key={key} className="metric-card">
                  <div className="metric-header">
                    <span className="metric-abbr" style={{ color }}>{abbr}</span>
                    <span className="metric-value" style={{ color }}>{format(m.value)}</span>
                  </div>
                  <p className="metric-label">{label}</p>
                  <div className="metric-bar-bg">
                    <div className="metric-bar-fill" style={{ width: `${Math.min(100, (m.value / thresholds[1]) * 100)}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Screenshots — performance tab only */}
      {activeTab === "performance" && (screenshots.final || screenshots.fullPage || filmstrip.length > 0) && (
        <section className="scores-section">
          <h2>Screenshots</h2>
          <ScreenshotPanel screenshots={screenshots} />
        </section>
      )}

      {/* Issues */}
      <section className="issues-section">
        <h2>Issues by Category</h2>
        <div className="cat-tabs">
          {CATEGORIES.map(({ key, label }) => {
            const count = issueCount(key);
            return (
              <button key={key} className={`cat-tab ${activeTab === key ? "active" : ""}`} onClick={() => setActiveTab(key)}>
                {label}{count > 0 && <span className="cat-count">{count}</span>}
              </button>
            );
          })}
        </div>
        <div className="issues-list">
          {allIssues.length === 0 ? (
            <p className="empty">No issues in this category.</p>
          ) : (
            allIssues.map((issue, i) => (
              <IssueCard key={i} issue={issue} severity={issue.sev} category={activeTab} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function ScreenshotPanel({ screenshots }) {
  const [active, setActive] = useState("filmstrip");
  const filmstrip = screenshots.filmstrip ?? [];

  const views = [
    ...(filmstrip.length     ? [{ key: "filmstrip", label: "Filmstrip" }] : []),
    ...(screenshots.final    ? [{ key: "final",     label: "Final"     }] : []),
    ...(screenshots.fullPage ? [{ key: "fullPage",  label: "Full Page" }] : []),
  ];

  if (!views.length) return null;
  const validActive = views.find((v) => v.key === active) ? active : views[0].key;

  return (
    <>
      <div className="screenshot-tabs">
        {views.map((v) => (
          <button key={v.key} className={`screenshot-tab ${validActive === v.key ? "active" : ""}`} onClick={() => setActive(v.key)}>
            {v.label}{v.key === "filmstrip" && filmstrip.length > 0 && <span className="cat-count">{filmstrip.length}</span>}
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
          <img src={validActive === "final" ? screenshots.final : screenshots.fullPage} alt={validActive} className="screenshot-img" />
        </div>
      )}
    </>
  );
}
