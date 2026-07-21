/**
 * bench.js - Benchmark Script
 * Menghitung total data yang ditarik dan berapa lama waktu eksekusi query
 * untuk setiap tabel di database JDI.
 *
 * Usage: node bench.js
 */

import pkg from 'pg';
import config from './config.js';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: config.databaseURL,
});

// Warna terminal
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
};

function colorDuration(ms) {
  if (ms < 500)  return `${C.green}${ms}ms${C.reset}`;
  if (ms < 2000) return `${C.yellow}${ms}ms${C.reset}`;
  return `${C.red}${ms}ms${C.reset}`;
}

function formatNumber(n) {
  return n.toLocaleString('id-ID');
}

// Daftar tabel yang akan di-benchmark
const benchmarks = [
  { label: 'tb_employee',          countSql: 'SELECT COUNT(*) AS total FROM tb_employee',          fetchSql: 'SELECT * FROM tb_employee LIMIT 10' },
  { label: 'tb_attendance_daily',  countSql: 'SELECT COUNT(*) AS total FROM tb_attendance_daily',  fetchSql: 'SELECT * FROM tb_attendance_daily LIMIT 10' },
  { label: 'tb_attendance_monthly',countSql: 'SELECT COUNT(*) AS total FROM tb_attendance_monthly',fetchSql: 'SELECT * FROM tb_attendance_monthly LIMIT 10' },
  { label: 'tb_training',          countSql: 'SELECT COUNT(*) AS total FROM tb_training',          fetchSql: 'SELECT * FROM tb_training LIMIT 10' },
];

async function runBenchmark() {
  console.log('\n' + C.bold + C.cyan + '+------------------------------------------------------+' + C.reset);
  console.log(C.bold + C.cyan + '¦         JDI DATABASE BENCHMARK TOOL                 ¦' + C.reset);
  console.log(C.bold + C.cyan + '+------------------------------------------------------+' + C.reset + '\n');
  console.log(C.dim + 'Waktu mulai : ' + new Date().toLocaleString('id-ID') + C.reset);
  console.log(C.dim + 'Port Server : ' + config.port + C.reset + '\n');

  // Cek koneksi
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log(C.green + '? Koneksi database berhasil' + C.reset + '\n');
  } catch (err) {
    console.error(C.red + '? Koneksi database gagal: ' + err.message + C.reset);
    process.exit(1);
  }

  const results = [];
  const overallStart = Date.now();

  for (const bench of benchmarks) {
    process.stdout.write(C.white + '? Mengukur ' + bench.label + '...' + C.reset + ' ');

    // COUNT total
    const countStart = Date.now();
    const countRes = await pool.query(bench.countSql);
    const countDuration = Date.now() - countStart;
    const totalRows = parseInt(countRes.rows[0].total, 10);

    // FETCH sample 10 rows
    const fetchStart = Date.now();
    const fetchRes = await pool.query(bench.fetchSql);
    const fetchDuration = Date.now() - fetchStart;
    const columnCount = fetchRes.fields ? fetchRes.fields.length : '-';

    console.log(C.bold + C.green + '?' + C.reset);
    results.push({ label: bench.label, totalRows, columnCount, countDuration, fetchDuration });
  }

  const overallDuration = Date.now() - overallStart;

  // Tampilkan hasil
  console.log('\n' + C.bold + C.cyan + '+----------------------------------------------------------------------+' + C.reset);
  console.log(C.bold + C.cyan + '¦                         HASIL BENCHMARK                             ¦' + C.reset);
  console.log(C.bold + C.cyan + '+----------------------------------------------------------------------+' + C.reset);

  const line = '-'.repeat(78);
  console.log('\n  ' + C.bold + C.magenta +
    'Tabel'.padEnd(28) + 'Total Data'.padStart(14) + 'Kolom'.padStart(8) + 'Durasi COUNT'.padStart(16) + 'Durasi FETCH'.padStart(16) +
    C.reset);
  console.log('  ' + line);

  let grandTotal = 0;
  for (const r of results) {
    grandTotal += r.totalRows;
    console.log(
      '  ' + C.white + r.label.padEnd(28) + C.reset +
      C.bold + C.green + formatNumber(r.totalRows).padStart(14) + C.reset +
      C.dim + String(r.columnCount).padStart(8) + C.reset +
      '  ' + colorDuration(r.countDuration).padStart(14) +
      '  ' + colorDuration(r.fetchDuration).padStart(14)
    );
  }

  console.log('  ' + line);
  console.log('  ' + C.bold + 'GRAND TOTAL'.padEnd(28) + formatNumber(grandTotal).padStart(14) + ' rows' + C.reset);

  console.log('\n' + C.bold + C.cyan + '+- RINGKASAN ----------------------------------------------------------+' + C.reset);
  console.log(C.cyan + '¦' + C.reset + '  Total semua data      : ' + C.bold + C.green + formatNumber(grandTotal) + ' rows' + C.reset);
  console.log(C.cyan + '¦' + C.reset + '  Total waktu eksekusi  : ' + colorDuration(overallDuration));
  console.log(C.cyan + '¦' + C.reset + '  Selesai pada          : ' + C.dim + new Date().toLocaleString('id-ID') + C.reset);
  console.log(C.bold + C.cyan + '+----------------------------------------------------------------------+' + C.reset + '\n');

  await pool.end();
}

runBenchmark().catch((err) => {
  console.error('\n' + '\x1b[31m' + '[ERROR] ' + err.message + '\x1b[0m');
  process.exit(1);
});
