import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { upsertSubmission } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = path.join(__dirname, '..', '..', 'schemas');

const SHIFTS = ['A', 'B', 'C'];

// Generate a random date in YYYY-MM-DD format
function getDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

async function seed() {
  console.log('Seeding analytics data for sheets 1, 2, 3...');
  
  for (const sheetId of [1, 2, 3]) {
    const layout = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, `sheet${sheetId}.layout.json`), 'utf-8'));
    const fields = layout.fields;
    
    // Create 30 days of data
    for (let d = 30; d >= 0; d--) {
      const dateStr = getDate(d);
      
      for (const shift of SHIFTS) {
        const values = {};
        let anomalyCount = 0;
        
        for (const field of fields) {
          // 95% chance to fill the field
          if (Math.random() > 0.95) continue;
          
          let val = '';
          
          if (field.ft === 'choice') {
            if (field.anomaly_if && field.anomaly_if.length > 0 && Math.random() > 0.95) {
              val = field.anomaly_if[0];
              anomalyCount++;
            } else {
              const safeOpts = field.opts.filter(o => !(field.anomaly_if || []).includes(o));
              val = safeOpts[Math.floor(Math.random() * safeOpts.length)] || field.opts[0];
            }
          } else if (field.ft === 'number') {
             if (Math.random() > 0.95) {
               val = Math.floor(Math.random() * 200) + 100;
             } else {
               val = Math.floor(Math.random() * 50) + 20;
             }
          } else {
             val = "Mock Data";
          }
          
          values[field.cell] = val;
        }
        
        const payload = {
          sheetId,
          date: dateStr,
          shift: shift,
          status: 'submitted',
          createdBy: 'seed-script',
          meta: { seed: true, simulatedAnomalies: anomalyCount },
          values: values
        };
        
        await upsertSubmission(payload);
      }
    }
  }
  console.log('Done seeding data!');
  process.exit(0);
}

seed().catch(console.error);
