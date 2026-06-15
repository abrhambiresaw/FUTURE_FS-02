const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sessionKey = "crm-suite-session";

function isValidEmail(email) {
  return typeof email === "string" && emailRegex.test(email.trim());
}

async function postJson(path, payload) {
  const session = getStoredSession();
  let response;

  try {
    response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Backend server is not running. Start it with npm run backend or npm run dev:full.",
    );
  }

  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }

  const text = await response.text().catch(() => "");
  return text ? { message: text } : {};
}

function getStoredSession() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(window.localStorage.getItem(sessionKey) || "null");
  } catch {
    return null;
  }
}

function setStoredSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
}

function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(sessionKey);
}

export const authApi = {
  isValidEmail,
  getStoredSession,
  setStoredSession,
  clearStoredSession,
  me: () => {
    const session = getStoredSession();
    return fetch("/api/auth/me", {
      headers: session?.token
        ? { Authorization: `Bearer ${session.token}` }
        : {},
      })
      .then(async (response) => {
        const data = await readJsonResponse(response);
        if (!response.ok) {
          throw new Error(data.message || `Request failed with status ${response.status}`);
        }
        return data;
      })
      .catch((error) => {
        if (error instanceof Error && error.message !== "Failed to fetch") {
          throw error;
        }

        throw new Error(
          "Backend server is not running. Start it with npm run backend or npm run dev:full.",
        );
      });
  },
  login: (payload) => postJson("/api/auth/login", payload),
  register: (payload) => postJson("/api/auth/register", payload),
  forgotPassword: (payload) => postJson("/api/auth/forgot-password", payload),
};
