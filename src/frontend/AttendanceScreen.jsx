import { useEffect, useRef } from 'react';
import Layout from './Layout';

export default function AttendanceScreen({ students, draft, setDraft, teacher, setTeacher, onFinish, onMenu }) {
  const { absent, cur, course } = draft;
  const rowRefs = useRef({});

  const courses = [...new Set(students.map((s) => s.course_name).filter(Boolean))].sort();
  const visible = course ? students.filter((s) => s.course_name === course) : students;
  const n = visible.length;
  const done = n > 0 && cur >= n;

  useEffect(() => {
    const st = visible[Math.min(cur, n - 1)];
    if (st) rowRefs.current[st.id]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [cur, course, students]);

  const mark = (isAbsent) => {
    if (cur >= n) return;
    setDraft({ ...draft, absent: { ...absent, [visible[cur].id]: isAbsent }, cur: cur + 1 });
  };
  const toggle = (id, index, value) => setDraft({ ...draft, absent: { ...absent, [id]: value }, cur: index });

  const sub = students.length > 0 && (
    <>
      <div className="course-pick">
        <select value={course} onChange={(e) => setDraft({ ...draft, course: e.target.value, cur: 0 })}>
          <option value="">All courses</option>
          {courses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="track"><div className="fill" style={{ width: `${n ? (cur / n) * 100 : 0}%` }} /></div>
    </>
  );

  const footer = n > 0 && (
    <>
      <button className="big green" disabled={done} onClick={() => mark(false)}>Present</button>
      <button className="big red" disabled={done} onClick={() => mark(true)}>Absent</button>
      <button className="big blue finish" onClick={onFinish}>Finish</button>
    </>
  );

  const teacherInput = (
    <label className="teacher">
      Teacher: <input value={teacher} placeholder="Enter name" onChange={(e) => setTeacher(e.target.value)} />
    </label>
  );

  return (
    <Layout title="Student Attendance" right={teacherInput} sub={sub} footer={footer} onMenu={onMenu}>
      {students.length === 0 ? (
        <p className="empty">No students yet.<br />Open the ☰ menu and choose “Import Excel”<br />(columns: Student Name, Roll Number, Course Name).</p>
      ) : (
        <div className="container">
          <table>
            <thead>
              <tr><th>Sl</th><th>Name</th><th>Roll No</th><th>Absent</th></tr>
            </thead>
            <tbody>
              {visible.map((s, i) => (
                <tr
                  key={s.id}
                  ref={(el) => (rowRefs.current[s.id] = el)}
                  className={`${absent[s.id] ? 'absent' : ''} ${i === cur ? 'current' : ''}`}
                  onClick={() => setDraft({ ...draft, cur: i })}
                >
                  <td>{i + 1}</td>
                  <td>{s.student_name}</td>
                  <td>{s.roll_number}</td>
                  <td>
                    <label className="switch" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={!!absent[s.id]} onChange={(e) => toggle(s.id, i, e.target.checked)} />
                      <span />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
