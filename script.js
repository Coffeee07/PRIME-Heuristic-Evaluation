/* ============================================================
   PRIME — Heuristic Evaluation Form
   ============================================================ */

// ---- 1. Prototype links (edit here if the links ever change) ----
const PROTOTYPE_LINKS = {
  mobile: "https://drive.google.com/file/d/1PuzUy6uTtKq-FyYwv05zin4tlAlAzZ3I/view",
  web: "https://prime-fe.bu-research.online/"
};

const HEURISTICS = [
  { id: "H1", title: "Visibility of system status" },
  { id: "H2", title: "Match between system and the real world" },
  { id: "H3", title: "User control and freedom" },
  { id: "H4", title: "Consistency and standards" },
  { id: "H5", title: "Error prevention" },
  { id: "H6", title: "Recognition rather than recall" },
  { id: "H7", title: "Flexibility and efficiency of use" },
  { id: "H8", title: "Aesthetic and minimalist design" },
  { id: "H9", title: "Help users recognize, diagnose, and recover from errors" },
  { id: "H10", title: "Help and documentation" },
  { id: "HN", title: "Non-heuristic issue" }
];

const DRAFT_KEY = "prime_heuristic_eval_draft_v1";

// ---- Auto-growing textareas (no scrollbars, box grows with content) ----
function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}
function bindAutoGrow(el) {
  autoGrow(el);
  el.addEventListener("input", () => autoGrow(el));
}

// ---- QR codes + link buttons ----
function qrUrl(link) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(link)}`;
}
document.getElementById("qr-mobile").src = qrUrl(PROTOTYPE_LINKS.mobile);
document.getElementById("qr-web").src = qrUrl(PROTOTYPE_LINKS.web);
document.getElementById("link-mobile").href = PROTOTYPE_LINKS.mobile;
document.getElementById("link-web").href = PROTOTYPE_LINKS.web;

// ---- Element refs ----
const issuesList = document.getElementById("issuesList");
const issueTemplate = document.getElementById("issueTemplate");
const summaryBody = document.querySelector("#summaryTable tbody");

// ---- Build summary table rows once ----
HEURISTICS.forEach(h => {
  const tr = document.createElement("tr");
  tr.dataset.heuristic = h.id;
  tr.innerHTML = `
    <td>${h.id} — ${h.title}</td>
    <td data-sev="0">0</td><td data-sev="1">0</td><td data-sev="2">0</td>
    <td data-sev="3">0</td><td data-sev="4">0</td><td class="total">0</td>`;
  summaryBody.appendChild(tr);
});

// ---- Issue cards (Part III) ----
let issueCount = 0;

function addIssueCard(data = {}) {
  issueCount++;
  const node = issueTemplate.content.cloneNode(true);
  const card = node.querySelector(".issue-card");

  card.querySelector(".issue-number").textContent = `Issue #${issueCount}`;
  card.querySelector(".issue-heuristic").value = data.heuristic || "H1";
  card.querySelector(".issue-where").value = data.where || "";
  card.querySelector(".issue-what").value = data.what || "";
  card.querySelector(".issue-why").value = data.why || "";
  card.querySelector(".issue-severity").value = data.severity ?? "1";
  card.querySelector(".issue-solution").value = data.solution || "";

  const thumbs = card.querySelector(".thumbs");
  const fileInput = card.querySelector(".issue-file");
  let storedImages = data.images || [];

  function renderThumbs() {
    thumbs.innerHTML = "";
    storedImages.forEach((src, i) => {
      const wrap = document.createElement("div");
      wrap.className = "thumb-wrap";

      const img = document.createElement("img");
      img.src = src;
      wrap.appendChild(img);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "thumb-remove";
      removeBtn.textContent = "✕";
      removeBtn.title = "Remove this screenshot";
      removeBtn.addEventListener("click", () => { storedImages.splice(i, 1); renderThumbs(); saveDraft(); });
      wrap.appendChild(removeBtn);

      thumbs.appendChild(wrap);
    });
  }
  renderThumbs();
  card._getImages = () => storedImages;

  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files);
    let remaining = files.length;
    if (!remaining) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        storedImages.push(e.target.result);
        remaining--;
        if (remaining === 0) { renderThumbs(); saveDraft(); }
      };
      reader.readAsDataURL(file);
    });
  });

  card.querySelectorAll("input, textarea, select").forEach(el => {
    el.addEventListener("input", () => { updateSummary(); saveDraft(); });
    el.addEventListener("change", () => { updateSummary(); saveDraft(); });
  });

  card.querySelector(".btn-remove").addEventListener("click", () => {
    card.remove();
    renumberIssues();
    updateSummary();
    saveDraft();
  });

  issuesList.appendChild(node);
  card.querySelectorAll("textarea").forEach(bindAutoGrow);
  updateSummary();
}

function renumberIssues() {
  issueCount = 0;
  issuesList.querySelectorAll(".issue-card").forEach(card => {
    issueCount++;
    card.querySelector(".issue-number").textContent = `Issue #${issueCount}`;
  });
}

document.getElementById("addIssueBtn").addEventListener("click", () => { addIssueCard(); saveDraft(); });

// ---- Summary table calculation ----
// "Total" = total severity score per heuristic (sum of each issue's severity
// value), not just a count of how many issues were found.
function updateSummary() {
  const counts = {};
  HEURISTICS.forEach(h => counts[h.id] = [0, 0, 0, 0, 0]);

  issuesList.querySelectorAll(".issue-card").forEach(card => {
    const h = card.querySelector(".issue-heuristic").value;
    const sev = parseInt(card.querySelector(".issue-severity").value, 10);
    if (counts[h]) counts[h][sev]++;
  });

  HEURISTICS.forEach(h => {
    const row = summaryBody.querySelector(`tr[data-heuristic="${h.id}"]`);
    let totalSeverity = 0;
    counts[h.id].forEach((n, sev) => {
      row.querySelector(`[data-sev="${sev}"]`).textContent = n;
      totalSeverity += n * sev;
    });
    row.querySelector(".total").textContent = totalSeverity;
  });
}

// ---- Collect full form state ----
function collectState() {
  return {
    evaluatorName: val("evaluatorName"),
    evaluatorDate: val("evaluatorDate"),
    projectDescription: val("projectDescription"),
    issues: Array.from(issuesList.querySelectorAll(".issue-card")).map(card => ({
      heuristic: card.querySelector(".issue-heuristic").value,
      where: card.querySelector(".issue-where").value,
      what: card.querySelector(".issue-what").value,
      why: card.querySelector(".issue-why").value,
      severity: card.querySelector(".issue-severity").value,
      solution: card.querySelector(".issue-solution").value,
      images: card._getImages ? card._getImages() : []
    })),
    overallSummary: val("overallSummary")
  };
}
function val(id) { return document.getElementById(id).value; }

// ---- Draft autosave / restore (localStorage) ----
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(collectState()));
  } catch (e) {
    console.warn("Could not save draft (storage may be full):", e);
  }
}

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) {
    addIssueCard();
    return;
  }
  try {
    const state = JSON.parse(raw);
    document.getElementById("evaluatorName").value = state.evaluatorName || "";
    document.getElementById("evaluatorDate").value = state.evaluatorDate || "";
    document.getElementById("projectDescription").value = state.projectDescription || "";
    document.getElementById("overallSummary").value = state.overallSummary || "";
    autoGrow(document.getElementById("projectDescription"));
    autoGrow(document.getElementById("overallSummary"));

    issuesList.innerHTML = "";
    issueCount = 0;
    (state.issues && state.issues.length ? state.issues : [{}]).forEach(i => addIssueCard(i));
  } catch (e) {
    console.warn("Could not restore draft:", e);
    addIssueCard();
  }
}

// top-level fields also autosave
["evaluatorName", "evaluatorDate", "projectDescription", "overallSummary"]
  .forEach(id => document.getElementById(id).addEventListener("input", saveDraft));

// auto-grow the top-level textareas too
bindAutoGrow(document.getElementById("projectDescription"));
bindAutoGrow(document.getElementById("overallSummary"));

// ---- Export as JSON (only wired up if the button exists in index.html) ----
const exportJsonBtn = document.getElementById("exportJsonBtn");
if (exportJsonBtn) {
  exportJsonBtn.addEventListener("click", () => {
    const state = collectState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const namePart = (state.evaluatorName || "evaluator").replace(/\s+/g, "_");
    a.href = url;
    a.download = `PRIME_HeuristicEvaluation_${namePart}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ---- Print / Save as PDF (manual, via browser print dialog) ----
document.getElementById("printBtn").addEventListener("click", () => window.print());

// ---- Clear form ----
document.getElementById("clearBtn").addEventListener("click", () => {
  if (!confirm("This will clear everything you've entered on this device. Continue?")) return;
  localStorage.removeItem(DRAFT_KEY);
  issuesList.innerHTML = "";
  issueCount = 0;
  document.getElementById("evalForm").reset();
  addIssueCard();
  updateSummary();
});

// ---- Build a printable PDF of the current form (used for cloud submission) ----
// Clones the form, strips out the nav / try-first / action buttons, and
// renders it into a PDF Blob using html2pdf.js.
//
// IMPORTANT: html2canvas (used by html2pdf.js) cannot reliably rasterize
// the *values* typed into <input>, <textarea>, or <select> elements — it
// just draws the empty box outline, which is why the PDF looked blank.
// The fix is to swap every form field in the clone for a plain text
// element showing its current value before rendering.
function replaceFieldsWithText(root) {
  root.querySelectorAll("input[type='text'], input[type='date']").forEach(el => {
    const div = document.createElement("div");
    div.className = "pdf-static-value";
    div.textContent = el.value || "—";
    el.replaceWith(div);
  });

  root.querySelectorAll("textarea").forEach(el => {
    const div = document.createElement("div");
    div.className = "pdf-static-value pdf-static-multiline";
    div.textContent = el.value || "—";
    el.replaceWith(div);
  });

  root.querySelectorAll("select").forEach(el => {
    const div = document.createElement("div");
    div.className = "pdf-static-value";
    const selected = el.options[el.selectedIndex];
    div.textContent = selected ? selected.textContent : "—";
    el.replaceWith(div);
  });
}

// html2canvas has known trouble resolving CSS custom properties (var(--navy)
// etc.) — it can silently drop colors/backgrounds, which is why exported
// PDFs sometimes come out blank even though the page looks fine on screen.
// Fix: walk the cloned tree and bake every element's *computed* (already
// resolved) color/background/border/font values in as literal inline
// styles, so html2canvas never has to deal with a var() reference at all.
function inlineComputedStyles(root) {
  const props = [
    "color", "backgroundColor",
    "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor",
    "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle",
    "fontFamily", "fontWeight", "fontSize", "lineHeight",
    "borderRadius", "boxShadow"
  ];
  const all = [root, ...root.querySelectorAll("*")];
  all.forEach(el => {
    const cs = window.getComputedStyle(el);
    props.forEach(p => {
      try { el.style[p] = cs[p]; } catch (e) { /* ignore unsupported prop */ }
    });
  });
}

async function generatePdfBlob() {
  if (typeof html2pdf === "undefined") {
    throw new Error("html2pdf.js is not loaded. Uncomment the script tags in index.html.");
  }

  const clone = document.querySelector("main").cloneNode(true);
  clone.querySelectorAll(".try-first, .trail, .actions-card").forEach(el => el.remove());

  // Replace file inputs (not renderable) with nothing — thumbnails already show the images.
  clone.querySelectorAll('input[type="file"]').forEach(el => el.remove());

  // Replace text/date/textarea/select fields with plain text so their
  // values actually show up in the rendered PDF.
  replaceFieldsWithText(clone);

  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.top = "0";
  wrapper.style.left = "0";
  wrapper.style.zIndex = "-1";
  wrapper.style.width = "800px";
  wrapper.style.padding = "20px";
  wrapper.style.background = "#ffffff";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // Give the browser a beat to lay out/paint the wrapper (and decode any
  // base64 screenshot images) before html2canvas takes its snapshot.
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // Now that the wrapper is laid out in the live DOM, bake resolved colors
  // in as literal values (see inlineComputedStyles above) before capture.
  inlineComputedStyles(wrapper);

  const state = collectState();
  const namePart = (state.evaluatorName || "evaluator").replace(/\s+/g, "_");

  try {
    const blob = await html2pdf()
      .from(wrapper)
      .set({
        margin: 10,
        filename: `PRIME_HeuristicEvaluation_${namePart}.pdf`,
        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: wrapper.scrollWidth,
          windowHeight: wrapper.scrollHeight
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .outputPdf("blob");
    return blob;
  } finally {
    wrapper.remove();
  }
}

// ---- Cloud save (optional Supabase hook — see README.md) ----
// Generates a PDF of the whole evaluation and uploads that PDF (not raw
// JSON) to the database, so what you review later is the same document
// the evaluator filled out.
document.getElementById("cloudSaveBtn").addEventListener("click", async () => {
  const status = document.getElementById("cloudStatus");

  if (typeof window.savePrimeEvaluationToCloud !== "function") {
    status.textContent = "☁️ Database isn't connected yet. See README.md to add Supabase, or use Export JSON / Save as PDF for now.";
    return;
  }

  status.textContent = "Generating PDF…";
  try {
    const state = collectState();
    const pdfBlob = await generatePdfBlob();
    status.textContent = "Uploading…";
    await window.savePrimeEvaluationToCloud(state, pdfBlob);
    status.textContent = "✅ PDF submitted to the database!";
  } catch (e) {
    console.error(e);
    const detail = (e && (e.message || e.error_description || e.msg)) || "Unknown error — see browser console for details.";
    status.textContent = `⚠️ Could not submit — ${detail}`;
  }
});

// ---- Init ----
loadDraft();
updateSummary();
