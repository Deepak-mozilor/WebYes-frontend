const BASE = "http://127.0.0.1:8000/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export const api = {
  signup: (email, username, password) =>
    request("POST", "/auth/signup", { email, username, password }),

  login: (email, password) =>
    request("POST", "/auth/login", { email, password }),

  me: () => request("GET", "/auth/me"),

  logout: () => request("POST", "/auth/logout"),

  getWebsites: () => request("GET", "/websites/"),

  createWebsite: (name, url) =>
    request("POST", "/websites/", { name, url }),

  deleteWebsite: (id) => request("DELETE", `/websites/${id}`),

  triggerScan: (website_id, strategy = "desktop") =>
    request("POST", "/scans/", { website_id, strategy }),

  getScanSummary: (scan_job_id) =>
    request("GET", `/scans/${scan_job_id}/summary`),

  getScanHistory: (website_id) =>
    request("GET", `/scans/website/${website_id}/history`),

  getIssues: (scan_job_id) =>
    request("GET", `/issues/?scan_job_id=${scan_job_id}`),

  getScreenshots: (scan_job_id) =>
    request("GET", `/scans/${scan_job_id}/screenshots`),

  guestScan: (url, strategy = "desktop") =>
    request("POST", "/scans/guest", { url, strategy }),
};
