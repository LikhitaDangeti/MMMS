import { index, getLayout } from '../services/schemaService.js';

export const getSheets = (_req, res) => {
  res.json(index.sheets);
};

export const getSheetLayout = (req, res) => {
  const l = getLayout(Number(req.params.id));
  if (!l) return res.status(404).json({ error: 'no such sheet' });
  res.json(l);
};
