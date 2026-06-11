import { useState, useEffect } from "react";
import { api } from "../api";
import ScanResults from "./ScanResults";

export default function Dashboard({ onLogout }) {
  const [websites, setWebsites] = useState([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(null);
  const [selectedScan, setSelectedScan] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => {});
    loadWebsites();
  }, []);

  async function loadWebsites() {
    try {
      const data = await api.getWebsites();
      setWebsites(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddWebsite(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createWebsite(name, url);
      setName("");
      setUrl("");
      await loadWebsites();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleScan(website) {
    setScanning(website.id);
    setError("");
    try {
      const job = await api.triggerScan(website.id, "desktop");
      const summary = await api.getScanSummary(job.scan_job_id);
      setSelectedScan({ website, summary, scanJobId: job.scan_job_id });
      await loadWebsites();
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this website and all its scan data?")) return;
    try {
      await api.deleteWebsite(id);
      await loadWebsites();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleViewHistory(website) {
    try {
      const history = await api.getScanHistory(website.id);
      if (!history.length) return alert("No scan history yet.");
      const latest = history[0];
      const summary = await api.getScanSummary(latest.scan_job_id);
      setSelectedScan({ website, summary, scanJobId: latest.scan_job_id });
    } catch (err) {
      setError(err.message);
    }
  }

  if (selectedScan) {
    return (
      <ScanResults
        website={selectedScan.website}
        summary={selectedScan.summary}
        scanJobId={selectedScan.scanJobId}
        onBack={() => setSelectedScan(null)}
      />
    );
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <h1>WebYes</h1>
        <div className="user-info">
          {user && <span>{user.email}</span>}
          <button className="btn-outline" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="dash-main">
        <section className="add-website-card">
          <h2>Add Website</h2>
          <form className="add-form" onSubmit={handleAddWebsite}>
            <input
              type="text"
              placeholder="Name (e.g. My Blog)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="url"
              placeholder="URL (e.g. https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">Add</button>
          </form>
          {error && <p className="error">{error}</p>}
        </section>

        <section className="websites-section">
          <h2>Your Websites ({websites.length})</h2>
          {websites.length === 0 ? (
            <p className="empty">No websites yet. Add one above.</p>
          ) : (
            <div className="website-grid">
              {websites.map((w) => (
                <div key={w.id} className="website-card">
                  <div className="website-info">
                    <h3>{w.name}</h3>
                    <a href={w.url} target="_blank" rel="noreferrer">{w.url}</a>
                    <p className="last-scanned">
                      {w.last_scanned_at
                        ? `Last scanned: ${new Date(w.last_scanned_at).toLocaleString()}`
                        : "Never scanned"}
                    </p>
                  </div>
                  <div className="website-actions">
                    <button
                      className="btn-primary"
                      onClick={() => handleScan(w)}
                      disabled={scanning === w.id}
                    >
                      {scanning === w.id ? "Scanning..." : "Scan"}
                    </button>
                    {w.last_scanned_at && (
                      <button
                        className="btn-outline"
                        onClick={() => handleViewHistory(w)}
                      >
                        Results
                      </button>
                    )}
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(w.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
