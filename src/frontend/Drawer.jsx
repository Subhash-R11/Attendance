import { useState } from 'react';

// ☰ menu: Dashboard, Import Excel, and the Recent imported files (each with a ⋮ → Rename).
export default function Drawer({ open, files, activeId, onClose, onDashboard, onImport, onOpenFile, onRename }) {
  const [menuFor, setMenuFor] = useState(null); // file id whose ⋮ popup is open
  if (!open) return null;

  return (
    <div className="overlay" onClick={() => { setMenuFor(null); onClose(); }}>
      <nav className="drawer" onClick={(e) => { e.stopPropagation(); setMenuFor(null); }}>
        <button className="nav-btn" onClick={onDashboard}>Dashboard</button>
        <button className="nav-btn" onClick={onImport}>Import Excel</button>

        <h3 className="recent">Recent</h3>
        <ul className="files">
          {files.length === 0 && <li className="none">No files imported yet</li>}
          {files.map((f) => (
            <li key={f.id} className={f.id === activeId ? 'active' : ''}>
              <button className="file-name" title={f.file_name} onClick={() => onOpenFile(f.id)}>{f.file_name}</button>
              <button
                className="dots"
                aria-label="File options"
                onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === f.id ? null : f.id); }}
              >⋮</button>
              {menuFor === f.id && (
                <div className="pop">
                  <button onClick={(e) => { e.stopPropagation(); setMenuFor(null); onRename(f.id); }}>Rename</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
