import { useState, useEffect } from 'react';

// Fixed top row: live Date / Day / Time
function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="topbar">
      <span>Date: <b>{now.toLocaleDateString('en-GB')}</b></span>
      <span>Day: <b>{now.toLocaleDateString('en-US', { weekday: 'long' })}</b></span>
      <span>Time: <b>{now.toLocaleTimeString()}</b></span>
    </div>
  );
}

// Shell: fixed top row, title bar with ☰ menu, optional sub bar, scrolling content, fixed bottom row.
export default function Layout({ title, right, sub, footer, noScroll, onMenu, children }) {
  return (
    <div className="app">
      <Clock />
      <div className="titlebar">
        <button className="menu-btn no-print" onClick={onMenu} aria-label="Menu">☰</button>
        <h1>{title}</h1>
        <div className="title-right">{right}</div>
      </div>
      {sub && <div className="subbar">{sub}</div>}
      <main className={noScroll ? 'noscroll' : ''}>{children}</main>
      {footer && <div className="bottombar no-print">{footer}</div>}
    </div>
  );
}
