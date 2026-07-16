import { getFieldMap } from '../services/schemaService.js';

const SHIFTS = ['A', 'B', 'C'];

export function validateSubmission(req, res, next) {
  const body = req.body;
  const errs = [];
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date || '')) errs.push('date must be YYYY-MM-DD');
  if (!SHIFTS.includes(body.shift)) errs.push('shift must be A, B or C');
  
  const sid = Number(body.sheetId);
  if (!(sid >= 1 && sid <= 13)) errs.push('sheetId must be 1..13');
  
  if (body.values && typeof body.values !== 'object') {
    errs.push('values must be an object');
  } else if (body.values) {
    const fieldMap = getFieldMap(sid);
    if (!fieldMap) {
      errs.push(`invalid sheetId ${sid}`);
    } else {
      for (const [cell, value] of Object.entries(body.values)) {
        const field = fieldMap[cell];
        if (!field) {
          errs.push(`unknown cell ${cell} for sheet ${sid}`);
          continue;
        }

        // Deep validation based on field type
        if (field.ft === 'choice') {
          if (!field.opts.includes(value)) {
            errs.push(`cell ${cell} expects one of [${field.opts.join(', ')}], got "${value}"`);
          }
        } else if (field.ft === 'number') {
          const num = Number(value);
          if (isNaN(num)) {
            errs.push(`cell ${cell} expects a number, got "${value}"`);
          } else {
            // Check provided min/max bounds, or apply sane global bounds
            const min = field.min !== undefined ? field.min : -100000;
            const max = field.max !== undefined ? field.max : 100000;
            if (num < min || num > max) {
              errs.push(`cell ${cell} value ${num} is out of bounds (min: ${min}, max: ${max})`);
            }
          }
        } else if (field.ft === 'text') {
          if (typeof value !== 'string') {
            errs.push(`cell ${cell} expects text`);
          } else if (value.length > 500) {
            errs.push(`cell ${cell} exceeds max length of 500 characters`);
          }
        }
      }
    }
  }
  
  if (errs.length > 0) return res.status(400).json({ errors: errs });
  next();
}
