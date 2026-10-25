const pad = (n) => String(n).padStart(2, '0');

// Local date as YYYY-MM-DD
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toDate = (dateStr) => new Date(dateStr.slice(0, 10) + 'T00:00:00');
export const dayName = (dateStr) => toDate(dateStr).toLocaleDateString('en-IN', { weekday: 'long' });
export const prettyDate = (dateStr) =>
  toDate(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
