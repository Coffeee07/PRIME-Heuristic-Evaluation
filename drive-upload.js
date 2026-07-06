/* ============================================================
   Google Drive upload
   ------------------------------------------------------------
   Requires (both loaded in index.html BEFORE this file):
     - https://accounts.google.com/gsi/client   (Google Identity Services)
     - drive-config.js                          (GOOGLE_CLIENT_ID, DRIVE_FOLDER_ID)

   Uses an OAuth "implicit" token (drive.file scope, so this app can
   only see/create files it uploads itself — not your whole Drive) and
   uploads the generated PDF straight into DRIVE_FOLDER_ID.
   ============================================================ */

let _driveTokenClient = null;
let _driveAccessToken = null;

function _initDriveTokenClient() {
  if (_driveTokenClient) return _driveTokenClient;
  if (typeof google === "undefined" || !google.accounts || !google.accounts.oauth2) {
    throw new Error("Google Identity Services script didn't load (check index.html <script> tags and your network).");
  }
  _driveTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: "https://www.googleapis.com/auth/drive.file",
    callback: () => {} // replaced per-request below
  });
  return _driveTokenClient;
}

function _getDriveAccessToken() {
  return new Promise((resolve, reject) => {
    const client = _initDriveTokenClient();
    client.callback = (resp) => {
    console.log("OAuth callback:", resp);

    if (resp.error) {
        console.error("OAuth error:", resp);
        reject(new Error(resp.error_description || resp.error));
        return;
    }

    _driveAccessToken = resp.access_token;
    console.log("Access token received.");
    resolve(_driveAccessToken);
};
    client.error_callback = (err) => {
    console.error("GIS error:", err);
    reject(new Error(err.message || "Google sign-in was cancelled or blocked."));
};
    // Skip the consent screen on repeat submissions in the same tab.
    client.requestAccessToken({ prompt: _driveAccessToken ? "" : "consent" });
  });
}

/**
 * Call this FIRST, directly inside the click handler, so the popup
 * request still counts as "triggered by a user gesture" in the browser.
 * Safe to call again later (e.g. before uploading) — it's a no-op once
 * a token is already held.
 */
window.ensureDriveAuth = async function () {
  if (_driveAccessToken) return _driveAccessToken;
  return _getDriveAccessToken();
};

async function _uploadPdfToDrive(pdfBlob, filename) {
  if (!_driveAccessToken) {
      await window.ensureDriveAuth();
  }

  const accessToken = _driveAccessToken;

  const metadata = {
    name: filename,
    parents: [DRIVE_FOLDER_ID]
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", pdfBlob);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form
    }
  );

  if (!res.ok) {
    // If the token expired/was revoked mid-session, clear it and let the
    // caller retry (they'll get a fresh consent prompt next click).
    if (res.status === 401) _driveAccessToken = null;
    const errBody = await res.text();
    throw new Error(`Drive upload failed (${res.status}): ${errBody}`);
  }

  return res.json();
}

// Same signature script.js already expects from the old Supabase hook,
// so no changes needed there beyond swapping which config/script files load.
window.savePrimeEvaluationToCloud = async function (state, pdfBlob) {
  const namePart = (state.evaluatorName || "evaluator").replace(/\s+/g, "_");
  const filename = `PRIME_HeuristicEvaluation_${namePart}_${Date.now()}.pdf`;
  return _uploadPdfToDrive(pdfBlob, filename);
};
