/* ============================================================
   Google Drive upload configuration
   ============================================================
   One-time setup (you only do this once for the whole project):

   1. Go to https://console.cloud.google.com/ and create a project
      (or pick an existing one).

   2. Enable the Drive API:
      APIs & Services > Library > search "Google Drive API" > Enable.

   3. Configure the OAuth consent screen:
      APIs & Services > OAuth consent screen
      - User type: External
      - While the app is in "Testing" mode, add every evaluator's Google
        account email under "Test users" (max 100), OR click "Publish App"
        if you want anyone to use it without being added manually.

   4. Create an OAuth Client ID:
      APIs & Services > Credentials > Create Credentials > OAuth client ID
      - Application type: Web application
      - Authorized JavaScript origins: add the exact URL this site is
        hosted at, no trailing slash, e.g.:
          https://<your-username>.github.io
        (add http://localhost:PORT too if you test locally)
      - Copy the "Client ID" it gives you into GOOGLE_CLIENT_ID below.
      1075066528515-smfa8qte87t5g35i9hvlppekocc09oj0.apps.googleusercontent.com

   5. Create (or reuse) a Google Drive folder where PDFs should land.
      Open it in Drive, click Share, and set it to
      "Anyone with the link" = Editor
      (or share individually with each evaluator's Google account instead,
      if you don't want it open to anyone with the link).

   6. Copy the folder ID from its URL:
      https://drive.google.com/drive/folders/<THIS_PART_IS_THE_FOLDER_ID>
      and paste it into DRIVE_FOLDER_ID below.
   ============================================================ */

const GOOGLE_CLIENT_ID = "1075066528515-smfa8qte87t5g35i9hvlppekocc09oj0.apps.googleusercontent.com.apps.googleusercontent.com";
const DRIVE_FOLDER_ID  = "1XLJ2oPQtumdZ818EjJPyyScOcoiYY3mJ";
