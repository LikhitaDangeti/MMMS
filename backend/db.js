import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const DB_PATH = process.env.SQLITE_DB_PATH || path.resolve('database.sqlite');

const listSort = (a, b) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : a.shift.localeCompare(b.shift);

const toListRow = ({ values, _id, ...rest }) => ({
  ...rest,
  filledCount: Object.keys(values || {}).length,
});

function mergeDoc(existing, payload, now) {
  if (existing) {
    return {
      ...existing,
      ...payload,
      meta: { ...existing.meta, ...payload.meta },
      values: { ...existing.values, ...payload.values },
      updatedAt: now,
    };
  }
  return {
    ...payload,
    status: payload.status || 'submitted',
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

async function makeSqliteStore() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  const initSql = `
    CREATE TABLE IF NOT EXISTS submissions (
      date TEXT NOT NULL,
      shift TEXT NOT NULL,
      sheetId INTEGER NOT NULL,
      status TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      schemaVersion INTEGER,
      createdBy TEXT,
      meta TEXT,
      valuesData TEXT,
      PRIMARY KEY (date, shift, sheetId)
    );
  `;
  await db.exec(initSql);

  const parseRow = (row) => ({
    date: row.date,
    shift: row.shift,
    sheetId: row.sheetId,
    status: row.status,
    createdAt: row.createdAt ? row.createdAt : null,
    updatedAt: row.updatedAt ? row.updatedAt : null,
    schemaVersion: row.schemaVersion,
    createdBy: row.createdBy || '',
    meta: row.meta ? JSON.parse(row.meta) : {},
    values: row.valuesData ? JSON.parse(row.valuesData) : {}
  });

  return {
    backend: 'sqlite',
    async find(date, shift, sheetId) {
      const row = await db.get(
        'SELECT * FROM submissions WHERE date = ? AND shift = ? AND sheetId = ?',
        [date, shift, Number(sheetId)]
      );
      if (!row) return null;
      return parseRow(row);
    },
    async list({ sheetId, date, shift } = {}) {
      let whereClause = [];
      let params = [];
      
      if (sheetId) {
        whereClause.push('sheetId = ?');
        params.push(Number(sheetId));
      }
      if (date) {
        whereClause.push('date = ?');
        params.push(date);
      }
      if (shift) {
        whereClause.push('shift = ?');
        params.push(shift);
      }
      
      let q = 'SELECT * FROM submissions';
      if (whereClause.length > 0) {
        q += ' WHERE ' + whereClause.join(' AND ');
      }
      
      const rows = await db.all(q, params);
      return rows.map(parseRow).map(toListRow).sort(listSort);
    },
    async upsert(payload) {
      const existing = await this.find(payload.date, payload.shift, payload.sheetId);
      const now = new Date().toISOString();
      const doc = mergeDoc(existing, payload, now);
      
      if (existing) {
        await db.run(`
          UPDATE submissions 
          SET status = ?, updatedAt = ?, meta = ?, valuesData = ?, createdBy = ?
          WHERE date = ? AND shift = ? AND sheetId = ?
        `, [
          doc.status || 'submitted',
          doc.updatedAt,
          JSON.stringify(doc.meta || {}),
          JSON.stringify(doc.values || {}),
          doc.createdBy || '',
          doc.date,
          doc.shift,
          Number(doc.sheetId)
        ]);
      } else {
        await db.run(`
          INSERT INTO submissions (date, shift, sheetId, status, createdAt, updatedAt, schemaVersion, createdBy, meta, valuesData)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          doc.date,
          doc.shift,
          Number(doc.sheetId),
          doc.status || 'submitted',
          doc.createdAt,
          doc.updatedAt,
          doc.schemaVersion || 1,
          doc.createdBy || '',
          JSON.stringify(doc.meta || {}),
          JSON.stringify(doc.values || {})
        ]);
      }
      
      return this.find(payload.date, payload.shift, payload.sheetId);
    },
    async count() {
      const row = await db.get('SELECT COUNT(*) as cnt FROM submissions');
      return row.cnt;
    },
    async delete(date, shift, sheetId) {
      await db.run('DELETE FROM submissions WHERE date = ? AND shift = ? AND sheetId = ?', [
        date, shift, Number(sheetId)
      ]);
      return true;
    },
  };
}

const store = await makeSqliteStore();
console.log(`[db] storage backend: ${store.backend}`);

export const findSubmission = (date, shift, sheetId) => store.find(date, shift, sheetId);
export const listSubmissions = (q) => store.list(q);
export const upsertSubmission = (p) => store.upsert(p);
export const deleteSubmission = (date, shift, sheetId) => store.delete(date, shift, sheetId);
export const submissionCount = () => store.count();
export const storageBackend = () => store.backend;
