import Layout from './Layout';

function Panel({ title, rows, cls }) {
  return (
    <section className={`panel ${cls}`}>
      <h2>{title} ({rows.length})</h2>
      <table>
        <thead><tr><th>Name</th><th>Roll No</th></tr></thead>
        <tbody>
          {rows.map((s) => <tr key={s.id}><td>{s.student_name}</td><td>{s.roll_number}</td></tr>)}
        </tbody>
      </table>
    </section>
  );
}

export default function ReviewScreen({ students, absent, teacher, onBack, onSubmit, onMenu }) {
  const footer = (
    <>
      <button className="big gray" onClick={onBack}>← Back to edit</button>
      <button className="big blue" onClick={() => window.print()}>Print</button>
      <button className="big green" onClick={onSubmit}>Submit</button>
    </>
  );

  return (
    <Layout
      title="Review Attendance"
      right={<span>Teacher: <b>{teacher || '—'}</b></span>}
      sub={<span>Check once more before submitting today’s attendance.</span>}
      footer={footer}
      onMenu={onMenu}
    >
      <div className="review">
        <Panel title="Absent" cls="panel-absent" rows={students.filter((s) => absent[s.id])} />
        <Panel title="Present" cls="panel-present" rows={students.filter((s) => !absent[s.id])} />
      </div>
    </Layout>
  );
}
