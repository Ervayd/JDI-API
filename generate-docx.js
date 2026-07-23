import fs from 'fs';
import path from 'path';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  AlignmentType, 
  HeadingLevel, 
  PageBreak 
} from 'docx';

const COLORS = {
  primary: "0F172A",      // Slate 900
  secondary: "2563EB",    // Blue 600
  border: "E2E8F0",       // Slate 200
  bgLight: "F8FAFC",      // Slate 50
  textDark: "0F172A",     // Slate 900
  textMuted: "64748B",    // Slate 500
  white: "FFFFFF",
  zebra: "F8FAFC"
};

// Helper to create paragraphs
function createParagraph(text, options = {}) {
  const runs = [];
  if (Array.isArray(text)) {
    text.forEach(t => runs.push(t));
  } else {
    runs.push(new TextRun({
      text: text,
      font: "Calibri",
      size: options.size || 22, // 11pt
      color: options.color || COLORS.textDark,
      bold: options.bold || false,
      italics: options.italics || false
    }));
  }

  return new Paragraph({
    children: runs,
    alignment: options.alignment || AlignmentType.LEFT,
    spacing: {
      before: options.before !== undefined ? options.before : 120, // 6pt
      after: options.after !== undefined ? options.after : 120,    // 6pt
      line: 276 // 1.15 line spacing
    }
  });
}

// Helper to create Headings
function createHeading(text, level, options = {}) {
  let size = 36; // Heading 1 (18pt)
  let color = COLORS.primary;
  let before = 240;
  let after = 120;

  if (level === HeadingLevel.HEADING_2) {
    size = 28; // Heading 2 (14pt)
    color = COLORS.secondary;
    before = 180;
  } else if (level === HeadingLevel.HEADING_3) {
    size = 24; // Heading 3 (12pt)
    color = COLORS.primary;
    before = 120;
  }

  return new Paragraph({
    heading: level,
    children: [
      new TextRun({
        text: text,
        font: "Calibri",
        size: size,
        color: color,
        bold: true
      })
    ],
    spacing: { before, after }
  });
}

// Helper to create cells
function createCell(text, options = {}) {
  const paragraphs = [];
  if (Array.isArray(text)) {
    text.forEach(p => paragraphs.push(p));
  } else {
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: text,
          font: "Calibri",
          size: options.size || 20, // 10pt
          bold: options.bold || false,
          color: options.color || COLORS.textDark
        })
      ],
      spacing: { before: 60, after: 60 }
    }));
  }

  return new TableCell({
    children: paragraphs,
    shading: options.bg ? { fill: options.bg } : undefined,
    verticalAlign: options.verticalAlign || "center",
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border }
    },
    margins: {
      top: 100,
      bottom: 100,
      left: 150,
      right: 150
    }
  });
}

// Helper to create simple tables
function createTable(headers, rows) {
  const tableRows = [];
  
  // Header row
  tableRows.push(new TableRow({
    children: headers.map(h => createCell(h, {
      bold: true,
      bg: COLORS.primary,
      color: COLORS.white
    }))
  }));

  // Data rows
  rows.forEach((r, idx) => {
    const isZebra = idx % 2 === 1;
    tableRows.push(new TableRow({
      children: r.map(cellText => createCell(cellText, {
        bg: isZebra ? COLORS.zebra : undefined
      }))
    }));
  });

  return new Table({
    rows: tableRows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    }
  });
}

// Build children array
const docChildren = [];

// ================= COVER PAGE =================
docChildren.push(new Paragraph({ spacing: { before: 1440 } })); // spacer

docChildren.push(new Paragraph({
  children: [
    new TextRun({
      text: "REFERENSI DEVELOPER / INTEGRASI",
      font: "Calibri",
      size: 20,
      color: COLORS.secondary,
      bold: true
    })
  ],
  spacing: { after: 240 }
}));

docChildren.push(new Paragraph({
  children: [
    new TextRun({
      text: "JDI REST API",
      font: "Calibri",
      size: 64, // 32pt
      color: COLORS.primary,
      bold: true
    })
  ],
  spacing: { after: 120 }
}));

docChildren.push(new Paragraph({
  children: [
    new TextRun({
      text: "Dokumentasi Teknis & Spesifikasi Integrasi Layanan Backend (Express.js & PostgreSQL)",
      font: "Calibri",
      size: 24,
      color: COLORS.textMuted
    })
  ],
  spacing: { after: 2880 } // large spacer
}));

// Metadata Table on Cover Page
const metadataTable = new Table({
  rows: [
    new TableRow({
      children: [
        createCell([
          createParagraph("Versi API", { bold: true, size: 18, color: COLORS.textMuted }),
          createParagraph("1.0.0 (Production)", { bold: true, size: 20 })
        ]),
        createCell([
          createParagraph("Tanggal Rilis", { bold: true, size: 18, color: COLORS.textMuted }),
          createParagraph("Juli 2026", { bold: true, size: 20 })
        ])
      ]
    }),
    new TableRow({
      children: [
        createCell([
          createParagraph("Dibuat Dengan", { bold: true, size: 18, color: COLORS.textMuted }),
          createParagraph("Node.js, Express, PostgreSQL", { bold: true, size: 20 })
        ]),
        createCell([
          createParagraph("Dokumen ID", { bold: true, size: 18, color: COLORS.textMuted }),
          createParagraph("JDI-API-REF-2026-V1", { bold: true, size: 20 })
        ])
      ]
    })
  ],
  width: { size: 100, type: WidthType.PERCENTAGE }
});

docChildren.push(metadataTable);
docChildren.push(new PageBreak());

// ================= SECTION 1 =================
docChildren.push(createHeading("1. Pendahuluan & Gambaran Umum", HeadingLevel.HEADING_1));
docChildren.push(createParagraph(
  "JDI REST API adalah layanan API backend berbasis RESTful yang dikembangkan menggunakan framework Express.js (Node.js) dan didukung oleh database PostgreSQL. API ini dirancang untuk menyajikan data secara cepat dan efisien terkait informasi karyawan (employees), kehadiran harian (daily attendance), kehadiran bulanan (monthly attendance), serta catatan sertifikasi pelatihan karyawan (training)."
));
docChildren.push(createParagraph(
  "Seluruh endpoint yang menyajikan data sensitif dilindungi dengan protokol keamanan standar, dilengkapi dengan kompresi gzip/brotli untuk performa transfer data optimal, serta optimasi query database melalui indexing pada kolom sorting utama."
));

// Architecture description
docChildren.push(createHeading("Aliran Integrasi Sistem", HeadingLevel.HEADING_2));
docChildren.push(createParagraph(
  "Klien / Consumer -> [Basic Auth Middleware] -> Express API -> PostgreSQL DB"
));

// ================= SECTION 2 =================
docChildren.push(createHeading("2. Autentikasi & Konfigurasi Dasar", HeadingLevel.HEADING_1));
docChildren.push(createParagraph(
  "Untuk menjaga keamanan data, semua endpoint API kecuali endpoint kesehatan status (/status atau /api/status) memerlukan autentikasi. Skema autentikasi yang digunakan adalah HTTP Basic Authentication."
));
docChildren.push(createParagraph(
  "Klien harus mengirimkan header HTTP berikut pada setiap request:"
));

docChildren.push(createParagraph("Authorization: Basic <Base64(username:password)>", { 
  bold: true, 
  color: COLORS.secondary, 
  size: 22 
}));

docChildren.push(createHeading("Konfigurasi Kredensial Default", HeadingLevel.HEADING_2));
docChildren.push(createParagraph(
  "Secara default, kredensial autentikasi API dikonfigurasi melalui environment variables (.env):"
));

const credentialsTable = createTable(
  ["Variabel Env", "Kunci Kredensial", "Nilai Default"],
  [
    ["BASIC_AUTH_USER", "Username", "JDI-API"],
    ["BASIC_AUTH_PASS", "Password", "JDI-GO2026"]
  ]
);
docChildren.push(credentialsTable);

docChildren.push(createHeading("Contoh Pembuatan Header Autentikasi (Node.js)", HeadingLevel.HEADING_2));
docChildren.push(createParagraph([
  new TextRun({
    text: "const username = 'JDI-API';\nconst password = 'JDI-GO2026';\nconst credentials = Buffer.from(`${username}:${password}`).toString('base64');\nconst headers = {\n  'Authorization': `Basic ${credentials}`,\n  'Content-Type': 'application/json'\n};",
    font: "Consolas",
    size: 18,
    color: COLORS.primary
  })
]));

docChildren.push(new PageBreak());

// ================= SECTION 3 =================
docChildren.push(createHeading("3. Referensi Endpoint API", HeadingLevel.HEADING_1));

// GET /status
docChildren.push(createHeading("3.1 GET /status & /api/status (Health Check)", HeadingLevel.HEADING_2));
docChildren.push(createParagraph("Endpoint publik untuk memantau status kesehatan server dan konektivitas database. Tidak memerlukan Basic Auth."));
docChildren.push(createParagraph("Response (200 OK):", { bold: true }));
docChildren.push(createParagraph([
  new TextRun({
    text: "{\n  \"status\": \"running\",\n  \"db_status\": \"connected\",\n  \"uptime\": \"142.50s\",\n  \"service\": \"JDI Express.js REST API\",\n  \"server_time\": \"2026-07-22T01:50:16.123Z\"\n}",
    font: "Consolas",
    size: 18
  })
]));

// GET /employees
docChildren.push(createHeading("3.2 GET /employees & /api/employees (Data Karyawan)", HeadingLevel.HEADING_2));
docChildren.push(createParagraph("Mengambil daftar direktori karyawan yang terdaftar. Mendukung pencarian teks (search) dan paginasi."));

docChildren.push(createParagraph("Parameter Query:", { bold: true }));
const employeesParams = createTable(
  ["Parameter", "Tipe", "Default", "Deskripsi"],
  [
    ["q", "String", '""', "Pencarian teks parsial (case-insensitive) pada kolom NIK (EMP_NO), nama (NAME), atau jabatan (JOB_POSITION)."],
    ["page", "Integer", "1", "Halaman data yang ingin diambil."],
    ["limit", "Integer", "20", "Jumlah baris data per halaman (maksimum 100 data per request)."]
  ]
);
docChildren.push(employeesParams);

docChildren.push(createParagraph("Response (200 OK):", { bold: true }));
docChildren.push(createParagraph([
  new TextRun({
    text: "{\n  \"data\": [\n    {\n      \"empId\": 45,\n      \"empNo\": \"202409823\",\n      \"name\": \"Budi Setiawan\",\n      \"positionNameEn\": \"Operation Officer\",\n      \"jobPosition\": \"Staff Operasional\",\n      \"lob\": \"LOGISTICS\",\n      \"departmentName\": \"Cargo Operation\",\n      \"subDepartmentName\": \"Warehouse Delivery\",\n      \"workLocationCode\": \"CGK-WH\",\n      \"spvId\": \"10234\",\n      \"spvName\": \"Heri Prasetyo\",\n      \"airline\": \"Garuda Indonesia\",\n      \"empType\": \"PERMANENT\",\n      \"vendorName\": null,\n      \"isActive\": true,\n      \"createdAt\": \"2026-07-20T14:32:00.000Z\",\n      \"updatedAt\": \"2026-07-21T08:15:30.000Z\"\n    }\n  ],\n  \"meta\": {\n    \"totalItems\": 1,\n    \"itemCount\": 1,\n    \"itemsPerPage\": 2,\n    \"totalPages\": 1,\n    \"currentPage\": 1,\n    \"hasNextPage\": false,\n    \"hasPreviousPage\": false\n  }\n}",
    font: "Consolas",
    size: 18
  })
]));

docChildren.push(new PageBreak());

// GET /attendance/daily
docChildren.push(createHeading("3.3 GET /attendance/daily & /api/attendance/daily (Kehadiran Harian)", HeadingLevel.HEADING_2));
docChildren.push(createParagraph("Mengambil log kehadiran harian karyawan. Diurutkan secara descending berdasarkan SHIFT_START."));

docChildren.push(createParagraph("Parameter Query:", { bold: true }));
const dailyParams = createTable(
  ["Parameter", "Tipe", "Default", "Deskripsi"],
  [
    ["page", "Integer", "1", "Halaman data yang ingin diambil."],
    ["limit", "Integer", "20", "Jumlah baris data per halaman (maksimum 100 data per request)."]
  ]
);
docChildren.push(dailyParams);

docChildren.push(createParagraph("Response (200 OK):", { bold: true }));
docChildren.push(createParagraph([
  new TextRun({
    text: "{\n  \"data\": [\n    {\n      \"atdId\": 82012,\n      \"attendId\": \"9082341\",\n      \"empNo\": \"202409823\",\n      \"name\": \"Budi Setiawan\",\n      \"shiftStart\": \"2026-07-21T08:00:00.000Z\",\n      \"shiftBreakStart1\": \"2026-07-21T12:00:00.000Z\",\n      \"shiftBreakEnd1\": \"2026-07-21T13:00:00.000Z\",\n      \"shiftEnd\": \"2026-07-21T17:00:00.000Z\",\n      \"startTime\": \"2026-07-21T07:54:12.000Z\",\n      \"actualBreakStart1\": \"2026-07-21T12:02:10.000Z\",\n      \"actualBreakEnd1\": \"2026-07-21T12:58:45.000Z\",\n      \"endTime\": \"2026-07-21T17:05:30.000Z\",\n      \"attendCode\": \"H\",\n      \"otRealInMinutes\": 30,\n      \"otIndexInHour\": 0.5,\n      \"otphRealInMinutes\": 0,\n      \"otphIndexInHour\": 0,\n      \"lastUpdate\": \"2026-07-21T17:15:00.000Z\",\n      \"remark\": \"Hadir tepat waktu, lembur 30 menit disetujui\"\n    }\n  ],\n  \"meta\": {\n    \"totalItems\": 12543,\n    \"itemCount\": 1,\n    \"itemsPerPage\": 1,\n    \"totalPages\": 12543,\n    \"currentPage\": 1,\n    \"hasNextPage\": true,\n    \"hasPreviousPage\": false\n  }\n}",
    font: "Consolas",
    size: 18
  })
]));

// GET /attendance/monthly
docChildren.push(createHeading("3.4 GET /attendance/monthly & /api/attendance/monthly (Kehadiran Bulanan)", HeadingLevel.HEADING_2));
docChildren.push(createParagraph("Mengambil log kehadiran bulanan karyawan. Diurutkan secara descending berdasarkan SHIFT_START."));

docChildren.push(createParagraph("Parameter Query:", { bold: true }));
docChildren.push(dailyParams); // reuse daily params schema table

docChildren.push(createParagraph("Response (200 OK):", { bold: true }));
docChildren.push(createParagraph([
  new TextRun({
    text: "{\n  \"data\": [\n    {\n      \"atmId\": 5422,\n      \"attendId\": \"9082341\",\n      \"empNo\": \"202409823\",\n      \"name\": \"Budi Setiawan\",\n      \"shiftStart\": \"2026-07-01T08:00:00.000Z\",\n      \"shiftBreakStart1\": \"2026-07-01T12:00:00.000Z\",\n      \"shiftBreakEnd1\": \"2026-07-01T13:00:00.000Z\",\n      \"shiftEnd\": \"2026-07-01T17:00:00.000Z\",\n      \"startTime\": \"2026-07-01T07:50:00.000Z\",\n      \"actualBreakStart1\": \"2026-07-01T12:00:00.000Z\",\n      \"actualBreakEnd1\": \"2026-07-01T13:00:00.000Z\",\n      \"endTime\": \"2026-07-01T17:00:00.000Z\",\n      \"attendCode\": \"H\",\n      \"otRealInMinutes\": 0,\n      \"otIndexInHour\": 0,\n      \"otphRealInMinutes\": 0,\n      \"otphIndexInHour\": 0,\n      \"lastUpdate\": \"2026-07-01T17:00:00.000Z\",\n      \"remark\": null\n    }\n  ],\n  \"meta\": {\n    \"totalItems\": 412,\n    \"itemCount\": 1,\n    \"itemsPerPage\": 1,\n    \"totalPages\": 412,\n    \"currentPage\": 1,\n    \"hasNextPage\": true,\n    \"hasPreviousPage\": false\n  }\n}",
    font: "Consolas",
    size: 18
  })
]));

// GET /training
docChildren.push(createHeading("3.5 GET /training & /api/training (Catatan Pelatihan)", HeadingLevel.HEADING_2));
docChildren.push(createParagraph("Mengambil daftar riwayat pelatihan sertifikasi karyawan. Diurutkan secara descending berdasarkan CREATED_AT."));

docChildren.push(createParagraph("Parameter Query:", { bold: true }));
docChildren.push(dailyParams); // reuse daily params schema table

docChildren.push(createParagraph("Response (200 OK):", { bold: true }));
docChildren.push(createParagraph([
  new TextRun({
    text: "{\n  \"data\": [\n    {\n      \"trainingId\": \"3491\",\n      \"empNo\": \"202409823\",\n      \"name\": \"Budi Setiawan\",\n      \"trainingSubject\": \"Dangerous Goods Regulations - Cat 6\",\n      \"certificateNo\": \"CERT-DGR-2026-0891\",\n      \"trainingDate\": \"2026-05-10T00:00:00.000Z\",\n      \"certDate\": \"2026-05-12T00:00:00.000Z\",\n      \"certExpired\": \"2028-05-12T00:00:00.000Z\",\n      \"createdAt\": \"2026-05-12T09:00:00.000Z\",\n      \"updatedAt\": \"2026-05-12T09:00:00.000Z\"\n    }\n  ],\n  \"meta\": {\n    \"totalItems\": 850,\n    \"itemCount\": 1,\n    \"itemsPerPage\": 1,\n    \"totalPages\": 850,\n    \"currentPage\": 1,\n    \"hasNextPage\": true,\n    \"hasPreviousPage\": false\n  }\n}",
    font: "Consolas",
    size: 18
  })
]));

docChildren.push(new PageBreak());

// ================= SECTION 4 =================
docChildren.push(createHeading("4. Model Data & Pemetaan Database", HeadingLevel.HEADING_1));
docChildren.push(createParagraph("API memetakan nama kolom database (UPPERCASE/snake_case) ke property JSON response (camelCase) untuk kebersihan pemanggilan API."));

docChildren.push(createHeading("Pemetaan Model Karyawan (tb_employee)", HeadingLevel.HEADING_2));
const employeeMapping = createTable(
  ["Property API", "Kolom Database", "Tipe Data", "Deskripsi"],
  [
    ["empId", "EMP_ID", "Integer", "Kunci utama karyawan."],
    ["empNo", "EMP_NO", "VARCHAR", "NIK Karyawan unik."],
    ["name", "NAME", "VARCHAR", "Nama lengkap karyawan."],
    ["positionNameEn", "POSITION_NAME_EN", "VARCHAR", "Jabatan (Bahasa Inggris)."],
    ["jobPosition", "JOB_POSITION", "VARCHAR", "Jabatan kerja organisasi."],
    ["lob", "LOB", "VARCHAR", "Divisi Bisnis (Line of Business)."],
    ["departmentName", "DEPARTMENT_NAME", "VARCHAR", "Nama Departemen."],
    ["subDepartmentName", "SUB_DEPARTMENT_NAME", "VARCHAR", "Nama Sub-Departemen."],
    ["workLocationCode", "WORKLOCATION_CODE", "VARCHAR", "Kode lokasi fisik."],
    ["spvId", "SPV_ID", "VARCHAR", "NIK Supervisor."],
    ["spvName", "SPV_NAME", "VARCHAR", "Nama Supervisor."],
    ["airline", "AIRLINE", "VARCHAR", "Nama maskapai maskapai."],
    ["empType", "EMP_TYPE", "VARCHAR", "Status kepegawaian (PERMANENT/CONTRACT)."],
    ["vendorName", "VENDOR_NAME", "VARCHAR", "Nama vendor outsourcer."],
    ["isActive", "is_active", "Boolean", "Status karyawan aktif."]
  ]
);
docChildren.push(employeeMapping);

docChildren.push(new PageBreak());

// ================= SECTION 5 =================
docChildren.push(createHeading("5. Indexing Database & Optimalisasi Performa", HeadingLevel.HEADING_1));
docChildren.push(createParagraph("Untuk menjaga respon kueri di bawah 100ms dengan beban jutaan data, index berikut dipasang di database PostgreSQL:"));

const indexTable = createTable(
  ["Nama Index Database", "Tabel Target", "Kolom", "Kegunaan"],
  [
    ["idx_tb_employee_created_at", "tb_employee", "created_at DESC", "Mempercepat kueri paginasi data karyawan terbaru."],
    ["idx_tb_attendance_daily_shift_start_last_update", "tb_attendance_daily", "SHIFT_START DESC, LAST_UPDATE DESC", "Optimasi sorting multi-kolom logs kehadiran harian."],
    ["idx_tb_attendance_monthly_shift_start_last_update", "tb_attendance_monthly", "SHIFT_START DESC, LAST_UPDATE DESC", "Optimasi sorting rekap kehadiran bulanan."],
    ["idx_tb_training_created_at", "tb_training", "CREATED_AT DESC", "Mempercepat kueri daftar pelatihan terbaru."]
  ]
);
docChildren.push(indexTable);

// ================= SECTION 6 =================
docChildren.push(createHeading("6. Penanganan Error (Error Handling)", HeadingLevel.HEADING_1));
docChildren.push(createParagraph("Format respon error yang seragam digunakan untuk menyederhanakan integrasi klien:"));
docChildren.push(createParagraph([
  new TextRun({
    text: "{\n  \"error\": \"Deskripsi detail error di sini\"\n}",
    font: "Consolas",
    size: 18
  })
]));

const errorTable = createTable(
  ["HTTP Code", "Status", "Penyebab & Solusi"],
  [
    ["401", "Unauthorized", "Header Authorization Basic Auth salah atau tidak disertakan."],
    ["404", "Not Found", "Endpoint URL tidak valid atau tidak ditemukan."],
    ["500", "Internal Server Error", "Masalah internal server seperti kegagalan kueri DB atau server database terputus."]
  ]
);
docChildren.push(errorTable);

// Create the Word document
const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,
            bottom: 1440,
            left: 1440,
            right: 1440
          }
        }
      },
      children: docChildren
    }
  ]
});

Packer.toBuffer(doc).then((buffer) => {
  const outputPath = path.resolve('JDI_API_Documentation.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Word document generated successfully at: ${outputPath}`);
}).catch(err => {
  console.error("Failed to generate DOCX file:", err);
  process.exit(1);
});
