import { useState } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from 'recharts';
import Layout from './Layout';
import { getHistory } from '../backend/attendanceService';

const GREEN = '#16a34a', RED = '#dc2626';
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB');
const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function StudentList({ title, rows, cls }) {
  return (
    <div className={`mini ${cls}`}>
      <h4>{title} ({rows.length})</h4>
      <ul>
        {rows.map((s) => <li key={s.id}><b>{s.roll_number}</b> {s.student_name}</li>)}
      </ul>
    </div>
  );
}

export default function DashboardScreen({ teacher, onMenu }) {
  const [history] = useState(getHistory); // newest first
  const [status, setStatus] = useState('all'); // all | present | absent
  const [q, setQ] = useState('');
  const [course, setCourse] = useState(''); // '' = all courses

  // chart data (oldest → newest)
  const rows = [...history].reverse().map((h) => {
    const total = h.present.length + h.absent.length;
    return {
      label: `${fmtDate(h.date_time).slice(0, 5)} ${fmtTime(h.date_time)}`,
      present: h.present.length,
      absent: h.absent.length,
      pct: total ? Math.round((h.present.length / total) * 100) : 0,
    };
  });
  const pie = [
    { name: 'Present', value: rows.reduce((a, r) => a + r.present, 0) },
    { name: 'Absent', value: rows.reduce((a, r) => a + r.absent, 0) },
  ];

  // filters for the right-hand list
  const courses = [...new Set(history.flatMap((h) => [...h.absent, ...h.present]).map((s) => s.course_name).filter(Boolean))].sort();
  const needle = q.trim().toLowerCase();
  const filtering = needle || course;
  const match = (s) =>
    (!course || s.course_name === course) &&
    (!needle || s.student_name.toLowerCase().includes(needle) || String(s.roll_number).toLowerCase().includes(needle));
  const cards = history
    .map((h) => ({ ...h, a: h.absent.filter(match), p: h.present.filter(match) }))
    .filter((h) => !filtering || (status !== 'present' && h.a.length) || (status !== 'absent' && h.p.length));

  return (
    <Layout
      title="Dashboard"
      right={<span>Teacher: <b>{teacher || '—'}</b></span>}
      noScroll
      onMenu={onMenu}
    >
      <div className="split">
        <div className="pane">
          {history.length === 0 ? (
            <p className="empty">No attendance submitted yet.</p>
          ) : (
            <>
              <div className="card">
                <h3>Overall (till date)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" label outerRadius={80}>
                      <Cell fill={GREEN} /><Cell fill={RED} />
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3>Present vs Absent per attendance</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} /><YAxis allowDecimals={false} />
                    <Tooltip /><Legend />
                    <Bar dataKey="present" fill={GREEN} /><Bar dataKey="absent" fill={RED} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3>Attendance % trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} /><YAxis domain={[0, 100]} unit="%" />
                    <Tooltip />
                    <Line type="monotone" dataKey="pct" name="Present %" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        <div className="pane">
          <div className="filters">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Present &amp; Absent</option>
              <option value="absent">Absent only</option>
              <option value="present">Present only</option>
            </select>
            <input placeholder="Filter by name or roll no" value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">All courses</option>
              {courses.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {cards.length === 0 && <p className="empty">No records.</p>}
          {cards.map((h) => (
            <div className="card" key={h.date_time}>
              <p className="meta">
                <span>Date: <b>{fmtDate(h.date_time)}</b></span>
                <span>Time: <b>{fmtTime(h.date_time)}</b></span>
                <span>Teacher: <b>{h.teacher}</b></span>
              </p>
              <div className="cols">
                {status !== 'present' && <StudentList title="Absent" rows={h.a} cls="red-t" />}
                {status !== 'absent' && <StudentList title="Present" rows={h.p} cls="green-t" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
