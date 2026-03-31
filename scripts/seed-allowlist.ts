/**
 * One-time script — seeds the `allowedEmails` Firestore collection with
 * the list of AKPsi-approved UW email addresses.
 *
 * Setup (same as seed-member.ts):
 *   1. Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save the downloaded file as `serviceAccountKey.json` in the project root
 *   3. Paste approved emails into the APPROVED_EMAILS array below
 *   4. Run: npx tsx scripts/seed-allowlist.ts
 *
 * Each email becomes a document in `allowedEmails/{email}` so lookups are
 * a direct get (no query needed). Re-running is safe — existing docs are skipped.
 */

import * as admin from "firebase-admin";
import { createRequire } from "module";

// ── Firebase Admin init ───────────────────────────────────────────────────────
const require = createRequire(import.meta.url);
let serviceAccount: object;
try {
  serviceAccount = require("../serviceAccountKey.json");
} catch {
  console.error(
    "\n❌  serviceAccountKey.json not found in project root.\n" +
    "   Go to Firebase Console → Project Settings → Service Accounts\n" +
    "   → Generate new private key, and save it as serviceAccountKey.json\n"
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount as admin.ServiceAccount) });
const db = admin.firestore();

// ── Paste approved emails here ────────────────────────────────────────────────
// One email per line. Must be @uw.edu addresses.
const APPROVED_EMAILS: string[] = [
  // example@uw.edu,
  // another@uw.edu,
];
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  if (APPROVED_EMAILS.length === 0) {
    console.error("\n❌  APPROVED_EMAILS is empty. Paste emails into the array and re-run.\n");
    process.exit(1);
  }

  const emails = APPROVED_EMAILS.map((e) => e.trim().toLowerCase()).filter(Boolean);
  const invalid = emails.filter((e) => !e.endsWith("@uw.edu"));
  if (invalid.length > 0) {
    console.error("\n❌  Non-@uw.edu emails found:\n  " + invalid.join("\n  ") + "\n");
    process.exit(1);
  }

  console.log(`\n🌱  Seeding allowedEmails — ${emails.length} email(s)...\n`);

  const col = db.collection("allowedEmails");
  let added = 0;
  let skipped = 0;

  for (const email of emails) {
    const ref = col.doc(email);
    const snap = await ref.get();
    if (snap.exists) {
      console.log(`  ⏭  Already exists: ${email}`);
      skipped++;
    } else {
      await ref.set({ email, addedAt: admin.firestore.Timestamp.now() });
      console.log(`  ✅  Added: ${email}`);
      added++;
    }
  }

  console.log(`\n✅  Done. ${added} added, ${skipped} skipped.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌  Error:", err);
  process.exit(1);
});
