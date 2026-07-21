/**
 * create-indexes.js
 * Script untuk membuat index pada database PostgreSQL agar query sorting berjalan lebih cepat.
 */

import pool, { query } from './db.js';

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
};

const indexes = [
  {
    name: 'idx_tb_employee_created_at',
    sql: 'CREATE INDEX IF NOT EXISTS idx_tb_employee_created_at ON tb_employee("created_at" DESC)'
  },
  {
    name: 'idx_tb_attendance_daily_shift_start_last_update',
    sql: 'CREATE INDEX IF NOT EXISTS idx_tb_attendance_daily_shift_start_last_update ON tb_attendance_daily("SHIFT_START" DESC, "LAST_UPDATE" DESC)'
  },
  {
    name: 'idx_tb_attendance_monthly_shift_start_last_update',
    sql: 'CREATE INDEX IF NOT EXISTS idx_tb_attendance_monthly_shift_start_last_update ON tb_attendance_monthly("SHIFT_START" DESC, "LAST_UPDATE" DESC)'
  },
  {
    name: 'idx_tb_training_created_at',
    sql: 'CREATE INDEX IF NOT EXISTS idx_tb_training_created_at ON tb_training("CREATED_AT" DESC)'
  }
];

async function run() {
  console.log('\n' + C.bold + C.cyan + '+------------------------------------------------------+' + C.reset);
  console.log(C.bold + C.cyan + '¦         MEMBUAT DATABASE INDEXES                     ¦' + C.reset);
  console.log(C.bold + C.cyan + '+------------------------------------------------------+' + C.reset + '\n');

  for (const idx of indexes) {
    process.stdout.write('? Membuat index ' + C.bold + idx.name + C.reset + '... ');
    const start = Date.now();
    try {
      await query(idx.sql);
      const duration = Date.now() - start;
      console.log(C.green + '? BERHASIL (' + duration + 'ms)' + C.reset);
    } catch (err) {
      console.log(C.red + '? GAGAL' + C.reset);
      console.error(C.red + '  Detail error: ' + err.message + C.reset);
    }
  }

  console.log('\n' + C.green + '?? Semua pembuatan index selesai.' + C.reset + '\n');
  await pool.end();
}

run().catch(async (err) => {
  console.error('\n' + C.red + '[FATAL] ' + err.message + C.reset);
  try { await pool.end(); } catch (_) {}
  process.exit(1);
});
