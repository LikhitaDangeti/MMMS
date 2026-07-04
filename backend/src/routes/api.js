import { Router } from 'express';
import { getSheets, getSheetLayout } from '../controllers/sheetController.js';
import { getSubmission, listAllSubmissions, createSubmission, downloadXlsx, deleteSubmission } from '../controllers/submissionController.js';
import { validateSubmission } from '../middleware/validate.js';
import { submissionCount, storageBackend } from '../../db.js';

const router = Router();

// Sheets
router.get('/sheets', getSheets);
router.get('/sheets/:id/layout', getSheetLayout);

// Submissions
router.get('/submissions', getSubmission);
router.get('/submissions/list', listAllSubmissions);
router.post('/submissions', validateSubmission, createSubmission);
router.delete('/submissions', deleteSubmission);
router.get('/submissions/xlsx', downloadXlsx);

// Health
router.get('/health', async (_req, res) => res.json({ ok: true, backend: storageBackend(), submissions: await submissionCount() }));

export default router;
