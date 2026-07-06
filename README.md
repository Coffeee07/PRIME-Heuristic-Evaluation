# PRIME — Heuristic Evaluation Site

A small static website evaluators use to fill out a Nielsen heuristic
evaluation of **PRIME** (mobile app + web app), upload screenshots, and get
an auto-calculated severity summary table — no installs needed on their end.

## What's in here

```
index.html            the whole form
style.css             the look ("cute travel route" theme)
script.js             all the logic (dynamic rows, autosave, export)
drive-config.js       your Google OAuth Client ID + Drive folder ID
drive-upload.js       uploads the generated PDF straight to that Drive folder
```

## 1. Try it locally

Just open `index.html` in a browser. Everything works immediately:
QR codes, the dynamic "add violation" cards, the live summary table,
and autosave (each evaluator's in-progress answers are kept in their own
browser via `localStorage`, so refreshing the page won't lose their work).

## 2. Publish it with GitHub Pages

1. Create a new GitHub repo (e.g. `prime-heuristic-eval`) and push these
   files to it.
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, choose the branch (usually `main`) and root folder `/`.
4. Save. GitHub will give you a link like
   `https://<your-username>.github.io/prime-heuristic-eval/` — that's the
   link you send to your evaluators.

No build step, no server — it's plain HTML/CSS/JS, so it just works.

## 3. How evaluators get their results to you (without a database)

By default there's no shared database, so each evaluator exports their own
answers and sends them to you:

- **Export JSON** — downloads a `.json` file with everything they entered,
  including their screenshots (embedded as images). Great if you want to
  merge everyone's answers programmatically later.
- **Save as PDF** — opens the browser print dialog pre-styled for printing,
  so they can "Print → Save as PDF" and email/submit that.

This is the zero-setup option and is enough for a class assignment.

## 4. Submissions save straight to Google Drive

The **Submit** button generates a PDF of the whole filled-out form and
uploads it directly into a Google Drive folder you control — no server,
no database. This only works from a browser, so it's fine on GitHub Pages.

### One-time setup (see the comment block at the top of `drive-config.js` too)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) →
   create a project (or reuse one).
2. **APIs & Services → Library** → search "Google Drive API" → **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User type: External.
   - While the app is in "Testing" mode, add every evaluator's Google
     account email under **Test users** (max 100) — otherwise Google
     will block their sign-in. Or click **Publish App** to allow anyone.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: add the exact URL this site is
     hosted at, no trailing slash — e.g. `https://<your-username>.github.io`
     (add `http://localhost:PORT` too if you test locally).
   - Copy the **Client ID** into `GOOGLE_CLIENT_ID` in `drive-config.js`.
5. Create (or reuse) a Drive folder for submissions, open it, click
   **Share**, and set it to at least "Anyone with the link = Editor"
   (or share it individually with each evaluator's Google account).
6. Copy the folder ID out of its URL —
   `https://drive.google.com/drive/folders/<THIS_PART>` — into
   `DRIVE_FOLDER_ID` in `drive-config.js`.
7. Commit and push (or redeploy). When an evaluator clicks **Submit**,
   they'll see a Google sign-in popup once per session, then the PDF
   uploads straight into that Drive folder.

### How it works under the hood

- `drive-config.js` holds your two IDs.
- `drive-upload.js` uses Google Identity Services to get a short-lived
  access token scoped only to files this app creates (`drive.file`
  scope — it can't browse the rest of anyone's Drive), then uploads the
  PDF via the Drive API.
- Each evaluator authorizes with *their own* Google account the first
  time they hit Submit in a session; the file lands in *your* shared
  folder because that's where `DRIVE_FOLDER_ID` points.

### Note on pop-up blockers

The Google sign-in prompt is a popup. Some browsers block popups that
appear after a delay, so `drive-upload.js` requests sign-in immediately
when Submit is clicked (before generating the PDF) to keep it tied to
the click. If an evaluator's browser still blocks it, they'll need to
allow popups for your site once.

## Editing the prototype links

If the mobile app or web app links ever change, open `script.js` and edit
the two URLs at the very top:

```js
const PROTOTYPE_LINKS = {
  mobile: "...",
  web: "..."
};
```

The QR codes and "Open" buttons update automatically from these two lines.
