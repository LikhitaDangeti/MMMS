// Storage layer for Microsoft SQL Server
import sql from 'mssql';
const SQLSERVER_URI = process.env.SQLSERVER_URI || '';

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

async function makeSqlServerStore() {
  const pool = await sql.connect(SQLSERVER_URI);

  const initSql = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='submissions' and xtype='U')
    CREATE TABLE submissions (
      date VARCHAR(10) NOT NULL,
      shift VARCHAR(5) NOT NULL,
      sheetId INT NOT NULL,
      status VARCHAR(50),
      createdAt DATETIME,
      updatedAt DATETIME,
      schemaVersion INT,
      createdBy NVARCHAR(MAX),
      meta NVARCHAR(MAX),
      valuesData NVARCHAR(MAX),
      PRIMARY KEY (date, shift, sheetId)
    );
  `;
  await pool.request().query(initSql);

  const parseRow = (row) => ({
    date: row.date,
    shift: row.shift,
    sheetId: row.sheetId,
    status: row.status,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    schemaVersion: row.schemaVersion,
    createdBy: row.createdBy || '',
    meta: row.meta ? JSON.parse(row.meta) : {},
    values: row.valuesData ? JSON.parse(row.valuesData) : {}
  });

  return {
    backend: 'sqlserver',
    async find(date, shift, sheetId) {
      const result = await pool.request()
        .input('date', sql.VarChar, date)
        .input('shift', sql.VarChar, shift)
        .input('sheetId', sql.Int, Number(sheetId))
        .query('SELECT * FROM submissions WHERE date = @date AND shift = @shift AND sheetId = @sheetId');
      
      if (result.recordset.length === 0) return null;
      return parseRow(result.recordset[0]);
    },
    async list({ sheetId, date, shift } = {}) {
      let req = pool.request();
      let whereClause = [];
      
      if (sheetId) {
        whereClause.push('sheetId = @sheetId');
        req.input('sheetId', sql.Int, Number(sheetId));
      }
      if (date) {
        whereClause.push('date = @date');
        req.input('date', sql.VarChar, date);
      }
      if (shift) {
        whereClause.push('shift = @shift');
        req.input('shift', sql.VarChar, shift);
      }
      
      let q = 'SELECT * FROM submissions';
      if (whereClause.length > 0) {
        q += ' WHERE ' + whereClause.join(' AND ');
      }
      
      const result = await req.query(q);
      return result.recordset.map(parseRow).map(toListRow).sort(listSort);
    },
    async upsert(payload) {
      const existing = await this.find(payload.date, payload.shift, payload.sheetId);
      const now = new Date();
      const doc = mergeDoc(existing, payload, now.toISOString());
      
      const req = pool.request()
        .input('date', sql.VarChar, doc.date)
        .input('shift', sql.VarChar, doc.shift)
        .input('sheetId', sql.Int, Number(doc.sheetId))
        .input('status', sql.VarChar, doc.status || 'submitted')
        .input('createdAt', sql.DateTime, new Date(doc.createdAt))
        .input('updatedAt', sql.DateTime, new Date(doc.updatedAt))
        .input('schemaVersion', sql.Int, doc.schemaVersion || 1)
        .input('createdBy', sql.NVarChar, doc.createdBy || '')
        .input('meta', sql.NVarChar, JSON.stringify(doc.meta || {}))
        .input('valuesData', sql.NVarChar, JSON.stringify(doc.values || {}));

      if (existing) {
        await req.query(`
          UPDATE submissions 
          SET status = @status, updatedAt = @updatedAt, meta = @meta, valuesData = @valuesData, createdBy = @createdBy
          WHERE date = @date AND shift = @shift AND sheetId = @sheetId
        `);
      } else {
        await req.query(`
          INSERT INTO submissions (date, shift, sheetId, status, createdAt, updatedAt, schemaVersion, createdBy, meta, valuesData)
          VALUES (@date, @shift, @sheetId, @status, @createdAt, @updatedAt, @schemaVersion, @createdBy, @meta, @valuesData)
        `);
      }
      
      return this.find(payload.date, payload.shift, payload.sheetId);
    },
    async count() {
      const result = await pool.request().query('SELECT COUNT(*) as cnt FROM submissions');
      return result.recordset[0].cnt;
    },
    async delete(date, shift, sheetId) {
      await pool.request()
        .input('date', sql.VarChar, date)
        .input('shift', sql.VarChar, shift)
        .input('sheetId', sql.Int, Number(sheetId))
        .query('DELETE FROM submissions WHERE date = @date AND shift = @shift AND sheetId = @sheetId');
      return true;
    },
  };
}

const store = await makeSqlServerStore();
console.log(`[db] storage backend: ${store.backend}`);

export const findSubmission = (date, shift, sheetId) => store.find(date, shift, sheetId);
export const listSubmissions = (q) => store.list(q);
export const upsertSubmission = (p) => store.upsert(p);
export const deleteSubmission = (date, shift, sheetId) => store.delete(date, shift, sheetId);
export const submissionCount = () => store.count();
export const storageBackend = () => store.backend;
