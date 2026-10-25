import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

// SQLite runs in the browser (WebAssembly); the file is saved to localStorage.
const KEY = 'attendance_db';
let db;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS Students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    course_name TEXT
  );
  CREATE TABLE IF NOT EXISTS Absence (
    date_time TEXT NOT NULL,
    student_id INTEGER NOT NULL REFERENCES Students(id)
  );
  CREATE TABLE IF NOT EXISTS ImportFiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    imported_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS FileStudents (
    file_id INTEGER NOT NULL REFERENCES ImportFiles(id),
    student_id INTEGER NOT NULL REFERENCES Students(id),
    PRIMARY KEY (file_id, student_id)
  );
  CREATE TABLE IF NOT EXISTS Sessions (
    date_time TEXT PRIMARY KEY,
    teacher TEXT NOT NULL,
    max_student_id INTEGER NOT NULL,
    file_id INTEGER
  );
`;

export async function initDb() {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const saved = localStorage.getItem(KEY);
  db = saved
    ? new SQL.Database(Uint8Array.from(atob(saved), (c) => c.charCodeAt(0)))
    : new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  db.run(SCHEMA);
  // older saved databases: add Sessions.file_id
  if (!all('PRAGMA table_info(Sessions)').some((c) => c.name === 'file_id')) {
    db.run('ALTER TABLE Sessions ADD COLUMN file_id INTEGER');
  }
  persist();
}

export function persist() {
  const bytes = db.export();
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  localStorage.setItem(KEY, btoa(bin));
  db.run('PRAGMA foreign_keys = ON;'); // export() resets pragmas
}

export function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export function run(sql, params = []) {
  db.run(sql, params);
  return db.getRowsModified();
}

export const lastInsertId = () => all('SELECT last_insert_rowid() AS id')[0].id;

export function transaction(fn) {
  db.run('BEGIN');
  try {
    fn();
    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
  persist();
}
