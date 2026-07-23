import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const inputPath = path.resolve('api-docs.html');
const outputPath = path.resolve('JDI_API_Documentation.pdf');

const args = [
  '--headless=old',
  '--disable-gpu',
  '--no-sandbox',
  '--no-pdf-header-footer',
  `--print-to-pdf=${outputPath}`,
  inputPath
];

console.log('Spawning Microsoft Edge to print PDF...');
console.log('Executable:', edgePath);
console.log('Arguments:', args);

execFile(edgePath, args, (err, stdout, stderr) => {
  if (err) {
    console.error('Execution failed:', err);
    process.exit(1);
  }
  
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    console.log(`Success! PDF generated at ${outputPath} (${stats.size} bytes)`);
  } else {
    console.error('Edge finished but output PDF file was not found.');
    process.exit(1);
  }
});
