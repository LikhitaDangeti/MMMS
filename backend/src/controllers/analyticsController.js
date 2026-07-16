import { listSubmissionsWithValues } from '../../db.js';
import { getLayout } from '../services/schemaService.js';

export async function getAnalytics(req, res) {
  try {
    const sheetId = Number(req.params.id);
    if (!sheetId || isNaN(sheetId)) return res.status(400).json({ error: 'invalid sheetId' });

    const layout = getLayout(sheetId);
    if (!layout) return res.status(404).json({ error: 'sheet not found' });

    const submissions = await listSubmissionsWithValues({ sheetId });
    
    // Sort submissions by date ascending, then shift for time series
    submissions.sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff !== 0) return dateDiff;
      return (a.shift || '').localeCompare(b.shift || '');
    });

    // Time Series: Anomalies over time
    const timeSeriesMap = {};
    const equipmentFails = {};
    const shiftStats = { A: 0, B: 0, C: 0 };
    let totalAnomalies = 0;

    for (const sub of submissions) {
      if (!timeSeriesMap[sub.date]) {
        timeSeriesMap[sub.date] = { date: sub.date, anomalies: 0, submissions: 0 };
      }
      
      timeSeriesMap[sub.date].submissions += 1;
      let anomaliesInSub = 0;
      
      for (const [cell, value] of Object.entries(sub.values || {})) {
        const field = layout.fields.find(f => f.cell === cell);
        if (!field) continue;
        
        let isAnomaly = false;
        if (field.ft === 'choice' && field.anomaly_if && field.anomaly_if.includes(value)) {
          isAnomaly = true;
        } else if (field.ft === 'number') {
           const num = Number(value);
           if ((field.min !== undefined && num < field.min) || (field.max !== undefined && num > field.max)) {
             isAnomaly = true;
           } else if (field.min === undefined && field.max === undefined && (num > 100 || num < 0)) {
             // Catch mock data anomalies if bounds aren't set
             isAnomaly = true;
           }
        }

        if (isAnomaly) {
          anomaliesInSub++;
          // Use colKey or rowKey or cell as equipment name
          let equipmentName = field.colKey || field.rowKey || cell;
          // Trim to prevent super long labels in charts
          if (equipmentName.length > 25) equipmentName = equipmentName.substring(0, 22) + '...';
          equipmentFails[equipmentName] = (equipmentFails[equipmentName] || 0) + 1;
        }
      }
      
      timeSeriesMap[sub.date].anomalies += anomaliesInSub;
      shiftStats[sub.shift] += anomaliesInSub;
      totalAnomalies += anomaliesInSub;
    }

    const timeSeries = Object.values(timeSeriesMap);
    
    // Top 5 failing equipment
    const topFailures = Object.entries(equipmentFails)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
      
    const shiftData = Object.entries(shiftStats).map(([name, value]) => ({ name, value }));

    const numericFields = layout.fields
      .filter(f => f.ft === 'number')
      .map(f => ({
        cell: f.cell,
        name: `${f.rowKey || ''} - ${f.colKey || ''}`.replace(/^- |- $/g, '').trim() || f.cell
      }));

    res.json({
      totalSubmissions: submissions.length,
      totalAnomalies,
      timeSeries,
      topFailures,
      shiftData,
      numericFields,
      submissions: submissions.map(s => ({
        date: s.date,
        shift: s.shift,
        values: s.values || {}
      }))
    });

  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
}
