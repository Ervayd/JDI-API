/**
 * test-endpoints.js
 * CLI API Test Runner untuk JDI REST API.
 *
 * Usage:
 *   node test-endpoints.js
 *   node test-endpoints.js employees
 *   node test-endpoints.js daily
 */

const args = process.argv.slice(2).filter(a => !a.startsWith('http'));
const baseArg = process.argv.slice(2).find(a => a.startsWith('http'));
const BASE_URL = baseArg || 'http://localhost:8081';
const ALL = 9999999;

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  magenta: '\x1b[35m',
  white:   '\x1b[37m',
  dim:     '\x1b[2m',
  blue:    '\x1b[34m',
};

function formatNumber(n) { 
  return Number(n).toLocaleString('id-ID'); 
}

function formatBytes(b) {
  if (b < 1024)         return b + ' B';
  if (b < 1024 * 1024)  return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(2) + ' MB';
}

const ALL_ENDPOINTS = [
  { key: 'status',   name: 'GET /status',                path: '/status',                          isStatus: true },
  { key: 'employees',name: 'GET /employees',            path: '/employees?limit=' + ALL },
  { key: 'daily',    name: 'GET /attendance/daily',     path: '/attendance/daily?limit=' + ALL },
  { key: 'monthly',  name: 'GET /attendance/monthly',   path: '/attendance/monthly?limit=' + ALL },
  { key: 'training', name: 'GET /training',            path: '/training?limit=' + ALL },
];

const endpoints = args.length === 0
  ? ALL_ENDPOINTS
  : ALL_ENDPOINTS.filter(ep => args.some(a => ep.key.includes(a.toLowerCase())));

if (endpoints.length === 0) {
  console.log('\n' + C.red + '[ERROR] Endpoint tidak ditemukan. Pilihan valid: status, employees, daily, monthly, training' + C.reset);
  process.exit(1);
}

const AUTH_USER = process.env.BASIC_AUTH_USER || 'JDI-API';
const AUTH_PASS = process.env.BASIC_AUTH_PASS || 'JDI-GO2026';
const AUTH_HEADER = 'Basic ' + Buffer.from(`${AUTH_USER}:${AUTH_PASS}`).toString('base64');

async function testEndpoint(ep) {
  const url = BASE_URL + ep.path;
  const start = Date.now();
  try {
    const res  = await fetch(url, {
      headers: {
        'Authorization': AUTH_HEADER
      }
    });
    const text = await res.text();
    const duration  = Date.now() - start;
    const sizeBytes = Buffer.byteLength(text, 'utf8');
    let body = null;
    try { body = JSON.parse(text); } catch (_) {}
    return { ep, status: res.status, body, duration, sizeBytes };
  } catch (err) {
    return { ep, status: 0, body: null, duration: Date.now() - start, sizeBytes: 0, error: err.message };
  }
}

async function run() {
  console.log('\n' + C.bold + C.cyan + ' JDI API TEST RUNNER' + C.reset);
  console.log(C.dim + ' Target: ' + BASE_URL + C.reset);
  console.log(C.dim + ' ------------------------------------------------------------' + C.reset);

  const overallStart = Date.now();
  const stats = [];

  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i];
    const result = await testEndpoint(ep);
    
    if (result.error) {
      console.log(` ${C.red}[FAIL]${C.reset} ${C.bold}${ep.name}${C.reset} ${C.dim}|${C.reset} ${C.red}Connection error (${result.error})${C.reset}`);
      stats.push({ success: false, totalRows: 0, duration: result.duration, sizeBytes: 0 });
      continue;
    }

    if (result.status >= 200 && result.status < 300) {
      let info = '';
      let totalRows = 0;

      if (ep.isStatus && result.body) {
        info = `DB: ${result.body.db_status === 'connected' ? C.green + 'connected' : C.red + result.body.db_status}${C.reset}`;
      } else if (result.body) {
        totalRows = result.body.meta?.totalItems !== undefined 
          ? result.body.meta.totalItems 
          : (result.body.total !== undefined ? result.body.total : (Array.isArray(result.body.data) ? result.body.data.length : 0));
        info = `${C.bold}${C.green}${formatNumber(totalRows)}${C.reset} rows`;
      }

      const sizeStr = formatBytes(result.sizeBytes);
      const timeStr = result.duration < 1000 ? `${C.green}${result.duration}ms${C.reset}` : `${C.yellow}${result.duration}ms${C.reset}`;

      console.log(` ${C.green}[PASS]${C.reset} ${C.bold}${ep.name.padEnd(25)}${C.reset} ${C.dim}|${C.reset} ${timeStr.padStart(15)} ${C.dim}|${C.reset} ${sizeStr.padStart(10)} ${C.dim}|${C.reset} ${info}`);
      stats.push({ success: true, totalRows, duration: result.duration, sizeBytes: result.sizeBytes });
    } else {
      console.log(` ${C.red}[FAIL]${C.reset} ${C.bold}${ep.name}${C.reset} ${C.dim}|${C.reset} HTTP ${result.status}`);
      stats.push({ success: false, totalRows: 0, duration: result.duration, sizeBytes: 0 });
    }
  }

  const overallDuration = Date.now() - overallStart;
  const grandTotal = stats.reduce((a, s) => a + (s.totalRows || 0), 0);
  const grandSize  = stats.reduce((a, s) => a + (s.sizeBytes || 0), 0);
  const passed     = stats.filter(s => s.success).length;
  const failed     = stats.filter(s => !s.success).length;

  console.log(C.dim + ' ------------------------------------------------------------' + C.reset);
  console.log(` ${C.bold}Test Summary:${C.reset}`);
  console.log(`   Endpoints : ${C.green}${passed} passed${C.reset}${failed > 0 ? `, ${C.red}${failed} failed` : ''}, ${stats.length} total`);
  if (grandTotal > 0) {
    console.log(`   Total Data: ${C.bold}${C.green}${formatNumber(grandTotal)}${C.reset} rows (${formatBytes(grandSize)})`);
  }
  console.log(`   Time      : ${C.bold}${C.cyan}${(overallDuration / 1000).toFixed(2)}s${C.reset}\n`);
}

run().catch(err => {
  console.error('\n' + C.red + '[FATAL] ' + err.message + C.reset);
  process.exit(1);
});
