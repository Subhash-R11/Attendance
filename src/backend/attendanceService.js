import { all, run, transaction } from '../database/db';

export const getTeacher = () => localStorage.getItem('teacher') || '';
export const saveTeacher = (name) => localStorage.setItem('teacher', name);

// Stores one submitted attendance: a Sessions row + one Absence row per absent student.
export function saveAttendance({ teacher, fileId, students, absentIds }) {
  const date = new Date().toISOString();
  const maxId = Math.max(0, ...students.map((s) => s.id));
  transaction(() => {
    run('INSERT INTO Sessions (date_time, teacher, max_student_id, file_id) VALUES (?, ?, ?, ?)', [date, teacher, maxId, fileId]);
    absentIds.forEach((id) => run('INSERT INTO Absence (date_time, student_id) VALUES (?, ?)', [date, id]));
  });
}

// All past submissions (newest first), each with its absent and present students.
// Present = students of that file (that existed at the time) who were not marked absent.
export function getHistory() {
  return all('SELECT * FROM Sessions ORDER BY date_time DESC').map((s) => ({
    ...s,
    absent: all(
      'SELECT st.* FROM Absence a JOIN Students st ON st.id = a.student_id WHERE a.date_time = ? ORDER BY st.id',
      [s.date_time]
    ),
    present: all(
      `SELECT st.* FROM Students st
       WHERE st.id <= ? AND st.id NOT IN (SELECT student_id FROM Absence WHERE date_time = ?)
         AND (? IS NULL OR st.id IN (SELECT student_id FROM FileStudents WHERE file_id = ?))
       ORDER BY st.id`,
      [s.max_student_id, s.date_time, s.file_id, s.file_id]
    ),
  }));
}
