import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || '';

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

async function makePostgresStore() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase/Neon
  });

  const initSql = `
    CREATE TABLE IF NOT EXISTS submissions (
      date VARCHAR(10) NOT NULL,
      shift VARCHAR(5) NOT NULL,
      "sheetId" INTEGER NOT NULL,
      status VARCHAR(50),
      "createdAt" TIMESTAMP,
      "updatedAt" TIMESTAMP,
      "schemaVersion" INTEGER,
      "createdBy" TEXT,
      meta TEXT,
      "valuesData" TEXT,
      PRIMARY KEY (date, shift, "sheetId")
    );
  `;
  await pool.query(initSql);

  const parseRow = (row) => ({
    date: row.date,
    shift: row.shift,
    sheetId: row.sheetId,
    status: row.status,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    schemaVersion: row.schemaVersion,
    createdBy: row.createdBy || '',
    meta: row.meta ? JSON.parse(row.meta) : {},
    values: row.valuesData ? JSON.parse(row.valuesData) : {}
  });

  return {
    backend: 'postgres',
    async find(date, shift, sheetId) {
      const res = await pool.query(
        'SELECT * FROM submissions WHERE date = $1 AND shift = $2 AND "sheetId" = $3',
        [date, shift, Number(sheetId)]
      );
      if (res.rows.length === 0) return null;
      return parseRow(res.rows[0]);
    },
    async list({ sheetId, date, shift } = {}) {
      let whereClause = [];
      let params = [];
      
      if (sheetId) {
        params.push(Number(sheetId));
        whereClause.push(`"sheetId" = $${params.length}`);
      }
      if (date) {
        params.push(date);
        whereClause.push(`date = $${params.length}`);
      }
      if (shift) {
        params.push(shift);
        whereClause.push(`shift = $${params.length}`);
      }
      
      let q = 'SELECT * FROM submissions';
      if (whereClause.length > 0) {
        q += ' WHERE ' + whereClause.join(' AND ');
      }
      
      const res = await pool.query(q, params);
      return res.rows.map(parseRow).map(toListRow).sort(listSort);
    },
    async upsert(payload) {
      const existing = await this.find(payload.date, payload.shift, payload.sheetId);
      const now = new Date().toISOString();
      const doc = mergeDoc(existing, payload, now);
      
      if (existing) {
        await pool.query(`
          UPDATE submissions 
          SET status = $1, "updatedAt" = $2, meta = $3, "valuesData" = $4, "createdBy" = $5
          WHERE date = $6 AND shift = $7 AND "sheetId" = $8
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
        await pool.query(`
          INSERT INTO submissions (date, shift, "sheetId", status, "createdAt", "updatedAt", "schemaVersion", "createdBy", meta, "valuesData")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      const res = await pool.query('SELECT COUNT(*) as cnt FROM submissions');
      return Number(res.rows[0].cnt);
    },
    async delete(date, shift, sheetId) {
      await pool.query('DELETE FROM submissions WHERE date = $1 AND shift = $2 AND "sheetId" = $3', [
        date, shift, Number(sheetId)
      ]);
      return true;
    },
  };
}

const store = await makePostgresStore();
console.log(`[db] storage backend: ${store.backend}`);

export const findSubmission = (date, shift, sheetId) => store.find(date, shift, sheetId);
export const listSubmissions = (q) => store.list(q);
export const upsertSubmission = (p) => store.upsert(p);
export const deleteSubmission = (date, shift, sheetId) => store.delete(date, shift, sheetId);
export const submissionCount = () => store.count();
export const storageBackend = () => store.backend;
