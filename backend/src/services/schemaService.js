import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = path.join(__dirname, '..', '..', '..', 'schemas');

const layouts = {};
for (let i = 1; i <= 13; i++) {
  layouts[i] = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, `sheet${i}.layout.json`), 'utf-8'));
}

export const index = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, 'index.json'), 'utf-8'));

export const getLayout = (id) => layouts[id];

export const getAllowedCells = (id) => {
  if (!layouts[id]) return null;
  return new Set(layouts[id].fields.map((f) => f.cell));
};

export const getFieldMap = (id) => {
  if (!layouts[id]) return null;
  const map = {};
  for (const f of layouts[id].fields) {
    map[f.cell] = f;
  }
  return map;
};
