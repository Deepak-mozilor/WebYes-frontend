import { useState } from "react";
import { api } from "../api";
import GuestResults from "./GuestResults";

export default function GuestPage({ onLoginClick }) {
  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState("desktop");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleScan(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await api.guestScan(url, strategy);
      setResult({ url, strategy, data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="guest-page">
      <header className="dash-header">
        <h1>WebYes</h1>
        <p className="guest-tagline">Website Audit Platform</p>
        <button className="btn-primary" onClick={onLoginClick}>Login / Sign Up</button>
      </header>

      <main className="guest-main">
        <section className="guest-scan-card">
          <h2>Scan any website instantly</h2>
          <p className="subtitle">No account needed — results are not saved</p>
          <form className="guest-form" onSubmit={handleScan}>
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={loading}
            />
            <select
              className="strategy-select"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              disabled={loading}
            >
              <option value="desktop">🖥 Desktop</option>
              <option value="mobile">📱 Mobile</option>
            </select>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Scanning... (15–30s)" : "Scan"}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
        </section>

        {result && (
          <>
            <div className="guest-cta">
              <p>Want to save results, track history, and compare devices?</p>
              <button className="btn-primary" onClick={onLoginClick}>Create a free account →</button>
            </div>
            <GuestResults url={result.url} strategy={result.strategy} data={result.data} />
          </>
        )}
      </main>
    </div>
  );
}
