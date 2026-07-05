/* ============================================================
   Firebase database connection
   ------------------------------------------------------------
   Loaded only when the 5 <script> tags near the bottom of
   index.html are uncommented.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBruz_kKIuz5eymKbs9vonkpX-_Ulj5S7Y",
  authDomain: "prime-heuristic-eval.firebaseapp.com",
  projectId: "prime-heuristic-eval",
  storageBucket: "prime-heuristic-eval.firebasestorage.app",
  messagingSenderId: "888708019973",
  appId: "1:888708019973:web:ce8d20a52382ef3eb9696c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

/**
 * Uploads the generated PDF (the whole filled-out form, screenshots
 * included) to Firebase Storage, then saves a small Firestore record
 * — evaluator name, date, and a link to the PDF — so you can browse
 * submissions and open each one's PDF from the Firebase console.
 *
 * Called from script.js as:
 *   window.savePrimeEvaluationToCloud(state, pdfBlob)
 */
window.savePrimeEvaluationToCloud = async function (state, pdfBlob) {
  const docId = `${(state.evaluatorName || "evaluator").replace(/\s+/g, "_")}_${Date.now()}`;

  const pdfRef = storage.ref(`evaluations/${docId}.pdf`);
  await pdfRef.put(pdfBlob, { contentType: "application/pdf" });
  const pdfUrl = await pdfRef.getDownloadURL();

  await db.collection("evaluations").doc(docId).set({
    evaluatorName: state.evaluatorName,
    evaluatorDate: state.evaluatorDate,
    issueCount: state.issues.length,
    pdfUrl,
    submittedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
};
