﻿/**
 * scripts/firestore_seed.mjs
 * - Usa Application Default Credentials (fornecidas pela action de auth)
 * - Garante coleções básicas e um meta.schemaVersion
 */
import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

const REPO = process.cwd();
const DOC = path.join(REPO, "doc", "DOCUMENTO_MESTRE_SERVIO_AI.md");
const reason = process.env.SEED_REASON || "";

function stamp() {
  const d = new Date();
  const p = (n)=>String(n).padStart(2,"0");
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}
const db = admin.firestore();

async function ensureMeta() {
  const ref = db.collection("_meta").doc("schema");
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ version: 1, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    return "created";
  } else {
    return "exists";
  }
}

async function ensureCollections() {
  // Exemplos mínimos; expanda conforme o documento mestre
  const usersRef = db.collection("users");
  const jobsRef = db.collection("jobs");

  // Seed opcional: garante um admin se não existir
  const adminQ = await usersRef.where("type","==","admin").limit(1).get();
  if (adminQ.empty) {
    await usersRef.add({
      email: "admin@servio.ai",
      name: "Admin",
      type: "admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

function appendUpdateLog(txt) {
  try {
    if (!fs.existsSync(DOC)) return;
    const line = `#update_log - ${stamp()}
${txt}${reason ? " | Motivo: "+reason : ""}

`;
    let md = fs.readFileSync(DOC, "utf-8");
    if (!md.includes("## Logs de Atualização (IA)")) {
      md += `

---

## Logs de Atualização (IA)
${line}`;
    } else {
      md += `

${line}`;
    }
    fs.writeFileSync(DOC, md, "utf-8");
  } catch (e) {
    console.error("Falha ao atualizar Documento Mestre:", e.message);
  }
}

(async () => {
  const meta = await ensureMeta();
  await ensureCollections();
  appendUpdateLog(`Seed/Migrate Firestore executado. _meta.schema=${meta}. Estruturas mínimas revisadas.`);
  console.log("Seed finalizado com sucesso.");
})();
