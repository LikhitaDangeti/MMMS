import { getAllowedCells } from '../services/schemaService.js';

const SHIFTS = ['A', 'B', 'C'];

export function validateSubmission(req, res, next) {
  const body = req.body;
  const errs = [];
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date || '')) errs.push('date must be YYYY-MM-DD');
  if (!SHIFTS.includes(body.shift)) errs.push('shift must be A, B or C');
  
  const sid = Number(body.sheetId);
  if (!(sid >= 1 && sid <= 13)) errs.push('sheetId must be 1..13');
  
  if (body.values && typeof body.values !== 'object') errs.push('values must be an object');
  
  const allowed = getAllowedCells(sid);
  if (body.values && allowed) {
    for (const cell of Object.keys(body.values)) {
      if (!allowed.has(cell)) errs.push(`unknown cell ${cell} for sheet ${sid}`);
    }
  }
  
  if (errs.length > 0) return res.status(400).json({ errors: errs });
  next();
}
