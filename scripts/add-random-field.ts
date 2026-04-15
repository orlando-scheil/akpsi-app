/**
 * One-time migration — adds a `random` field to every existing gallery document.
 *
 * Why this is needed:
 * ─────────────────────────────────────────────────────────────────────────────
 * The Gallery shuffle feature (added alongside photo deletion) works by storing
 * a random float [0, 1) on each gallery document at upload time. Firestore indexes
 * this field and the shuffle query uses it as a cursor:
 *
 *   query(galleryCol, orderBy("random"), startAfter(Math.random()), limit(24))
 *
 * Photos uploaded before this feature was added don't have the `random` field,
 * so they are invisible to shuffle queries. This script patches all existing
 * documents with a random value so they become eligible.
 *
 * Safety:
 * ─────────────────────────────────────────────────────────────────────────────
 * - The script skips documents that already have a `random` field, so it is
 *   safe to re-run if interrupted partway through.
 * - Writes go through Firestore batch commits (max 500 ops per batch) to stay
 *   within Firestore limits and avoid partial failures.
 *
 * Setup (one-time):
 *   1. Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save the downloaded JSON as `serviceAccountKey.json` in the project root
 *      (it is gitignored — never commit it)
 *   3. Run: npx tsx scripts/add-random-field.ts
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
    "\nERROR: serviceAccountKey.json not found.\n" +
    "Download it from Firebase Console → Project Settings → Service Accounts\n" +
    "and place it in the project root.\n"
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

// ── Migration ─────────────────────────────────────────────────────────────────

const BATCH_SIZE = 500; // Firestore maximum writes per batch commit

async function run() {
  console.log("Fetching all gallery documents…");
  const snap = await db.collection("gallery").get();

  if (snap.empty) {
    console.log("No documents found in the gallery collection. Nothing to migrate.");
    return;
  }

  // Filter to only documents that are missing the random field.
  const toUpdate = snap.docs.filter((doc) => doc.data().random === undefined);

  console.log(`Total documents:  ${snap.size}`);
  console.log(`Already migrated: ${snap.size - toUpdate.length}`);
  console.log(`Need migration:   ${toUpdate.length}`);

  if (toUpdate.length === 0) {
    console.log("\nAll documents already have a random field. Migration complete.");
    return;
  }

  // Process in batches of BATCH_SIZE to respect Firestore limits.
  let written = 0;
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const chunk = toUpdate.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const doc of chunk) {
      batch.update(doc.ref, { random: Math.random() });
    }

    await batch.commit();
    written += chunk.length;
    console.log(`  Wrote ${written} / ${toUpdate.length}…`);
  }

  console.log(`\nDone. Assigned random values to ${toUpdate.length} documents.`);
  console.log(
    "You can now use the shuffle feature. The Firestore index on the `random` field\n" +
    "will be built automatically on the first shuffle query — this may take a minute."
  );
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
