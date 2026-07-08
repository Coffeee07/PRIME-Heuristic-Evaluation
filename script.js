/* ============================================================
   PRIME — Heuristic Evaluation Form
   ============================================================ */

// ---- 1. Prototype links (edit here if the links ever change) ----
const PROTOTYPE_LINKS = {
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
document.getElementById("qr-web").src = qrUrl(PROTOTYPE_LINKS.web);
document.getElementById("link-web").href = PROTOTYPE_LINKS.web;

const PLATFORM_LABELS = { mobile: "Mobile App", web: "Web App" };
const SIDE_LABELS = { microentrepreneur: "Microentrepreneur", lgu: "LGU" };

// ---- Element refs ----
const issuesList = document.getElementById("issuesList");
const issueTemplate = document.getElementById("issueTemplate");
const summaryBodies = {
  mobile: document.querySelector("#summaryTableMobile tbody"),
  web: document.querySelector("#summaryTableWeb tbody")
};

// ---- Build summary table rows once, per platform ----
Object.values(summaryBodies).forEach(body => {
  HEURISTICS.forEach(h => {
    const tr = document.createElement("tr");
    tr.dataset.heuristic = h.id;
    tr.innerHTML = `
      <td>${h.id} — ${h.title}</td>
      <td data-sev="0">0</td><td data-sev="1">0</td><td data-sev="2">0</td>
      <td data-sev="3">0</td><td data-sev="4">0</td><td class="total">0</td>`;
    body.appendChild(tr);
  });
});

// ---- Issue cards (Part III) ----
let issueCount = 0;

function addIssueCard(data = {}) {
  issueCount++;
  const node = issueTemplate.content.cloneNode(true);
  const card = node.querySelector(".issue-card");

  card.querySelector(".issue-number").textContent = `Issue #${issueCount}`;
  card.querySelector(".issue-platform").value = data.platform || "mobile";
  card.querySelector(".issue-side").value = data.side || "microentrepreneur";
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
  const counts = {
    mobile: {},
    web: {}
  };
  HEURISTICS.forEach(h => {
    counts.mobile[h.id] = [0, 0, 0, 0, 0];
    counts.web[h.id] = [0, 0, 0, 0, 0];
  });

  issuesList.querySelectorAll(".issue-card").forEach(card => {
    const platform = card.querySelector(".issue-platform").value === "web" ? "web" : "mobile";
    const h = card.querySelector(".issue-heuristic").value;
    const sev = parseInt(card.querySelector(".issue-severity").value, 10);
    if (counts[platform][h]) counts[platform][h][sev]++;
  });

  Object.keys(summaryBodies).forEach(platform => {
    const body = summaryBodies[platform];
    HEURISTICS.forEach(h => {
      const row = body.querySelector(`tr[data-heuristic="${h.id}"]`);
      let totalSeverity = 0;
      counts[platform][h.id].forEach((n, sev) => {
        row.querySelector(`[data-sev="${sev}"]`).textContent = n;
        totalSeverity += n * sev;
      });
      row.querySelector(".total").textContent = totalSeverity;
    });
  });
}

// ---- Collect full form state ----
function collectState() {
  return {
    evaluatorName: val("evaluatorName"),
    evaluatorDate: val("evaluatorDate"),
    issues: Array.from(issuesList.querySelectorAll(".issue-card")).map(card => ({
      platform: card.querySelector(".issue-platform").value,
      side: card.querySelector(".issue-side").value,
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
    document.getElementById("overallSummary").value = state.overallSummary || "";
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
["evaluatorName", "evaluatorDate", "overallSummary"]
  .forEach(id => document.getElementById(id).addEventListener("input", saveDraft));

// auto-grow the top-level textareas too
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

// ---- Build a PDF of the current evaluation directly with jsPDF ----
// This writes text, images, and the summary table straight onto the PDF
// canvas using the form's *data* (via collectState()), instead of asking
// html2canvas to rasterize the live DOM. That's what was producing blank
// pages before: html2canvas can't reliably capture the typed-in values of
// <input>/<textarea>/<select> elements or resolve CSS custom properties
// like var(--navy). Building the PDF from data sidesteps both problems
// entirely, and is also much faster and more reliable on GitHub Pages.

// Screenshots are stored as data URLs of whatever type the browser gave us
// (png/jpeg/webp/etc). jsPDF's addImage() only reliably supports PNG/JPEG,
// so every image is redrawn onto a canvas and re-exported as PNG first —
// this also gives us the natural width/height needed to scale it to fit
// the page.
function loadImageAsPng(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => reject(new Error("Could not load an attached screenshot."));
    img.src = dataUrl;
  });
}

function heuristicLabel(id) {
  const h = HEURISTICS.find(h => h.id === id);
  return h ? `${h.id} — ${h.title}` : id;
}

function platformLabel(platform) {
  return PLATFORM_LABELS[platform] || platform || "—";
}

function sideLabel(side) {
  return SIDE_LABELS[side] || side || "—";
}

const SEVERITY_LABELS = ["0 – Not a problem", "1 – Cosmetic", "2 – Minor", "3 – Major", "4 – Catastrophe"];
function severityLabel(sev) {
  return SEVERITY_LABELS[parseInt(sev, 10)] || String(sev);
}

async function generatePdfBlob() {
  if (typeof window.jspdf === "undefined") {
    throw new Error("jsPDF didn't load (check index.html <script> tags and your network).");
  }

  const { jsPDF } = window.jspdf;
  const state = collectState();

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  const NAVY = [31, 58, 77];
  const TEAL = [47, 191, 166];
  const CORAL = [255, 111, 94];
  const MUTED = [90, 113, 128];

  function ensureSpace(h) {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function heading(text) {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(text, margin, y);
    y += 2;
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.6);
    doc.line(margin, y, margin + contentW, y);
    y += 6;
  }

  function label(text) {
    ensureSpace(6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(text, margin, y);
    y += 5;
  }

  function paragraph(text) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    const lines = doc.splitTextToSize((text && text.trim()) || "—", contentW);
    lines.forEach(line => {
      ensureSpace(5.5);
      doc.text(line, margin, y);
      y += 5.5;
    });
    y += 2;
  }

  // ---- Title ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text("PRIME", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text("Promoting Resilience Innovation for Microenterprise Empowerment", margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(...CORAL);
  doc.text("NIELSEN HEURISTIC EVALUATION", margin, y);
  y += 8;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentW, y);
  y += 8;

  // ---- Part I ----
  heading("Part I \u00b7 Evaluator");
  label("Full name");
  paragraph(state.evaluatorName);
  label("Date evaluated");
  paragraph(state.evaluatorDate);

  // ---- Part II ----
  heading("Part II \u00b7 List of Violations");
  if (!state.issues.length) {
    paragraph("No violations recorded.");
  }
  for (let i = 0; i < state.issues.length; i++) {
    const issue = state.issues[i];

    ensureSpace(13);
    doc.setFillColor(233, 251, 247);
    doc.roundedRect(margin, y - 4, contentW, 8, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...NAVY);
    doc.text(`Issue #${i + 1}  \u00b7  ${heuristicLabel(issue.heuristic)}`, margin + 3, y + 1.5);
    y += 9;

    label("Platform / User side");
    paragraph(`${platformLabel(issue.platform)} \u2014 ${sideLabel(issue.side)}`);
    label("Where");
    paragraph(issue.where);
    label("What \u2014 the problem");
    paragraph(issue.what);
    label("Why \u2014 heuristic broken & impact");
    paragraph(issue.why);
    label("Severity");
    paragraph(severityLabel(issue.severity));
    label("Proposed solution");
    paragraph(issue.solution);

    if (issue.images && issue.images.length) {
      label(`Screenshot${issue.images.length > 1 ? "s" : ""}`);
      for (const src of issue.images) {
        try {
          const img = await loadImageAsPng(src);
          const maxH = 90;
          let drawW = contentW;
          let drawH = drawW * (img.height / img.width);
          if (drawH > maxH) {
            drawH = maxH;
            drawW = drawH * (img.width / img.height);
          }
          ensureSpace(drawH + 4);
          doc.addImage(img.dataUrl, "PNG", margin, y, drawW, drawH);
          y += drawH + 4;
        } catch (e) {
          console.warn("Skipping unreadable screenshot:", e);
        }
      }
    }
    y += 4;
  }

  // ---- Part III ----
  heading("Part III \u00b7 Summary & Recommendations");

  const counts = { mobile: {}, web: {} };
  HEURISTICS.forEach(h => {
    counts.mobile[h.id] = [0, 0, 0, 0, 0];
    counts.web[h.id] = [0, 0, 0, 0, 0];
  });
  state.issues.forEach(issue => {
    const platform = issue.platform === "web" ? "web" : "mobile";
    const sev = parseInt(issue.severity, 10);
    if (counts[platform][issue.heuristic]) counts[platform][issue.heuristic][sev]++;
  });

  function drawPlatformTable(title, platformKey) {
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(title, margin, y);
    y += 5;

    const tableBody = HEURISTICS.map(h => {
      const row = counts[platformKey][h.id];
      const total = row.reduce((sum, n, sev) => sum + n * sev, 0);
      return [`${h.id} \u2014 ${h.title}`, ...row, total];
    });

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Heuristic", "0", "1", "2", "3", "4", "Total severity"]],
      body: tableBody,
      styles: { fontSize: 8.5, cellPadding: 2.2, textColor: NAVY },
      headStyles: { fillColor: [255, 232, 184], textColor: NAVY, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: contentW - 5 * 12 - 22, halign: "left" },
        1: { cellWidth: 12, halign: "center" },
        2: { cellWidth: 12, halign: "center" },
        3: { cellWidth: 12, halign: "center" },
        4: { cellWidth: 12, halign: "center" },
        5: { cellWidth: 12, halign: "center" },
        6: { cellWidth: 22, halign: "center", fontStyle: "bold" }
      }
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  drawPlatformTable("\ud83d\udcf1 Mobile App", "mobile");
  drawPlatformTable("\ud83d\udcbb Web App", "web");

  label("Overall summary & joint recommendations");
  paragraph(state.overallSummary);

  // ---- Footer: page numbers on every page ----
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Page ${p} of ${pageCount}`, pageW - margin, pageH - 8, { align: "right" });
    doc.text("PRIME Heuristic Evaluation", margin, pageH - 8);
  }

  const blob = doc.output("blob");
  console.log("Generated PDF blob:", blob, "size:", blob.size);
  return blob;
}

// ---- Cloud save (uploads generated PDF to Google Drive — see README.md) ----
// Generates a PDF of the whole evaluation and uploads that PDF (not raw
// JSON) to the database, so what you review later is the same document
// the evaluator filled out.
document.getElementById("cloudSaveBtn").addEventListener("click", async () => {
  const status = document.getElementById("cloudStatus");

  if (typeof window.savePrimeEvaluationToCloud !== "function") {
    status.textContent = "☁️ Google Drive isn't connected yet. See README.md, or use Export JSON / Save as PDF for now.";
    return;
  }

  try {
    // Request Drive sign-in FIRST, while we're still directly inside the
    // click handler — browsers can block the OAuth popup if it's requested
    // after an async delay (like PDF generation) breaks the user-gesture chain.
    if (typeof window.ensureDriveAuth === "function") {
      status.textContent = "Connecting to Google Drive…";
      await window.ensureDriveAuth();
    }

    status.textContent = "Generating PDF…";
    const state = collectState();
    const pdfBlob = await generatePdfBlob();

    status.textContent = "Uploading to Drive…";
    const result = await window.savePrimeEvaluationToCloud(state, pdfBlob);
    const link = result && result.webViewLink
      ? ` — <a href="${result.webViewLink}" target="_blank" rel="noopener">open in Drive</a>`
      : "";
    status.innerHTML = `✅ PDF uploaded to Google Drive!${link}`;
  } catch (e) {
    console.error(e);
    const detail = (e && (e.message || e.error_description || e.msg)) || "Unknown error — see browser console for details.";
    status.textContent = `⚠️ Could not submit — ${detail}`;
  }
});

// ---- Init ----
loadDraft();
updateSummary();
