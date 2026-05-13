// One-off migration: add siteRole to allowedEmails docs and replace isAdmin with siteRole on users docs.
// Run ONCE before deploying the role-aware code: npx ts-node --esm scripts/migrate-roles.ts
// IMPORTANT: Add your admin email addresses to ADMIN_EMAILS before running.
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, deleteField } from "firebase/firestore";

// ─── EDIT THIS before running ─────────────────────────────────────────────────
const ADMIN_EMAILS: Set<string> = new Set([
  // "youremail@uw.edu",
]);
// ──────────────────────────────────────────────────────────────────────────────

// Paste your Firebase config here (same values as in lib/firebase.ts)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateAllowedEmails() {
  const snap = await getDocs(collection(db, "allowedEmails"));
  let updated = 0;
  for (const docSnap of snap.docs) {
    const email = docSnap.id.toLowerCase();
    const role = ADMIN_EMAILS.has(email) ? "admin" : "member";
    await updateDoc(doc(db, "allowedEmails", docSnap.id), { role });
    console.log(`  allowedEmails/${docSnap.id} → role: ${role}`);
    updated++;
  }
  console.log(`allowedEmails: ${updated} documents updated`);
}

async function migrateUsers() {
  const snap = await getDocs(collection(db, "users"));
  let updated = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if ("isAdmin" in data) {
      const siteRole = data.isAdmin === true ? "admin" : "member";
      await updateDoc(doc(db, "users", docSnap.id), {
        siteRole,
        isAdmin: deleteField(),
      });
      console.log(`  users/${docSnap.id} → siteRole: ${siteRole}, removed isAdmin`);
      updated++;
    }
  }
  console.log(`users: ${updated} documents updated`);
}

async function main() {
  console.log("Starting migration...");
  console.log("\nMigrating allowedEmails collection:");
  await migrateAllowedEmails();
  console.log("\nMigrating users collection:");
  await migrateUsers();
  console.log("\nMigration complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
