import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const allowedStatuses = ['Submitted', 'Under Review', 'Approved', 'Printing', 'Ready', 'Released', 'Returned'];
export const transitions = {
  Submitted: ['Under Review', 'Returned'],
  'Under Review': ['Approved', 'Returned'],
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
      copies INTEGER NOT NULL CHECK(copies BETWEEN 1 AND 1000),
      pages INTEGER NOT NULL CHECK(pages BETWEEN 1 AND 100),
      exam_date TEXT NOT NULL,
      needed_by TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
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
  seed(db);
  return db;
}

function seed(db) {
  if (db.prepare('SELECT COUNT(*) count FROM requests').get().count) return;
  const samples = [
    ['TQ-2026-0001','IT 301','Web Systems and Technologies','Midterm Examination','College of Information Technology',45,5,'2026-08-25','2026-08-21','Staple upper-left corner','Under Review'],
    ['TQ-2026-0002','CS 220','Data Structures and Algorithms','Final Examination','College of Information Technology',38,7,'2026-08-28','2026-08-23','Use long bond paper','Approved'],
    ['TQ-2026-0003','IS 114','Fundamentals of Information Systems','Preliminary Examination','College of Information Technology',52,4,'2026-08-19','2026-08-16','Two-sided printing','Printing'],
    ['TQ-2026-0004','GE 102','Mathematics in the Modern World','Special Examination','General Education Department',12,3,'2026-08-15','2026-08-13','','Ready']
  ];
  const insert = db.prepare('INSERT INTO requests (reference,course_code,course_title,exam_type,department,copies,pages,exam_date,needed_by,notes,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  for (const sample of samples) insert.run(...sample);
}

export function toRequest(row) {
  return { id: row.id, reference: row.reference, courseCode: row.course_code, courseTitle: row.course_title, examType: row.exam_type, department: row.department, copies: row.copies, pages: row.pages, examDate: row.exam_date, neededBy: row.needed_by, notes: row.notes, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}
