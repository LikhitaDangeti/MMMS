const J = (r) => {
  if (!r.ok) return r.json().then((e) => Promise.reject(e));
  return r.json();
};

// In-memory cache so large layout JSONs are only fetched once per session
const layoutCache = new Map();

export const api = {
  sheets: () => fetch('/api/sheets').then(J),
  layout: (id) => {
    if (layoutCache.has(id)) return Promise.resolve(layoutCache.get(id));
    return fetch(`/api/sheets/${id}/layout`).then(J).then((data) => {
      layoutCache.set(id, data);
      return data;
    });
  },
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
