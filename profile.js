/*
 * profile.js — accounts via Supabase (Postgres + Auth).
 *
 * Sign-up and sign-in go to auth.users. A trigger in supabase/schema.sql
 * creates a matching profiles row and an empty user_data row. Sessions are
 * stored in localStorage and refreshed automatically, so a returning visitor
 * stays signed in. Conditions and scan history for a signed-in user are
 * written to public.user_data; guests still use this browser only.
 *
 * Requires (loaded first): supabase-config.js, @supabase/supabase-js
 */

const Auth = (() => {
  const listeners = new Set();
  const STORAGE_PREFIX = "ingredient_check_";

  let client = null;
  let sessionUser = null;
  let hydrating = false;
  let persistTimer = null;
  let readySettled = false;

  let readyResolve;
  const ready = new Promise((resolve) => {
    readyResolve = resolve;
  });

  function configured() {
    const url = String(window.SUPABASE_URL || "").trim();
    const key = String(window.SUPABASE_ANON_KEY || "").trim();
    return Boolean(url && key && !url.includes("YOUR-PROJECT-REF") && key !== "YOUR-ANON-KEY");
  }

  function settleReady() {
    if (readySettled) return;
    readySettled = true;
    readyResolve();
  }

  function readLocal(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("Could not save", key, error);
      return false;
    }
  }

  function scopedKey(base, userId) {
    return `${STORAGE_PREFIX}${base}:u_${userId}`;
  }

  function current() {
    return sessionUser;
  }

  function scope() {
    return sessionUser ? `u_${sessionUser.id}` : "guest";
  }

  function initials(user) {
    if (!user) return "GU";
    const parts = String(user.name || user.email || "?").trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return String(parts[0] || "?").slice(0, 2).toUpperCase();
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

  function mapUser(authUser, profile) {
    if (!authUser) return null;
    const metaName = authUser.user_metadata?.name;
    return {
      id: authUser.id,
      name: profile?.name || metaName || authUser.email?.split("@")[0] || "Account",
      email: authUser.email || "",
      createdAt: profile?.created_at || authUser.created_at,
    };
  }

  function explainError(error, fallback) {
    const msg = String(error?.message || "").toLowerCase();
    if (msg.includes("failed to fetch") || msg.includes("network")) {
      return "Could not reach the account server. Check your connection and try again.";
    }
    if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
      return "That email or password is not right.";
    }
    if (msg.includes("already registered") || msg.includes("already been registered")) {
      return "An account with that email already exists. Sign in instead.";
    }
    if (msg.includes("email not confirmed")) {
      return "Confirm your email from the link we sent, then sign in.";
    }
    if (msg.includes("password should be") || msg.includes("password is known")) {
      return error.message;
    }
    if (msg.includes("not authenticated") || msg.includes("jwt")) {
      return "Your session expired. Sign in again.";
    }
    return error?.message || fallback;
  }

  function notConfiguredError() {
    return {
      ok: false,
      error:
        "Accounts are not connected yet. Add your project URL and anon key to supabase-config.js, then run supabase/schema.sql in the Supabase SQL Editor.",
    };
  }

  async function hydrate(session) {
    hydrating = true;
    try {
      if (!session?.user || !client) {
        sessionUser = null;
        return;
      }

      const authUser = session.user;
      let profile = null;
      const { data: profileRow } = await client.from("profiles").select("id, name, created_at").eq("id", authUser.id).maybeSingle();
      profile = profileRow;

      if (!profile) {
        const fallbackName =
          String(authUser.user_metadata?.name || "").trim() || authUser.email?.split("@")[0] || "Account";
        const { data: upserted } = await client
          .from("profiles")
          .upsert({ id: authUser.id, name: fallbackName })
          .select("id, name, created_at")
          .maybeSingle();
        profile = upserted;
      }

      sessionUser = mapUser(authUser, profile);

      const { data: row } = await client
        .from("user_data")
        .select("conditions, kids_product, history")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (row) {
        writeLocal(scopedKey("conditions", authUser.id), Array.isArray(row.conditions) ? row.conditions : []);
        writeLocal(scopedKey("kidsproduct", authUser.id), Boolean(row.kids_product));
        writeLocal(scopedKey("history", authUser.id), Array.isArray(row.history) ? row.history : []);
      } else {
        await client.from("user_data").upsert({ user_id: authUser.id });
      }
    } catch (error) {
      console.warn("Could not load account data", error);
      if (session?.user) {
        sessionUser = mapUser(session.user, null);
      }
    } finally {
      hydrating = false;
    }
  }

  async function flushPersist() {
    if (!client || !sessionUser || hydrating) return;

    const id = sessionUser.id;
    const payload = {
      user_id: id,
      conditions: readLocal(scopedKey("conditions", id), []),
      kids_product: readLocal(scopedKey("kidsproduct", id), false) === true,
      history: readLocal(scopedKey("history", id), []),
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from("user_data").upsert(payload, { onConflict: "user_id" });
    if (error) console.warn("Could not save account data", error);
  }

  function persistSoon() {
    if (!sessionUser || !client || hydrating) return;
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      flushPersist().catch((error) => console.warn(error));
    }, 450);
  }

  function clearScopedLocal(userId) {
    const suffix = `:u_${userId}`;
    try {
      const doomed = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX) && key.endsWith(suffix)) doomed.push(key);
      }
      doomed.forEach((key) => localStorage.removeItem(key));
    } catch {
      /* ignore */
    }
  }

  async function init() {
    if (!configured()) {
      settleReady();
      return;
    }

    if (!window.supabase?.createClient) {
      console.error("Supabase library did not load. Sign-in is unavailable.");
      settleReady();
      return;
    }

    client = window.supabase.createClient(window.SUPABASE_URL.trim(), window.SUPABASE_ANON_KEY.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "ingredient_check_supabase_auth",
      },
    });

    const {
      data: { session },
    } = await client.auth.getSession();
    await hydrate(session);
    settleReady();
    notify();

    client.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === "INITIAL_SESSION") return;
      await hydrate(nextSession);
      notify();
    });
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  async function signUp({ name, email, password }) {
    if (!configured() || !client) return notConfiguredError();

    const cleanName = String(name || "").trim();
    const cleanEmail = normalizeEmail(email);

    if (cleanName.length < 2) return { ok: false, error: "Enter a name with at least 2 characters." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) return { ok: false, error: "That email address does not look right." };
    if (String(password || "").length < 8) return { ok: false, error: "Use a password of at least 8 characters." };

    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password: String(password),
      options: { data: { name: cleanName } },
    });

    if (error) return { ok: false, error: explainError(error, "Could not create the account.") };

    if (data.user && !data.session) {
      return {
        ok: true,
        needsConfirm: true,
        user: { id: data.user.id, name: cleanName, email: cleanEmail },
      };
    }

    if (data.session) {
      if (data.user) {
        await client.from("profiles").upsert({ id: data.user.id, name: cleanName });
      }
      await hydrate(data.session);
      notify();
    }

    return { ok: true, user: sessionUser || mapUser(data.user, { name: cleanName }) };
  }

  async function signIn({ email, password }) {
    if (!configured() || !client) return notConfiguredError();

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !password) return { ok: false, error: "Enter your email and password." };

    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password: String(password),
    });

    if (error) return { ok: false, error: explainError(error, "Could not sign in.") };

    await hydrate(data.session);
    notify();
    return { ok: true, user: sessionUser };
  }

  async function signOut() {
    clearTimeout(persistTimer);
    if (client) {
      await client.auth.signOut();
    }
    sessionUser = null;
    notify();
  }

  async function deleteCurrent() {
    const user = sessionUser;
    if (!user) return { ok: false, error: "No account is signed in." };

    if (client) {
      await flushPersist();
      const { error } = await client.rpc("delete_own_account");
      if (error) {
        await client.from("user_data").delete().eq("user_id", user.id);
        await client.from("profiles").delete().eq("id", user.id);
        console.warn("Account row cleanup:", error.message);
      }
      try {
        await client.auth.signOut();
      } catch {
        /* ignore */
      }
    }

    clearScopedLocal(user.id);
    sessionUser = null;
    notify();
    return { ok: true };
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  init().catch((error) => {
    console.error("Auth failed to start", error);
    settleReady();
  });

  return {
    ready,
    configured,
    current,
    scope,
    initials,
    signUp,
    signIn,
    signOut,
    deleteCurrent,
    persistSoon,
    subscribe,
  };
})();
