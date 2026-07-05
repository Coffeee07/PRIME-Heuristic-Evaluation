/* ============================================================
   Supabase database connection
   ------------------------------------------------------------
   Loaded only when the 2 <script> tags near the bottom of
   index.html are uncommented (the supabase-js CDN script and
   this file).

   Replace the two placeholder strings below with your project's
   real values, found in your Supabase project at:
   Project Settings → API → Project URL / anon public key
   ============================================================ */

const SUPABASE_URL = "https://ejtcnhzqekyxjopsoltz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdGNuaHpxZWt5eGpvcHNvbHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNTk2NTgsImV4cCI6MjA5ODgzNTY1OH0.u1QBTrnGvcMix7_x-pjpFUUtC4iFnQdkoBqugDBvBV4";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Uploads the generated PDF (the whole filled-out form, screenshots
 * included) to Supabase Storage, then saves a small row in the
 * "evaluations" table — evaluator name, date, and a link to the PDF —
 * so you can browse submissions and open each one's PDF anytime.
 *
 * Called from script.js as:
 *   window.savePrimeEvaluationToCloud(state, pdfBlob)
 */
window.savePrimeEvaluationToCloud = async function (state, pdfBlob) {
  const docId = `${(state.evaluatorName || "evaluator").replace(/\s+/g, "_")}_${Date.now()}`;
  const filePath = `evaluations/${docId}.pdf`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from("evaluations")
    .upload(filePath, pdfBlob, { contentType: "application/pdf" });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabaseClient
    .storage
    .from("evaluations")
    .getPublicUrl(filePath);

  const pdfUrl = publicUrlData.publicUrl;

  const { error: insertError } = await supabaseClient
    .from("evaluations")
    .insert({
      doc_id: docId,
      evaluator_name: state.evaluatorName,
      evaluator_date: state.evaluatorDate,
      issue_count: state.issues.length,
      pdf_url: pdfUrl
    });

  if (insertError) throw insertError;
};
