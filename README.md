# PRIME — Heuristic Evaluation Site

A small static website evaluators use to fill out a Nielsen heuristic
evaluation of **PRIME** (mobile app + web app), upload screenshots, and get
an auto-calculated severity summary table — no installs needed on their end.

## What's in here

```
index.html          the whole form
style.css            the look ("cute travel route" theme)
script.js            all the logic (dynamic rows, autosave, export)
firebase-config.js    OPTIONAL — only needed if you want a shared database
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

## 4. Adding a real database (optional)

If you want every submission to land in one place automatically instead of
collecting exported files, hook up **Firebase** (free tier is plenty for a
class project, and it works fine from a static GitHub Pages site since all
the saving happens from the visitor's browser — you don't need your own
server).

### Steps

1. Go to [firebase.google.com](https://firebase.google.com/) → **Console** →
   **Add project**. Name it anything (e.g. `prime-heuristic-eval`).
2. In the project, open **Build → Firestore Database** → **Create database**
   → start in **test mode** for now (fine for a short-lived class project).
3. Open **Build → Storage** → **Get started** (this is where screenshots
   will live).
4. Go to **Project settings** (gear icon) → scroll to **Your apps** → click
   the **</>** (web) icon → register an app (no need for Firebase Hosting).
   Firebase will show you a config object like:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "prime-heuristic-eval.firebaseapp.com",
     projectId: "prime-heuristic-eval",
     storageBucket: "prime-heuristic-eval.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
5. Paste those real values into `firebase-config.js` in this project,
   replacing the placeholder strings.
6. Open `index.html` and **uncomment** the four `<script>` tags near the
   bottom (just above `<script src="script.js">`):
   ```html
   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js"></script>
   <script src="firebase-config.js"></script>
   ```
7. Commit and push. The **"Submit to database"** button will now save each
   evaluation (with screenshots) into the `evaluations` collection in
   Firestore, viewable anytime in the Firebase console.

### Before sharing the link widely

Test mode security rules expire after ~30 days and allow anyone to
read/write. For a short class assignment that's usually fine, but if you
want it locked down sooner, go to **Firestore → Rules** and **Storage →
Rules** and restrict writes, e.g. only allow `create` (not read/update/delete)
so evaluators can submit but not see or tamper with others' entries:

```
// Firestore rules example
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /evaluations/{doc} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}
```

### Alternative: Supabase

If you'd rather use a SQL database, [Supabase](https://supabase.com) works
the same way (free tier, JS client, works from a static site) — create a
table for evaluations and a storage bucket for screenshots, then swap the
Firebase calls in `firebase-config.js` for `supabase-js` calls following
their docs. The rest of the site (`index.html`, `style.css`, `script.js`)
doesn't need to change.

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
