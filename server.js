import express from 'express';
import cors from 'cors';
import compression from 'compression';
import config from './config.js';
import { query, checkConnection } from './db.js';

const app = express();
const startTime = new Date();

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[Express Server] ${req.method} ${req.originalUrl} from ${req.ip} completed in ${duration}ms`);
  });
  next();
});

// Basic Auth Middleware
const basicAuth = (req, res, next) => {
  // Public access for health check status endpoint
  if (req.path === '/status') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Authorization Required"');
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  if (username === config.basicAuth.user && password === config.basicAuth.pass) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Authorization Required"');
  return res.status(401).json({ error: 'Unauthorized: Invalid username or password' });
};

app.use(basicAuth);

// Helper for mapping
const mapEmployee = (row) => ({
  empId: row.EMP_ID,
  empNo: row.EMP_NO,
  name: row.NAME,
  positionNameEn: row.POSITION_NAME_EN,
  jobPosition: row.JOB_POSITION,
  lob: row.LOB,
  departmentName: row.DEPARTMENT_NAME,
  subDepartmentName: row.SUB_DEPARTMENT_NAME,
  workLocationCode: row.WORKLOCATION_CODE,
  spvId: row.SPV_ID,
  spvName: row.SPV_NAME,
  airline: row.AIRLINE,
  empType: row.EMP_TYPE,
  vendorName: row.VENDOR_NAME,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapAttendanceDaily = (row) => ({
  atdId: row.ATD_ID,
  attendId: row.ATTEND_ID ? String(row.ATTEND_ID) : null,
  empNo: row.EMP_NO,
  name: row.NAME,
  shiftStart: row.SHIFT_START,
  shiftBreakStart1: row.SHIFTBREAK_START1,
  shiftBreakEnd1: row.SHIFTBREAK_END1,
  shiftEnd: row.SHIFT_END,
  startTime: row.START_TIME,
  actualBreakStart1: row.ACTUAL_BREAKSTART1,
  actualBreakEnd1: row.ACTUAL_BREAKEND1,
  endTime: row.END_TIME,
  attendCode: row.ATTEND_CODE,
  otRealInMinutes: row.OT_REAL_IN_MINUTES,
  otIndexInHour: row.OT_INDEX_IN_HOUR ? parseFloat(row.OT_INDEX_IN_HOUR) : null,
  otphRealInMinutes: row.OTPH_REAL_IN_MINUTES,
  otphIndexInHour: row.OTPH_INDEX_IN_HOUR ? parseFloat(row.OTPH_INDEX_IN_HOUR) : null,
  lastUpdate: row.LAST_UPDATE,
  remark: row.REMARK
});

const mapAttendanceMonthly = (row) => ({
  atmId: row.ATM_ID,
  attendId: row.ATTEND_ID ? String(row.ATTEND_ID) : null,
  empNo: row.EMP_NO,
  name: row.NAME,
  shiftStart: row.SHIFT_START,
  shiftBreakStart1: row.SHIFTBREAK_START1,
  shiftBreakEnd1: row.SHIFTBREAK_END1,
  shiftEnd: row.SHIFT_END,
  startTime: row.START_TIME,
  actualBreakStart1: row.ACTUAL_BREAKSTART1,
  actualBreakEnd1: row.ACTUAL_BREAKEND1,
  endTime: row.END_TIME,
  attendCode: row.ATTEND_CODE,
  otRealInMinutes: row.OT_REAL_IN_MINUTES,
  otIndexInHour: row.OT_INDEX_IN_HOUR ? parseFloat(row.OT_INDEX_IN_HOUR) : null,
  otphRealInMinutes: row.OTPH_REAL_IN_MINUTES,
  otphIndexInHour: row.OTPH_INDEX_IN_HOUR ? parseFloat(row.OTPH_INDEX_IN_HOUR) : null,
  lastUpdate: row.LAST_UPDATE,
  remark: row.REMARK
});

const mapTraining = (row) => ({
  trainingId: row.TRAINING_ID ? String(row.TRAINING_ID) : null,
  empNo: row.EMP_NO,
  name: row.NAME,
  trainingSubject: row.TRAINING_SUBJECT,
  certificateNo: row.CERTIFICATE_NO,
  trainingDate: row.TRAINING_DATE,
  certDate: row.CERT_DATE,
  certExpired: row.CERT_EXPIRED,
  createdAt: row.CREATED_AT,
  updatedAt: row.UPDATED_AT
});

// Routes
app.get('/status', async (req, res) => {
  let dbStatus = 'connected';
  try {
    await checkConnection();
  } catch (err) {
    dbStatus = `disconnected: ${err.message}`;
  }

  res.json({
    status: 'running',
    db_status: dbStatus,
    uptime: `${((new Date() - startTime) / 1000).toFixed(2)}s`,
    service: 'JDI Express.js REST API',
    server_time: new Date().toISOString(),
  });
});

app.get('/employees', async (req, res) => {
  try {
    const q = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    let countSql = `SELECT COUNT(*) AS total FROM tb_employee`;
    let sql = `
      SELECT 
        "EMP_ID", "EMP_NO", "NAME", "POSITION_NAME_EN", "JOB_POSITION", 
        "LOB", "DEPARTMENT_NAME", "SUB_DEPARTMENT_NAME", "WORKLOCATION_CODE", 
        "SPV_ID", "SPV_NAME", "AIRLINE", "EMP_TYPE", "VENDOR_NAME", 
        "is_active", "created_at", "updated_at" 
      FROM tb_employee
    `;
    const countParams = [];
    const params = [];

    if (q) {
      const searchPattern = `%${q}%`;
      countSql += ` WHERE "EMP_NO" ILIKE $1 OR "NAME" ILIKE $1 OR "JOB_POSITION" ILIKE $1`;
      countParams.push(searchPattern);

      sql += ` WHERE "EMP_NO" ILIKE $1 OR "NAME" ILIKE $1 OR "JOB_POSITION" ILIKE $1`;
      params.push(searchPattern);
      sql += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      sql += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const [countRes, dataRes] = await Promise.all([
      query(countSql, countParams),
      query(sql, params)
    ]);

    const total = parseInt(countRes.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      total,
      page,
      limit,
      totalPages,
      data: dataRes.rows.map(mapEmployee)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/attendance/daily', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM tb_attendance_daily`;
    const sql = `
      SELECT 
        "ATD_ID", "ATTEND_ID", "EMP_NO", "NAME", "SHIFT_START", 
        "SHIFTBREAK_START1", "SHIFTBREAK_END1", "SHIFT_END", "START_TIME", 
        "ACTUAL_BREAKSTART1", "ACTUAL_BREAKEND1", "END_TIME", "ATTEND_CODE", 
        "OT_REAL_IN_MINUTES", "OT_INDEX_IN_HOUR", "OTPH_REAL_IN_MINUTES", 
        "OTPH_INDEX_IN_HOUR", "LAST_UPDATE", "REMARK"
      FROM tb_attendance_daily
      ORDER BY "SHIFT_START" DESC, "LAST_UPDATE" DESC
      LIMIT $1 OFFSET $2
    `;

    const [countRes, dataRes] = await Promise.all([
      query(countSql),
      query(sql, [limit, offset])
    ]);

    const total = parseInt(countRes.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      total,
      page,
      limit,
      totalPages,
      data: dataRes.rows.map(mapAttendanceDaily)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/attendance/monthly', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM tb_attendance_monthly`;
    const sql = `
      SELECT 
        "ATM_ID", "ATTEND_ID", "EMP_NO", "NAME", "SHIFT_START", 
        "SHIFTBREAK_START1", "SHIFTBREAK_END1", "SHIFT_END", "START_TIME", 
        "ACTUAL_BREAKSTART1", "ACTUAL_BREAKEND1", "END_TIME", "ATTEND_CODE", 
        "OT_REAL_IN_MINUTES", "OT_INDEX_IN_HOUR", "OTPH_REAL_IN_MINUTES", 
        "OTPH_INDEX_IN_HOUR", "LAST_UPDATE", "REMARK"
      FROM tb_attendance_monthly
      ORDER BY "SHIFT_START" DESC, "LAST_UPDATE" DESC
      LIMIT $1 OFFSET $2
    `;

    const [countRes, dataRes] = await Promise.all([
      query(countSql),
      query(sql, [limit, offset])
    ]);

    const total = parseInt(countRes.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      total,
      page,
      limit,
      totalPages,
      data: dataRes.rows.map(mapAttendanceMonthly)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/training', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM tb_training`;
    const sql = `
      SELECT 
        "TRAINING_ID", "EMP_NO", "NAME", "TRAINING_SUBJECT", "CERTIFICATE_NO", 
        "TRAINING_DATE", "CERT_DATE", "CERT_EXPIRED", "CREATED_AT", "UPDATED_AT"
      FROM tb_training
      ORDER BY "CREATED_AT" DESC
      LIMIT $1 OFFSET $2
    `;

    const [countRes, dataRes] = await Promise.all([
      query(countSql),
      query(sql, [limit, offset])
    ]);

    const total = parseInt(countRes.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      total,
      page,
      limit,
      totalPages,
      data: dataRes.rows.map(mapTraining)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(config.port, () => {
  console.log(`[Express Server] Starting REST API Server on port ${config.port}...`);
});
