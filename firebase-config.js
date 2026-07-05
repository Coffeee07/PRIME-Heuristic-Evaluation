/* ============================================================
   OPTIONAL: Firebase database connection
   ------------------------------------------------------------
   This file is NOT loaded by default. The form works fine
   without it (exports to JSON / PDF, autosaves in the browser).

   To turn on "Submit to database" so every evaluator's response
   is saved to the cloud automatically, follow README.md, then:
     1. Paste your real Firebase config below.
     2. Uncomment the 4 <script> tags near the bottom of index.html.
   ============================================================ */

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

/**
 * Uploads any screenshot images to Firebase Storage, then saves
 * the evaluation (with image URLs instead of huge base64 strings)
 * to the "evaluations" collection in Firestore.
 */
window.savePrimeEvaluationToCloud = async function (state) {
  const docId = `${(state.evaluatorName || "evaluator").replace(/\s+/g, "_")}_${Date.now()}`;

  const issuesWithUploadedImages = await Promise.all(
    state.issues.map(async (issue, i) => {
      const uploadedUrls = await Promise.all(
        (issue.images || []).map(async (base64, j) => {
          const ref = storage.ref(`evaluations/${docId}/issue${i}_img${j}.png`);
          await ref.putString(base64, "data_url");
          return await ref.getDownloadURL();
        })
      );
      return { ...issue, images: uploadedUrls };
    })
  );

  await db.collection("evaluations").doc(docId).set({
    ...state,
    issues: issuesWithUploadedImages,
    submittedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
};
