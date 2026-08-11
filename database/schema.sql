CREATE TABLE requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  course_code TEXT NOT NULL,
  course_title TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  department TEXT NOT NULL,
  copies INTEGER NOT NULL CHECK (copies BETWEEN 1 AND 1000),
  pages INTEGER NOT NULL CHECK (pages BETWEEN 1 AND 100),
  exam_date TEXT NOT NULL,
  needed_by TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  tos_outcomes TEXT NOT NULL,
  tos_coverage TEXT NOT NULL,
  tos_total_items INTEGER NOT NULL CHECK (tos_total_items BETWEEN 10 AND 200),
  tos_remembering INTEGER NOT NULL,
  tos_understanding INTEGER NOT NULL,
  tos_applying INTEGER NOT NULL,
  tos_analyzing INTEGER NOT NULL,
  tos_evaluating INTEGER NOT NULL,
  tos_creating INTEGER NOT NULL,
  coordinator_name TEXT NOT NULL DEFAULT '',
  coordinator_notes TEXT NOT NULL DEFAULT '',
  coordinator_approved_at TEXT,
  dean_name TEXT NOT NULL DEFAULT '',
  dean_notes TEXT NOT NULL DEFAULT '',
  dean_approved_at TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
