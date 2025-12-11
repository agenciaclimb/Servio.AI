import { execSync } from "child_process";

const pr = process.argv[2];

if (!pr) {
  console.error("Uso: node mergePR.js <numero_do_pr>");
  process.exit(1);
}

// Verifica status do PR
const prStatus = execSync(`gh pr view ${pr} --json state,mergeable`, {
  encoding: "utf8"
});

const status = JSON.parse(prStatus);

if (status.state !== "OPEN") {
  console.error(`❌ PR #${pr} não está aberto. Status: ${status.state}`);
  process.exit(1);
}

if (status.mergeable !== "MERGEABLE") {
  console.error(`❌ PR #${pr} não está pronto para merge. Mergeable: ${status.mergeable}`);
  process.exit(1);
}

// Faz merge
execSync(`gh pr merge ${pr} --squash --delete-branch`, { stdio: "inherit" });

console.log(`✅ PR #${pr} merged com sucesso!`);
