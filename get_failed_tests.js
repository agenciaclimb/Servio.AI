import fs from 'fs';
try {
  const fileContent = fs.readFileSync('test_result.json', 'utf16le');
  const cleanContent = fileContent.trim().replace(/^\uFEFF/, '');
  const data = JSON.parse(cleanContent);
  const failedFiles = data.testResults.filter(r => r.status === 'failed');
  let out = '';
  if (failedFiles.length === 0) {
    out = 'No failed test files found or parse error.\n';
  } else {
    failedFiles.forEach(file => {
      out += `File: ${file.name}\n`;
      file.assertionResults.filter(a => a.status === 'failed').forEach(a => {
        out += `  Test: ${a.title}\n`;
        if (a.failureMessages && a.failureMessages.length) {
          out += `  Error: ${a.failureMessages[0].split('\n')[0]}\n`;
        }
      });
      out += '---\n';
    });
  }
  fs.writeFileSync('failed_tests_summary.txt', out);
  console.log('Summary written to failed_tests_summary.txt');
} catch (e) {
  console.error('Error reading/parsing test_result.json:', e);
}
