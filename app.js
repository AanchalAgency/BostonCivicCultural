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
  SPACE_TYPES: [
    { label: "Artist live/work space" },
    { label: "Arts/cultural center" },
    { label: "Club/nightlife/live music venue" },
    { label: "Commercial gallery" },
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
    { label: "Library" },
    { label: "Makerspace" },
    { label: "Movie theater" },
    { label: "Museum/public gallery" },
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

  // Which floor the space is on. Optional. "Not sure" is a real answer here
  // (owner's request, 2026-08-27); it is STORED as "Unsure" to match how the
  // other unsure answers are stored, and the pop-up shows any unsure answer
  // as "Currently unknown".
  LOCATION_IN_BUILDING: [
    "Whole building",
    "First floor / street level",
    "Basement",
    "Upper floor(s)",
    "Open space / land",
    { value: "Unsure", label: "Not sure" },
  ],

  // The main purpose of the space. Multi-select; stored joined by "; " in
  // space_purpose. The stored VALUES match the MASTER base layer's own terms
  // (Produce / Present / Learn / Gather) while the LABELS carry the owner's
  // fuller wording — so the export stays clean and the question stays clear.
  // These are also what colours the pins — see PURPOSE_GROUPS below.
  SPACE_PURPOSE: [
    { value: "Present", label: "To PRESENT: Sell, share or display art and creative work to an audience (for example, live music venue, gallery, comedy club, museum)" },
    { value: "Produce", label: "To PRODUCE: Make, build, rehearse or produce art and creative work (for example, live-work studio, music rehearsal studio, makerspace, photography studio)" },
    { value: "Learn",   label: "To LEARN: Teach, learn about or train in arts and creative work (for example, youth arts centre, architecture school, music school)" },
    { value: "Gather",  label: "To GATHER: Participate in cultural heritage or arts-related community activities (for example, public space, park, rentable events space)" },
    { value: "Something else", label: "Something else" },
  ],

  // How much of the space's life is arts and culture. The question is asked in
  // plain language, but the SHEET stores Primary / Secondary, which is what the
  // owner's schema and the imported base layer already use.
  USE_TYPE: [
    { value: "Primary",   label: "Most of the time" },
    { value: "Secondary", label: "Some of the time" },
    { value: "Unsure",    label: "Not sure" },
  ],

  // Closure state. "No" leads because it is the common answer, so most people
  // never have to read past the first option. The last answer is SHOWN as
  // "Not sure" but STORED as "Unsure" — the sheet already holds "Unsure" and
  // the backend whitelist expects it, so only the label changed (2026-08-27).
  CLOSURE_STATUS: [
    "No",
    "Yes, permanently",
    "Yes, temporarily",
    "Yes, but relocated",
    "Imminent",
    { value: "Unsure", label: "Not sure" },
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
    "Imminent",
  ],
};

// Several space types are stored in one cell, joined by this. A semicolon
// keeps the ArcGIS export to one column while staying easy to split, and no
// type label contains one.
const TYPE_SEPARATOR = "; ";

/* Two answer labels were reworded on 2026-08-27, and rows recorded under the
   old wording are still in the sheet. Without this map, opening one of those
   spaces in the correction form would show its answer UNTICKED — and a
   corrector who did not notice would silently vote the answer away.
   Old label -> current label. */
const LABEL_ALIASES = {
  "Club/nightlife": "Club/nightlife/live music venue",
  "Ground floor / street level": "First floor / street level",
  // The use_type question changed from storing its own words to storing the
  // schema's Primary/Secondary.
  "Most of the time": "Primary",
  "Some of the time": "Secondary",
  "Not sure": "Unsure",
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
  { id: "produce", value: "Produce", label: "Produce", hex: "#C77E00" },  // amber
  { id: "learn",   value: "Learn",   label: "Learn",   hex: "#009E73" },  // teal green
  { id: "gather",  value: "Gather",  label: "Gather",  hex: "#A64D82" },  // magenta
  { id: "other",   value: "Something else", label: "Something else", hex: "#58585B" },
  { id: "unknown", label: "No purpose recorded", hex: "#8A9199", hollow: true },
];

/* The legend's hover/focus description for each purpose, in the survey's own
   words so the map and the form define these the same way. Sourced from
   CONFIG.SPACE_PURPOSE labels; the "no purpose" entry has no survey wording
   of its own, so it explains the gap instead. */
function purposeDescription(group) {
  if (!group.value) {
    return "Nobody has recorded what this space is used for yet — open it and " +
           "suggest a correction if you know.";
  }
  const opt = CONFIG.SPACE_PURPOSE.filter(function (p) { return p.value === group.value; })[0];
  return opt ? opt.label : group.label;
}

/* The closure label shown above the name in a pin's pop-up. Closure no longer
   colours the pins, but "Closed" is still the most consequential fact about a
   space, so the pop-up keeps its labelled line. Anything unrecognised —
   including blank and "Unsure" — gets no label: absence of an answer is not
   an answer. (Closed uses --freedom-text, not raw Freedom Trail Red, because
   this renders at 14px.) */
const CLOSURE_LABELS = {
  "No":                 { label: "Open",         hex: "#1871bd" },
  "Imminent":           { label: "Closing soon", hex: "#8A6412" },
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

  /* use_type is stored as Primary/Secondary for the export, but that is jargon
     to a reader. The pin shows the plain-language version the form asks in. */
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
  const activeGroups = {};     // purpose group id -> shown?
  PURPOSE_GROUPS.forEach((g) => { activeGroups[g.id] = true; });

  let draftMarker = null;      // the draggable pin while adding a space
  let draftLocation = null;    // { lat, lng }
  let draftPlaceId = "";       // Google place_id, when added via search
  let correctingId = null;     // asset being corrected, or null when adding new
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

  /* The neighbourhood currently shown appended to the address box, or "" when
     none was appended. This is what makes splitting the box back into two
     columns safe: we only split when we know we joined. */
  let shownNeighborhood = "";

  /* Split the address box back into the two columns it came from.

     Only splits when a neighbourhood was actually appended when the form
     opened. Otherwise the whole box is the street address — which matters,
     because plenty of real addresses contain commas ("450 Harrison Ave,
     Suite 3") and blindly splitting those would file "Suite 3" as a
     neighbourhood.

     When we did append one, we split on the LAST comma, so it behaves the
     same whether the person left the neighbourhood alone or edited it. If
     they delete it entirely, no comma remains, the whole box is the street
     address, and the neighbourhood is cleared — which is what deleting it
     should mean. */
  function submitAddressParts() {
    const raw = $("fAddr").value.trim();
    if (!shownNeighborhood) return { address_1: raw, neighborhood: "" };

    const cut = raw.lastIndexOf(",");
    if (cut === -1) return { address_1: raw, neighborhood: "" };
    return {
      address_1: raw.slice(0, cut).trim(),
      neighborhood: raw.slice(cut + 1).trim(),
    };
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
      ($("fContactConsent") && $("fContactConsent").checked ? "C" : "");
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

  // space_type holds one or more labels joined by TYPE_SEPARATOR. Split it
  // back into a list, tolerating rows that used "," (the base layer and any
  // hand-editing in the Sheet).
  function typesOf(space) {
    return String(space.space_type || "")
      .split(/[;,]/)
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

  // True when at least one of the space's purposes is switched on in the
  // legend — a two-purpose pin stays visible until BOTH its colours are off.
  function isShown(space) {
    return purposeGroupsFor(space).some((g) => activeGroups[g.id]);
  }

  // The legend/list swatch for ONE group. Mirrors the pin: solid for a known
  // purpose, hollow for "No purpose recorded".
  function dotHtml(g) {
    return g.hollow
      ? '<span class="dot hollow" style="border-color:' + g.hex + '"></span>'
      : '<span class="dot" style="background:' + g.hex + '"></span>';
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

  // The types shown to a reader. (An "Other" description has no column of its
  // own in the 2026-08-26 schema — the server appends it to `notes`, which the
  // info window already shows.)
  function typeLabel(space) {
    const chosen = typesOf(space);
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

    // Clicking anywhere on the map starts the pin-drop path.
    map.addListener("click", (e) => {
      if (!e.latLng) return;
      const at = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setDraftLocation(at, null);
      draftPlaceId = "";
      openAddForm();
      // Look the address up from the coordinates, since there is no Places
      // result to take one from on this path.
      fillAddressFromPin(at);
    });

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

  function renderAll() {
    // Rebuild markers from scratch — the dataset is small enough that this is
    // simpler and less bug-prone than diffing.
    Object.keys(markers).forEach((id) => { markers[id].map = null; });
    markers = {};

    assets.forEach((a) => {
      if (!isShown(a)) return;
      const marker = new AdvancedMarkerElement({
        map: map,
        position: { lat: a.lat, lng: a.long },
        content: pinSvgFor(purposeGroupsFor(a)),
        title: nameOf(a),
        gmpClickable: true,
      });
      // Advanced markers use "gmp-click", not the plain "click" event.
      marker.addEventListener("gmp-click", () => openInfoWindow(a.space_id));
      markers[a.space_id] = marker;
    });

    $("countPill").textContent = assets.length + (assets.length === 1 ? " space" : " spaces") + " on record";
    renderList();
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
      el.innerHTML = '<div class="empty-msg">Nothing here for the colors currently shown on the legend. Turn a color back on, or use “+ Add a space”.</div>';
      return;
    }

    items.forEach((a) => {
      const btn = document.createElement("button");
      btn.className = "asset-item";
      btn.setAttribute("role", "listitem");
      btn.innerHTML =
        dotHtmlFor(purposeGroupsFor(a)) +
        '<span><span class="name">' + esc(nameOf(a)) +
        (a.confirmations > 0 ? '<span class="stamp">✓ ' + esc(a.confirmations) + "</span>" : "") +
        '</span><span class="meta">' + esc(typeLabel(a)) + "</span></span>";
      btn.addEventListener("click", () => {
        map.panTo({ lat: a.lat, lng: a.long });
        if (map.getZoom() < 15) map.setZoom(15);
        openInfoWindow(a.space_id);
      });
      el.appendChild(btn);
    });
  }

  /* One chip per purpose. (The city-outline chip was removed at the owner's
     request on 2026-08-27 — the boundary is now always drawn.)

     Each chip carries the survey's own wording for that purpose, shown on
     hover AND on keyboard focus — a tooltip only a mouse can reach is not a
     tooltip for everyone. One shared bubble is reused rather than one per
     chip, and it is aria-hidden with the same text bound to the chip through
     aria-describedby, so a screen reader hears the description instead of
     hunting for a floating element. */
  function buildLegend() {
    const wrap = $("filters");

    const tip = document.createElement("div");
    tip.className = "legend-tip";
    tip.id = "legendTip";
    tip.hidden = true;
    tip.setAttribute("aria-hidden", "true");
    $("mapLegend").appendChild(tip);

    let hideTimer = null;
    function showTip(chip, text) {
      clearTimeout(hideTimer);
      tip.textContent = text;
      tip.hidden = false;
      // Sit the bubble directly above the chip, clamped to the legend box so
      // it can never run off the edge of the map.
      const box = $("mapLegend").getBoundingClientRect();
      const r = chip.getBoundingClientRect();
      tip.style.left = "0px";                        // measure at a known origin
      const tw = tip.offsetWidth;
      let left = r.left - box.left + r.width / 2 - tw / 2;
      left = Math.max(0, Math.min(left, box.width - tw));
      tip.style.left = left + "px";
      tip.style.bottom = (box.bottom - r.top + 8) + "px";
    }
    function hideTip() {
      hideTimer = setTimeout(() => { tip.hidden = true; }, 80);
    }

    PURPOSE_GROUPS.forEach((g) => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.innerHTML = dotHtml(g) + esc(g.label);
      chip.setAttribute("aria-pressed", "true");

      const desc = purposeDescription(g);
      // A hidden span gives assistive tech the description without relying on
      // the visual bubble being present.
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.id = "purposeDesc-" + g.id;
      sr.textContent = desc;
      chip.appendChild(sr);
      chip.setAttribute("aria-describedby", sr.id);

      chip.addEventListener("mouseenter", () => showTip(chip, desc));
      chip.addEventListener("focus", () => showTip(chip, desc));
      chip.addEventListener("mouseleave", hideTip);
      chip.addEventListener("blur", hideTip);

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
    const listOf = (v) => String(v || "")
      .split(/[;,]/).map((s) => s.trim()).filter(Boolean).join(", ");

    const rows = [
      ["Address", cell(addressOf(a))],
      ["Neighborhood", cell(a.neighborhood)],
      ["Location in building", cell(known(a.location_in_building))],
      ["Purpose", cell(listOf(a.space_purpose))],
      ["Key uses", cell(typeLabel(a) === "Unspecified" ? "" : typeLabel(a))],
      // The sheet stores Primary/Secondary; people read it as how often.
      ["Frequency of use", cell(known(a.use_type) && (USE_TYPE_WORDS[a.use_type] || a.use_type))],
      ["Closed?", cell(known(a.status))],
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
      "</div>" +
      '<div class="pp-actions">' +
        '<button class="pp-confirm" type="button">✓ Confirm it\'s correct</button>' +
        '<button class="pp-note-btn" type="button">Suggest a correction</button>' +
      "</div>";

    div.querySelector(".pp-confirm").addEventListener("click", function () {
      confirmAsset(a.space_id, this);
    });
    div.querySelector(".pp-note-btn").addEventListener("click", () => {
      openCorrectionForm(a.space_id);
    });

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

    infoWindow.setContent(div);
    const marker = markers[a.space_id];
    if (marker) {
      infoWindow.open({ map: map, anchor: marker });
    } else {
      infoWindow.setPosition({ lat: a.lat, lng: a.long });
      infoWindow.open({ map: map });
    }
  }

  /* ======================================================================
     Loading assets
     ====================================================================== */

  async function loadAssets(quiet) {
    $("countPill").textContent = "Loading…";
    try {
      if (demoMode) {
        assets = DEMO_ASSETS.slice();
      } else {
        const data = await apiGet("getSpaces");
        // Guard against a half-written row breaking the whole map.
        assets = (data.spaces || []).filter(
          (a) => a && a.space_id && typeof a.lat === "number" && typeof a.long === "number"
        );
      }
      renderAll();
      if (!quiet) toast("Up to date.");
    } catch (err) {
      console.error("Load failed:", err);
      $("countPill").textContent = "Load failed";
      toast("Couldn't load the spaces. Check your connection and press Refresh.", 5000);
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
        field.value = results[0].formatted_address || "";
        hint.textContent =
          "Filled in automatically from the spot you clicked — edit it if it looks wrong.";
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
    /* The address box shows "street, neighbourhood" as one line, because that
       is how a person reads an address. They are two columns in the sheet, so
       submitAddressParts() splits them back apart on the way out — see there
       for why the split is safe. */
    shownNeighborhood = String(a.neighborhood || "").trim();
    $("fAddr").value = [String(a.address_1 || "").trim(), shownNeighborhood]
      .filter(Boolean).join(", ");
    // canonicalLabel() maps answers stored under the old wording onto the
    // current options, so a reworded question does not show up blank here.
    $("fLocIn").value = canonicalLabel(a.location_in_building);
    $("fPrimary").value = canonicalLabel(a.use_type);
    $("fClosed").value = a.status || "";
    $("fConnection").value = a.submitter_connection || "";

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
    /* Show the recorded neighbourhood alongside the street address, so a
       corrector can see WHERE the map thinks this space is. It is shown here
       rather than dropped into the address box on purpose: the box writes
       straight to address_1, and folding the neighbourhood into it would put
       "Jamaica Plain" inside the street-address column on every correction.
       textContent, not innerHTML — this string comes from the sheet. */
    $("addrHint").textContent = shownNeighborhood
      ? "Street address and neighborhood, as currently recorded. Edit either part if it looks wrong."
      : "Edit the street address above if it looks wrong.";

    infoWindow.close();
    openAddForm();
  }

  function resetAddForm() {
    correctingId = null;
    ["fName", "fTypeOther", "fPurposeOther", "fAddr", "fClosureYear",
     "fSubName", "fSubEmail", "fSubAffil"].forEach((id) => { $(id).value = ""; });
    ["fLocIn", "fPrimary", "fClosed", "fConnection"].forEach((id) => { $(id).selectedIndex = 0; });
    document.querySelectorAll(".type-check, .purpose-check").forEach((b) => { b.checked = false; });
    $("fContactConsent").checked = false;
    $("otherWrap").hidden = true;
    $("purposeOtherWrap").hidden = true;
    $("closureYearWrap").hidden = true;
    $("correctingNote").hidden = true;
    $("dupWarn").hidden = true;
    $("dupWarn").innerHTML = "";
    $("outsideNote").hidden = true;
    shownNeighborhood = "";
    $("searchWrap").hidden = false;
    $("addrHint").textContent =
      "Filled in automatically from your search or map pin — edit it if it looks wrong.";
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
        await place.fetchFields({
          fields: ["id", "displayName", "formattedAddress", "location"],
        });

        const loc = place.location;
        if (!loc) { showError(null, "errLocation", "That result has no location — try another, or click the map."); return; }

        draftPlaceId = place.id || "";
        setDraftLocation({ lat: loc.lat(), lng: loc.lng() }, place.displayName || null);

        // Pre-fill, but never overwrite something the user has already typed.
        if (!$("fName").value.trim() && place.displayName) $("fName").value = place.displayName;
        if (!$("fAddr").value.trim() && place.formattedAddress) $("fAddr").value = place.formattedAddress;

        map.panTo({ lat: loc.lat(), lng: loc.lng() });
        if (map.getZoom() < 16) map.setZoom(16);
      } catch (err) {
        console.error("Place details failed:", err);
        showError(null, "errLocation", "Couldn't fetch that place's details. Try again, or click the map to place the pin yourself.");
      }
    });
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

    const addrParts = submitAddressParts();

    return {
      space_name: name,
      // Stored joined, in CONFIG order rather than click order, so the same
      // set of answers always produces the same cell value.
      space_type: types.join(TYPE_SEPARATOR),
      space_type_other: isOther ? $("fTypeOther").value.trim() : "",
      space_purpose: purposes.join(TYPE_SEPARATOR),
      // No column of its own in the schema — the server appends it to notes,
      // the same way it handles an "Other" space type.
      space_purpose_other: purposeIsOther ? $("fPurposeOther").value.trim() : "",
      notes: "",
      address_1: addrParts.address_1,
      neighborhood: addrParts.neighborhood,
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
        const data = await apiPost("addSpace", payload);
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
      showError(null, "errLocation", err.message || "Couldn't save that. Please try again.");
      toast(err.message || "Couldn't save. Please try again.", 5000);
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
      if (!demoMode) {
        await apiPost("confirmSpace", { space_id: spaceId });
      }
      a.confirmations = (Number(a.confirmations) || 0) + 1;
      renderList();
      openInfoWindow(spaceId);
      toast("Thanks — confirmation recorded.");
    } catch (err) {
      console.error(err);
      btnEl.disabled = false;
      btnEl.textContent = "✓ Confirm it's correct";
      toast(err.message || "Couldn't save the confirmation. Please try again.", 5000);
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
      bd.addEventListener("click", (e) => {
        if (e.target !== bd) return;          // a click INSIDE the box, ignore
        if (!confirmDiscard(bd.id)) return;
        bd.classList.remove("open");
        if (bd.id === "addModal") resetAddForm();
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      document.querySelectorAll(".modal-backdrop.open").forEach((bd) => {
        if (!confirmDiscard(bd.id)) return;
        bd.classList.remove("open");
        if (bd.id === "addModal") resetAddForm();
      });
    });

    $("addBtn").addEventListener("click", () => {
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

  /* The intro pop-up's photo rotation. One <img>, whose src cycles through
     data-images — so only the photo on screen is ever downloaded, instead of
     all thirteen at once on page load. */
  function initCarousel() {
    const box = $("introCarousel");
    if (!box) return;
    const images = (box.getAttribute("data-images") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const img = box.querySelector("img");
    if (!img || images.length < 2) return;

    let i = 0;
    setInterval(() => {
      i = (i + 1) % images.length;
      img.classList.add("fading");
      setTimeout(() => {
        img.src = images[i];
        img.classList.remove("fading");
      }, 450);   // matches the CSS opacity transition
    }, 4500);
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
