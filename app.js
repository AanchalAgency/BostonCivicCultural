/* ==========================================================================
   Boston Civic & Cultural Asset Map
   Plain JavaScript — no framework, no build step. Load index.html from any
   static web server and it runs.

   Read the CONFIG block below first: it is the only part of this file the
   project owner needs to edit. Everything under "Nothing below here needs
   editing" is application logic.
   ========================================================================== */

/* ==========================================================================
   1. CONFIG — the only block you need to edit
   ==========================================================================
   Every value here is filled in by following README.md → "Owner setup
   checklist". The comment on each line says exactly where the value comes
   from. Until a value is replaced, the page shows an orange banner listing
   what is still missing, and runs in DEMO MODE with sample pins so you can
   still see how it behaves.
   ========================================================================== */

// The "about to close" closure answer, exactly as stored in the sheet
// (owner's decision, 2026-09-28). Defined once because the form options,
// the year question, the pop-up label and the old-value aliases all use it.
const IMMINENT = "Imminent (about to close)";

const CONFIG = {

  // Google Cloud console → APIs & Services → Credentials → API key.
  // Restrict it by HTTP referrer to your deployed site's URL.
  GOOGLE_MAPS_API_KEY: "AIzaSyCkFjEevZDJ8TVsPmUW5h6IdAnL0CCCLyg",

  // Google Cloud console → Google Maps Platform → Map management → Create map ID
  // (Map type: JavaScript, Raster). Required for the pin markers to render.
  // "DEMO_MAP_ID" works while developing on localhost; replace it before launch.
  MAP_ID: "77c79c7f20024d30ec1dd46d",

  // Apps Script → Deploy → New deployment → Web app → copy the /exec URL.
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxt7zBGVdM1K4t0GrBeO6PGSaQ_gdLQezfUzaeskAUrBkjaPhqu2jd3fcHOmhnsz9uABg/exec",

  // Your Google Form's public link, ending in /viewform.
  SURVEY_FORM_BASE: "https://docs.google.com/forms/d/e/1FAIpQLScoqoHJwK_WqAz1j24OBPHS1o4JBeF12qRkDtFGrPdsKwGMUw/viewform",

  // Google Form → ⋮ menu → "Get pre-filled link" → fill each of the four
  // auto-fill questions with dummy text → Get link → read the entry.NNN ids
  // out of the URL it gives you. See README.md for a walk-through.
  SURVEY_ENTRY_IDS: {
    asset_id:   "entry.1442699235",   // "Space ID"
    space_name: "entry.427636158",    // "Space name"
    latitude:   "entry.1768120616",   // "Latitude"
    longitude:  "entry.502678152",    // "Longitude"
  },

  // Where the map opens, and the area Places search is biased toward.
  // BOSTON_BOUNDS is a *bias*, not a hard limit — spaces just over the line in
  // Cambridge, Somerville and Brookline can still be found and added.
  //
  // Centre and zoom are measured, not guessed: the city spans 42.228–42.397 N
  // and −71.191 to −70.924 W, and at zoom 12 a desktop map pane covers about
  // 0.34° of longitude and 0.20° of latitude — enough to hold the whole city,
  // Hyde Park to Charlestown, with the harbour islands in view. The centre sits
  // slightly north and west of the polygon's centre so the bulk of the pins
  // (mean 42.336, −71.092) is not pushed to the top of the frame.
  // Zoom 13 opened tight on South Boston, which is what this replaced.
  MAP_CENTER: { lat: 42.3250, lng: -71.0750 },
  MAP_ZOOM: 12,
  BOSTON_BOUNDS: { north: 42.42, south: 42.22, east: -70.95, west: -71.20 },

  // "What happens in the space" — a MULTI-select; a space can be several of
  // these at once. Edit freely: add, remove or reword.
  //
  // These do not affect pin colour. Pins are coloured by the space's PURPOSE
  // (see PURPOSE_GROUPS below), so this list is purely the question's answers.
  //
  // Reworded 2026-09-28 from the owner's survey doc: "Club/nightlife/live
  // music venue" split into two, and "Commercial gallery" + "Museum/public
  // gallery" became "Gallery/Exhibition Space" + "Museum". Rows saved under
  // the old wording are mapped onto these by LABEL_ALIASES below — add an
  // alias whenever a label here is reworded.
  SPACE_TYPES: [
    { label: "Artist live/work space" },
    { label: "Arts/cultural center" },
    { label: "Club/nightlife venue" },
    { label: "Community center" },
    { label: "Creative co-working space" },
    { label: "Dance/theater rehearsal studio" },
    { label: "Desk-based arts-related office" },
    { label: "Education institution (K-12)" },
    { label: "Education institution (higher ed)" },
    { label: "Fabrication/manufacturing space" },
    { label: "Faith-based space" },
    { label: "Fashion/textile design and manufacturing" },
    { label: "Film/TV facility" },
    { label: "Gallery/Exhibition Space" },
    { label: "Library" },
    { label: "Live music venue" },
    { label: "Makerspace" },
    { label: "Movie theater" },
    { label: "Museum" },
    { label: "Music recording studio" },
    { label: "Music rehearsal space" },
    { label: "Outdoor venue or public space for cultural use" },
    { label: "Printing facility" },
    { label: "Restaurant/bar" },
    { label: "Retail/store/professional service" },
    { label: "Theater/performance hall" },
    { label: "Visual art studio" },
    { label: "Other" },
  ],

  // Which floor the space is on. Optional. The "Not sure" answer was dropped
  // from the survey doc on 2026-09-28; rows already saved as "Unsure" still
  // show "Currently unknown" in the pop-up, and the backend still accepts it.
  LOCATION_IN_BUILDING: [
    "Whole building",
    "First floor / street level",
    "Basement",
    "Upper floor(s)",
    "Open space / land",
  ],

  // The main purpose of the space. Multi-select; stored joined by "; " in
  // space_purpose. The stored VALUES match the MASTER base layer's own terms
  // (Produce / Present / Learn / Gather) while the LABELS carry the owner's
  // fuller wording — so the export stays clean and the question stays clear.
  // These are also what colours the pins — see PURPOSE_GROUPS below.
  // "Produce" is SHOWN as "Create" since 2026-09-28 (owner's decision) but
  // still STORED as "Produce", matching the base layer.
  SPACE_PURPOSE: [
    { value: "Present", label: "To PRESENT: Sell, share or display art and creative work to an audience (for example, live music venue, gallery, comedy club, museum)" },
    { value: "Produce", label: "To CREATE: Make, build, rehearse or produce art and creative work (for example, live-work studio, music rehearsal studio, makerspace, photography studio)" },
    { value: "Learn",   label: "To LEARN: Teach, learn about or train in arts and creative work (for example, youth arts center, architecture school, music school)" },
    { value: "Gather",  label: "To GATHER: Participate in cultural heritage or arts-related community activities (for example, public space, park, rentable events space)" },
    { value: "Something else", label: "Something else" },
  ],

  // How much of the space's life is arts and culture. Since 2026-09-28 the
  // sheet stores the answer's own short words (owner's decision — it replaced
  // Primary/Secondary when "All the time" was added, so the export can tell
  // "all" from "most"). The backend whitelist (ALLOWED_USE_TYPE in Code.gs)
  // must list every value here. Older rows still hold Primary/Secondary;
  // LABEL_ALIASES maps them onto these for correction pre-fills.
  USE_TYPE: [
    { value: "All the time",     label: "All the time" },
    { value: "Most of the time", label: "Most of the time (several days of the week)" },
    { value: "Some of the time", label: "Some of the time (some days of the week / month)" },
    { value: "Unsure",           label: "Not sure" },
  ],

  // Closure state. "No" leads because it is the common answer, so most people
  // never have to read past the first option (kept first on 2026-09-28 even
  // though the survey doc lists it fifth). Labels may be reworded freely; the
  // VALUES are what the sheet and the backend whitelist expect.
  CLOSURE_STATUS: [
    "No",
    "Yes, permanently",
    "Yes, temporarily",
    "Yes, but relocated",
    // STORED as the full wording (owner's decision, 2026-09-28 — it was
    // "Imminent" before). The backend's ALLOWED_STATUS must match exactly.
    IMMINENT,
    "Unsure",
  ],

  // How the person filling in the form relates to the space. Stored in
  // submitter_connection.
  SUBMITTER_CONNECTION: [
    "I am the owner / operator",
    "I am a staff member or volunteer here",
    "I am a regular user - I visit this space at least once on an average month",
    "I am an irregular user - I visit this space only a few times in an average year",
    "I am aware of this space but have never visited it",
    "Other",
  ],

  // Which CLOSURE_STATUS answers should reveal the "what year?" question.
  CLOSURE_NEEDS_YEAR: [
    "Yes, permanently",
    "Yes, temporarily",
    "Yes, but relocated",
    IMMINENT,
  ],
};

// Several space types are stored in one cell, joined by this. A semicolon
// keeps the ArcGIS export to one column while staying easy to split, and no
// type label contains one.
const TYPE_SEPARATOR = "; ";

/* Answer labels get reworded, and rows recorded under the old wording stay in
   the sheet. Without this map, opening one of those spaces in the correction
   form would show its answer UNTICKED — and since the pin shows the most
   recent submission, a corrector who did not notice would silently erase it.
   Old label -> current label. Only affects the correction form's pre-fill;
   the sheet itself is never rewritten. */
const LABEL_ALIASES = {
  // Space types. Old wording from earlier versions of this form, plus the
  // base layer's own near-matches.
  "Club/nightlife": "Club/nightlife venue",
  "Club/nightlife/live music venue": "Club/nightlife venue",
  "Commercial gallery": "Gallery/Exhibition Space",
  "Gallery / Exhibition Space": "Gallery/Exhibition Space",
  "Museum/public gallery": "Museum",
  "Museum - Art": "Museum",
  "Museum - Other": "Museum",
  "Outdoor venue for cultural use": "Outdoor venue or public space for cultural use",
  // Floor.
  "Ground floor / street level": "First floor / street level",
  // Frequency: stored Primary/Secondary until 2026-09-28, and those were
  // asked as "Most of the time" / "Some of the time" at the time.
  "Primary": "Most of the time",
  "Secondary": "Some of the time",
  "Not sure": "Unsure",
  // Closure: the stored value became "Imminent (about to close)" on
  // 2026-09-28 (owner's decision). Older rows may still say "Imminent", and
  // one live row said "Imminent (about to close) (about to close)" — read
  // both as the current value so the pop-up label, the filter and the
  // correction pre-fill all work. (runDataCleanup rewrites them in the
  // sheet too.)
  "Imminent": IMMINENT,
  "Imminent (about to close) (about to close)": IMMINENT,
};

function canonicalLabel(s) {
  const v = String(s || "").trim();
  return LABEL_ALIASES[v] || v;
}

/* Pin colours and legend chips — driven by the space's PURPOSE (owner's
   decision, 2026-08-27; pins were coloured by open/closed before that).

   A space can have several purposes at once. One purpose = a solid pin in
   that colour; two or more = the pin body is split into a stripe per purpose
   (drawn as a small inline SVG — Google's PinElement can only do one fill).

   Colour choice is measured, not taste. The hues start from the Okabe–Ito
   colour-blind-safe palette (anchored on Boston's Optimistic Blue for
   Present), then two were darkened on 2026-08-27 after actually simulating
   protanopia, deuteranopia and tritanopia across all fifteen pairs:

     - Produce #E69F00 -> #C77E00. The original was only 2.25:1 against a
       white/light map, below the 3:1 WCAG 1.4.11 asks of a graphical object.
     - Gather  #CC79A7 -> #A64D82. Under DEUTERANOPIA the original sat almost
       exactly on top of the grey "no purpose" pin (ΔE 3.9 — indistinguishable).

   That lifted the worst pair across every simulated vision type from ΔE 3.9
   to 12.0, and every colour now clears 3:1 on white. Re-run that simulation
   before changing any of these, and never introduce a green-vs-red pairing.

   "No purpose recorded" deliberately has NO hue of its own. Grey has almost
   zero chroma, so it cannot carry identity the way a hue does. It is drawn
   HOLLOW — white fill, coloured ring — so its form distinguishes it rather
   than its colour. That is also honest: it is an absence of data, not a
   purpose. (It used to be drawn smaller as well; the owner asked for one pin
   size on 2026-08-27, so the hollow form now carries that job alone.) */
const PURPOSE_GROUPS = [
  { id: "present", value: "Present", label: "Present", hex: "#1871bd" },  // Optimistic Blue
  // Stored as "Produce", SHOWN as "Create" (owner's wording, 2026-09-28).
  { id: "produce", value: "Produce", label: "Create",  hex: "#C77E00" },  // amber
  { id: "learn",   value: "Learn",   label: "Learn",   hex: "#009E73" },  // teal green
  { id: "gather",  value: "Gather",  label: "Gather",  hex: "#A64D82" },  // magenta
  { id: "other",   value: "Something else", label: "Something else", hex: "#58585B" },
  // Label reworded 2026-09-28 (was "No purpose recorded") — the owner's
  // standard wording for any gap is "Currently unknown".
  { id: "unknown", label: "Currently unknown", hex: "#8A9199", hollow: true },
];

/* Closed spaces get their own pin (owner's request, 2026-09-28): a navy
   SQUARE with a white X instead of the purpose-coloured teardrop, so they
   read as different at a glance by shape alone, before colour. Charles Blue
   was checked against every pin colour under simulated protanopia,
   deuteranopia and tritanopia (Machado 2009, CIEDE2000): the closest it
   comes to anything is ΔE 20.3 (the grey "Something else" pin, protan) —
   well clear of the existing worst pair, ΔE 11.1 (Gather vs Something else,
   deutan, same method). 16.8:1 on white.

   "Imminent" is NOT closed — the space is still open — so it keeps its
   purpose colours; the pop-up's "Closing soon" line carries it. */
const CLOSED_PIN = { id: "closed", label: "Closed", hex: "#091F2F" };
const CLOSED_STATUSES = ["Yes, permanently", "Yes, temporarily", "Yes, but relocated"];

/* The legend's hover/focus description for each purpose, in the survey's own
   words so the map and the form define these the same way. Sourced from
   CONFIG.SPACE_PURPOSE labels; the "no purpose" entry has no survey wording
   of its own, so it explains the gap instead. */
function purposeDescription(group) {
  if (group.id === CLOSED_PIN.id) {
    return "The space has closed — permanently, temporarily, or because it " +
           "relocated. Closed spaces from the last 15 years stay on the map.";
  }
  if (!group.value) {
    return "Nobody has told us what this space is used for yet — open it and " +
           "suggest a correction if you know.";
  }
  const opt = CONFIG.SPACE_PURPOSE.filter(function (p) { return p.value === group.value; })[0];
  return opt ? opt.label : group.label;
}

/* The survey labels open with "To PRESENT: …". In the legend's (i) panel
   the category name is already printed in bold, so the "To X:" lead-in is
   dropped there to avoid saying it twice. "Something else" has no wording
   beyond its own name, so it gets a plain explanation instead. */
function stripLead(s) {
  if (s === "Something else") return "A purpose that isn't one of the four above.";
  return String(s).replace(/^To [A-Z]+:\s*/, "");
}

/* The closure label shown above the name in a pin's pop-up. Closure no longer
   colours the pins, but "Closed" is still the most consequential fact about a
   space, so the pop-up keeps its labelled line. Anything unrecognised —
   including blank and "Unsure" — gets no label: absence of an answer is not
   an answer. (Closed uses --freedom-text, not raw Freedom Trail Red, because
   this renders at 14px.) */
const CLOSURE_LABELS = {
  "No":                 { label: "Open",         hex: "#1871bd" },
  [IMMINENT]:           { label: "Closing soon", hex: "#8A6412" },
  "Yes, permanently":   { label: "Closed",       hex: "#C63024" },
  "Yes, temporarily":   { label: "Closed",       hex: "#C63024" },
  "Yes, but relocated": { label: "Closed",       hex: "#C63024" },
};

/* ==========================================================================
   Nothing below here needs editing
   ========================================================================== */

(function () {
  "use strict";

  // ---------- Derived lookups ----------
  const groupById = {};
  PURPOSE_GROUPS.forEach((g) => { groupById[g.id] = g; });

  const OTHER_LABEL = "Other";               // in the space-type list
  const PURPOSE_OTHER = "Something else";    // in the purpose list

  /* use_type was stored as Primary/Secondary until 2026-09-28, which is
     jargon to a reader, so older rows are shown in the plain words the form
     asked in at the time. Newer rows already hold plain words. */
  const USE_TYPE_WORDS = {
    "Primary": "Most of the time",
    "Secondary": "Some of the time",
    "Unsure": "Not sure",
  };

  // ---------- Application state ----------
  let map = null;
  let infoWindow = null;
  let AdvancedMarkerElement = null;
  let PinElement = null;

  let assets = [];             // all assets loaded from the backend
  let markers = {};            // asset_id -> AdvancedMarkerElement
  const activeGroups = {};     // purpose group id (and "closed") -> shown?
  PURPOSE_GROUPS.forEach((g) => { activeGroups[g.id] = true; });
  activeGroups[CLOSED_PIN.id] = true;

  let draftMarker = null;      // the draggable pin while adding a space
  let draftLocation = null;    // { lat, lng }
  let draftPlaceId = "";       // Google place_id, when added via search
  let correctingId = null;     // asset being corrected, or null when adding new
  // Retry guard: one random key per filled-in form, sent with the save. If
  // Google answers slowly with an error AFTER saving, pressing the button
  // again returns the same row instead of adding a duplicate. A new key is
  // made whenever the answers change (so an edited resubmission is saved).
  let submissionKey = null;
  let submissionKeyFor = "";
  let demoMode = false;        // true when APPS_SCRIPT_URL is not configured

  /* ======================================================================
     Small helpers
     ====================================================================== */

  // Escape every user-supplied string before it touches innerHTML. This map is
  // a public-write tool, so a space named `<img onerror=...>` must be inert.
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function $(id) { return document.getElementById(id); }

  function toast(msg, ms) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), ms || 3000);
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function openModal(id) { $(id).classList.add("open"); }
  function closeModal(id) { $(id).classList.remove("open"); }

  /* ======================================================================
     "Are you sure you want to leave?"
     ----------------------------------------------------------------------
     Losing a part-filled form to a stray click on the backdrop is the single
     most annoying thing this form can do, so closing it asks first — but ONLY
     when there is something to lose. An untouched form closes silently;
     nagging someone who typed nothing just trains them to dismiss warnings.

     The comparison is against a snapshot taken when the form opened, so a
     correction (which opens pre-filled) counts as dirty only once the person
     actually changes something.
     ====================================================================== */

  let formSnapshot = "";

  /* ======================================================================
     Address state (2026-09-28)
     ----------------------------------------------------------------------
     The address box holds the STREET ADDRESS ONLY — "75 W Newton St" — the
     same shape as the imported base layer. The neighborhood is no longer in
     the box at all: the server computes it from the pin (neighborhoodFor_
     in Code.gs), which is what fixed "10 Newbury Street, 5th floor" being
     split into a street and a neighborhood called "5th floor". The zip rides
     alongside in draftZip and is stored in zip_code.

     verifiedAddress is the exact text of the last address Google confirmed
     (from the search, the pin drop, or a picked suggestion) — or, when
     correcting, what the record already says. If the box still says exactly
     that on submit, nothing needs checking. Anything else was typed by hand
     and is looked up before saving (checkTypedAddress). */
  let draftZip = "";
  let verifiedAddress = "";
  let addressCheck = "";        // "verified" once Google has matched it
  let addressWarnedFor = null;  // the text we already warned about once

  /* Street + zip from Google's address parts. Works for both shapes Google
     returns: Places (New) { types, longText, shortText } and the Geocoder's
     { types, long_name, short_name }. The street uses the SHORT road name
     ("W Newton St"), matching the base layer's "184 Dudley St" style; a unit
     number, when Google has one, is kept as "#3". */
  function addressFromComponents(components) {
    const get = (type, short) => {
      const c = (components || []).filter((x) => (x.types || []).indexOf(type) > -1)[0];
      if (!c) return "";
      return short ? (c.shortText || c.short_name || "") : (c.longText || c.long_name || "");
    };
    let street = [get("street_number"), get("route", true)].filter(Boolean).join(" ");
    const unit = get("subpremise");
    if (street && unit) street += " #" + unit;
    return { street: street, zip: get("postal_code") };
  }

  /* Google's one-line form minus the tail the base layer never carries:
     "O'Day Playground, 75 W Newton St, Boston, MA 02118, USA"
       -> "75 W Newton St". Only a fallback, for results with no street
     number (a park, a plaza). Same rule as splitGoogleAddress_ in Code.gs. */
  function trimGoogleAddress(s) {
    const m = String(s || "").trim().match(/^(.*?),\s*[^,]+,\s*MA\s+(\d{5})(?:-\d{4})?(?:,\s*USA)?$/);
    if (!m) return String(s || "").replace(/,\s*USA$/, "").trim();
    let parts = m[1].split(",").map((x) => x.trim()).filter(Boolean);
    const firstNumbered = parts.findIndex((x) => /^\d/.test(x));
    if (firstNumbered > 0) parts = parts.slice(firstNumbered);
    return parts.join(", ");
  }

  // Put a Google-confirmed address into the box.
  function setVerifiedAddress(street, zip) {
    $("fAddr").value = street;
    draftZip = zip || "";
    verifiedAddress = street;
    addressCheck = street ? "verified" : "";
    addressWarnedFor = null;
    $("addrWarn").hidden = true;
  }

  function snapshotForm() {
    const text = ["fName", "fAddr", "fTypeOther", "fPurposeOther", "fClosureYear",
                  "fSubName", "fSubEmail", "fSubAffil"]
      .map((id) => { const el = $(id); return el ? el.value : ""; });
    const selects = ["fLocIn", "fPrimary", "fClosed", "fConnection"]
      .map((id) => { const el = $(id); return el ? el.value : ""; });
    const boxes = Array.prototype.slice
      .call(document.querySelectorAll(".type-check, .purpose-check"))
      .map((b) => (b.checked ? "1" : "0")).join("") +
      ($("fContactConsent") && $("fContactConsent").checked ? "C" : "") +
      ($("fUpdatesConsent") && $("fUpdatesConsent").checked ? "U" : "");
    return text.concat(selects).join("") + "" + boxes;
  }

  // Returns true if it is OK to close.
  function confirmDiscard(modalId) {
    if (modalId !== "addModal") return true;
    if (snapshotForm() === formSnapshot) return true;
    return window.confirm(
      "Are you sure you want to exit? Everything you have entered will be lost."
    );
  }

  function showError(fieldId, errId, message) {
    const err = $(errId);
    err.textContent = message;
    err.hidden = false;
    if (fieldId) $(fieldId).classList.add("invalid");
  }

  function clearErrors() {
    document.querySelectorAll(".err").forEach((e) => { e.hidden = true; });
    document.querySelectorAll(".invalid").forEach((e) => e.classList.remove("invalid"));
  }

  // space_type holds one or more labels joined by TYPE_SEPARATOR ("; ").
  // Split on ";" ONLY — some base-layer labels contain commas themselves
  // ("Independent Artists, Writers, and Performers"). The base layer's
  // space_type never used commas as separators (checked 2026-09-28), and
  // normalizeSeparators() in Code.gs tidies the rest.
  function typesOf(space) {
    return String(space.space_type || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /* Pin colour comes from the space's recorded purpose(s). Returned in
     PURPOSE_GROUPS order so the same set of answers always draws the same
     pin. A space with no recognised purpose falls to the hollow "No purpose
     recorded" group — never silently to a real purpose. */
  function purposeGroupsFor(space) {
    const values = String(space.space_purpose || "")
      .split(/[;,]/).map((s) => canonicalLabel(s)).filter(Boolean);
    const found = PURPOSE_GROUPS.filter((g) => g.value && values.indexOf(g.value) > -1);
    return found.length ? found : [groupById.unknown];
  }

  // The display label for a stored answer, from a CONFIG option list whose
  // entries are either plain strings or { value, label }.
  function optionLabel(options, value) {
    const hit = options.filter((o) => (typeof o === "string" ? o : o.value) === value)[0];
    return hit ? (typeof hit === "string" ? hit : hit.label) : value;
  }

  function isClosed(space) {
    return CLOSED_STATUSES.indexOf(String(space.status || "").trim()) > -1;
  }

  // Legend filtering. A closed space follows ONLY the "Closed" chip — it is
  // drawn as a closed pin, not in its purpose colours, so the purpose chips
  // would be hiding something that does not look like them. An open space
  // stays visible while at least one of its purposes is switched on — a
  // two-purpose pin hides only when BOTH its colours are off.
  function isShown(space) {
    if (isClosed(space)) return activeGroups[CLOSED_PIN.id];
    return purposeGroupsFor(space).some((g) => activeGroups[g.id]);
  }

  // The legend/list swatch for ONE group. Mirrors the pin: solid for a known
  // purpose, hollow for "No purpose recorded".
  function dotHtml(g) {
    if (g.id === CLOSED_PIN.id) {
      // A small square with an X, mirroring the closed pin's shape.
      return '<span class="dot closed-dot" style="background:' + g.hex + '"></span>';
    }
    return g.hollow
      ? '<span class="dot hollow" style="border-color:' + g.hex + '"></span>'
      : '<span class="dot" style="background:' + g.hex + '"></span>';
  }

  // The list swatch for one space — the closed square, or its purpose dot.
  function swatchFor(space) {
    return isClosed(space) ? dotHtml(CLOSED_PIN) : dotHtmlFor(purposeGroupsFor(space));
  }

  // The list swatch for a whole space: one purpose = a plain dot; several =
  // the dot is split into equal colour segments, echoing the striped pin.
  function dotHtmlFor(groups) {
    if (groups.length === 1) return dotHtml(groups[0]);
    const step = 100 / groups.length;
    const stops = groups
      .map((g, i) => g.hex + " " + (i * step) + "% " + ((i + 1) * step) + "%")
      .join(", ");
    return '<span class="dot" style="background:linear-gradient(135deg,' + stops + ')"></span>';
  }

  // The types shown to a reader. "Other" shows what the person actually
  // typed — "Other: community radio station" — from space_type_other
  // (its own column since 2026-09-28; owner's request).
  function typeLabel(space) {
    const other = String(space.space_type_other || "").trim();
    const chosen = typesOf(space).map((t) =>
      (t === OTHER_LABEL && other) ? OTHER_LABEL + ": " + other : t);
    return chosen.length ? chosen.join(TYPE_SEPARATOR) : "Unspecified";
  }

  // The name is optional on the form, so a row can legitimately have none.
  // Blank text would leave an unlabelled pin nobody could identify or correct.
  function nameOf(space) {
    return String(space.space_name || "").trim() || "Unnamed space";
  }

  // One line of street address from the two columns.
  function addressOf(space) {
    return [space.address_1, space.address_2]
      .map((s) => String(s || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  /* ======================================================================
     Survey links
     ----------------------------------------------------------------------
     Never stored per pin — built fresh at render time, so every new pin gets
     a working pre-filled survey link automatically. The asset_id travelling
     in the URL is what lets survey responses join back to pins in Sheets and
     ArcGIS with a plain lookup, instead of matching names by hand.
     ====================================================================== */
  function surveyUrlFor(space) {
    const p = new URLSearchParams({ usp: "pp_url" });
    p.set(CONFIG.SURVEY_ENTRY_IDS.asset_id, space.space_id);
    p.set(CONFIG.SURVEY_ENTRY_IDS.space_name, space.space_name);
    p.set(CONFIG.SURVEY_ENTRY_IDS.latitude, space.lat);
    p.set(CONFIG.SURVEY_ENTRY_IDS.longitude, space.long);
    return CONFIG.SURVEY_FORM_BASE + "?" + p.toString();
  }

  /* All four ids must be real and distinct. Checking only asset_id was a trap:
     with the others left at the placeholder, URLSearchParams would set the same
     key three times and the last write would win — so name, latitude and
     longitude would all vanish and the survey would look like it was working. */
  function surveyConfigured() {
    if (CONFIG.SURVEY_FORM_BASE.indexOf("FORM_ID") > -1) return false;
    const ids = [
      CONFIG.SURVEY_ENTRY_IDS.asset_id,
      CONFIG.SURVEY_ENTRY_IDS.space_name,
      CONFIG.SURVEY_ENTRY_IDS.latitude,
      CONFIG.SURVEY_ENTRY_IDS.longitude,
    ];
    if (ids.some((id) => !id || id === "entry.0000000")) return false;
    return new Set(ids).size === 4;   // duplicated ids would overwrite each other
  }

  /* The deep-dive prompt shown AFTER a submission saves.

     Deliberately after, never inside the form: a brand-new space has no
     space_id until the server assigns one on save, so a link offered before
     submitting could not carry the id and its survey responses would need
     hand-matching. Prompting once the save has succeeded means every
     deep-dive response arrives already tagged with the space it belongs to —
     which is the whole join between the two datasets. */
  function openDeepDivePrompt(space, message) {
    if (!surveyConfigured()) return false;
    $("deepDiveLede").textContent = message;
    $("deepDiveLink").href = surveyUrlFor(space);
    openModal("deepDiveModal");
    return true;
  }

  /* ======================================================================
     Setup banner — tells the owner exactly what is still unconfigured
     ====================================================================== */
  function checkConfig() {
    const missing = [];
    if (CONFIG.GOOGLE_MAPS_API_KEY === "YOUR_KEY_HERE") missing.push("GOOGLE_MAPS_API_KEY");
    if (CONFIG.MAP_ID === "DEMO_MAP_ID") missing.push("MAP_ID (using Google's demo map id)");
    if (CONFIG.APPS_SCRIPT_URL === "YOUR_DEPLOYMENT_URL_HERE") missing.push("APPS_SCRIPT_URL");
    if (!surveyConfigured()) missing.push("SURVEY_FORM_BASE / SURVEY_ENTRY_IDS");

    demoMode = CONFIG.APPS_SCRIPT_URL === "YOUR_DEPLOYMENT_URL_HERE";

    if (missing.length) {
      const b = $("setupBanner");
      b.innerHTML =
        "<b>Setup not finished.</b> Still using placeholder values in <code>app.js</code> → CONFIG: " +
        esc(missing.join(", ")) + ". See README.md." +
        (demoMode ? " Running in <b>demo mode</b> — pins are sample data and nothing is saved." : "");
      b.hidden = false;
    }
  }

  /* ======================================================================
     Backend calls (Google Apps Script web app)
     ----------------------------------------------------------------------
     Apps Script cannot return custom CORS headers on a preflight, so POSTs go
     out as Content-Type: text/plain carrying a JSON string. That keeps them
     "simple requests" that the browser sends without a preflight.
     ====================================================================== */

  async function apiGet(action) {
    const url = CONFIG.APPS_SCRIPT_URL + "?action=" + encodeURIComponent(action);
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    if (!res.ok) throw new Error("Request failed (" + res.status + ")");
    return parseApiResponse(await res.text());
  }

  async function apiPost(action, payload) {
    const body = JSON.stringify(Object.assign({ action: action, clientId: clientId() }, payload));
    const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: body,
      redirect: "follow",
    });
    if (!res.ok) throw new Error("Request failed (" + res.status + ")");
    return parseApiResponse(await res.text());
  }

  // True for a timeout / network failure (Google's 404 when slow, a dropped
  // connection) — as opposed to the server answering and rejecting the data.
  function isSlowServerError(err) {
    return /Request failed|Failed to fetch|NetworkError|Load failed/i.test((err && err.message) || "");
  }

  function parseApiResponse(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Apps Script returns an HTML error page when the deployment is wrong.
      throw new Error("The server sent something unexpected. Check the Apps Script deployment is set to 'Anyone' access.");
    }
    if (!data.ok) throw new Error(data.error || "The server rejected that.");
    return data;
  }

  // A random per-browser id. Not security — it just gives the server's rate
  // limiter something to count against so one person cannot flood the sheet.
  function clientId() {
    try {
      let id = localStorage.getItem("bcam_client_id");
      if (!id) {
        id = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem("bcam_client_id", id);
      }
      return id;
    } catch (e) {
      return "no-storage";
    }
  }

  /* Which spaces this browser has already confirmed / asked to remove, so
     the pop-up can show "You confirmed this" instead of the button (owner's
     request, 2026-09-28: one per person per pin). The server enforces the
     same rule by client id; this list just keeps the page honest about it.
     Wrapped in try/catch because storage can be blocked (private windows) —
     then the buttons simply stay available and the server dedupes. */
  function doneKey(kind) { return "bcam_" + kind; }
  function hasDone(kind, spaceId) {
    try {
      const list = JSON.parse(localStorage.getItem(doneKey(kind)) || "[]");
      return list.indexOf(spaceId) > -1;
    } catch (e) {
      return false;
    }
  }
  function markDone(kind, spaceId) {
    try {
      const list = JSON.parse(localStorage.getItem(doneKey(kind)) || "[]");
      if (list.indexOf(spaceId) === -1) list.push(spaceId);
      localStorage.setItem(doneKey(kind), JSON.stringify(list));
    } catch (e) { /* storage blocked — the server still dedupes */ }
  }

  /* ======================================================================
     Demo data — used only when APPS_SCRIPT_URL is still a placeholder
     ====================================================================== */
  const DEMO_ASSETS = [
    {
      space_id: "demo-1", space_name: "Hibernian Hall", space_type: "Arts/cultural center",
      notes: "Historic Roxbury ballroom restored as a performing arts and community events space.",
      address_1: "184 Dudley St, Roxbury, MA 02119", address_2: "", google_place_id: "",
      lat: 42.3286, long: -71.0846, submitter_name: "Example entry",
      date_added: "2026-01-15T12:00:00.000Z", source: "Community submission",
      status: "No", confirmations: 3, submissions: 1,
    },
    {
      space_id: "demo-2", space_name: "Boston Public Library — Central Library", space_type: "Library",
      notes: "Copley Square. Exhibitions, courses, and community programmes.",
      address_1: "700 Boylston St, Boston, MA 02116", address_2: "", google_place_id: "",
      lat: 42.3493, long: -71.0782, submitter_name: "Example entry",
      date_added: "2026-01-15T12:00:00.000Z", source: "Community submission",
      status: "No", confirmations: 5, submissions: 1,
    },
    {
      space_id: "demo-3", space_name: "Fenway Studios", space_type: "Visual art studio",
      notes: "Purpose-built artists' studios in continuous use since 1905.",
      address_1: "30 Ipswich St, Boston, MA 02215", address_2: "", google_place_id: "",
      lat: 42.3455, long: -71.0937, submitter_name: "Example entry",
      date_added: "2026-01-16T12:00:00.000Z", source: "Community submission",
      status: "", confirmations: 0, submissions: 1,
    },
  ];

  /* ======================================================================
     Load the Google Maps JavaScript API
     ----------------------------------------------------------------------
     Loaded from JS rather than a <script> tag so the API key lives in CONFIG
     and nowhere else.
     ====================================================================== */
  function loadGoogleMaps() {
    return new Promise((resolve, reject) => {
      window.__bcamMapsReady = resolve;
      const s = document.createElement("script");
      s.src = "https://maps.googleapis.com/maps/api/js"
            + "?key=" + encodeURIComponent(CONFIG.GOOGLE_MAPS_API_KEY)
            + "&v=weekly&loading=async&callback=__bcamMapsReady";
      s.async = true;
      s.onerror = () => reject(new Error("Could not reach Google Maps."));
      document.head.appendChild(s);
    });
  }

  function showMapError(html) {
    const el = $("mapError");
    el.innerHTML = html;
    el.hidden = false;
    $("mapLoading").hidden = true;
  }

  function hideMapError() {
    $("mapError").hidden = true;
  }

  // If Google's tiles never arrive, say why instead of showing a blank grey
  // rectangle. The three things that actually cause this are: the page is not
  // rendering (background tab / hidden panel — Google Maps draws via
  // requestAnimationFrame, so it paints nothing), the container has collapsed
  // to zero height, or the key was rejected.
  function diagnoseBlankMap() {
    const r = $("map").getBoundingClientRect();
    let frames = 0;
    const t0 = performance.now();
    (function tick() {
      frames++;
      if (performance.now() - t0 < 400) requestAnimationFrame(tick);
    })();

    setTimeout(function () {
      const facts =
        "container " + Math.round(r.width) + " × " + Math.round(r.height) + " px · " +
        "visibility " + document.visibilityState + " · " +
        frames + " animation frames in 400ms";

      let cause;
      if (frames <= 1) {
        cause = "This page is not being rendered — it is in a background tab, a hidden " +
                "panel, or a preview pane. Google Maps only draws inside a visible window. " +
                "Open this address in a normal browser tab.";
      } else if (r.width < 50 || r.height < 50) {
        cause = "The map container has collapsed. Check the page zoom and window size.";
      } else {
        cause = "The page is rendering and the container is sized, so this is most likely " +
                "the API key. Open the browser console (F12) — Google prints the exact " +
                "reason there. README.md has a table of what each message means.";
      }

      showMapError("<div><b>The map did not finish drawing</b>" + cause +
                   "<br><br><span style='font-size:12px;opacity:.75'>" + esc(facts) + "</span></div>");
    }, 600);
  }

  /* ======================================================================
     Map, markers, info windows
     ====================================================================== */

  async function initMap() {
    const mapsLib = await google.maps.importLibrary("maps");
    const markerLib = await google.maps.importLibrary("marker");
    AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
    PinElement = markerLib.PinElement;
    // Used to test whether a dropped pin falls inside the city outline.
    // Part of the Maps JS API — no extra SKU, no extra request.
    geometryLib = await google.maps.importLibrary("geometry");

    map = new mapsLib.Map($("map"), {
      center: CONFIG.MAP_CENTER,
      zoom: CONFIG.MAP_ZOOM,
      mapId: CONFIG.MAP_ID,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,   // stop Google's own POI popups stealing map clicks
      // The legend occupies the bottom-right corner, so the zoom buttons move
      // to the bottom-left. zoomControl is stated explicitly rather than left
      // to the default — Google hides it by default on touch devices, which is
      // why it was missing.
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.LEFT_BOTTOM },
    });

    infoWindow = new mapsLib.InfoWindow({ maxWidth: 400 });

    // "tilesloaded" is the only reliable proof the map actually drew. If it
    // has not fired within 8 seconds, explain why rather than leaving a blank
    // grey rectangle on screen.
    let tilesSeen = false;
    map.addListener("tilesloaded", function () {
      tilesSeen = true;
      hideMapError();
    });
    setTimeout(function () {
      if (!tilesSeen) diagnoseBlankMap();
    }, 8000);

    /* Clicking anywhere on the map starts the pin-drop path — with two
       guards against opening the form by accident (owner's report from a
       phone, 2026-09-28):

       1. A tap while a pin's pop-up or the space list is open just CLOSES
          it. Tapping "off" a pop-up is how everyone dismisses one; it must
          not launch a survey.
       2. The form waits DOUBLE_TAP_MS before opening, and a double-tap
          (Google's zoom gesture, which also fires a plain click first)
          cancels it. Before this, double-tapping to zoom opened the form. */
    const DOUBLE_TAP_MS = 350;
    let pendingDrop = null;
    map.addListener("dblclick", () => {
      clearTimeout(pendingDrop);
      pendingDrop = null;
    });
    map.addListener("click", (e) => {
      if (!e.latLng) return;
      if (infoWindow.isOpen) {
        infoWindow.close();
        dismissDropBubble();
        return;
      }
      if (!$("listPanel").hidden) { $("listToggle").click(); return; }

      const at = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      clearTimeout(pendingDrop);
      pendingDrop = setTimeout(() => {
        pendingDrop = null;
        openDropBubble(at);
      }, DOUBLE_TAP_MS);
    });

    // The pop-up's own × — if it was the "Add a space here?" bubble, the
    // temporary pin goes with it.
    infoWindow.addListener("closeclick", dismissDropBubble);

    addBoundaryLayers();
  }

  /* ======================================================================
     City boundary
     ----------------------------------------------------------------------
     One google.maps.Data layer drawn from GeoJSON vendored in Data/, from
     Analyze Boston (data.boston.gov) and already in WGS84, so it lines up
     with the pins without any reprojection. (A neighbourhood-boundaries
     layer existed until 2026-08-26 and was removed at the owner's request.)

     `clickable: false` is essential, not cosmetic: a clickable Data layer
     swallows the map click, and the map click is how the pin-drop path
     starts. Make this clickable and "click the map to add a space" silently
     stops working anywhere inside the city.

     This is display only. Nothing here is sent to the backend and no Maps
     SKU is billed for drawing it.
     ====================================================================== */

  const CITY_BOUNDARY_FILE = "Data/boston_city_boundary.geojson";

  let cityLayer = null;

  function addBoundaryLayers() {
    // One line around the city. The source polygon had 113 interior rings
    // where water was cut out of the municipal area, which drew an outline
    // around every pond and stretch of river; those rings are stripped out
    // of the vendored file, so this is the coastline and the islands only.
    cityLayer = new google.maps.Data({ map: map });
    cityLayer.setStyle({
      fillOpacity: 0,           // outline only — never tint the whole city
      strokeColor: "#091F2F",   // Charles Blue (navy) — owner's pick, 2026-08-27
      strokeOpacity: 0.75,      // navy needs a touch more opacity than the old blue
      strokeWeight: 4,
      clickable: false,
      zIndex: 2,
    });
    loadGeoJsonInto(cityLayer, CITY_BOUNDARY_FILE, "city boundary");
  }

  // loadGeoJson's own failures are silent, so fetch it ourselves and say so in
  // the console when a file is missing. The map stays usable either way — the
  // boundaries are context, not function.
  function loadGeoJsonInto(layer, url, label) {
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((geo) => {
        layer.addGeoJson(geo);
        // Keep the city outline's rings as plain Polygons so the geometry
        // library can answer "is this pin inside Boston?" without a request.
        if (layer !== cityLayer) return;
        cityPolygons = [];
        layer.forEach((feature) => {
          const g = feature.getGeometry();
          if (!g) return;
          const rings = g.getType() === "MultiPolygon"
            ? g.getArray().map((p) => p.getAt(0))
            : (g.getType() === "Polygon" ? [g.getAt(0)] : []);
          rings.forEach((ring) => {
            if (ring) cityPolygons.push(new google.maps.Polygon({ paths: ring.getArray() }));
          });
        });
      })
      .catch((err) => {
        console.warn("Could not load " + label + " from " + url + ": " + err.message);
      });
  }

  // The draft pin (while adding a space) is still a stock PinElement — it is
  // one temporary marker with a single colour, so the SVG machinery below
  // would be overkill for it.
  function pinElementFor(hex, isDraft) {
    return new PinElement({
      background: hex,
      borderColor: "#FFFFFF",
      glyphColor: "#FFFFFF",
      scale: isDraft ? 1.2 : 1,
    });
  }

  /* ======================================================================
     Purpose pins — a small inline SVG per marker
     ----------------------------------------------------------------------
     PinElement can only paint one background colour, and a space can have
     several purposes at once, so the real pins are drawn by hand:

       one purpose      -> a solid pin in that purpose's colour
       several purposes -> the pin body split into a vertical stripe per
                           purpose, in PURPOSE_GROUPS order
       no purpose       -> a smaller, hollow, grey-outlined pin (form, not
                           hue, is what distinguishes "we don't know")

     AdvancedMarkerElement anchors custom content at its bottom centre by
     default, which is exactly where the pin's tip is.
     ====================================================================== */

  const SVG_NS = "http://www.w3.org/2000/svg";
  // A classic teardrop: round head, pointed tip at (13, 33).
  const PIN_PATH = "M13 0C5.82 0 0 5.82 0 13c0 8.4 13 20 13 20s13-11.6 13-20C26 5.82 20.18 0 13 0z";
  let pinIdSeq = 0;   // clipPath ids live in the page's global id space

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
    return el;
  }

  function pinSvgFor(groups) {
    const hollow = groups.length === 1 && groups[0].hollow;
    // The 1.5px padding in the viewBox keeps the outline stroke from being
    // clipped at the edges. Every pin is the same size (owner's request,
    // 2026-08-27) — the hollow FORM, not a smaller footprint, is what marks
    // a space with no recorded purpose.
    const svg = svgEl("svg", {
      viewBox: "-1.5 -1.5 29 36",
      width: 27,
      height: 33,
      "aria-hidden": "true",
    });

    if (hollow) {
      svg.appendChild(svgEl("path", {
        d: PIN_PATH, fill: "#FFFFFF",
        stroke: groups[0].hex, "stroke-width": 2,
      }));
      svg.appendChild(svgEl("circle", { cx: 13, cy: 13, r: 4, fill: groups[0].hex }));
      return svg;
    }

    // One vertical stripe per purpose, clipped to the pin shape.
    const clipId = "bcam-pin-clip-" + (++pinIdSeq);
    const clip = svgEl("clipPath", { id: clipId });
    clip.appendChild(svgEl("path", { d: PIN_PATH }));
    svg.appendChild(clip);

    const w = 26 / groups.length;
    groups.forEach((g, i) => {
      svg.appendChild(svgEl("rect", {
        x: i * w, y: 0, width: w + 0.5, height: 34,   // +0.5 hides hairline seams
        fill: g.hex, "clip-path": "url(#" + clipId + ")",
      }));
    });

    // White outline and centre dot, matching PinElement's look.
    svg.appendChild(svgEl("path", {
      d: PIN_PATH, fill: "none", stroke: "#FFFFFF", "stroke-width": 1.5,
    }));
    svg.appendChild(svgEl("circle", { cx: 13, cy: 13, r: 4.5, fill: "#FFFFFF" }));
    return svg;
  }

  /* The closed-space pin: a navy rounded square with a short pointer down to
     the same tip point (13, 33) as the teardrop, so it anchors on the exact
     spot, and a white X. Same footprint as every other pin. */
  const CLOSED_PATH = "M4 0h18a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4h-5l-4 7-4-7H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z";
  function closedPinSvg() {
    const svg = svgEl("svg", {
      viewBox: "-1.5 -1.5 29 36",
      width: 27,
      height: 33,
      "aria-hidden": "true",
    });
    svg.appendChild(svgEl("path", {
      d: CLOSED_PATH, fill: CLOSED_PIN.hex, stroke: "#FFFFFF", "stroke-width": 1.5,
    }));
    svg.appendChild(svgEl("path", {
      d: "M8 8l10 10M18 8L8 18", stroke: "#FFFFFF", "stroke-width": 2.6,
      "stroke-linecap": "round", fill: "none",
    }));
    return svg;
  }

  function renderAll() {
    // Rebuild markers from scratch — the dataset is small enough that this is
    // simpler and less bug-prone than diffing.
    //
    // Every pin is always drawn, at every zoom, in its own colours — the
    // owner wants the whole-city mix visible when zoomed out. (Clustering was
    // tried on 2026-09-28 and removed the same day: numbered bubbles hid the
    // colour coding.) Overlapping pins are handled on CLICK instead — see
    // "Several spaces here" below.
    Object.keys(markers).forEach((id) => { markers[id].map = null; });
    markers = {};

    assets.forEach((a) => {
      if (!isShown(a)) return;
      const marker = new AdvancedMarkerElement({
        map: map,
        position: { lat: a.lat, lng: a.long },
        content: isClosed(a) ? closedPinSvg() : pinSvgFor(purposeGroupsFor(a)),
        title: nameOf(a) + (isClosed(a) ? " (closed)" : ""),
        gmpClickable: true,
      });
      // Advanced markers use "gmp-click", not the plain "click" event.
      marker.addEventListener("gmp-click", () => onPinClick(a));
      markers[a.space_id] = marker;
    });

    $("countPill").textContent = assets.length + (assets.length === 1 ? " space" : " spaces") + " on record";
    renderList();
  }

  /* ======================================================================
     "Several spaces here" — picking one pin out of an overlapping stack
     ----------------------------------------------------------------------
     Owner's choice, 2026-09-28. When the clicked pin has other visible pins
     within STACK_RADIUS_PX of it ON SCREEN, the pop-up first shows a short
     list of every space at that spot (the clicked one first, then nearest
     outward) instead of guessing which one was meant. Picking one opens its
     normal pop-up, with a "‹ Back" link to the list.

     Works at any zoom, and it is the only thing that separates spaces at
     the exact same coordinates (several galleries in one building). A pin
     with nothing near it opens its pop-up straight away, as before.

     Distances are measured in screen pixels from Google's map projection, so
     the same rule follows the zoom: zoomed out, a dense block lists many
     spaces; zoomed in, only genuinely overlapping pins do. */
  const STACK_RADIUS_PX = 20;   // pins are 27 px wide — closer than this, they overlap
  let currentStack = null;      // { ids: [...] } while a stack list is in play

  function stackAround(a) {
    const proj = map.getProjection();
    if (!proj) return [a];
    const scale = Math.pow(2, map.getZoom());
    const p0 = proj.fromLatLngToPoint(new google.maps.LatLng(a.lat, a.long));
    return assets
      .filter((b) => isShown(b))
      .map((b) => {
        const p = proj.fromLatLngToPoint(new google.maps.LatLng(b.lat, b.long));
        return { b: b, d: Math.hypot((p.x - p0.x) * scale, (p.y - p0.y) * scale) };
      })
      .filter((x) => x.d <= STACK_RADIUS_PX)
      // The clicked space first, then the rest nearest-first, then by name.
      .sort((x, y) => (x.b === a ? -1 : y.b === a ? 1 : 0) || (x.d - y.d) ||
        nameOf(x.b).localeCompare(nameOf(y.b)))
      .map((x) => x.b);
  }

  function onPinClick(a) {
    dismissDropBubble();   // a real pin replaces any "Add a space here?" bubble
    const stack = stackAround(a);
    if (stack.length < 2) {
      currentStack = null;
      openInfoWindow(a.space_id);
      return;
    }
    currentStack = { anchorId: a.space_id, ids: stack.map((s) => s.space_id) };
    openStackList();
  }

  /* ----------------------------------------------------------------------
     Where a pin's pop-up is shown (owner's request, 2026-09-28)
     ----------------------------------------------------------------------
     On a computer: Google's usual bubble, pointing at the pin.
     On a phone (760px wide or less): a FULL-SCREEN panel instead. The map is
     only the top half of a phone screen, so Google's bubble was squeezed
     into a small box that had to be scrolled to read. The panel shows the
     exact same content, with a × and a "Back to map" button to close it.
     The panel is created here in JS, so index.html and embed.html need no
     extra markup. (The small "Add a space here?" bubble stays a bubble.) */
  function isPhoneLayout() {
    return window.matchMedia("(max-width:760px)").matches;
  }

  function pinSheet() {
    let sheet = $("pinSheet");
    if (sheet) return sheet;
    sheet = document.createElement("div");
    sheet.id = "pinSheet";
    sheet.className = "pin-sheet";
    sheet.hidden = true;
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "Space details");
    sheet.innerHTML =
      '<div class="pin-sheet-head">' +
        '<button type="button" class="pin-sheet-back">‹ Back to map</button>' +
        '<button type="button" class="pin-sheet-close" aria-label="Close">×</button>' +
      "</div>" +
      '<div class="pin-sheet-body"></div>';
    sheet.querySelector(".pin-sheet-back").addEventListener("click", closePinSheet);
    sheet.querySelector(".pin-sheet-close").addEventListener("click", closePinSheet);
    document.body.appendChild(sheet);
    return sheet;
  }

  function closePinSheet() {
    const sheet = $("pinSheet");
    if (sheet) sheet.hidden = true;
  }

  // Show a pop-up's content: full-screen panel on a phone, bubble otherwise.
  function showPopup(div, anchorId, pos) {
    if (isPhoneLayout()) {
      infoWindow.close();
      const sheet = pinSheet();
      const body = sheet.querySelector(".pin-sheet-body");
      body.innerHTML = "";
      body.appendChild(div);
      body.scrollTop = 0;
      sheet.hidden = false;
      return;
    }
    closePinSheet();
    infoWindow.setContent(div);
    const marker = markers[anchorId];
    if (marker) {
      infoWindow.open({ map: map, anchor: marker });
    } else {
      infoWindow.setPosition(pos);
      infoWindow.open({ map: map });
    }
  }

  function openStackList() {
    const ids = currentStack.ids;
    const div = document.createElement("div");
    div.className = "pp pp-stack";
    div.innerHTML =
      '<div class="pp-name">' + ids.length + " spaces here</div>" +
      '<div class="pp-stack-hint">These pins overlap at this zoom. Pick one to see its details.</div>';
    const list = document.createElement("div");
    list.className = "pp-stack-list";
    ids.forEach((id) => {
      const s = assets.find((x) => x.space_id === id);
      if (!s) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pp-stack-item";
      btn.innerHTML = swatchFor(s) +
        '<span><span class="name">' + esc(nameOf(s)) + "</span>" +
        '<span class="meta">' + esc(isClosed(s) ? "Closed" : typeLabel(s)) + "</span></span>";
      btn.addEventListener("click", () => openInfoWindow(id));
      list.appendChild(btn);
    });
    div.appendChild(list);

    const s = assets.find((x) => x.space_id === currentStack.anchorId);
    showPopup(div, currentStack.anchorId, s ? { lat: s.lat, lng: s.long } : null);
  }

  // The scrollable list that drops down from the count pill. Follows the same
  // legend filters as the pins, in alphabetical order by name (owner's
  // request, 2026-08-27 — it was newest-first before).
  function renderList() {
    const el = $("assetList");
    el.innerHTML = "";

    const items = assets
      .filter(isShown)
      .sort((x, y) => nameOf(x).localeCompare(nameOf(y), undefined, { sensitivity: "base" }));

    if (!items.length) {
      el.innerHTML = '<div class="empty-msg">Nothing here for the categories currently shown on the legend. Turn one back on, or use “+ Add a space”.</div>';
      return;
    }

    items.forEach((a) => {
      const btn = document.createElement("button");
      btn.className = "asset-item";
      btn.setAttribute("role", "listitem");
      btn.innerHTML =
        swatchFor(a) +
        '<span><span class="name">' + esc(nameOf(a)) +
        (a.confirmations > 0 ? '<span class="stamp">✓ ' + esc(a.confirmations) + "</span>" : "") +
        '</span><span class="meta">' + esc(typeLabel(a)) + "</span></span>";
      btn.addEventListener("click", () => {
        dismissDropBubble();
        map.panTo({ lat: a.lat, lng: a.long });
        if (map.getZoom() < 15) map.setZoom(15);
        currentStack = null;   // came from the list, not from a stack
        openInfoWindow(a.space_id);
      });
      el.appendChild(btn);
    });
  }

  /* One chip per purpose, plus "Closed". (The city-outline chip was removed
     at the owner's request on 2026-08-27 — the boundary is now always drawn.)

     What each category MEANS lives behind the (i) button beside "Legend"
     (owner's request, 2026-09-28 — it replaced per-chip hover tooltips,
     which touch screens could never reach). The panel lists every category
     with its swatch and the survey's own wording, so the map and the form
     define them the same way. The chips themselves just filter. */
  function buildLegend() {
    const wrap = $("filters");
    const groups = PURPOSE_GROUPS.concat([CLOSED_PIN]);

    const info = $("legendInfo");
    info.innerHTML = groups.map((g) =>
      '<div class="legend-info-row">' + dotHtml(g) +
        "<div><b>" + esc(g.label) + "</b> &mdash; " + esc(stripLead(purposeDescription(g))) + "</div>" +
      "</div>").join("");
    $("legendInfoBtn").addEventListener("click", function () {
      info.hidden = !info.hidden;
      this.setAttribute("aria-expanded", String(!info.hidden));
      this.classList.toggle("on", !info.hidden);
    });

    groups.forEach((g) => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.innerHTML = dotHtml(g) + esc(g.label);
      chip.setAttribute("aria-pressed", "true");
      chip.title = "Show or hide these pins";

      chip.addEventListener("click", () => {
        activeGroups[g.id] = !activeGroups[g.id];
        chip.classList.toggle("off", !activeGroups[g.id]);
        chip.setAttribute("aria-pressed", String(activeGroups[g.id]));
        renderAll();
      });
      wrap.appendChild(chip);
    });
  }

  /* Everything known about a space, as a two-column table.

     Every field is always listed, even when nobody has answered it — a blank
     row is a visible prompt to correct it, whereas a missing row just looks
     like the map has nothing to say. This matters here: the imported base
     layer left `primary_use` empty on 463 of 527 spaces and
     `location_in_building` empty on all of them, so hiding empties made whole
     questions disappear from almost every pin.

     "Year closed" is the one exception — it is only meaningful once a space is
     actually closed, so it appears only when the closure answer implies one. */
  function detailRows(a) {
    const unknown = '<span class="pp-unknown">Currently unknown</span>';
    const cell = (v) => (v ? esc(v) : unknown);

    /* An "Unsure"/"Not sure" answer means nobody actually knows, so the
       pop-up shows it as "Currently unknown", exactly like an unanswered
       question (owner's request, 2026-08-27). */
    const known = (v) => {
      const s = String(v == null ? "" : v).trim();
      return (s === "Unsure" || s === "Not sure") ? "" : s;
    };

    /* The purpose and the key uses are both multi-valued, stored joined by
       "; ". They are listed out in full rather than summarised — "Multiple"
       tells a reader nothing they can check or correct. */
    // Purposes are shown by their legend label, so a stored "Produce" reads
    // "Create" here just as it does on the legend chip.
    // "Something else" shows the typed description too (space_purpose_other).
    const purposeOther = String(a.space_purpose_other || "").trim();
    const purposeWords = (v) => String(v || "").split(/[;,]/)
      .map((s) => s.trim()).filter(Boolean)
      .map((s) => {
        if (s === PURPOSE_OTHER && purposeOther) return PURPOSE_OTHER + ": " + purposeOther;
        const g = PURPOSE_GROUPS.filter((p) => p.value && p.value === s)[0];
        return g ? g.label : s;
      }).join(", ");

    const rows = [
      // Neighborhood is deliberately NOT shown (owner's request, 2026-09-28)
      // — it stays in the sheet and the export only.
      ["Address", cell(addressOf(a))],
      ["Location in building", cell(known(a.location_in_building))],
      ["Purpose", cell(purposeWords(a.space_purpose))],
      ["Key uses", cell(typeLabel(a) === "Unspecified" ? "" : typeLabel(a))],
      // Older rows store Primary/Secondary; people read it as how often.
      ["Frequency of use", cell(known(a.use_type) && (USE_TYPE_WORDS[a.use_type] || a.use_type))],
      // Shown in the form's own wording ("Imminent (about to close)").
      ["Closed?", cell(known(a.status) && optionLabel(CONFIG.CLOSURE_STATUS, a.status))],
    ];

    const closed = CONFIG.CLOSURE_NEEDS_YEAR.indexOf(a.status) > -1;
    if (closed || a.year_closed) rows.push(["Year closed", cell(a.year_closed)]);
    if (a.relocated_to) rows.push(["Relocated to", cell(a.relocated_to)]);

    return '<table class="pp-details"><tbody>' +
      rows.map((r) =>
        "<tr><th scope=\"row\">" + esc(r[0]) + "</th><td>" + r[1] + "</td></tr>").join("") +
      "</tbody></table>";
  }

  function openInfoWindow(spaceId) {
    const a = assets.find((x) => x.space_id === spaceId);
    if (!a) return;

    const count = Number(a.confirmations) || 0;
    const removals = Number(a.removal_requests) || 0;
    const confirmed = hasDone("confirmed", a.space_id);
    const removalAsked = hasDone("removal", a.space_id);
    const div = document.createElement("div");
    div.className = "pp";
    /* The closure state, shown above the name — but ONLY when somebody has
       actually said whether the space is open. Blank and "Unsure" are the
       absence of an answer, not an answer, so they get no label at all. */
    const closure = CLOSURE_LABELS[String(a.status || "").trim()];
    const statusLine = closure
      ? '<div class="pp-cat" style="color:' + closure.hex + '">' + esc(closure.label) + "</div>"
      : "";

    /* Notes are deliberately NOT shown in the pop-up (owner's request,
       2026-08-27) — they stay in the sheet and the export. */
    div.innerHTML =
      statusLine +
      '<div class="pp-name">' + esc(nameOf(a)) + "</div>" +
      detailRows(a) +
      '<div class="pp-meta">' +
        // Where the entry came from, and when. Never the submitter's name -
        // contact details stay out of the public map.
        (a.source ? esc(a.source) : "") +
        (a.source && a.date_added ? " · " : "") +
        (a.date_added ? esc(fmtDate(a.date_added)) : "") +
        (Number(a.submissions) > 1
          ? "<br>Showing the most recent of " + esc(a.submissions) + " submissions."
          : "") +
      "</div>" +
      '<div class="pp-valid"><span class="vcount">✓ ' + count + "</span> " +
        "other " + (count === 1 ? "person has" : "people have") + " confirmed this entry" +
        // Public count of "doesn't belong" requests — shown only when there
        // are any. The reasons stay private in the sheet.
        (removals > 0
          ? '<div class="pp-removals"><span class="rcount">✗ ' + removals + "</span> " +
            (removals === 1 ? "person doesn't" : "people don't") + " think this belongs on the map</div>"
          : "") +
      "</div>" +
      '<div class="pp-actions">' +
        (confirmed
          ? '<button class="pp-confirm" type="button" disabled>✓ You confirmed this</button>'
          : '<button class="pp-confirm" type="button">✓ Confirm it\'s correct</button>') +
        // Pencil icon (inline SVG, so it looks the same on every phone —
        // the ✎ character turns into a coloured emoji on some).
        '<button class="pp-note-btn" type="button">' +
          '<svg class="pp-pencil" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">' +
            '<path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>' +
          "</svg> Suggest a correction</button>" +
      "</div>" +
      // "Doesn't belong" — a quiet link-style button, then a short reason
      // box that opens in place. One per browser per space.
      (removalAsked
        ? '<div class="pp-removal-done">You told us you don\'t think this space belongs on the map. Thank you — we\'ll review it.</div>'
        : '<button class="pp-removal-btn" type="button">I don\'t think this space belongs on the map</button>' +
          '<div class="pp-removal-form" hidden>' +
            '<label for="ppRemovalReason">Why not? <span class="opt">(optional)</span></label>' +
            '<textarea id="ppRemovalReason" maxlength="300" rows="3" placeholder="e.g., It closed more than 15 years ago, or it isn\'t a cultural space"></textarea>' +
            '<div class="pp-removal-actions">' +
              '<button class="pp-removal-cancel" type="button">Cancel</button>' +
              '<button class="pp-removal-send" type="button">Send</button>' +
            "</div>" +
          "</div>");

    if (!confirmed) {
      div.querySelector(".pp-confirm").addEventListener("click", function () {
        confirmAsset(a.space_id, this);
      });
    }
    div.querySelector(".pp-note-btn").addEventListener("click", () => {
      openCorrectionForm(a.space_id);
    });
    if (!removalAsked) {
      const openBtn = div.querySelector(".pp-removal-btn");
      const form = div.querySelector(".pp-removal-form");
      openBtn.addEventListener("click", () => {
        openBtn.hidden = true;
        form.hidden = false;
        form.querySelector("textarea").focus();
      });
      form.querySelector(".pp-removal-cancel").addEventListener("click", () => {
        form.hidden = true;
        openBtn.hidden = false;
      });
      form.querySelector(".pp-removal-send").addEventListener("click", function () {
        requestRemoval(a.space_id, form.querySelector("textarea").value, this);
      });
    }

    /* The deep-dive pointer, aimed at people who actually run the space.
       The prefilled link carries this space's id, so responses join to it
       automatically. (Removed 2026-08-27, back by owner request the same
       day — with copy that targets operators rather than everyone.) */
    if (surveyConfigured()) {
      const deep = document.createElement("div");
      deep.className = "pp-deep";
      deep.innerHTML =
        "<b>Do you know a lot about this space?</b> " +
        "If you are an owner, operator, staff or volunteer member, please " +
        "answer our deep-dive questions.";
      const link = document.createElement("a");
      link.className = "pp-survey";
      link.href = surveyUrlFor(a);
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Cultural space deep-dive";
      deep.appendChild(link);
      div.appendChild(deep);
    }
    // Opened from a "several spaces here" list: a way back to it at the top.
    if (currentStack && currentStack.ids.indexOf(a.space_id) > -1) {
      const back = document.createElement("button");
      back.type = "button";
      back.className = "pp-back";
      back.textContent = "‹ All " + currentStack.ids.length + " spaces here";
      back.addEventListener("click", openStackList);
      div.insertBefore(back, div.firstChild);
    }

    showPopup(div, a.space_id, { lat: a.lat, lng: a.long });
  }

  /* ======================================================================
     Loading assets
     ====================================================================== */

  async function loadAssets(quiet) {
    $("countPill").textContent = "Loading…";
    // The centred note on the map (owner's request, 2026-09-28) — the pill
    // alone was too easy to miss. Always cleared in `finally`.
    $("mapLoading").hidden = false;
    try {
      if (demoMode) {
        assets = DEMO_ASSETS.slice();
      } else {
        /* One automatic retry. On 2026-09-28 the live backend answered the
           same getSpaces request in 74 s, then 12 s, then with a 404 after
           29 s — Apps Script is occasionally flaky, and a single failure
           should not leave a visitor staring at "Load failed". */
        let data;
        try {
          data = await apiGet("getSpaces");
        } catch (firstErr) {
          console.warn("getSpaces failed once, retrying:", firstErr);
          data = await apiGet("getSpaces");
        }
        // Guard against a half-written row breaking the whole map.
        assets = (data.spaces || []).filter(
          (a) => a && a.space_id && typeof a.lat === "number" && typeof a.long === "number"
        );
        // Closure answers typed into the sheet by hand can drift from the
        // stored values (see LABEL_ALIASES) — normalise once here so every
        // closure check downstream sees one spelling.
        assets.forEach((a) => { a.status = canonicalLabel(a.status); });
      }
      renderAll();
      if (!quiet) toast("Up to date.");
    } catch (err) {
      console.error("Load failed:", err);
      $("countPill").textContent = "Load failed";
      toast("Couldn't load the spaces. Check your connection and press Refresh.", 5000);
    } finally {
      $("mapLoading").hidden = true;
    }
  }

  /* ======================================================================
     Adding a space — draft pin
     ====================================================================== */

  function setDraftLocation(latLng, label) {
    draftLocation = latLng;

    if (draftMarker) draftMarker.map = null;
    draftMarker = new AdvancedMarkerElement({
      map: map,
      position: latLng,
      content: pinElementFor("#14324A", true),
      gmpDraggable: true,        // still draggable, just no longer advertised
      zIndex: 999,
    });
    // Keep the coordinates in step with wherever the user drags the pin.
    draftMarker.addListener("dragend", () => {
      const p = draftMarker.position;
      const lat = typeof p.lat === "function" ? p.lat() : p.lat;
      const lng = typeof p.lng === "function" ? p.lng() : p.lng;
      draftLocation = { lat: lat, lng: lng };
      draftPlaceId = "";       // moved by hand — no longer the Places location
      flagIfOutsideBoston();
    });

    $("errLocation").hidden = true;
    flagIfOutsideBoston();
    checkForDuplicates();
  }

  /* ======================================================================
     "This space is outside the City of Boston"
     ----------------------------------------------------------------------
     A note, never a block — the map deliberately accepts spaces just over the
     line in Cambridge, Somerville and Brookline. The test runs against the
     same city-boundary polygons already drawn on the map, using the Maps
     geometry library, so it costs nothing and needs no extra request.
     ====================================================================== */

  let geometryLib = null;      // google.maps.geometry, loaded in initMap
  let cityPolygons = [];       // the boundary polygons, for containsLocation

  function insideBoston(latLng) {
    // If the boundary or the geometry library never loaded, say nothing
    // rather than warn wrongly.
    if (!geometryLib || !cityPolygons.length) return true;
    const point = new google.maps.LatLng(latLng.lat, latLng.lng);
    return cityPolygons.some((poly) =>
      geometryLib.poly.containsLocation(point, poly));
  }

  function flagIfOutsideBoston() {
    const note = $("outsideNote");
    if (!note) return;
    note.hidden = !draftLocation || insideBoston(draftLocation);
  }

  /* ======================================================================
     "Is this already on the map?"
     ----------------------------------------------------------------------
     Deliberately a WARNING, never a block. Cultural spaces genuinely stack:
     an arts centre and three artist studios can share one address, and
     Fenway Studios is dozens of spaces at one door. Refusing a submission
     because something is nearby would lose exactly the density this map
     exists to capture. So we surface the likely match, offer the correction
     path, and let the person carry on if they know better.
     ====================================================================== */

  // Metres between two lat/lng points.
  function metresBetween(a, b) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 +
      Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // Loose comparison so "Hibernian Hall" matches "hibernian hall." etc.
  function normalizeName(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  /* How close counts as "probably the same place". 100 feet is about the
     depth of one building, which is the right scale here: cultural spaces
     genuinely stack, so a wide radius would flag half a block as duplicates
     of each other. Stored in metres because that is what the maths uses;
     shown to people in feet. */
  const DUPLICATE_RADIUS_FT = 100;
  const FEET_PER_METRE = 3.28084;
  const DUPLICATE_RADIUS_M = DUPLICATE_RADIUS_FT / FEET_PER_METRE;

  function possibleDuplicates() {
    if (!draftLocation) return [];
    const typed = normalizeName($("fName").value);
    const placeId = draftPlaceId;

    return assets
      .map((a) => {
        const distance = metresBetween(draftLocation, { lat: a.lat, lng: a.long });
        const sameName = typed && normalizeName(a.space_name) === typed;
        const samePlace = placeId && a.google_place_id === placeId;
        return { asset: a, distance: distance, sameName: sameName, samePlace: samePlace };
      })
      // A Places id match is conclusive wherever it is; a name match counts at
      // any distance because the same venue may have been pinned sloppily.
      .filter((c) => c.samePlace || c.sameName || c.distance <= DUPLICATE_RADIUS_M)
      .sort((x, y) => {
        const rank = (c) => (c.samePlace ? 0 : c.sameName ? 1 : 2);
        return rank(x) - rank(y) || x.distance - y.distance;
      })
      .slice(0, 4);
  }

  function checkForDuplicates() {
    const box = $("dupWarn");
    // Never while correcting — the whole point there is that it already exists.
    if (correctingId) { box.hidden = true; return; }

    const hits = possibleDuplicates();
    if (!hits.length) { box.hidden = true; box.innerHTML = ""; return; }

    const strong = hits[0].samePlace || hits[0].sameName;
    box.innerHTML =
      "<b>" + (strong ? "This space may already be on the map" : "There are already spaces here") + "</b>" +
      "<p>" + (strong
        ? "If it is the same space, please correct the existing entry instead of adding a second one — that keeps its confirmations and history."
        : "If one of these is the space you mean, correct it instead. If yours is a different space at the same address, carry on adding it.") +
      "</p>";

    hits.forEach((c) => {
      const row = document.createElement("div");
      row.className = "dup-hit";

      const label = document.createElement("span");
      label.textContent = nameOf(c.asset) +
        (c.samePlace ? " — same place" : c.sameName ? " — same name" : " — " + Math.round(c.distance * FEET_PER_METRE) + " ft away");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dup-use";
      btn.textContent = "Correct this one";
      btn.addEventListener("click", () => openCorrectionForm(c.asset.space_id));

      row.appendChild(label);
      row.appendChild(btn);
      box.appendChild(row);
    });

    box.hidden = false;
  }

  function clearDraft() {
    if (draftMarker) { draftMarker.map = null; draftMarker = null; }
    draftLocation = null;
    draftPlaceId = "";
  }

  /* ======================================================================
     "Add a space here?" — the confirm step on the pin-drop path
     ----------------------------------------------------------------------
     Owner's choice, 2026-09-28, after the form kept opening by accident on
     a phone. Tapping empty map no longer opens the form: it drops the
     temporary navy pin with a small bubble asking "Add a space here?", and
     only the bubble's button opens the form. Cancel, the bubble's ×, a tap
     elsewhere on the map, or opening any other pin removes the temporary
     pin again. The pin stays draggable, so the spot can be adjusted before
     committing. */
  let dropBubbleActive = false;

  function openDropBubble(at) {
    currentStack = null;
    setDraftLocation(at, null);
    draftPlaceId = "";
    dropBubbleActive = true;

    const div = document.createElement("div");
    div.className = "pp pp-drop";
    div.innerHTML =
      '<div class="pp-name">Add a space here?</div>' +
      '<div class="pp-stack-hint">You can drag the pin to adjust the spot first.</div>' +
      '<div class="pp-drop-actions">' +
        '<button class="pp-drop-cancel" type="button">Cancel</button>' +
        '<button class="pp-drop-add" type="button">+ Add a space</button>' +
      "</div>";
    div.querySelector(".pp-drop-cancel").addEventListener("click", () => {
      infoWindow.close();
      dismissDropBubble();
    });
    div.querySelector(".pp-drop-add").addEventListener("click", () => {
      dropBubbleActive = false;       // the pin now belongs to the form
      infoWindow.close();
      openAddForm();
      // Look the address up from the coordinates (wherever the pin was
      // dragged to), since there is no Places result on this path.
      fillAddressFromPin(draftLocation);
    });

    infoWindow.setContent(div);
    infoWindow.open({ map: map, anchor: draftMarker });
  }

  // Removes the temporary pin if the bubble was showing. Safe to call any
  // time — does nothing once the form has taken over the pin.
  function dismissDropBubble() {
    if (!dropBubbleActive) return;
    dropBubbleActive = false;
    clearDraft();
  }

  function openAddForm() {
    clearErrors();
    flagIfOutsideBoston();
    openModal("addModal");
    /* Always open at the FIRST question. The dialog keeps its scroll position
       between opens, so a correction opened after scrolling through the form
       once would appear already scrolled to the bottom — the person sees the
       "About you" section and no sign of what they came to fix. */
    const box = $("addModal").querySelector(".modal");
    if (box) box.scrollTop = 0;
    // Remember what the form looked like on open, so "have you typed
    // anything?" can be answered when the user tries to close it.
    formSnapshot = snapshotForm();
  }

  /* ======================================================================
     Reverse geocoding — an address from a dropped pin
     ----------------------------------------------------------------------
     Only ever runs on the PIN-DROP path. The search path already gets a
     formatted address back from Places, so asking again would be a second
     billed request for something we have.

     COST: this uses the Geocoding API, which is a separate SKU from Maps and
     Places. It is free for the first 10,000 calls a month and only fires when
     somebody drops a pin, so a pilot cannot get near the ceiling — but the
     API has to be enabled in the Google Cloud console first (README step 1.3).
     If it is not enabled, or the call fails, the address is simply left blank
     for the user to type, exactly as it behaved before.
     ====================================================================== */

  let geocoder = null;

  async function fillAddressFromPin(latLng) {
    const field = $("fAddr");
    const hint = $("addrHint");
    if (!field || field.value.trim()) return;    // never overwrite typing

    try {
      if (!geocoder) {
        const geocodingLib = await google.maps.importLibrary("geocoding");
        geocoder = new geocodingLib.Geocoder();
      }
      hint.textContent = "Looking up the address for that spot…";
      const { results } = await geocoder.geocode({
        location: { lat: latLng.lat, lng: latLng.lng },
      });
      if (results && results.length && !field.value.trim()) {
        // Street + zip in the base layer's shape, not Google's full line.
        const parts = addressFromComponents(results[0].address_components);
        setVerifiedAddress(parts.street || trimGoogleAddress(results[0].formatted_address), parts.zip);
        hint.textContent =
          "Filled in automatically from the spot you clicked. If it's wrong, type the right address and pick it from the list — the pin moves to match.";
      } else {
        hint.textContent = "Couldn't find an address for that spot — please type it in.";
      }
    } catch (err) {
      // Most likely the Geocoding API is not enabled on the key. Not fatal:
      // the person can type the address themselves.
      console.warn("Reverse geocoding unavailable:", err && err.message);
      hint.textContent = "Please type the street address for this spot.";
    }
  }

  /* ======================================================================
     Correcting an existing space
     ----------------------------------------------------------------------
     Opens the same form, pre-filled with what the map currently believes, and
     submits as a NEW row carrying refers_to. Nothing is overwritten: the
     server keeps every submission and shows the most recent allowed one, so a
     correction supersedes what came before it. The original row is still
     there - nothing is overwritten - so the full history reaches the ArcGIS
     export even though the map shows only the newest answer.
     ====================================================================== */
  function openCorrectionForm(spaceId) {
    const a = assets.find((x) => x.space_id === spaceId);
    if (!a) return;

    resetAddForm();
    correctingId = spaceId;

    $("fName").value = a.space_name || "";
    /* Street address only — the neighborhood is computed from the pin now,
       so it is never shown here or split back out (the old "street,
       neighborhood" box filed "5th floor" as a neighborhood). The recorded
       address counts as the baseline: only a CHANGED address is looked up. */
    $("fAddr").value = String(a.address_1 || "").trim();
    verifiedAddress = $("fAddr").value;
    draftZip = String(a.zip_code || "").trim();
    addressCheck = "";
    // canonicalLabel() maps answers stored under the old wording onto the
    // current options, so a reworded question does not show up blank here.
    $("fLocIn").value = canonicalLabel(a.location_in_building);
    $("fPrimary").value = canonicalLabel(a.use_type);
    $("fClosed").value = a.status || "";
    // "How are you connected?" is about the person correcting, so it starts
    // blank — and the original submitter's answer is private anyway (it is
    // no longer in the public feed, 2026-09-28).

    // Tick every type and purpose currently recorded for the space.
    const currentTypes = typesOf(a).map(canonicalLabel);
    document.querySelectorAll(".type-check").forEach((b) => {
      b.checked = currentTypes.indexOf(b.value) > -1;
    });
    $("otherWrap").hidden = currentTypes.indexOf(OTHER_LABEL) === -1;

    const currentPurpose = String(a.space_purpose || "")
      .split(/[;,]/).map((s) => canonicalLabel(s));
    document.querySelectorAll(".purpose-check").forEach((b) => {
      b.checked = currentPurpose.indexOf(b.value) > -1;
    });
    $("purposeOtherWrap").hidden = currentPurpose.indexOf(PURPOSE_OTHER) === -1;
    // The typed "Other" / "Something else" descriptions come back too.
    $("fTypeOther").value = String(a.space_type_other || "");
    $("fPurposeOther").value = String(a.space_purpose_other || "");

    const needsYear = CONFIG.CLOSURE_NEEDS_YEAR.indexOf(a.status) > -1;
    $("closureYearWrap").hidden = !needsYear;
    $("fClosureYear").value = needsYear ? (a.year_closed || "") : "";

    // Keep the existing location unless the corrector moves the pin.
    setDraftLocation({ lat: a.lat, lng: a.long }, null);
    draftPlaceId = a.google_place_id || "";

    $("addTitle").textContent = "Suggest a correction";
    $("correctingNote").hidden = false;
    $("correctingName").textContent = nameOf(a);
    $("saveAssetBtn").textContent = "Submit correction";
    // The space is already identified, so searching for it again would only
    // let someone replace it with a different place by accident.
    $("searchWrap").hidden = true;
    $("addrHint").textContent =
      "The street address as currently recorded. If it's wrong, type the right one and pick it from the list — the pin moves to match.";

    infoWindow.close();
    closePinSheet();
    openAddForm();
  }

  function resetAddForm() {
    correctingId = null;
    submissionKey = null;
    ["fName", "fTypeOther", "fPurposeOther", "fAddr", "fClosureYear",
     "fSubName", "fSubEmail", "fSubAffil"].forEach((id) => { $(id).value = ""; });
    ["fLocIn", "fPrimary", "fClosed", "fConnection"].forEach((id) => { $(id).selectedIndex = 0; });
    document.querySelectorAll(".type-check, .purpose-check").forEach((b) => { b.checked = false; });
    $("fContactConsent").checked = false;
    $("fUpdatesConsent").checked = false;
    $("otherWrap").hidden = true;
    $("purposeOtherWrap").hidden = true;
    $("closureYearWrap").hidden = true;
    $("correctingNote").hidden = true;
    $("dupWarn").hidden = true;
    $("dupWarn").innerHTML = "";
    $("outsideNote").hidden = true;
    draftZip = "";
    verifiedAddress = "";
    addressCheck = "";
    addressWarnedFor = null;
    $("addrWarn").hidden = true;
    hideAddrSuggest();
    $("searchWrap").hidden = false;
    $("addrHint").textContent =
      "Filled in automatically from your search or map pin. To change it, start typing and pick the address from the list — the pin moves to match.";
    $("addTitle").textContent = "Add a Cultural Space to the Map";
    $("saveAssetBtn").textContent = "Add to the map";
    const pac = $("pacHost").firstElementChild;
    if (pac && "value" in pac) pac.value = "";
    clearDraft();
    clearErrors();
    formSnapshot = snapshotForm();
  }

  /* ======================================================================
     Places Autocomplete
     ----------------------------------------------------------------------
     Uses PlaceAutocompleteElement, the current recommended widget (the older
     google.maps.places.Autocomplete class is deprecated). The widget manages
     its own autocomplete session tokens internally and passes the token to
     the first fetchFields call, which is what keeps this on the per-session
     billing path rather than per-keystroke.
     ====================================================================== */

  async function initAutocomplete() {
    const placesLib = await google.maps.importLibrary("places");

    const pac = new placesLib.PlaceAutocompleteElement({
      // Bias, not restriction — a venue in Cambridge or Brookline still shows,
      // it just ranks below Boston results.
      locationBias: CONFIG.BOSTON_BOUNDS,
      includedRegionCodes: ["us"],
      // No includedPrimaryTypes filter on purpose: the default set matches
      // establishments by name *and* street addresses, which is what we want.
    });
    pac.id = "pacInput";
    $("pacHost").appendChild(pac);

    pac.addEventListener("gmp-select", async ({ placePrediction }) => {
      try {
        const place = placePrediction.toPlace();
        // addressComponents (added 2026-09-28) is an Essentials-tier field —
        // below the Pro tier displayName already puts this call in, so it
        // adds no cost. It gives the street and zip separately.
        await place.fetchFields({
          fields: ["id", "displayName", "formattedAddress", "location", "addressComponents"],
        });

        const loc = place.location;
        if (!loc) { showError(null, "errLocation", "That result has no location — try another, or click the map."); return; }

        draftPlaceId = place.id || "";
        setDraftLocation({ lat: loc.lat(), lng: loc.lng() }, place.displayName || null);

        // Pre-fill, but never overwrite something the user has already typed.
        if (!$("fName").value.trim() && place.displayName) $("fName").value = place.displayName;
        if (!$("fAddr").value.trim()) {
          // Street + zip in the base layer's shape ("75 W Newton St" / "02118"),
          // not Google's full "…, Boston, MA 02118, USA" line.
          const parts = addressFromComponents(place.addressComponents);
          const street = parts.street || trimGoogleAddress(place.formattedAddress);
          if (street) setVerifiedAddress(street, parts.zip);
        }

        map.panTo({ lat: loc.lat(), lng: loc.lng() });
        if (map.getZoom() < 16) map.setZoom(16);
      } catch (err) {
        console.error("Place details failed:", err);
        showError(null, "errLocation", "Couldn't fetch that place's details. Try again, or click the map to place the pin yourself.");
      }
    });

    initAddressLookup(placesLib);
  }

  /* ======================================================================
     Address lookup on the address box (owner's choice, 2026-09-28)
     ----------------------------------------------------------------------
     Like a UK checkout: as you type, real street addresses are suggested
     under the box; picking one fills the street + zip AND MOVES THE PIN to
     that address — for new spaces and corrections alike. The server shows a
     space at its most recent submission's coordinates, so a correction that
     picks a new address really moves the pin; every such move is listed in
     the owner's REVIEW report.

     Built on AutocompleteSuggestion (the programmatic side of Places
     Autocomplete) rather than a second PlaceAutocompleteElement, because the
     box must be pre-fillable with the recorded address when correcting, and
     the widget cannot be. That means the session token is managed HERE (the
     widget does it for itself): one token per typing session, handed to the
     final fetchFields, then replaced. Only address-type results are asked
     for (street_address / premise / subpremise).

     COST: suggestions in a session that ends with a pick are free; the pick
     is one Place Details Essentials call (10k free/month). Abandoned typing
     is billed per request against the Autocomplete free tier (10k/month) —
     the 4-character minimum and 250 ms pause keep that low.

     Free typing is never blocked (nothing on this form is mandatory); it is
     looked up once on submit instead — see checkTypedAddress. */
  let addrLookup = null;   // { lib, token, seq, items, active }

  function initAddressLookup(placesLib) {
    if (!placesLib || !placesLib.AutocompleteSuggestion) return;   // older API: plain box
    addrLookup = { lib: placesLib, token: null, seq: 0, items: [], active: -1 };
    const input = $("fAddr");
    let timer = null;

    input.addEventListener("input", () => {
      $("addrWarn").hidden = true;
      clearTimeout(timer);
      const text = input.value.trim();
      if (text.length < 4 || text === verifiedAddress) { hideAddrSuggest(); return; }
      timer = setTimeout(() => fetchAddrSuggestions(text), 250);
    });

    input.addEventListener("keydown", (e) => {
      const box = $("addrSuggest");
      if (box.hidden || !addrLookup.items.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const n = addrLookup.items.length;
        addrLookup.active = (addrLookup.active + (e.key === "ArrowDown" ? 1 : n - 1)) % n;
        highlightAddrSuggest();
      } else if (e.key === "Enter" && addrLookup.active > -1) {
        e.preventDefault();
        pickAddrSuggestion(addrLookup.items[addrLookup.active]);
      } else if (e.key === "Escape") {
        e.stopPropagation();   // close the list, not the whole form
        hideAddrSuggest();
      }
    });

    // Let a click on a suggestion land before the list disappears.
    input.addEventListener("blur", () => setTimeout(hideAddrSuggest, 180));
  }

  async function fetchAddrSuggestions(text) {
    const lib = addrLookup.lib;
    const mySeq = ++addrLookup.seq;      // ignore answers to older keystrokes
    if (!addrLookup.token) addrLookup.token = new lib.AutocompleteSessionToken();
    try {
      const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: text,
        sessionToken: addrLookup.token,
        locationBias: CONFIG.BOSTON_BOUNDS,
        includedRegionCodes: ["us"],
        includedPrimaryTypes: ["street_address", "premise", "subpremise"],
      });
      if (mySeq !== addrLookup.seq) return;
      addrLookup.items = (suggestions || [])
        .map((s) => s.placePrediction).filter(Boolean).slice(0, 5);
      addrLookup.active = -1;
      renderAddrSuggest();
    } catch (err) {
      // Places unavailable: the box simply behaves like a plain text box.
      console.warn("Address suggestions unavailable:", err && err.message);
      hideAddrSuggest();
    }
  }

  function renderAddrSuggest() {
    const box = $("addrSuggest");
    box.innerHTML = "";
    if (!addrLookup.items.length) { hideAddrSuggest(); return; }
    addrLookup.items.forEach((p, i) => {
      const opt = document.createElement("div");
      opt.className = "addr-option";
      opt.id = "addrOpt" + i;
      opt.setAttribute("role", "option");
      const main = p.mainText ? p.mainText.toString() : p.text.toString();
      const sub = p.secondaryText ? p.secondaryText.toString() : "";
      // textContent only — suggestion text comes from outside this site.
      const b = document.createElement("span");
      b.className = "addr-main";
      b.textContent = main;
      const s = document.createElement("span");
      s.className = "addr-sub";
      s.textContent = sub;
      opt.appendChild(b);
      opt.appendChild(s);
      // mousedown, not click, so it fires before the input's blur.
      opt.addEventListener("mousedown", (e) => { e.preventDefault(); pickAddrSuggestion(p); });
      box.appendChild(opt);
    });
    const credit = document.createElement("div");
    credit.className = "addr-credit";
    credit.textContent = "Suggestions powered by Google";
    box.appendChild(credit);
    box.hidden = false;
    $("fAddr").setAttribute("aria-expanded", "true");
  }

  function highlightAddrSuggest() {
    document.querySelectorAll("#addrSuggest .addr-option").forEach((el, i) => {
      el.classList.toggle("active", i === addrLookup.active);
    });
    $("fAddr").setAttribute("aria-activedescendant",
      addrLookup.active > -1 ? "addrOpt" + addrLookup.active : "");
  }

  function hideAddrSuggest() {
    const box = $("addrSuggest");
    if (!box) return;
    box.hidden = true;
    box.innerHTML = "";
    if (addrLookup) { addrLookup.items = []; addrLookup.active = -1; }
    $("fAddr").setAttribute("aria-expanded", "false");
    $("fAddr").removeAttribute("aria-activedescendant");
  }

  async function pickAddrSuggestion(prediction) {
    hideAddrSuggest();
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["addressComponents", "location", "formattedAddress"] });
      addrLookup.token = null;           // that session is spent
      const parts = addressFromComponents(place.addressComponents);
      setVerifiedAddress(parts.street || trimGoogleAddress(place.formattedAddress), parts.zip);
      if (place.location) {
        // Move the pin to the chosen address. setDraftLocation re-runs the
        // outside-Boston note and the duplicate check for the new spot.
        const at = { lat: place.location.lat(), lng: place.location.lng() };
        setDraftLocation(at, null);
        map.panTo(at);
        $("addrHint").textContent = "Address confirmed — the pin has moved to it.";
      }
    } catch (err) {
      console.warn("Address details failed:", err && err.message);
      $("addrHint").textContent = "Couldn't look that address up — you can still type it.";
    }
  }

  /* Run on submit when the address box holds text Google never confirmed
     (typed by hand, not picked). Looks it up once with the Geocoding API:

       - no real street address found  -> "not found"
       - found, but > ADDRESS_FAR_METERS from the pin -> "far from pin"
       - otherwise -> "verified" (and the zip is taken from the match)

     Either problem shows a warning and asks for a SECOND click to submit
     anyway — a warning, never a block, like everything else on this form.
     Whatever happens is sent as address_check, and anything but "verified"
     lands in the owner's REVIEW report. If the Geocoding API is unavailable
     the check is skipped and address_check stays blank. */
  const ADDRESS_FAR_METERS = 300;

  async function checkTypedAddress() {
    const text = $("fAddr").value.trim();
    if (!text) return { ok: true, check: "", zip: "" };
    if (text === verifiedAddress) return { ok: true, check: addressCheck, zip: draftZip };
    if (addressWarnedFor === text) {
      // Second click on the same text: the person has seen the warning.
      return { ok: true, check: $("addrWarn").dataset.check || "not found", zip: "" };
    }

    let check = "verified", zip = "", far = 0;
    try {
      if (!geocoder) {
        const geocodingLib = await google.maps.importLibrary("geocoding");
        geocoder = new geocodingLib.Geocoder();
      }
      const { results } = await geocoder.geocode({
        address: text,
        bounds: CONFIG.BOSTON_BOUNDS,
        componentRestrictions: { country: "US" },
      });
      const r = results && results[0];
      const types = (r && r.types) || [];
      const isStreetLevel = r && !r.partial_match &&
        (types.indexOf("street_address") > -1 || types.indexOf("premise") > -1 ||
         types.indexOf("subpremise") > -1);
      if (!isStreetLevel) {
        check = "not found";
      } else {
        zip = addressFromComponents(r.address_components).zip;
        if (draftLocation) {
          far = metresBetween(
            { lat: draftLocation.lat, lng: draftLocation.lng },
            { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() });
          if (far > ADDRESS_FAR_METERS) check = "far from pin";
        }
      }
    } catch (err) {
      console.warn("Address check unavailable:", err && err.message);
      return { ok: true, check: "", zip: "" };
    }

    if (check === "verified") return { ok: true, check: check, zip: zip };

    addressWarnedFor = text;
    const warn = $("addrWarn");
    warn.dataset.check = check;
    warn.textContent = check === "not found"
      ? "We couldn't find “" + text + "” as a street address. Check it, or pick one from the suggestions as you type. Press the button again to submit it as it is."
      : "That address is about " + Math.round(far * 3.281).toLocaleString() + " feet from the pin. Pick it from the suggestions to move the pin there, or press the button again to keep both as they are.";
    warn.hidden = false;
    warn.scrollIntoView({ block: "center", behavior: "smooth" });
    return { ok: false };
  }

  /* ======================================================================
     Form: space type dropdown, validation, submit
     ====================================================================== */

  // Checkboxes rather than a <select multiple>: multi-select on a phone is
  // near-unusable, and ctrl-clicking is not discoverable on a public tool.
  function buildTypeSelect() {
    const wrap = $("typeList");
    CONFIG.SPACE_TYPES.forEach((t, i) => {
      const id = "ftype" + i;
      const row = document.createElement("label");
      row.className = "check-row";
      row.setAttribute("for", id);

      const box = document.createElement("input");
      box.type = "checkbox";
      box.id = id;
      box.value = t.label;
      box.className = "type-check";

      const text = document.createElement("span");
      text.textContent = t.label;

      row.appendChild(box);
      row.appendChild(text);
      wrap.appendChild(row);

      // "Other" reveals a required free-text field.
      if (t.label === OTHER_LABEL) {
        box.addEventListener("change", () => {
          $("otherWrap").hidden = !box.checked;
          if (!box.checked) $("fTypeOther").value = "";
        });
      }
    });
  }

  function selectedTypes() {
    return Array.prototype.slice
      .call(document.querySelectorAll(".type-check:checked"))
      .map((b) => b.value);
  }

  // The purpose question is the same pattern: checkboxes, several allowed.
  function buildPurposeChecks() {
    const wrap = $("purposeList");
    CONFIG.SPACE_PURPOSE.forEach((p, i) => {
      const id = "fpurpose" + i;
      const row = document.createElement("label");
      row.className = "check-row";
      row.setAttribute("for", id);

      const box = document.createElement("input");
      box.type = "checkbox";
      box.id = id;
      box.value = p.value;          // the stored value ("Produce"), not the label
      box.className = "purpose-check";

      const text = document.createElement("span");
      text.textContent = p.label;

      row.appendChild(box);
      row.appendChild(text);
      wrap.appendChild(row);

      // "Something else" reveals a required free-text field — the answer on
      // its own says nothing, so it is worth asking what the something is.
      if (p.value === PURPOSE_OTHER) {
        box.addEventListener("change", () => {
          $("purposeOtherWrap").hidden = !box.checked;
          if (!box.checked) $("fPurposeOther").value = "";
        });
      }
    });
  }

  function selectedPurposes() {
    return Array.prototype.slice
      .call(document.querySelectorAll(".purpose-check:checked"))
      .map((b) => b.value);
  }

  // Fill a <select> from a list of plain strings, or of {value, label} pairs
  // (the pair form stores the short value while showing the friendly label).
  function buildSelect(id, options, placeholder) {
    const sel = $(id);
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = placeholder;
    sel.appendChild(blank);
    options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = typeof opt === "string" ? opt : opt.value;
      o.textContent = typeof opt === "string" ? opt : opt.label;
      sel.appendChild(o);
    });
  }

  function buildExtraSelects() {
    buildSelect("fLocIn", CONFIG.LOCATION_IN_BUILDING, "Choose one…");
    buildSelect("fPrimary", CONFIG.USE_TYPE, "Choose one…");
    buildSelect("fClosed", CONFIG.CLOSURE_STATUS, "Choose one…");
    buildSelect("fConnection", CONFIG.SUBMITTER_CONNECTION, "Choose one…");

    // Only ask for a closure year when the answer implies one.
    $("fClosed").addEventListener("change", (e) => {
      const needsYear = CONFIG.CLOSURE_NEEDS_YEAR.indexOf(e.target.value) > -1;
      $("closureYearWrap").hidden = !needsYear;
      if (!needsYear) $("fClosureYear").value = "";
    });
  }

  /* No question on this form is mandatory (owner's decision, 2026-08-27), so
     nothing below blocks on a blank answer. Two checks remain, and neither is
     a "required field":
       - a LOCATION, because a pin with no coordinates cannot be drawn at all;
       - the FORMAT of the two free-text answers people can get wrong (a year
         and an email), which is caught only when they actually typed
         something. Leaving either blank is fine. */
  function validateAddForm() {
    clearErrors();
    let firstBad = null;

    const name = $("fName").value.trim();
    const types = selectedTypes();
    const isOther = types.indexOf(OTHER_LABEL) > -1;
    const purposes = selectedPurposes();
    const purposeIsOther = purposes.indexOf(PURPOSE_OTHER) > -1;

    // Only validated when the question is actually being asked.
    const closure = $("fClosed").value;
    const needsYear = CONFIG.CLOSURE_NEEDS_YEAR.indexOf(closure) > -1;
    const year = $("fClosureYear").value.trim();
    if (needsYear && year && !/^(19|20)\d{2}$/.test(year)) {
      showError("fClosureYear", "errClosureYear", "Please give a four-digit year, like 2024.");
      firstBad = firstBad || "fClosureYear";
    }

    // Optional, but if an email is given it should at least look like one.
    const email = $("fSubEmail").value.trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      showError("fSubEmail", "errSubEmail", "That email address doesn't look right — fix it or leave it blank.");
      firstBad = firstBad || "fSubEmail";
    }

    if (!draftLocation) {
      showError(null, "errLocation", "Set a location first — search for the space above, or close this form and click its spot on the map.");
      firstBad = firstBad || "pacHost";
    }

    if (firstBad) {
      const el = $(firstBad);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "center", behavior: "smooth" });
      if (el && el.focus) el.focus({ preventScroll: true });
      return null;
    }

    return {
      space_name: name,
      // Stored joined by "; ", in CONFIG order rather than click order, so
      // the same set of answers always produces the same cell value.
      space_type: types.join(TYPE_SEPARATOR),
      // Own columns since 2026-09-28, so the map shows the actual use.
      space_type_other: isOther ? $("fTypeOther").value.trim() : "",
      space_purpose: purposes.join(TYPE_SEPARATOR),
      space_purpose_other: purposeIsOther ? $("fPurposeOther").value.trim() : "",
      notes: "",
      // Street only. The neighborhood is NOT sent — the server computes it
      // from the pin. zip_code and address_check are added in submitAsset
      // once the typed address has been looked up.
      address_1: $("fAddr").value.trim(),
      address_2: "",              // question removed 2026-08-27; column kept for imported data
      // How the location was chosen — a Places result or a hand-placed pin.
      address_source: draftPlaceId ? "Search" : "Pin drop",
      google_place_id: draftPlaceId,
      lat: draftLocation.lat,
      long: draftLocation.lng,
      submitter_name: $("fSubName").value.trim(),
      submitter_email: email,
      submitter_affiliation: $("fSubAffil").value.trim(),
      submitter_connection: $("fConnection").value,
      contact_consent: $("fContactConsent").checked ? "Yes" : "",
      // Separate consent (added 2026-09-28): project updates and future
      // conversations, as opposed to questions about this one space.
      updates_consent: $("fUpdatesConsent").checked ? "Yes" : "",
      location_in_building: $("fLocIn").value,
      use_type: $("fPrimary").value,
      status: closure,
      year_closed: needsYear ? year : "",
      // Set only when correcting: makes this row a vote on an existing space
      // rather than a new one.
      refers_to: correctingId || "",
    };
  }

  async function submitAsset(btn) {
    const payload = validateAddForm();
    if (!payload) return;

    btn.disabled = true;
    btn.textContent = "Checking the address…";
    const addr = demoMode ? { ok: true, check: "", zip: draftZip } : await checkTypedAddress();
    if (!addr.ok) {
      // Warned about the address — the next click submits it as it is.
      btn.disabled = false;
      btn.textContent = correctingId ? "Submit correction" : "Add to the map";
      return;
    }
    payload.zip_code = addr.zip;
    payload.address_check = addr.check;

    btn.textContent = "Saving…";
    // resetAddForm() clears these, so capture them before it runs.
    const wasCorrection = !!correctingId;
    const correctedId = correctingId;
    try {
      let saved;
      if (demoMode) {
        saved = Object.assign({}, payload, {
          space_id: "demo-" + Date.now().toString(36),
          date_added: new Date().toISOString(),
          review_status: "allow", confirmations: 0, submissions: 1,
        });
        DEMO_ASSETS.push(saved);
        assets = DEMO_ASSETS.slice();
      } else {
        const answers = snapshotForm() + "|" + (correctingId || "") + "|" + payload.lat + "," + payload.long;
        if (!submissionKey || submissionKeyFor !== answers) {
          submissionKey = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
          submissionKeyFor = answers;
        }
        payload.submission_key = submissionKey;
        /* One automatic retry when Google is slow (it answers 404 past
           ~30 s, often AFTER the save has gone through). The submission key
           makes the retry safe: if the first attempt saved, the server hands
           back that same row instead of writing a second one. */
        let data;
        try {
          data = await apiPost("addSpace", payload);
        } catch (firstErr) {
          if (!isSlowServerError(firstErr)) throw firstErr;
          console.warn("addSpace failed once, retrying with the same key:", firstErr);
          btn.textContent = "Still saving…";
          data = await apiPost("addSpace", payload);
        }
        saved = data.space;
        if (wasCorrection) {
          // A correction is a separate row that the server folds back into the
          // space it corrects. Appending it here would draw a second pin on
          // top of the first, so re-read the merged result instead.
          await loadAssets(true);
        } else if (saved.review_status === "allow") {
          assets = assets.concat([saved]);
        }
        // A submission the server flagged for review (bad language, or an
        // exact duplicate) is saved but not public yet — nothing to draw.
      }

      closeModal("addModal");
      resetAddForm();
      renderAll();

      // Anything not "allow" is off the public map — "review" (possible
      // duplicate, queued for the owner) and "hold" (auto-rejected for bad
      // language) both get the same neutral message; the toast never tells a
      // submitter which net caught them.
      const held = !demoMode && saved.review_status !== "allow";
      if (!held) openInfoWindow(wasCorrection ? correctedId : saved.space_id);

      /* The deep-dive prompt. A correction's responses must join to the
         CANONICAL space — the pin people see — not to the correction row's
         own id, so the canonical entry is looked up first and the saved row
         only stands in if the canonical is not visible (e.g. held). */
      let prompted = false;
      if (!demoMode) {
        const promptSpace = wasCorrection
          ? (assets.find((x) => x.space_id === correctedId) ||
             Object.assign({}, saved, { space_id: correctedId }))
          : saved;
        // The modal's header already says "Thank you!", so the sub-heading
        // states the outcome without repeating it (owner's request).
        prompted = openDeepDivePrompt(promptSpace, held
          ? "Your submission has been received and will appear on the map once the City has reviewed it."
          : wasCorrection
            ? "Your correction has been submitted."
            : "Your space has been added to the map!");
      }

      if (!prompted) {
        toast(demoMode
          ? "Saved — but this is demo mode, so nothing was stored."
          : held
            ? "Thank you — your submission has been received and will appear once the City has reviewed it."
            : wasCorrection
              ? "Correction submitted — thank you. The pin now shows your version."
              : "Added to the map — thank you!", 6000);
      }
    } catch (err) {
      console.error(err);
      // A timeout / network error (as opposed to the server rejecting the
      // answers) may have happened AFTER the save. Say so plainly — the
      // retry guard above means pressing the button again is always safe.
      const msg = isSlowServerError(err)
        ? "The server took too long to answer, so your submission may already be saved. " +
          "Please press the button again — it won't create a duplicate."
        : (err.message || "Couldn't save that. Please try again.");
      showError(null, "errLocation", msg);
      toast(msg, 8000);
    } finally {
      btn.disabled = false;
      btn.textContent = wasCorrection ? "Submit correction" : "Add to the map";
    }
  }

  /* ======================================================================
     Validating: confirmations
     ----------------------------------------------------------------------
     A confirmation is a row in the sheet's CONFIRMATIONS tab, and the
     displayed count is the number of those rows. Nothing rewrites the space
     row, so two people confirming at the same moment cannot overwrite each
     other.
     ====================================================================== */

  async function confirmAsset(spaceId, btnEl) {
    const a = assets.find((x) => x.space_id === spaceId);
    if (!a) return;
    btnEl.disabled = true;
    btnEl.textContent = "Saving…";
    try {
      let already = false;
      if (!demoMode) {
        const res = await apiPost("confirmSpace", { space_id: spaceId });
        // The server answers "already" when this browser confirmed before
        // (e.g. from another tab) — nothing new was counted.
        already = !!(res.confirmation && res.confirmation.already);
      }
      if (!already) a.confirmations = (Number(a.confirmations) || 0) + 1;
      markDone("confirmed", spaceId);
      renderList();
      openInfoWindow(spaceId);
      toast(already ? "You've already confirmed this space — thank you." : "Thanks — confirmation recorded.");
    } catch (err) {
      console.error(err);
      btnEl.disabled = false;
      btnEl.textContent = "✓ Confirm it's correct";
      toast(err.message || "Couldn't save the confirmation. Please try again.", 5000);
    }
  }

  /* "I don't think this space belongs on the map." A row in the sheet's
     REMOVAL_REQUESTS tab with the optional reason; the pin is NOT hidden —
     the owner reviews these (they appear in the REVIEW report). */
  async function requestRemoval(spaceId, reason, btnEl) {
    const a = assets.find((x) => x.space_id === spaceId);
    if (!a) return;
    btnEl.disabled = true;
    btnEl.textContent = "Sending…";
    try {
      let already = false;
      if (!demoMode) {
        const res = await apiPost("requestRemoval", { space_id: spaceId, reason: String(reason || "").trim() });
        already = !!(res.request && res.request.already);
      }
      if (!already) a.removal_requests = (Number(a.removal_requests) || 0) + 1;
      markDone("removal", spaceId);
      openInfoWindow(spaceId);
      toast("Thanks — we'll review this space.");
    } catch (err) {
      console.error(err);
      btnEl.disabled = false;
      btnEl.textContent = "Send";
      toast(err.message || "Couldn't send that. Please try again.", 5000);
    }
  }

  /* ======================================================================
     Wiring
     ====================================================================== */

  function wireUi() {
    document.querySelectorAll("[data-close]").forEach((b) => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-close");
        if (!confirmDiscard(id)) return;
        closeModal(id);
        if (id === "addModal") resetAddForm();
      });
    });

    document.querySelectorAll(".modal-backdrop").forEach((bd) => {
      // A click only counts as "outside the box" if the press STARTED on the
      // backdrop too. Selecting text inside the form and letting go of the
      // mouse past its edge fires a click on the backdrop — which used to ask
      // "Are you sure you want to exit?" mid-selection (owner's report,
      // 2026-09-28).
      let downOnBackdrop = false;
      bd.addEventListener("pointerdown", (e) => { downOnBackdrop = (e.target === bd); });
      bd.addEventListener("click", (e) => {
        if (e.target !== bd) return;          // a click INSIDE the box, ignore
        if (!downOnBackdrop) return;          // a drag that began inside, ignore
        downOnBackdrop = false;
        if (!confirmDiscard(bd.id)) return;
        bd.classList.remove("open");
        if (bd.id === "addModal") resetAddForm();
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      closePinSheet();
      document.querySelectorAll(".modal-backdrop.open").forEach((bd) => {
        if (!confirmDiscard(bd.id)) return;
        bd.classList.remove("open");
        if (bd.id === "addModal") resetAddForm();
      });
    });

    $("addBtn").addEventListener("click", () => {
      // The header button starts the SEARCH path from scratch — any
      // "Add a space here?" bubble and its temporary pin are dropped.
      if (dropBubbleActive) { infoWindow.close(); dismissDropBubble(); }
      openAddForm();
      const pac = $("pacHost").firstElementChild;
      if (pac && pac.focus) setTimeout(() => pac.focus(), 50);
    });

    $("refreshBtn").addEventListener("click", () => loadAssets(false));
    $("saveAssetBtn").addEventListener("click", function () { submitAsset(this); });

    // Typing a name that matches an existing pin should raise the same warning
    // as dropping the pin on top of one. Debounced so it does not run per key.
    let nameTimer = null;
    $("fName").addEventListener("input", () => {
      clearTimeout(nameTimer);
      nameTimer = setTimeout(() => {
        checkForDuplicates();
      }, 350);
    });

    /* Google-Maps-style panel collapse: hides the whole sidebar so the map
       fills the window. The tab sits on the sidebar/map seam so it stays
       reachable while the sidebar is hidden.

       Guarded because embed.html — the map-only build meant to sit in an
       iframe on another site — ships no sidebar and no toggle. Everything
       else on this page is shared between the two, so one missing element
       must not take the whole script down with it. */
    const sideToggle = $("sidebarToggle");
    if (sideToggle) {
      sideToggle.addEventListener("click", function () {
        const hidden = document.body.classList.toggle("map-only");
        this.setAttribute("aria-expanded", String(!hidden));
        const label = hidden ? "Show the panel" : "Hide the panel";
        this.title = label;
        this.setAttribute("aria-label", label);
      });
    }

    /* Hide / show the legend so the map can be seen full-screen (owner's
       request, 2026-09-28). The choice is remembered per browser — a
       convenience only, so storage failures are ignored. */
    const LEGEND_KEY = "bcam_legend_hidden";
    function setLegendHidden(hide) {
      $("mapLegend").hidden = hide;
      $("legendShowBtn").hidden = !hide;
      try { localStorage.setItem(LEGEND_KEY, hide ? "1" : "0"); } catch (e) { /* ignore */ }
    }
    $("legendHideBtn").addEventListener("click", () => {
      setLegendHidden(true);
      $("legendShowBtn").focus();
    });
    $("legendShowBtn").addEventListener("click", () => {
      setLegendHidden(false);
      $("legendHideBtn").focus();
    });
    try {
      if (localStorage.getItem(LEGEND_KEY) === "1") setLegendHidden(true);
    } catch (e) { /* ignore */ }

    // The count pill drops the scrollable list of spaces down beneath itself.
    $("listToggle").addEventListener("click", function () {
      const panel = $("listPanel");
      panel.hidden = !panel.hidden;
      this.setAttribute("aria-expanded", String(!panel.hidden));
      this.querySelector(".plus").textContent = panel.hidden ? "+" : "−";
      this.title = panel.hidden ? "Show the list of spaces" : "Hide the list of spaces";
    });

    // The standalone deep-dive links in the sidebar and the intro pop-up.
    // Filled from CONFIG so the survey address lives in one place; they stay
    // hidden until the Form is wired up. These carry no asset_id on purpose —
    // the pre-filled per-pin links do that job.
    if (surveyConfigured()) {
      document.querySelectorAll(".js-survey-link").forEach((a) => {
        a.href = CONFIG.SURVEY_FORM_BASE;
        a.hidden = false;
      });
    }

    initCarousel();
  }

  /* Photo rotations: the intro pop-up's and the sidebar's (added 2026-09-28).
     Each is one <img> whose src cycles through its data-images — so only the
     photo on screen is ever downloaded, instead of all thirteen at once on
     page load. Each starts from whichever photo its HTML src names, so the
     two never show the same picture at once. */
  function initCarousel() {
    document.querySelectorAll(".carousel[data-images]").forEach((box) => {
      const images = (box.getAttribute("data-images") || "").split(",").map((s) => s.trim()).filter(Boolean);
      const img = box.querySelector("img");
      if (!img || images.length < 2) return;

      let i = Math.max(0, images.indexOf(img.getAttribute("src")));
      setInterval(() => {
        i = (i + 1) % images.length;
        img.classList.add("fading");
        setTimeout(() => {
          img.src = images[i];
          img.classList.remove("fading");
        }, 450);   // matches the CSS opacity transition
      }, 4500);
    });
  }

  /* ======================================================================
     Start
     ====================================================================== */

  async function start() {
    checkConfig();
    buildTypeSelect();
    buildPurposeChecks();
    buildExtraSelects();
    buildLegend();
    wireUi();

    if (CONFIG.GOOGLE_MAPS_API_KEY === "YOUR_KEY_HERE") {
      showMapError(
        "<div><b>The map needs an API key</b>Open <code>app.js</code>, put your Google Maps API key into " +
        "<code>CONFIG.GOOGLE_MAPS_API_KEY</code>, then reload. README.md step 1 walks through creating one.</div>"
      );
      $("countPill").textContent = "Map not configured";
      return;
    }

    // Google calls this global when it rejects the key. Without it, an
    // unauthorised key just leaves a silent blank rectangle.
    window.gm_authFailure = function () {
      showMapError(
        "<div><b>Google rejected the API key</b>The key is invalid, or the address you are " +
        "viewing this from is not in its list of allowed websites. Check " +
        "<code>CONFIG.GOOGLE_MAPS_API_KEY</code> and the key's website restrictions in the " +
        "Google Cloud console — README.md step 1.5.</div>"
      );
      $("countPill").textContent = "Map key rejected";
    };

    // Up from the moment the map starts loading, not just while the spaces
    // are fetched — loadAssets() clears it; showMapError() clears it on failure.
    $("mapLoading").hidden = false;
    try {
      await loadGoogleMaps();
      await initMap();
      await initAutocomplete();
    } catch (err) {
      console.error(err);
      showMapError(
        "<div><b>The map couldn't load</b>Usually this means the API key is wrong, is restricted to a " +
        "different website, or the Maps JavaScript API and Places API aren't enabled yet. " +
        "Open the browser console for Google's exact message.</div>"
      );
      $("countPill").textContent = "Map failed to load";
      return;
    }

    await loadAssets(true);
  }

  start();
})();
