import { findSubmission, listSubmissions, upsertSubmission, deleteSubmission as dbDeleteSubmission } from '../../db.js';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(__dirname, '..', '..', '..', 'template', 'MillShiftCheckList.xlsx');
const STAMP_SCRIPT = path.join(__dirname, '..', '..', 'stamp.py');

export const getSubmission = async (req, res) => {
  const { date, shift, sheetId } = req.query;
  if (!date || !shift || !sheetId) return res.status(400).json({ error: 'date, shift, sheetId required' });
  res.json(await findSubmission(date, shift, Number(sheetId)));
};

export const listAllSubmissions = async (req, res) => {
  res.json(await listSubmissions(req.query));
};

export const createSubmission = async (req, res) => {
  const saved = await upsertSubmission({
    date: req.body.date,
    shift: req.body.shift,
    sheetId: Number(req.body.sheetId),
    meta: req.body.meta || {},
    values: req.body.values || {},
    status: req.body.status || 'submitted',
    createdBy: req.body.createdBy || (req.body.meta && req.body.meta.checkedBy) || '',
  });
  res.json(saved);
};

export const downloadXlsx = async (req, res) => {
  const { date, shift, sheetId } = req.query;
  const sub = await findSubmission(date, shift, Number(sheetId));
  if (!sub) return res.status(404).json({ error: 'no submission for that date/shift/sheet' });

  const outName = `Sheet${sheetId}_${date}_${shift}.xlsx`;
  const outPath = path.join(os.tmpdir(), `mmms_${Date.now()}_${outName}`);
  const py = spawn('python', [STAMP_SCRIPT, TEMPLATE, outPath], { stdio: ['pipe', 'inherit', 'inherit'] });
  
  py.stdin.write(JSON.stringify({ sheetId: Number(sheetId), date, shift, meta: sub.meta || {}, values: sub.values || {} }));
  py.stdin.end();
  
  py.on('close', (code) => {
    if (code !== 0 || !fs.existsSync(outPath)) return res.status(500).json({ error: 'excel stamping failed' });
    res.download(outPath, outName, () => fs.unlink(outPath, () => {}));
  });
};

export const deleteSubmission = async (req, res) => {
  const { date, shift, sheetId } = req.query;
  if (!date || !shift || !sheetId) return res.status(400).json({ error: 'date, shift, sheetId required' });
  await dbDeleteSubmission(date, shift, Number(sheetId));
  res.json({ ok: true });
};
