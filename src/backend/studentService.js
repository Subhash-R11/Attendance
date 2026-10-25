import * as XLSX from 'xlsx';
import { all, run, lastInsertId, transaction } from '../database/db';

export const getFiles = () => all('SELECT * FROM ImportFiles ORDER BY id DESC');

export const renameFile = (id, name) => run('UPDATE ImportFiles SET file_name = ? WHERE id = ?', [name, id]);

export const getStudents = (fileId) =>
  fileId == null
    ? []
    : all(
        'SELECT st.* FROM Students st JOIN FileStudents fs ON fs.student_id = st.id WHERE fs.file_id = ? ORDER BY st.id',
        [fileId]
      );

// Imports an .xlsx File (columns: Student Name, Roll Number, Course Name) as a new "recent file".
// Students whose roll number already exists are reused, not duplicated.
// Returns { fileId, total, added }.
export async function importStudentsFromExcel(file) {
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const rows = XLSX.utils
    .sheet_to_json(wb.Sheets[wb.SheetNames[0]])
    .filter((x) => x['Student Name'] && x['Roll Number'] != null);
  if (rows.length === 0) throw new Error('No rows found. Expected columns: Student Name, Roll Number, Course Name.');

  let fileId, added = 0;
  transaction(() => {
    run('INSERT INTO ImportFiles (file_name, imported_at) VALUES (?, ?)', [file.name, new Date().toISOString()]);
    fileId = lastInsertId();
    for (const x of rows) {
      const roll = String(x['Roll Number']).trim();
      let id = all('SELECT id FROM Students WHERE roll_number = ?', [roll])[0]?.id;
      if (id == null) {
        run('INSERT INTO Students (student_name, roll_number, course_name) VALUES (?, ?, ?)', [
          String(x['Student Name']).trim(), roll, String(x['Course Name'] ?? '').trim(),
        ]);
        id = lastInsertId();
        added++;
      }
      run('INSERT OR IGNORE INTO FileStudents (file_id, student_id) VALUES (?, ?)', [fileId, id]);
    }
  });
  return { fileId, total: rows.length, added };
}

// Data saved before "recent files" existed: put those students in one file so they stay usable.
export function adoptUnlinkedStudents() {
  const orphans = all('SELECT id FROM Students WHERE id NOT IN (SELECT student_id FROM FileStudents)');
  if (orphans.length === 0) return;
  transaction(() => {
    run('INSERT INTO ImportFiles (file_name, imported_at) VALUES (?, ?)', ['Students.xlsx', new Date().toISOString()]);
    const fileId = lastInsertId();
    run('INSERT INTO FileStudents (file_id, student_id) SELECT ?, id FROM Students WHERE id NOT IN (SELECT student_id FROM FileStudents)', [fileId]);
    run('UPDATE Sessions SET file_id = ? WHERE file_id IS NULL', [fileId]);
  });
}
