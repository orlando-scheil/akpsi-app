/**
 * Interactive CLI seed script — adds real member profiles to Firestore.
 *
 * Setup (one-time):
 *   1. Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save the downloaded file as `serviceAccountKey.json` in the project root
 *   3. Run: npx tsx scripts/seed-member.ts
 *
 * The script prompts for each field, auto-generates Firestore doc IDs,
 * and resolves big/little links by name → UID lookup.
 */

import * as admin from "firebase-admin";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const rl = readline.createInterface({ input, output });

async function ask(question: string, fallback = ""): Promise<string> {
  const answer = await rl.question(`  ${question}${fallback ? ` [${fallback}]` : ""}: `);
  return answer.trim() || fallback;
}

async function askRequired(question: string): Promise<string> {
  while (true) {
    const answer = await rl.question(`  ${question} (required): `);
    if (answer.trim()) return answer.trim();
    console.log("    ⚠  This field is required.");
  }
}

async function askChoice<T extends string>(
  question: string,
  choices: T[],
  fallback: T
): Promise<T> {
  const choiceStr = choices.join(" / ");
  while (true) {
    const answer = (await ask(`${question} (${choiceStr})`, fallback)).toLowerCase();
    const match = choices.find((c) => c.toLowerCase() === answer);
    if (match) return match;
    console.log(`    ⚠  Enter one of: ${choiceStr}`);
  }
}

async function askNumber(question: string, fallback: number): Promise<number> {
  while (true) {
    const answer = await ask(question, String(fallback));
    const n = parseInt(answer, 10);
    if (!isNaN(n)) return n;
    console.log("    ⚠  Enter a valid number.");
  }
}

// ── Big lookup ─────────────────────────────────────────────────────────────────
/** session-level registry: display name → uid */
const sessionMembers = new Map<string, { uid: string; firstName: string; lastName: string }>();

async function loadExistingMembers() {
  const snap = await db.collection("users").get();
  for (const doc of snap.docs) {
    const d = doc.data();
    const fullName = `${d.firstName} ${d.lastName}`.toLowerCase();
    sessionMembers.set(fullName, { uid: doc.id, firstName: d.firstName, lastName: d.lastName });
  }
  console.log(`  ℹ  Loaded ${snap.size} existing member(s) for big lookup.\n`);
}

async function resolveBig(rl: readline.Interface): Promise<{ bigUid: string | null; bigName: string | null }> {
  const input = await ask("Big's name (leave blank if none)");
  if (!input) return { bigUid: null, bigName: null };

  const query = input.toLowerCase();
  const matches = [...sessionMembers.entries()].filter(([name]) => name.includes(query));

  if (matches.length === 0) {
    console.log(`    ℹ  No match found for "${input}" — saving as ghost (bigName only).`);
    return { bigUid: null, bigName: input };
  }

  if (matches.length === 1) {
    const [, m] = matches[0];
    console.log(`    ✓  Matched: ${m.firstName} ${m.lastName} (${m.uid})`);
    return { bigUid: m.uid, bigName: null };
  }

  // Multiple matches — let user pick
  console.log("    Multiple matches:");
  matches.forEach(([, m], i) => console.log(`      ${i + 1}. ${m.firstName} ${m.lastName} (${m.uid})`));
  while (true) {
    const pick = await rl.question("    Pick a number: ");
    const idx = parseInt(pick.trim(), 10) - 1;
    if (idx >= 0 && idx < matches.length) {
      const [, m] = matches[idx];
      return { bigUid: m.uid, bigName: null };
    }
    console.log("    ⚠  Invalid selection.");
  }
}

// ── Main loop ─────────────────────────────────────────────────────────────────
async function addMember() {
  console.log("\n─────────────────────────────────────");
  console.log("  New Member");
  console.log("─────────────────────────────────────");

  const firstName   = await askRequired("First name");
  const lastName    = await askRequired("Last name");
  const preferredName = (await ask("Preferred name (if different from first name)")) || null;
  const email       = await askRequired("UW email (@uw.edu)");
  const major       = await askRequired("Major");
  const graduationYear = await askNumber("Graduation year", 2026);
  const pledgeClassQuarter = await askChoice("Pledge class quarter", ["Fall", "Spring"] as const, "Fall");
  const pledgeClassYear = await askNumber("Pledge class year", 2024);
  const status      = await askChoice("Status", ["active", "alumni", "inactive"] as const, "active");
  const role        = (await ask("Chapter role (e.g. President, VP Finance — blank if none)")) || null;
  const { bigUid, bigName } = await resolveBig(rl);
  const phone       = (await ask("Phone number (blank if none)")) || null;
  const bio         = (await ask("Bio (blank if none)")) || null;
  const industriesRaw = await ask("Industries (comma-separated, e.g. Finance, Technology)");
  const industries  = industriesRaw ? industriesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const docRef = db.collection("users").doc(); // auto-generate ID
  const uid = docRef.id;

  const memberData = {
    firstName,
    lastName,
    preferredName,
    profilePhotoUrl: null,
    email,
    major,
    graduationYear,
    pledgeClassQuarter,
    pledgeClassYear,
    status,
    role,
    familyId: null,
    familyName: null,
    bigUid,
    bigName,
    phone,
    preferredContact: null,
    socialLinks: [],
    bio,
    industries,
    joinedAt: admin.firestore.Timestamp.now(),
    lastActive: admin.firestore.Timestamp.now(),
    isAdmin: false,
  };

  await docRef.set(memberData);

  // Register in session for subsequent big lookups
  const fullName = `${firstName} ${lastName}`.toLowerCase();
  sessionMembers.set(fullName, { uid, firstName, lastName });

  console.log(`\n  ✅  Added ${firstName} ${lastName} (uid: ${uid})\n`);
}

async function main() {
  console.log("\n🌱  AKPsi Member Seed Script");
  console.log("   Ctrl+C to exit at any time.\n");

  await loadExistingMembers();

  while (true) {
    await addMember();
    const again = await askChoice("Add another member?", ["y", "n"] as const, "y");
    if (again === "n") break;
  }

  console.log("\n✅  Done. All members written to Firestore.\n");
  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌  Error:", err);
  rl.close();
  process.exit(1);
});
