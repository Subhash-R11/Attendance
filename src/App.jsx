import { useState, useEffect, useRef } from 'react';
import { initDb } from './database/db';
import { getStudents, getFiles, renameFile, importStudentsFromExcel, adoptUnlinkedStudents } from './backend/studentService';
import { getTeacher, saveTeacher, saveAttendance } from './backend/attendanceService';
import Drawer from './frontend/Drawer';
import AttendanceScreen from './frontend/AttendanceScreen';
import ReviewScreen from './frontend/ReviewScreen';
import DashboardScreen from './frontend/DashboardScreen';

const EMPTY_DRAFT = { absent: {}, cur: 0, course: '' };

export default function App() {
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState('dashboard'); // dashboard | attendance | review
  const [menuOpen, setMenuOpen] = useState(false);
  const [files, setFiles] = useState([]);          // recent imported Excel files
  const [fileId, setFileId] = useState(null);      // file whose students are being marked
  const [students, setStudents] = useState([]);
  const [draft, setDraft] = useState(EMPTY_DRAFT); // { absent: {id: true}, cur: index in visible list, course: filter }
  const [teacher, setTeacherState] = useState(getTeacher);
  const fileRef = useRef(null);

  const selectFile = (id) => {
    localStorage.setItem('activeFile', String(id));
    setFileId(id);
    setStudents(getStudents(id));
    setDraft(EMPTY_DRAFT);
  };

  useEffect(() => {
    initDb().then(() => {
      adoptUnlinkedStudents();
      const list = getFiles();
      setFiles(list);
      const saved = Number(localStorage.getItem('activeFile'));
      const active = list.find((f) => f.id === saved) || list[0];
      if (active) selectFile(active.id);
      setReady(true);
    });
  }, []);

  const setTeacher = (name) => { saveTeacher(name); setTeacherState(name); };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { fileId: id, total, added } = await importStudentsFromExcel(file);
      setFiles(getFiles());
      selectFile(id);
      setPage('attendance');
      alert(`${total} student(s) loaded from ${file.name} (${added} new).`);
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };

  const rename = (id) => {
    const name = window.prompt('Rename file', files.find((f) => f.id === id)?.file_name);
    if (name && name.trim()) { renameFile(id, name.trim()); setFiles(getFiles()); }
  };

  const submit = () => {
    if (!teacher.trim()) {
      alert('Enter the teacher name before submitting.');
      setPage('attendance');
      return;
    }
    const absentIds = students.filter((s) => draft.absent[s.id]).map((s) => s.id);
    saveAttendance({ teacher: teacher.trim(), fileId, students, absentIds });
    setDraft(EMPTY_DRAFT);
    setPage('dashboard');
    alert("Today's attendance submitted.");
  };

  if (!ready) return <p className="empty">Loading…</p>;

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={handleImport} />
      <Drawer
        open={menuOpen}
        files={files}
        activeId={fileId}
        onClose={closeMenu}
        onDashboard={() => { closeMenu(); setPage('dashboard'); }}
        onImport={() => { closeMenu(); fileRef.current.click(); }}
        onOpenFile={(id) => { closeMenu(); selectFile(id); setPage('attendance'); }}
        onRename={rename}
      />
      {page === 'dashboard' && <DashboardScreen teacher={teacher} onMenu={openMenu} />}
      {page === 'review' && (
        <ReviewScreen
          students={students} absent={draft.absent} teacher={teacher}
          onBack={() => setPage('attendance')} onSubmit={submit} onMenu={openMenu}
        />
      )}
      {page === 'attendance' && (
        <AttendanceScreen
          students={students} draft={draft} setDraft={setDraft}
          teacher={teacher} setTeacher={setTeacher}
          onFinish={() => setPage('review')} onMenu={openMenu}
        />
      )}
    </>
  );
}
