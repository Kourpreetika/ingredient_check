/*
 * profile.js — local profiles.
 *
 * There is no server here. A "profile" is a record in this browser's
 * localStorage that keeps one person's conditions and scan history separate
 * from another's on a shared machine. Passwords are salted and hashed so they
 * are not sitting in storage as plain text, but this is not authentication and
 * the UI says so plainly — anyone with access to the browser can read the data.
 */

const AUTH_USERS_KEY = "ingredient_check_users";
const AUTH_SESSION_KEY = "ingredient_check_session";

const Auth = (() => {
  const listeners = new Set();

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("Could not save", key, error);
      return false;
    }
  }

  function users() {
    const list = read(AUTH_USERS_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function randomSalt() {
    if (window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  /**
   * SHA-256 where available. crypto.subtle is missing on plain http:// origins,
   * so fall back to a plain string hash rather than failing sign-up entirely.
   */
  async function hashPassword(password, salt) {
    const input = `${salt}::${password}`;
    if (window.crypto?.subtle) {
      try {
        const data = new TextEncoder().encode(input);
        const digest = await window.crypto.subtle.digest("SHA-256", data);
        return `sha256:${[...new Uint8Array(digest)]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")}`;
      } catch {
        /* fall through */
      }
    }
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < input.length; i += 1) {
      h1 = Math.imul(h1 ^ input.charCodeAt(i), 16777619) >>> 0;
      h2 = Math.imul(h2 + input.charCodeAt(i) * (i + 1), 2246822519) >>> 0;
    }
    return `weak:${h1.toString(16)}${h2.toString(16)}`;
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function notify() {
    listeners.forEach((fn) => {
      try {
        fn(current());
      } catch (error) {
        console.error(error);
      }
    });
  }

  function current() {
    const id = read(AUTH_SESSION_KEY, null);
    if (!id) return null;
    return users().find((u) => u.id === id) || null;
  }

  /** Storage suffix so each profile keeps its own history and settings. */
  function scope() {
    const user = current();
    return user ? `u_${user.id}` : "guest";
  }

  function initials(user) {
    if (!user) return "GU";
    const parts = String(user.name || user.email || "?").trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return String(parts[0] || "?").slice(0, 2).toUpperCase();
  }

  async function signUp({ name, email, password }) {
    const cleanName = String(name || "").trim();
    const cleanEmail = normalizeEmail(email);

    if (cleanName.length < 2) return { ok: false, error: "Enter a name with at least 2 characters." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) return { ok: false, error: "That email address does not look right." };
    if (String(password || "").length < 8) return { ok: false, error: "Use a password of at least 8 characters." };

    const list = users();
    if (list.some((u) => u.email === cleanEmail)) {
      return { ok: false, error: "A profile with that email already exists on this device. Sign in instead." };
    }

    const salt = randomSalt();
    const user = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      email: cleanEmail,
      salt,
      hash: await hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    };

    list.push(user);
    if (!write(AUTH_USERS_KEY, list)) {
      return { ok: false, error: "This browser is blocking local storage, so the profile could not be saved." };
    }
    write(AUTH_SESSION_KEY, user.id);
    notify();
    return { ok: true, user };
  }

  async function signIn({ email, password }) {
    const cleanEmail = normalizeEmail(email);
    const user = users().find((u) => u.email === cleanEmail);
    if (!user) {
      return { ok: false, error: "No profile with that email on this device. Create one first." };
    }
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.hash) {
      return { ok: false, error: "That password does not match. There is no recovery for local profiles." };
    }
    write(AUTH_SESSION_KEY, user.id);
    notify();
    return { ok: true, user };
  }

  function signOut() {
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      /* ignore */
    }
    notify();
  }

  /** Removes the profile and everything stored under its scope. */
  function deleteCurrent() {
    const user = current();
    if (!user) return false;

    const suffix = `u_${user.id}`;
    try {
      const doomed = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.endsWith(`:${suffix}`)) doomed.push(key);
      }
      doomed.forEach((key) => localStorage.removeItem(key));
    } catch {
      /* ignore */
    }

    write(AUTH_USERS_KEY, users().filter((u) => u.id !== user.id));
    signOut();
    return true;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return { current, scope, initials, signUp, signIn, signOut, deleteCurrent, subscribe, count: () => users().length };
})();
