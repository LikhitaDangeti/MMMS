const J = (r) => {
  if (!r.ok) return r.json().then((e) => Promise.reject(e));
  return r.json();
};

export const api = {
  sheets: () => fetch('/api/sheets').then(J),
  layout: (id) => fetch(`/api/sheets/${id}/layout`).then(J),
  get: (date, shift, sheetId) =>
    fetch(`/api/submissions?date=${date}&shift=${shift}&sheetId=${sheetId}`).then(J),
  list: (q = {}) => {
    const p = new URLSearchParams(Object.entries(q).filter(([, v]) => v));
    return fetch(`/api/submissions/list?${p}`).then(J);
  },
  save: (body) =>
    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(J),
  xlsxUrl: (date, shift, sheetId) =>
    `/api/submissions/xlsx?date=${date}&shift=${shift}&sheetId=${sheetId}`,
  remove: (date, shift, sheetId) =>
    fetch(`/api/submissions?date=${date}&shift=${shift}&sheetId=${sheetId}`, { method: 'DELETE' }).then(J),
};
