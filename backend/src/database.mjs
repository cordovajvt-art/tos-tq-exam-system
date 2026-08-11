import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const allowedStatuses = ['Submitted', 'Area Coordinator Review', 'Dean Review', 'Approved', 'Printing', 'Ready', 'Released', 'Returned'];
export const transitions = {
  Submitted: ['Area Coordinator Review', 'Returned'],
  'Area Coordinator Review': ['Dean Review', 'Returned'],
  'Dean Review': ['Approved', 'Returned'],
  Approved: ['Printing'],
  Printing: ['Ready'],
  Ready: ['Released'],
  Returned: ['Submitted'],
  Released: [],
};

export function createDatabase(filename = process.env.DATABASE_PATH || './data/exam-system.db') {
  const path = filename === ':memory:' ? filename : resolve(filename);
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE,
      course_code TEXT NOT NULL,
      course_title TEXT NOT NULL,
      exam_type TEXT NOT NULL,
      department TEXT NOT NULL,
      academic_area TEXT NOT NULL DEFAULT 'Biology and Chemistry',
      copies INTEGER NOT NULL CHECK(copies BETWEEN 1 AND 1000),
      pages INTEGER NOT NULL CHECK(pages BETWEEN 1 AND 100),
      exam_date TEXT NOT NULL,
      needed_by TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      tos_outcomes TEXT NOT NULL DEFAULT '',
      tos_coverage TEXT NOT NULL DEFAULT '',
      tos_rows TEXT NOT NULL DEFAULT '[]',
      tos_total_items INTEGER NOT NULL DEFAULT 50,
      tos_remembering INTEGER NOT NULL DEFAULT 20,
      tos_understanding INTEGER NOT NULL DEFAULT 20,
      tos_applying INTEGER NOT NULL DEFAULT 20,
      tos_analyzing INTEGER NOT NULL DEFAULT 20,
      tos_evaluating INTEGER NOT NULL DEFAULT 10,
      tos_creating INTEGER NOT NULL DEFAULT 10,
      coordinator_name TEXT NOT NULL DEFAULT '',
      coordinator_tos_comment TEXT NOT NULL DEFAULT '',
      coordinator_tq_comment TEXT NOT NULL DEFAULT '',
      coordinator_signature TEXT NOT NULL DEFAULT '',
      coordinator_approved_at TEXT,
      dean_name TEXT NOT NULL DEFAULT '',
      dean_tos_comment TEXT NOT NULL DEFAULT '',
      dean_tq_comment TEXT NOT NULL DEFAULT '',
      dean_signature TEXT NOT NULL DEFAULT '',
      dean_approved_at TEXT,
      status TEXT NOT NULL DEFAULT 'Submitted',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  migrate(db);
  seed(db);
  return db;
}

function migrate(db) {
  const columns = new Set(db.prepare('PRAGMA table_info(requests)').all().map((column) => column.name));
  const additions = {
    academic_area: "TEXT NOT NULL DEFAULT 'Biology and Chemistry'",
    tos_outcomes: "TEXT NOT NULL DEFAULT ''", tos_coverage: "TEXT NOT NULL DEFAULT ''", tos_rows: "TEXT NOT NULL DEFAULT '[]'", tos_total_items: 'INTEGER NOT NULL DEFAULT 50',
    tos_remembering: 'INTEGER NOT NULL DEFAULT 20', tos_understanding: 'INTEGER NOT NULL DEFAULT 20', tos_applying: 'INTEGER NOT NULL DEFAULT 20',
    tos_analyzing: 'INTEGER NOT NULL DEFAULT 20', tos_evaluating: 'INTEGER NOT NULL DEFAULT 10', tos_creating: 'INTEGER NOT NULL DEFAULT 10',
    coordinator_name: "TEXT NOT NULL DEFAULT ''", coordinator_tos_comment: "TEXT NOT NULL DEFAULT ''", coordinator_tq_comment: "TEXT NOT NULL DEFAULT ''", coordinator_signature: "TEXT NOT NULL DEFAULT ''", coordinator_approved_at: 'TEXT',
    dean_name: "TEXT NOT NULL DEFAULT ''", dean_tos_comment: "TEXT NOT NULL DEFAULT ''", dean_tq_comment: "TEXT NOT NULL DEFAULT ''", dean_signature: "TEXT NOT NULL DEFAULT ''", dean_approved_at: 'TEXT',
  };
  for (const [name, definition] of Object.entries(additions)) if (!columns.has(name)) db.exec(`ALTER TABLE requests ADD COLUMN ${name} ${definition}`);
  db.prepare("UPDATE requests SET status='Area Coordinator Review' WHERE status='Under Review'").run();
}

function seed(db) {
  if (db.prepare('SELECT COUNT(*) count FROM requests').get().count) return;
  const samples = [
    ['TQ-2026-0001','IT 301','Web Systems and Technologies','Midterm Examination','College of Information Technology',45,5,'2026-08-25','2026-08-21','Staple upper-left corner','Area Coordinator Review'],
    ['TQ-2026-0002','CS 220','Data Structures and Algorithms','Final Examination','College of Information Technology',38,7,'2026-08-28','2026-08-23','Use long bond paper','Approved'],
    ['TQ-2026-0003','IS 114','Fundamentals of Information Systems','Preliminary Examination','College of Information Technology',52,4,'2026-08-19','2026-08-16','Two-sided printing','Printing'],
    ['TQ-2026-0004','GE 102','Mathematics in the Modern World','Special Examination','General Education Department',12,3,'2026-08-15','2026-08-13','','Ready']
  ];
  const insert = db.prepare('INSERT INTO requests (reference,course_code,course_title,exam_type,department,copies,pages,exam_date,needed_by,notes,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  for (const sample of samples) insert.run(...sample);
}

export function toRequest(row) {
  let rows = []; try { rows = JSON.parse(row.tos_rows || '[]'); } catch {}
  return { id: row.id, reference: row.reference, courseCode: row.course_code, courseTitle: row.course_title, examType: row.exam_type, department: row.department, academicArea: row.academic_area, copies: row.copies, pages: row.pages, examDate: row.exam_date, neededBy: row.needed_by, notes: row.notes, tos: { outcomes: row.tos_outcomes, coverage: row.tos_coverage, rows, totalItems: row.tos_total_items, remembering: row.tos_remembering, understanding: row.tos_understanding, applying: row.tos_applying, analyzing: row.tos_analyzing, evaluating: row.tos_evaluating, creating: row.tos_creating }, approvals: { coordinator: { name: row.coordinator_name, tosComment: row.coordinator_tos_comment, tqComment: row.coordinator_tq_comment, signature: row.coordinator_signature, approvedAt: row.coordinator_approved_at }, dean: { name: row.dean_name, tosComment: row.dean_tos_comment, tqComment: row.dean_tq_comment, signature: row.dean_signature, approvedAt: row.dean_approved_at } }, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}
