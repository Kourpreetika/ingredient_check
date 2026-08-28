/*
 * app.js — everything the user touches.
 *
 * Depends on (loaded before this file):
 *   ingredient-database.js  INGREDIENT_DB, PRODUCT_ALTERNATIVES, SEVERITY_RANK
 *   condition-database.js   CONDITION_LIBRARY, KIDS_SAFETY_RULES, evaluateConditions,
 *                           evaluateKidsSafety, cdMatchGroup, cdNormalize, cdCollapseCodes
 *   profile.js              Auth
 */

const MAX_HISTORY = 24;

/* ————————————————————————————————————————
   Scoped storage — each profile keeps its own settings and history
   ———————————————————————————————————————— */

function storeKey(base) {
  return `ingredient_check_${base}:${Auth.scope()}`;
}

function readStore(base, fallback) {
  try {
    const raw = localStorage.getItem(storeKey(base));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(base, value) {
  try {
    localStorage.setItem(storeKey(base), JSON.stringify(value));
  } catch (error) {
    console.warn("Could not save", base, error);
  }
}

/* ————————————————————————————————————————
   DOM
   ———————————————————————————————————————— */

const $ = (id) => document.getElementById(id);

const homeView = $("homeView");
const appView = $("appView");
const navLinks = document.querySelectorAll("[data-nav]");

const dropZone = $("dropZone");
const imageInput = $("imageInput");
const scanBtn = $("scanBtn");
const pasteToggleBtn = $("pasteToggleBtn");
const pastePanel = $("pastePanel");
const pasteText = $("pasteText");
const analyzeTextBtn = $("analyzeTextBtn");
const previewWrap = $("previewWrap");
const previewImg = $("previewImg");
const clearPreviewBtn = $("clearPreviewBtn");
const progress = $("progress");
const progressLabel = $("progressLabel");
const resultBox = $("resultBox");
const kidsProductCheck = $("kidsProductCheck");
const createReportBtn = $("createReportBtn");

const conditionSelect = $("conditionSelect");
const conditionTrigger = $("conditionTrigger");
const conditionTriggerLabel = $("conditionTriggerLabel");
const conditionMenu = $("conditionMenu");
const conditionNote = $("conditionNote");
const appBarNote = $("appBarNote");

const historyTab = $("historyTab");
const historyCount = $("historyCount");
const historyDrawer = $("historyDrawer");
const historyBackdrop = $("historyBackdrop");
const historyClose = $("historyClose");
const historyList = $("historyList");
const historyOwner = $("historyOwner");
const clearHistoryBtn = $("clearHistoryBtn");

const profileTrigger = $("profileTrigger");
const profileMenu = $("profileMenu");
const headerAvatar = $("headerAvatar");
const headerName = $("headerName");
const menuName = $("menuName");
const menuMeta = $("menuMeta");
const menuHistory = $("menuHistory");
const menuAccount = $("menuAccount");
const menuSignIn = $("menuSignIn");
const menuSignUp = $("menuSignUp");
const menuSignOut = $("menuSignOut");

const authBackdrop = $("authBackdrop");
const authForm = $("authForm");
const authTitle = $("authTitle");
const authSub = $("authSub");
const authNameRow = $("authNameRow");
const authName = $("authName");
const authEmail = $("authEmail");
const authPassword = $("authPassword");
const authPasswordHint = $("authPasswordHint");
const authError = $("authError");
const authSubmit = $("authSubmit");
const authSwitch = $("authSwitch");
const authSwitchText = $("authSwitchText");
const authClose = $("authClose");

const accountBackdrop = $("accountBackdrop");
const accountBody = $("accountBody");
const accountClose = $("accountClose");
const deleteAccountBtn = $("deleteAccountBtn");

const toastEl = $("toast");

/* ————————————————————————————————————————
   State
   ———————————————————————————————————————— */

let activeConditions = [];
let currentObjectUrl = null;
let lastReport = null;
let lastScan = null;
let pendingFile = null;
let isScanning = false;
let lastProductName = "";
let authMode = "signup";
let toastTimer = null;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("is-open");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-open"), 2600);
}

/* ————————————————————————————————————————
   Routing
   ———————————————————————————————————————— */

function applyRoute() {
  const onScan = (location.hash || "").startsWith("#/scan");
  homeView.classList.toggle("hidden", onScan);
  appView.classList.toggle("hidden", !onScan);

  navLinks.forEach((link) => {
    if (!link.dataset.nav) return;
    link.classList.toggle("is-active", (link.dataset.nav === "scan") === onScan);
  });

  document.title = onScan
    ? "Label check — Ingredient_Check"
    : "Ingredient_Check — read the label before you buy it";
}

window.addEventListener("hashchange", () => {
  const wasHome = !homeView.classList.contains("hidden");
  const goingToScan = (location.hash || "").startsWith("#/scan");
  applyRoute();
  if (wasHome && goingToScan) {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    return;
  }
  // Anchor links (#how, #conditions) fire before the home view is un-hidden,
  // so the browser's own scroll is a no-op and has to be repeated here.
  const anchor = (location.hash || "").slice(1);
  if (anchor && !anchor.startsWith("/")) {
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
  }
});

/* ————————————————————————————————————————
   Home page content, generated from the databases
   ———————————————————————————————————————— */

function countLabelTerms() {
  const terms = new Set();
  CONDITION_LIBRARY.forEach((c) => c.groups.forEach((g) => g.terms.forEach((t) => terms.add(t))));
  KIDS_SAFETY_RULES.forEach((r) => r.terms.forEach((t) => terms.add(t)));
  INGREDIENT_DB.forEach((i) => i.aliases.forEach((a) => terms.add(a.toLowerCase())));
  return terms.size;
}

function renderHomeStats() {
  const stats = {
    ingredients: INGREDIENT_DB.length,
    conditions: CONDITION_LIBRARY.length,
    terms: countLabelTerms(),
  };
  document.querySelectorAll("[data-stat]").forEach((el) => {
    const value = stats[el.dataset.stat];
    el.textContent = value >= 100 ? `${Math.floor(value / 10) * 10}+` : String(value);
  });
}

function renderConditionCover() {
  const wrap = $("conditionCover");
  if (!wrap) return;
  wrap.innerHTML = CONDITION_LIBRARY.map(
    (c) => `<article class="condition-cover-item"><h3>${escapeHtml(c.label)}</h3></article>`
  ).join("");
}

function renderKidsAgeList() {
  const wrap = $("kidsAgeList");
  if (!wrap) return;
  // Show a spread of ages rather than six rules that all say "under 10".
  const perAge = new Map();
  for (const rule of [...KIDS_SAFETY_RULES].sort((a, b) => b.minAge - a.minAge)) {
    const bucket = perAge.get(rule.minAge) || [];
    if (bucket.length < 2) bucket.push(rule);
    perAge.set(rule.minAge, bucket);
  }
  const rules = [...perAge.values()].flat().slice(0, 6);
  wrap.innerHTML = rules
    .map(
      (r) => `
      <li>
        <span class="band-age">Under ${r.minAge}</span>
        <span>${escapeHtml(r.label)}</span>
      </li>`
    )
    .join("");
}

/* ————————————————————————————————————————
   Conditions panel
   ———————————————————————————————————————— */

function conditionLabel(id) {
  return CONDITION_LIBRARY.find((c) => c.id === id)?.label || id;
}

function renderConditions() {
  if (!conditionMenu) return;

  if (typeof CONDITION_LIBRARY !== "undefined") {
    conditionMenu.innerHTML =
      CONDITION_LIBRARY.map((c) => {
        const checked = activeConditions.includes(c.id) ? "checked" : "";
        return `
      <label class="select-option">
        <input type="checkbox" data-condition="${c.id}" ${checked}>
        <span>${escapeHtml(c.label)}</span>
      </label>`;
      }).join("") +
      `<button type="button" class="select-clear" id="conditionClear">Clear all</button>`;
  } else {
    conditionMenu.querySelectorAll("input[type=checkbox]").forEach((el) => {
      el.checked = activeConditions.includes(el.dataset.condition);
    });
  }

  conditionMenu.querySelectorAll("input[type=checkbox]").forEach((el) => {
    el.addEventListener("change", () => {
      activeConditions = [...conditionMenu.querySelectorAll("input:checked")].map((i) => i.dataset.condition);
      writeStore("conditions", activeConditions);
      updateConditionNote();
      refreshReport();
    });
  });

  $("conditionClear")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    activeConditions = [];
    conditionMenu.querySelectorAll("input[type=checkbox]").forEach((i) => (i.checked = false));
    writeStore("conditions", activeConditions);
    updateConditionNote();
    refreshReport();
  });

  updateConditionNote();
}

function setConditionMenuOpen(open) {
  if (!conditionSelect) return;
  if ("open" in conditionSelect) conditionSelect.open = Boolean(open);
  conditionSelect.classList.toggle("is-open", Boolean(open));
  conditionTrigger?.setAttribute("aria-expanded", String(Boolean(open)));
}

function updateConditionNote() {
  const names = activeConditions.map(conditionLabel);
  const summary = names.join(", ");

  if (conditionTriggerLabel) {
    conditionTriggerLabel.textContent = names.length ? summary : "Select your conditions";
    conditionTriggerLabel.classList.toggle("is-placeholder", names.length === 0);
  }
  if (conditionNote) conditionNote.textContent = "";
  if (appBarNote) {
    appBarNote.textContent = names.length ? `Checking: ${summary}` : "No conditions selected yet.";
  }
}

/* ————————————————————————————————————————
   History
   ———————————————————————————————————————— */

function loadHistory() {
  const entries = readStore("history", []);
  return Array.isArray(entries) ? entries : [];
}

function addHistoryEntry({ source, findings, extractedText, kidsMinAge }) {
  const entries = loadHistory();
  entries.unshift({
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    source,
    count: findings.length,
    high: findings.filter((f) => f.severity === "high").length,
    kidsMinAge: kidsMinAge || 0,
    names: findings.slice(0, 4).map((f) => f.name),
    extractedText: (extractedText || "").slice(0, 4000),
    matches: findings.map((f) => ({ id: f.id, alias: f.matchedAlias })),
  });
  writeStore("history", entries.slice(0, MAX_HISTORY));
  renderHistory();
}

function formatRelative(iso) {
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function renderHistory() {
  const entries = loadHistory();

  if (historyCount) {
    historyCount.textContent = String(entries.length);
    historyCount.classList.toggle("hidden", entries.length === 0);
  }

  const user = Auth.current();
  if (historyOwner) {
    historyOwner.textContent = user
      ? `${entries.length} scan${entries.length === 1 ? "" : "s"} saved to ${user.name}'s profile`
      : `${entries.length} guest scan${entries.length === 1 ? "" : "s"} on this device`;
  }

  if (!historyList) return;

  if (entries.length === 0) {
    historyList.innerHTML = `<p class="history-empty">No scans yet. Every label you check lands here, and you can reopen any of them.</p>`;
    return;
  }

  historyList.innerHTML = entries
    .map((e) => {
      const summary =
        e.count === 0 ? "Nothing flagged" : `${e.count} additive${e.count === 1 ? "" : "s"} flagged`;
      const kids = e.kidsMinAge ? `<span class="tag tag-limit">${e.kidsMinAge}+</span>` : "";
      return `
        <button type="button" class="history-item" data-id="${e.id}">
          <span class="history-meta">${escapeHtml(formatRelative(e.at))} · ${escapeHtml(e.source)} ${kids}</span>
          <span class="history-summary">${escapeHtml(summary)}${e.high ? ` · ${e.high} high risk` : ""}</span>
          ${e.names?.length ? `<span class="history-tags">${e.names.map(escapeHtml).join(" · ")}</span>` : ""}
        </button>`;
    })
    .join("");

  historyList.querySelectorAll(".history-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const entry = loadHistory().find((x) => x.id === btn.dataset.id);
      if (!entry) return;

      const findings = (entry.matches || [])
        .map(({ id, alias }) => {
          const item = INGREDIENT_DB.find((i) => i.id === id);
          return item ? { ...item, matchedAlias: alias } : null;
        })
        .filter(Boolean);

      closeHistory();
      if (!location.hash.startsWith("#/scan")) location.hash = "#/scan";
      displayFindings(findings, entry.extractedText || "", { fromHistory: true, source: entry.source || "scan" });
      resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function openHistory() {
  historyDrawer.classList.add("is-open");
  historyBackdrop.classList.add("is-open");
  historyDrawer.setAttribute("aria-hidden", "false");
  historyTab.setAttribute("aria-expanded", "true");
}

function closeHistory() {
  historyDrawer.classList.remove("is-open");
  historyBackdrop.classList.remove("is-open");
  historyDrawer.setAttribute("aria-hidden", "true");
  historyTab.setAttribute("aria-expanded", "false");
}

/* ————————————————————————————————————————
   Matching
   ———————————————————————————————————————— */

function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9\s.\-&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fix the mistakes OCR reliably makes on small print before matching. */
function enhanceOcrText(text) {
  return text
    .replace(/\bE\s*[-]?\s*(\d{3}[a-z]?)\b/gi, "e$1")
    .replace(/\b[IL1]NS\s*[-]?\s*(\d{3}[a-z]?)\b/gi, "e$1")
    .replace(/\bFD\s*[& ]?\s*C\b/gi, "fd&c")
    .replace(/\bmonosodiurn\b/gi, "monosodium")
    .replace(/\bbenzoat[eo]\b/gi, "benzoate")
    .replace(/\bcarageenan\b/gi, "carrageenan")
    .replace(/\bpartially\s+hydrogenat[eo]d\b/gi, "partially hydrogenated")
    .replace(/\bmalda\b/gi, "maida")
    .replace(/\bpalm\s+olein\b/gi, "palmolein")
    .replace(/\btartrazin\b/gi, "tartrazine")
    .replace(/\bvanaspat[iy]\b/gi, "vanaspati")
    .replace(/\bmetabisulfite\b/gi, "metabisulphite");
}

function findAliasIndex(normalized, alias) {
  const a = normalizeText(alias);
  if (!a) return -1;
  if (a.length <= 4 || /^e\d+[a-z]?$/i.test(a) || /^(msg|bha|bht|ada|bvo|hvp|hfcs|tio2|acek|ace-k)$/i.test(a)) {
    const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|[^a-z0-9])(${escaped})(?:[^a-z0-9]|$)`, "i");
    const m = normalized.match(re);
    if (!m) return -1;
    return normalized.indexOf(m[1], m.index);
  }
  return normalized.indexOf(a);
}

function spansOverlap(aStart, aLen, bStart, bLen) {
  return aStart < bStart + bLen && bStart < aStart + aLen;
}

function hasAddedSugarWord(normalized) {
  const re = /(?:^|[^a-z0-9])(sugars?)(?!\s*free)(?=[^a-z0-9]|$)/gi;
  let m;
  while ((m = re.exec(normalized)) !== null) {
    const start = m.index + m[0].length - m[1].length;
    const around = normalized.slice(Math.max(0, start - 20), start + 24);
    if (/of which sugars?/.test(around)) continue;
    if (cdIsNegated(normalized, start, SUGAR_NEGATIONS)) continue;
    return true;
  }
  return false;
}

function findIngredients(rawText) {
  const normalized = normalizeText(enhanceOcrText(extractLabelIngredients(rawText)));
  const candidates = [];

  for (const item of INGREDIENT_DB) {
    const aliasesByLen = [...item.aliases].sort((a, b) => b.length - a.length);
    for (const alias of aliasesByLen) {
      const idx = findAliasIndex(normalized, alias);
      if (idx === -1) continue;
      const matchLen = normalizeText(alias).length;
      if (cdIsSafeContext(normalized, idx, idx + matchLen, alias)) continue;
      if (item.id === "added-sugar" && cdIsNegated(normalized, idx, SUGAR_NEGATIONS)) continue;
      if (item.id === "salt" && cdIsNegated(normalized, idx, ["salt free", "salt-free", "no added salt", "without salt", "unsalted"])) continue;
      if (item.id === "hydrogenated" && cdIsSafeContext(normalized, idx, idx + matchLen, "hydrogenated")) continue;
      candidates.push({
        ...item,
        matchedAlias: alias,
        matchStart: idx,
        matchLen,
      });
      break;
    }
  }

  // Longer matches win, so "high fructose corn syrup" does not also report "corn syrup".
  candidates.sort((a, b) => b.matchLen - a.matchLen || SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  const kept = [];
  for (const c of candidates) {
    const nested = kept.some(
      (k) => spansOverlap(c.matchStart, c.matchLen, k.matchStart, k.matchLen) && c.matchLen < k.matchLen
    );
    if (!nested) kept.push(c);
  }

  kept.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.name.localeCompare(b.name));
  const found = kept.map(({ matchStart, matchLen, ...rest }) => rest);

  if (!found.some((f) => f.id === "added-sugar") && hasAddedSugarWord(normalized)) {
    const sugarItem = INGREDIENT_DB.find((i) => i.id === "added-sugar");
    if (sugarItem) {
      found.push({ ...sugarItem, matchedAlias: "sugar" });
      found.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.name.localeCompare(b.name));
    }
  }

  return found;
}

/** Which of the user's conditions object to this specific ingredient. */
function conditionTagsFor(item) {
  const haystack = cdCollapseCodes(cdNormalize([item.name, ...(item.aliases || [])].join(", ")));
  const tags = [];

  for (const id of activeConditions) {
    const condition = CONDITION_LIBRARY.find((c) => c.id === id);
    if (!condition) continue;
    for (const group of condition.groups) {
      if (cdMatchGroup(haystack, group).length > 0) {
        tags.push({ label: condition.label, level: group.level, why: group.why });
        break;
      }
    }
  }

  return tags;
}

/* ————————————————————————————————————————
   Nutrition
   ———————————————————————————————————————— */

function parseNutritionText(text) {
  const raw = String(text || "");
  if (!raw.trim()) return null;

  const pick = (patterns) => {
    for (const re of patterns) {
      const m = raw.match(re);
      if (m) {
        const n = parseFloat(String(m[1]).replace(",", "."));
        if (!Number.isNaN(n) && n >= 0 && n <= 1000) return n;
      }
    }
    return null;
  };

  const sugar = pick([
    /(?:total\s+)?sugars?\s*[:=\-]?\s*(\d+(?:[.,]\d+)?)\s*g/i,
    /(?:of which\s+)?sugars?\s*[:=\-]?\s*(\d+(?:[.,]\d+)?)/i,
    /(\d+(?:[.,]\d+)?)\s*g\s+(?:total\s+)?sugars?/i,
    /carbohydrate[^.\n]{0,40}?sugars?\s*(\d+(?:[.,]\d+)?)/i,
  ]);
  const fat = pick([
    /total\s+(?:fat|lipids?)\s*[:=\-]?\s*(\d+(?:[.,]\d+)?)\s*g/i,
    /(?:^|[^\w])(?:fat|lipids?)\s*[:=\-]?\s*(\d+(?:[.,]\d+)?)\s*g/im,
    /(\d+(?:[.,]\d+)?)\s*g\s+(?:total\s+)?(?:fat|lipids?)/i,
  ]);
  const protein = pick([
    /proteins?\s*[:=\-]?\s*(\d+(?:[.,]\d+)?)\s*g/i,
    /(\d+(?:[.,]\d+)?)\s*g\s+proteins?/i,
  ]);
  let sodium = pick([
    /sodium\s*[:=\-]?\s*(\d+(?:[.,]\d+)?)\s*mg/i,
    /sodium\s*[:=\-]?\s*(\d+(?:[.,]\d+)?)\s*g/i,
  ]);
  // Sodium is usually printed in mg; convert so every value is grams.
  if (sodium != null && /sodium\s*[:=\-]?\s*\d+(?:[.,]\d+)?\s*mg/i.test(raw)) sodium /= 1000;
  const salt = pick([/salt\s*[:=\-]?\s*(\d+(?:[.,]\d+)?)\s*g/i]);
  if (sodium == null && salt != null) sodium = salt / 2.5;

  if (sugar == null && fat == null && protein == null && sodium == null) return null;
  return { sugar, fat, protein, sodium };
}

function nutritionFlagsFor(nutrition) {
  if (!nutrition) return [];
  const flags = [];
  for (const id of activeConditions) {
    const condition = CONDITION_LIBRARY.find((c) => c.id === id);
    for (const limit of condition?.nutrition || []) {
      const value = nutrition[limit.key];
      if (value != null && value > limit.limit) {
        flags.push({ key: limit.key, label: condition.label, why: limit.why, value });
      }
    }
  }
  return flags;
}

function renderNutrition(nutrition, flags) {
  if (!nutrition) return "";

  const rows = [
    ["Sugar", "sugar", nutrition.sugar],
    ["Fat", "fat", nutrition.fat],
    ["Protein", "protein", nutrition.protein],
    ["Sodium", "sodium", nutrition.sodium],
  ].filter(([, , value]) => value != null);

  if (rows.length === 0) return "";

  const cells = rows
    .map(([label, key, value]) => {
      const flag = flags.find((f) => f.key === key);
      const shown = value >= 1 ? Number(value.toFixed(1)) : Number(value.toFixed(2));
      return `
        <div class="nutrition-cell">
          <span class="stat-label">${label}</span>
          <span class="nutrition-val">${shown}g</span>
          ${flag ? `<span class="nutrition-flag">High for ${escapeHtml(flag.label.toLowerCase())}</span>` : ""}
        </div>`;
    })
    .join("");

  return `
    <section class="report-block">
      <span class="eyebrow">Nutrition</span>
      <div class="block-head"><h3>Read off the panel</h3></div>
      <p class="block-lead">Check whether the pack states these per serving or per 100 g.</p>
      <div class="nutrition-row">${cells}</div>
      ${
        flags.length
          ? `<p class="nutrition-missing">${flags.map((f) => escapeHtml(f.why)).join(" ")}</p>`
          : ""
      }
    </section>`;
}

/* ————————————————————————————————————————
   Alternatives
   ———————————————————————————————————————— */

function normalizeProductQuery(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s&+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findProductAlternatives(productName) {
  const q = normalizeProductQuery(productName);
  if (!q || q.length < 2) return null;

  let best = null;
  let bestScore = 0;

  for (const product of PRODUCT_ALTERNATIVES) {
    for (const alias of product.aliases) {
      const a = normalizeProductQuery(alias);
      if (!a) continue;
      let score = 0;
      if (q === a) score = 100;
      else if (q.includes(a) || a.includes(q)) score = 70 + Math.min(a.length, 20);
      else {
        const qWords = q.split(" ");
        const aWords = a.split(" ");
        const overlap = aWords.filter((w) => w.length > 2 && qWords.some((qw) => qw.includes(w) || w.includes(qw)));
        if (overlap.length >= Math.min(2, aWords.length)) score = 40 + overlap.length * 10;
      }
      if (score > bestScore) {
        bestScore = score;
        best = product;
      }
    }
  }

  return bestScore >= 40 ? best : null;
}

function genericAlternativesFromFindings(findings) {
  const cats = new Set(findings.map((f) => f.category));
  if (cats.has("Sweeteners") && !cats.has("Flavor Enhancers") && !cats.has("Artificial Colors")) {
    return { label: "sweeter packaged foods", alternatives: GENERIC_SWEET_ALTERNATIVES };
  }
  const drinkSignals = findings.some((f) =>
    /syrup|benzoate|phosphoric|caramel|caffeine|aspartame|sucralose|acesulfame/i.test(`${f.name} ${f.matchedAlias || ""}`)
  );
  if (drinkSignals && !cats.has("Flavor Enhancers")) {
    return { label: "sugary or additive-heavy drinks", alternatives: GENERIC_DRINK_ALTERNATIVES };
  }
  return { label: "packaged snacks like this", alternatives: GENERIC_SNACK_ALTERNATIVES };
}

function renderAlternativesList(items) {
  return `
    <ul class="alt-list">
      ${items
        .map(
          (alt) => `
        <li>
          <span class="alt-check" aria-hidden="true">✓</span>
          <div>
            <strong>${escapeHtml(alt.name)}</strong>
            ${alt.why ? `<span>${escapeHtml(alt.why)}</span>` : ""}
          </div>
        </li>`
        )
        .join("")}
    </ul>`;
}

function renderAlternativesResult(productName, findings) {
  const cleaned = String(productName || "").trim();
  if (!cleaned) return `<p class="alt-note">Enter a product name to see better options.</p>`;

  const matched = findProductAlternatives(cleaned);
  if (matched) {
    return `
      <div class="alt-product">${escapeHtml(matched.displayName)}</div>
      ${renderAlternativesList(matched.alternatives)}`;
  }

  const fallback = genericAlternativesFromFindings(findings);
  return `
    <div class="alt-product">${escapeHtml(cleaned)}</div>
    <p class="alt-note">No exact match in the swap list — here is what people usually move to instead of ${escapeHtml(fallback.label)}:</p>
    ${renderAlternativesList(fallback.alternatives)}`;
}

function renderAlternativesSection(preferredName = "") {
  return `
    <section class="report-block">
      <span class="eyebrow">Swaps</span>
      <div class="block-head"><h3>Something better for the same craving</h3></div>
      <p class="block-lead">Name the product and you will get alternatives that solve the same problem with fewer additives.</p>
      <div class="alt-row">
        <input class="field" type="text" id="productNameInput" maxlength="80" placeholder="e.g. Lay's Magic Masala" value="${escapeHtml(preferredName)}" autocomplete="off">
        <button type="button" class="btn btn-secondary" id="suggestAltBtn">Suggest</button>
      </div>
      <div class="alt-result" id="alternativesResult" aria-live="polite"></div>
    </section>`;
}

function bindAlternativesUI(findings) {
  const input = $("productNameInput");
  const btn = $("suggestAltBtn");
  const out = $("alternativesResult");
  if (!input || !btn || !out) return;

  const run = () => {
    lastProductName = input.value.trim();
    out.innerHTML = renderAlternativesResult(lastProductName, findings);
  };

  btn.addEventListener("click", run);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      run();
    }
  });

  if (lastProductName) {
    input.value = lastProductName;
    run();
  }
}

/* ————————————————————————————————————————
   Report rendering
   ———————————————————————————————————————— */

function renderConditionReport(results) {
  if (results.length === 0) {
    if (activeConditions.length === 0) return "";
    return `
      <section class="report-block">
        <span class="eyebrow">Your conditions</span>
        <div class="block-head"><h3>Nothing here clashes with your conditions</h3></div>
        <p class="block-lead">
          Nothing matched the avoid list for ${escapeHtml(activeConditions.map(conditionLabel).join(", "))}.
          Portion size, sugar and salt still count.
        </p>
      </section>`;
  }

  const worst = results.some((r) => r.verdict === "avoid") ? "" : " is-limit";
  const blocks = results
    .map((result) => {
      const groups = result.groups
        .map(
          (group) => `
          <div class="cond-group">
            <div class="cond-group-top">
              <strong>${escapeHtml(group.title)}</strong>
              <span class="tag tag-${group.level}">${group.level === "avoid" ? "Avoid" : "Limit"}</span>
            </div>
            <p class="cond-why">${escapeHtml(group.why)}</p>
            <div class="found-terms">
              ${group.found.map((t) => `<span class="term">${escapeHtml(t)}</span>`).join("")}
            </div>
          </div>`
        )
        .join("");

      return `
        <div class="cond-block">
          <div class="cond-block-head">
            <h4>${escapeHtml(result.label)}</h4>
            <span class="tag tag-${result.verdict}">${result.verdict === "avoid" ? "Not recommended" : "Limit"}</span>
          </div>
          ${groups}
          ${result.note ? `<p class="cond-note">${escapeHtml(result.note)}</p>` : ""}
          ${result.guidance ? `<p class="cond-note">${escapeHtml(result.guidance)}</p>` : ""}
        </div>`;
    })
    .join("");

  return `
    <section class="report-block cond-alert${worst}">
      <span class="eyebrow">Your conditions</span>
      <div class="block-head"><h3>What this means for you</h3></div>
      <p class="block-lead">What to avoid, and why.</p>
      ${blocks}
    </section>`;
}

function renderKidsReport(kids, { prominent }) {
  const { rating, flags, minAge } = kids;

  const ageBadge = minAge > 0
    ? `${minAge}<small>yrs+</small>`
    : `OK<small>any age</small>`;

  const lead = flags.length
    ? `${flags.length} age-restricted item${flags.length === 1 ? "" : "s"} found.`
    : "Nothing age-restricted was found.";

  const flagList = flags
    .map(
      (flag) => `
      <li class="kids-flag">
        <span class="kids-flag-age${flag.severity === "moderate" ? " is-moderate" : ""}">Under ${flag.minAge}</span>
        <div>
          <strong>${escapeHtml(flag.label)}</strong>
          <p>${escapeHtml(flag.why)}</p>
          <div class="found-terms">
            ${flag.found.slice(0, 8).map((t) => `<span class="term">${escapeHtml(t)}</span>`).join("")}
          </div>
        </div>
      </li>`
    )
    .join("");

  return `
    <section class="report-block kids-block tone-${rating.tone}">
      <span class="eyebrow">Kids safety</span>
      <div class="block-head"><h3>${escapeHtml(rating.label)}</h3></div>
      <p class="block-lead">
        ${escapeHtml(lead)}
        ${kids.looksLikeKidsProduct ? " The wording on this pack suggests it is sold for children." : ""}
      </p>
      <div class="kids-rating">
        <span class="kids-age">${ageBadge}</span>
        <div class="kids-rating-copy">
          <strong>${escapeHtml(rating.label)}</strong>
          <span>${
            minAge > 0
              ? `The strictest item found sets the floor at ${minAge} years.`
              : "No age-restricted additives were matched."
          }</span>
        </div>
      </div>
      ${flags.length ? `<ul class="kids-flags">${flagList}</ul>` : ""}
    </section>`;
}

function buildVerdict({ findings, conditionResults, kids, kidsRelevant }) {
  const avoidConditions = conditionResults.filter((r) => r.verdict === "avoid");

  if (avoidConditions.length > 0) {
    const names = avoidConditions.map((r) => r.label).join(", ");
    return {
      tone: "danger",
      label: "Not recommended for you",
      detail: `This label carries ingredients on the avoid list for ${names}. The reasons are set out below.`,
    };
  }

  if (kidsRelevant && kids.rating.tone === "danger") {
    return {
      tone: "danger",
      label: kids.rating.label,
      detail: `${kids.flags.length} additive${kids.flags.length === 1 ? "" : "s"} on the children's checklist were found on this label.`,
    };
  }

  if (conditionResults.length > 0) {
    const names = conditionResults.map((r) => r.label).join(", ");
    return {
      tone: "warn",
      label: "Fine occasionally, not regularly",
      detail: `Nothing here is on the outright avoid list for ${names}, but some ingredients are ones you were told to keep down.`,
    };
  }

  if (findings.length === 0) {
    return {
      tone: "safe",
      label: "No additives of concern matched",
      detail: "Nothing on the concern list appeared. That does not make it a healthy product — sugar, salt and portion size still apply.",
    };
  }

  const high = findings.filter((f) => f.severity === "high").length;
  if (high > 0) {
    return {
      tone: "danger",
      label: `${findings.length} additive${findings.length === 1 ? "" : "s"} of concern`,
      detail: `${high} of them rate as high risk with regular consumption. Each one is explained below.`,
    };
  }

  return {
    tone: "warn",
    label: `${findings.length} additive${findings.length === 1 ? "" : "s"} worth knowing about`,
    detail: "None rate as high risk on their own. Occasional use is a different question from daily use.",
  };
}

function renderIngredientCard(item) {
  const tags = conditionTagsFor(item);
  const risks = (item.risks || []).map((r) => `<li>${escapeHtml(r)}</li>`).join("");

  return `
    <article class="ingredient${tags.length ? " has-warning" : ""}">
      <div class="ingredient-top">
        <h4>${escapeHtml(item.name)}</h4>
        ${tags
          .map((t) => `<span class="tag tag-${t.level}">${escapeHtml(t.label)}</span>`)
          .join("")}
        <span class="sev sev-${item.severity}">${item.severity}</span>
      </div>
      <p class="ingredient-note">${escapeHtml(item.note)}</p>
      <p class="risk-heading">If you eat this regularly</p>
      <ul class="risk-list">${risks}</ul>
      ${item.watchFor ? `<p class="watch-for"><span>Who should be careful:</span> ${escapeHtml(item.watchFor)}</p>` : ""}
      <p class="matched-as">Matched on the label as “${escapeHtml(item.matchedAlias)}”</p>
    </article>`;
}

function displayFindings(findings, extractedText, { fromHistory = false, source = "scan" } = {}) {
  const text = extractedText || "";
  lastScan = { findings, text, source };
  const conditionResults = evaluateConditions(text, activeConditions);
  const kids = evaluateKidsSafety(text);
  const kidsRelevant = Boolean(kidsProductCheck?.checked) || kids.looksLikeKidsProduct;
  const verdict = buildVerdict({ findings, conditionResults, kids, kidsRelevant });

  const nutrition = parseNutritionText(text);
  const nutritionFlags = nutritionFlagsFor(nutrition);

  const high = findings.filter((f) => f.severity === "high").length;
  const moderate = findings.filter((f) => f.severity === "moderate").length;
  const low = findings.filter((f) => f.severity === "low").length;

  let html = `
    <section class="verdict verdict-${verdict.tone}">
      <span class="eyebrow">${fromHistory ? "Restored from history" : "Verdict"}</span>
      <h2>${escapeHtml(verdict.label)}</h2>
      <p>${escapeHtml(verdict.detail)}</p>
      <div class="pills">
        <span class="pill pill-high"><strong>${high}</strong> high</span>
        <span class="pill pill-mod"><strong>${moderate}</strong> moderate</span>
        <span class="pill pill-low"><strong>${low}</strong> low</span>
        ${kids.minAge ? `<span class="pill">Kids <strong>${kids.minAge}+</strong></span>` : ""}
      </div>
    </section>`;

  const kidsBlock = renderKidsReport(kids, { prominent: kidsRelevant });
  const conditionBlock = renderConditionReport(conditionResults);

  if (kidsRelevant) {
    html += kidsBlock + conditionBlock;
  } else {
    html += conditionBlock;
  }

  if (findings.length > 0) {
    html += `
      <section class="report-block">
        <span class="eyebrow">Findings</span>
        <div class="block-head"><h3>What was found</h3></div>
        <p class="block-lead">Worst first.</p>
        <ol class="harmful-list">
          ${findings
            .map(
              (item) => `
            <li>
              <span class="harmful-name">${escapeHtml(item.name)}</span>
              <span class="sev sev-${item.severity}">${item.severity}</span>
            </li>`
            )
            .join("")}
        </ol>
      </section>`;

    html += renderAlternativesSection(lastProductName);

    const groups = new Map();
    for (const f of findings) {
      if (!groups.has(f.category)) groups.set(f.category, []);
      groups.get(f.category).push(f);
    }

    let detail = `
      <section class="report-block">
        <span class="eyebrow">Detail</span>
        <div class="block-head"><h3>What each one does</h3></div>
        <p class="block-lead">Grouped by what the ingredient is for.</p>`;
    for (const [category, items] of groups) {
      detail += `<div class="cat-group"><p class="cat-title">${escapeHtml(category)}</p>`;
      detail += items.map(renderIngredientCard).join("");
      detail += `</div>`;
    }
    detail += `</section>`;
    html += detail;
  }

  if (!kidsRelevant) html += kidsBlock;

  html += renderNutrition(nutrition, nutritionFlags);

  html += `
    <details class="extracted">
      <summary>Text read from the label</summary>
      <pre>${escapeHtml(text || "(empty)")}</pre>
    </details>

    <section class="report-block download-block">
      <div>
        <h3>Download this report</h3>
        <p>A PDF you can keep, print, or show to your doctor.</p>
      </div>
      <button type="button" class="btn btn-primary" id="downloadReportBtn">
        <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 11l5 5 5-5M5 21h14"/></svg>
        Download PDF
      </button>
    </section>

    <p class="disclaimer">
      Educational information only — not medical advice. Risk depends on how much and how often you eat something.
    </p>`;

  resultBox.innerHTML = html;
  bindAlternativesUI(findings);

  lastReport = { verdict, findings, conditionResults, kids, kidsRelevant, nutrition, nutritionFlags, text };
  $("downloadReportBtn")?.addEventListener("click", downloadReportPdf);

  if (!fromHistory) {
    addHistoryEntry({ source, findings, extractedText: text, kidsMinAge: kids.minAge });
  }
}

/* ————————————————————————————————————————
   PDF export
   ———————————————————————————————————————— */

function downloadReportPdf() {
  const jsPDFCtor = window.jspdf?.jsPDF;
  if (!jsPDFCtor || !lastReport) {
    toast("The PDF library did not load — check your connection");
    return;
  }

  const { verdict, findings, conditionResults, kids, nutrition, text } = lastReport;
  const doc = new jsPDFCtor({ unit: "pt", format: "a4" });

  const MARGIN = 48;
  const WIDTH = doc.internal.pageSize.getWidth();
  const HEIGHT = doc.internal.pageSize.getHeight();
  const BODY_WIDTH = WIDTH - MARGIN * 2;
  let y = MARGIN;

  const room = (needed) => {
    if (y + needed > HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const write = (str, { size = 10, style = "normal", color = [40, 46, 44], gap = 4, indent = 0 } = {}) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(str), BODY_WIDTH - indent);
    for (const line of lines) {
      room(size + gap);
      doc.text(line, MARGIN + indent, y);
      y += size + gap;
    }
  };

  const heading = (str) => {
    room(38);
    y += 14;
    write(str, { size: 13, style: "bold", color: [16, 20, 19], gap: 6 });
    doc.setDrawColor(226, 232, 230);
    doc.line(MARGIN, y - 4, WIDTH - MARGIN, y - 4);
    y += 8;
  };

  doc.setFillColor(33, 105, 92);
  doc.rect(0, 0, WIDTH, 84, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Ingredient_Check", MARGIN, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Label report — ${new Date().toLocaleString()}`, MARGIN, 63);
  y = 116;

  write(verdict.label, { size: 15, style: "bold", color: [16, 20, 19], gap: 6 });
  write(verdict.detail, { size: 10, color: [74, 83, 80], gap: 5 });

  const high = findings.filter((f) => f.severity === "high").length;
  const moderate = findings.filter((f) => f.severity === "moderate").length;
  const low = findings.filter((f) => f.severity === "low").length;
  y += 4;
  write(
    `${high} high concern · ${moderate} moderate · ${low} low${kids.minAge ? ` · Suitable from age ${kids.minAge}` : ""}`,
    { size: 10, style: "bold", color: [33, 105, 92] }
  );

  if (activeConditions.length) {
    write(`Checked against: ${activeConditions.map(conditionLabel).join(", ")}`, { size: 9, color: [122, 131, 127] });
  }

  if (conditionResults?.length) {
    heading("What this means for you");
    for (const result of conditionResults) {
      write(`${result.label} — ${result.verdict === "avoid" ? "Not recommended" : result.verdict === "limit" ? "Limit this" : "Nothing flagged"}`, {
        size: 11,
        style: "bold",
        color: [16, 20, 19],
        gap: 5,
      });
      for (const group of result.groups || []) {
        write(`• ${group.title} (${group.level})`, { size: 10, style: "bold", indent: 10, gap: 3 });
        write(group.why, { size: 9.5, color: [74, 83, 80], indent: 20, gap: 3 });
        if (group.found?.length) {
          write(`Found on the label: ${group.found.join(", ")}`, { size: 9, color: [122, 131, 127], indent: 20 });
        }
      }
      y += 6;
    }
  }

  if (kids?.flags?.length) {
    heading("Children");
    write(kids.rating?.label || `Not recommended below ${kids.minAge} years`, { size: 11, style: "bold", gap: 5 });
    for (const flag of kids.flags) {
      write(`• ${flag.label} — under ${flag.minAge}`, { size: 10, style: "bold", indent: 10, gap: 3 });
      write(flag.why, { size: 9.5, color: [74, 83, 80], indent: 20, gap: 3 });
    }
  }

  if (findings.length) {
    heading("Ingredients of concern");
    for (const item of findings) {
      write(`${item.name} — ${item.severity}`, { size: 11, style: "bold", gap: 4 });
      write(item.note, { size: 9.5, color: [74, 83, 80], indent: 10, gap: 3 });
      for (const risk of (item.risks || []).slice(0, 4)) {
        write(`• ${risk}`, { size: 9.5, color: [74, 83, 80], indent: 20, gap: 3 });
      }
      y += 6;
    }
  }

  const nutritionRows = [
    ["Sugar", nutrition?.sugar],
    ["Fat", nutrition?.fat],
    ["Protein", nutrition?.protein],
    ["Sodium", nutrition?.sodium],
  ].filter(([, value]) => value != null);

  if (nutritionRows.length) {
    heading("Nutrition read from the pack");
    for (const [label, value] of nutritionRows) {
      write(`${label}: ${value >= 1 ? Number(value.toFixed(1)) : Number(value.toFixed(2))} g`, {
        size: 10,
        indent: 10,
        gap: 3,
      });
    }
  }

  heading("Label text");
  write(text || "(empty)", { size: 8.5, color: [122, 131, 127], gap: 2 });

  y += 12;
  write(
    "Educational information only — not medical advice. Risk depends on how much and how often you eat something. Follow your clinician's guidance over anything here.",
    { size: 8.5, color: [154, 163, 160] }
  );

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`ingredient-check-${stamp}.pdf`);
  toast("Report downloaded");
}

function showError(title, body, { showPaste = false } = {}) {
  resultBox.innerHTML = `
    <section class="report-block report-error">
      <span class="eyebrow">Could not finish</span>
      <div class="block-head"><h3>${escapeHtml(title)}</h3></div>
      <p class="block-lead">${escapeHtml(body)}</p>
    </section>`;
  if (showPaste) pastePanel?.classList.remove("hidden");
}

/* ————————————————————————————————————————
   Scan flow
   ———————————————————————————————————————— */

function updateCreateButton() {
  if (createReportBtn) createReportBtn.disabled = isScanning;
}

function isImageFile(file) {
  if (!file) return false;
  const type = file.type || "";
  if (!type || type === "application/octet-stream") return true;
  return type.startsWith("image/");
}

function stageFile(file) {
  if (!file) return;
  if (!isImageFile(file)) {
    showError("That is not an image", "Choose a photograph of the ingredients panel.");
    return;
  }
  pendingFile = file;
  setPreview(file);
  resultBox.innerHTML = "";
  updateCreateButton();
  processImageFile(file);
}

function clearPreview() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  pendingFile = null;
  lastScan = null;
  previewWrap?.classList.add("hidden");
  if (previewImg) previewImg.src = "";
  if (imageInput) imageInput.value = "";
  updateCreateButton();
}

function setPreview(file) {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  currentObjectUrl = URL.createObjectURL(file);
  if (previewImg) previewImg.src = currentObjectUrl;
  previewWrap?.classList.remove("hidden");
}

function startScanning(label) {
  isScanning = true;
  resultBox.innerHTML = "";
  progress?.classList.remove("hidden");
  if (progressLabel) progressLabel.textContent = label;
  if (scanBtn) scanBtn.disabled = true;
  updateCreateButton();
}

function stopScanning() {
  isScanning = false;
  progress?.classList.add("hidden");
  if (scanBtn) scanBtn.disabled = false;
  updateCreateButton();
}

/** Upscale and harden contrast so OCR reads small label print better. */
async function prepareImageForOcr(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(2, 2000 / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const boosted = gray < 140 ? gray * 0.75 : Math.min(255, gray * 1.15);
      d[i] = d[i + 1] = d[i + 2] = boosted;
    }
    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    return blob || file;
  } catch {
    return file;
  }
}

async function processImageFile(file) {
  if (!file || isScanning) return;
  if (typeof Tesseract === "undefined") {
    showError("Could not load the reader", "Check your connection and refresh the page, or type the ingredients instead.", { showPaste: true });
    return;
  }

  startScanning("Reading the label…");

  try {
    const prepared = await prepareImageForOcr(file);
    if (progressLabel) progressLabel.textContent = "Reading the label…";

    const result = await Tesseract.recognize(prepared, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text" && typeof m.progress === "number" && progressLabel) {
          progressLabel.textContent = `Reading the label… ${Math.round(m.progress * 100)}%`;
        }
      },
    });

    const extractedText = enhanceOcrText((result.data.text || "").trim());
    if (extractedText.length < 5) {
      showError(
        "Could not read enough text",
        "Try brighter light, a flatter surface, or crop tight to the ingredients block. You can also type the text instead.",
        { showPaste: true }
      );
      return;
    }

    if (progressLabel) progressLabel.textContent = "Building your report…";
    displayFindings(findIngredients(extractedText), extractedText, { source: "photo" });
    resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error(error);
    showError("The scan failed", "The photo could not be read. Type the ingredients instead and you will get the same report.", { showPaste: true });
  } finally {
    stopScanning();
  }
}

function analyzePastedText() {
  const text = (pasteText?.value || "").trim();
  if (!text) {
    showError("Nothing to analyse", "Paste the ingredients list from the pack first.");
    return;
  }
  const cleaned = enhanceOcrText(text);
  displayFindings(findIngredients(cleaned), cleaned, { source: "text" });
  resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
}

function refreshReport() {
  if (!lastScan?.text) return;
  displayFindings(lastScan.findings, lastScan.text, { fromHistory: true, source: lastScan.source });
}

async function createFullReport() {
  if (isScanning) return;
  const pasted = (pasteText?.value || "").trim();
  if (pasted) {
    analyzePastedText();
    return;
  }
  if (pendingFile) {
    await processImageFile(pendingFile);
    return;
  }
  if (lastScan?.text) {
    refreshReport();
    resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  showError("Add a label first", "Drop a photo of the ingredients panel, or type the text, then create the report.");
}

/* ————————————————————————————————————————
   Profile UI
   ———————————————————————————————————————— */

function refreshIdentity() {
  const user = Auth.current();
  const initials = Auth.initials(user);

  if (headerAvatar) {
    headerAvatar.textContent = initials;
    headerAvatar.classList.toggle("avatar-guest", !user);
  }

  if (headerName) headerName.textContent = user ? user.name.split(" ")[0] : "Guest";
  if (menuName) menuName.textContent = user ? user.name : "Browsing as guest";
  if (menuMeta) menuMeta.textContent = user ? user.email : "Scans stay on this device";

  menuSignIn?.classList.toggle("hidden", Boolean(user));
  menuSignUp?.classList.toggle("hidden", Boolean(user));
  menuAccount?.classList.toggle("hidden", !user);
  menuSignOut?.classList.toggle("hidden", !user);
}

/** Pull settings and history for whichever profile is now active. */
function loadScopedState() {
  const saved = readStore("conditions", []);
  const mapped = Array.isArray(saved)
    ? saved.flatMap((id) => (id === "diabetes" ? ["diabetes-a", "diabetes-b"] : [id]))
    : [];
  activeConditions = mapped.filter(
    (id, i) => mapped.indexOf(id) === i && CONDITION_LIBRARY.some((c) => c.id === id)
  );
  if (kidsProductCheck) kidsProductCheck.checked = readStore("kidsproduct", false) === true;

  renderConditions();
  renderHistory();
}

function openAuth(mode) {
  authMode = mode;
  const signup = mode === "signup";

  authTitle.textContent = signup ? "Create a profile" : "Sign in";
  authSub.textContent = signup
    ? "Save your conditions and scan history on this device."
    : "Welcome back.";
  authSubmit.textContent = signup ? "Create profile" : "Sign in";
  authSwitchText.textContent = signup ? "Already have a profile here?" : "No profile on this device yet?";
  authSwitch.textContent = signup ? "Sign in" : "Create one";
  authPasswordHint?.classList.add("hidden");
  authNameRow.classList.toggle("hidden", !signup);
  authPassword.setAttribute("autocomplete", signup ? "new-password" : "current-password");

  authError.classList.add("hidden");
  authError.textContent = "";
  authForm.reset();
  authBackdrop.classList.add("is-open");
  setTimeout(() => (signup ? authName : authEmail).focus(), 120);
}

function closeAuth() {
  authBackdrop.classList.remove("is-open");
}

function renderAccount() {
  const user = Auth.current();
  if (!user) return;
  const scans = loadHistory().length;

  accountBody.innerHTML = `
    <div class="profile-card">
      <span class="avatar">${escapeHtml(Auth.initials(user))}</span>
      <div>
        <p class="profile-name">${escapeHtml(user.name)}</p>
        <p class="profile-meta">${escapeHtml(user.email)}</p>
      </div>
    </div>
    <p class="panel-note">
      Profile created ${escapeHtml(new Date(user.createdAt).toLocaleDateString())}.
      ${scans} scan${scans === 1 ? "" : "s"} saved.
      ${activeConditions.length ? `Conditions: ${escapeHtml(activeConditions.map(conditionLabel).join(", "))}.` : "No conditions set."}
    </p>`;

  accountBackdrop.classList.add("is-open");
}

/* ————————————————————————————————————————
   Events
   ———————————————————————————————————————— */

scanBtn?.addEventListener("click", () => imageInput.click());
imageInput?.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (file) stageFile(file);
});

clearPreviewBtn?.addEventListener("click", () => {
  clearPreview();
  resultBox.innerHTML = "";
});

pasteToggleBtn?.addEventListener("click", () => {
  pastePanel.classList.toggle("hidden");
  if (!pastePanel.classList.contains("hidden")) pasteText?.focus();
  updateCreateButton();
});

pasteText?.addEventListener("input", updateCreateButton);
analyzeTextBtn?.addEventListener("click", analyzePastedText);
pasteText?.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    createFullReport();
  }
});
createReportBtn?.addEventListener("click", createFullReport);

if (dropZone) {
  ["dragenter", "dragover"].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add("is-dragging");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove("is-dragging");
    })
  );
  dropZone.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) stageFile(file);
  });
  dropZone.addEventListener("click", () => imageInput.click());
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      imageInput.click();
    }
  });
}

kidsProductCheck?.addEventListener("change", () => {
  writeStore("kidsproduct", Boolean(kidsProductCheck.checked));
  refreshReport();
});

conditionSelect?.addEventListener("toggle", () => {
  conditionSelect.classList.toggle("is-open", Boolean(conditionSelect.open));
});

document.addEventListener("pointerdown", (e) => {
  if (!conditionSelect?.open) return;
  if (e.target.closest("#conditionSelect")) return;
  setConditionMenuOpen(false);
});

historyTab?.addEventListener("click", openHistory);
historyClose?.addEventListener("click", closeHistory);
historyBackdrop?.addEventListener("click", closeHistory);
menuHistory?.addEventListener("click", () => {
  profileMenu.classList.add("hidden");
  openHistory();
});

clearHistoryBtn?.addEventListener("click", () => {
  if (loadHistory().length === 0) return;
  if (!confirm("Delete every saved scan for this profile?")) return;
  writeStore("history", []);
  renderHistory();
  toast("Scan history cleared");
});

profileTrigger?.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = profileMenu.classList.toggle("hidden");
  profileTrigger.setAttribute("aria-expanded", String(!open));
});

document.addEventListener("click", (e) => {
  if (!profileMenu.classList.contains("hidden") && !e.target.closest(".profile-wrap")) {
    profileMenu.classList.add("hidden");
    profileTrigger.setAttribute("aria-expanded", "false");
  }
});

menuSignIn?.addEventListener("click", () => {
  profileMenu.classList.add("hidden");
  openAuth("signin");
});
menuSignUp?.addEventListener("click", () => {
  profileMenu.classList.add("hidden");
  openAuth("signup");
});
menuAccount?.addEventListener("click", () => {
  profileMenu.classList.add("hidden");
  renderAccount();
});
menuSignOut?.addEventListener("click", () => {
  profileMenu.classList.add("hidden");
  Auth.signOut();
  toast("Signed out — back to guest scans");
});

authSwitch?.addEventListener("click", () => openAuth(authMode === "signup" ? "signin" : "signup"));
authClose?.addEventListener("click", closeAuth);
authBackdrop?.addEventListener("click", (e) => {
  if (e.target === authBackdrop) closeAuth();
});

authForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.classList.add("hidden");
  authSubmit.disabled = true;

  const payload = {
    name: authName.value,
    email: authEmail.value,
    password: authPassword.value,
  };
  const result = authMode === "signup" ? await Auth.signUp(payload) : await Auth.signIn(payload);

  authSubmit.disabled = false;

  if (!result.ok) {
    authError.textContent = result.error;
    authError.classList.remove("hidden");
    return;
  }

  closeAuth();
  toast(authMode === "signup" ? `Profile created — welcome, ${result.user.name.split(" ")[0]}` : `Signed in as ${result.user.name.split(" ")[0]}`);
});

accountClose?.addEventListener("click", () => accountBackdrop.classList.remove("is-open"));
accountBackdrop?.addEventListener("click", (e) => {
  if (e.target === accountBackdrop) accountBackdrop.classList.remove("is-open");
});

deleteAccountBtn?.addEventListener("click", () => {
  if (!confirm("Delete this profile and everything saved under it? This cannot be undone.")) return;
  Auth.deleteCurrent();
  accountBackdrop.classList.remove("is-open");
  toast("Profile deleted");
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  closeHistory();
  closeAuth();
  accountBackdrop.classList.remove("is-open");
  profileMenu.classList.add("hidden");
  setConditionMenuOpen(false);
});

/* Re-scope everything whenever the signed-in profile changes. */
Auth.subscribe(() => {
  refreshIdentity();
  loadScopedState();
});

/* ————————————————————————————————————————
   Boot
   ———————————————————————————————————————— */

renderHomeStats();
renderConditionCover();
renderKidsAgeList();
refreshIdentity();
loadScopedState();
updateCreateButton();
applyRoute();
