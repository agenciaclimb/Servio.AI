import { execSync } from "child_process";
import fs from "fs";

const title = process.argv[2];
const branch = process.argv[3] || "main";

if (!title) {
  console.error("Uso: node createPR.js <titulo_do_pr> [branch_base]");
  process.exit(1);
}

// Obtém o branch atual
const currentBranch = execSync("git branch --show-current", {
  encoding: "utf8"
}).trim();

// Cria o PR via gh CLI
const prNumber = execSync(
  `gh pr create --title "${title}" --body "PR criado automaticamente pelo sistema de automação" --base ${branch} --head ${currentBranch}`,
  { encoding: "utf8" }
);

console.log(`✅ PR criado com sucesso!`);
console.log(prNumber);

// Salva número do PR para referência
const prMatch = prNumber.match(/\/pull\/(\d+)/);
if (prMatch) {
  fs.writeFileSync("automation_output/last_pr.txt", prMatch[1]);
  console.log(`📝 Número do PR salvo: ${prMatch[1]}`);
}
