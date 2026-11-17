const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("authToken");

  return sendRequest(endpoint, options, token);
}

export async function adminApiRequest(endpoint, options = {}) {
  const token = sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin session expired. Please login again.");
  }

  return sendRequest(endpoint, options, token);
}

async function sendRequest(endpoint, options, token) {
  const headers = new Headers(options.headers || {});

  // Handle FormData without manually setting Content-Type
  if (options.body instanceof FormData) {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}
