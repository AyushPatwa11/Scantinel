const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Scan = require('../models/Scan');
const { runScan } = require('../services/scanner');
const { validateScanRequest } = require('../middleware/validator');
const { asyncHandler } = require('../middleware/asyncHandler');

// SSE client registry: scanId → Set<res>
const sseRegistry = new Map();

function emit(scanId, payload) {
  const clients = sseRegistry.get(scanId);
  if (!clients || clients.size === 0) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  clients.forEach(res => {
    try { res.write(data); } catch {}
  });
}

// POST /api/scans — initiate scan
router.post('/', validateScanRequest, asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || url.trim().length < 3) {
    return res.status(400).json({ error: 'A valid URL is required.' });
  }

  const cleanUrl = url.trim().toLowerCase().replace(/^https?:\/\//i, '') ? url.trim() : url.trim();
  const scanId = uuidv4();

  const scan = new Scan({ scanId, url: cleanUrl, status: 'queued', progress: 0, currentStep: 'Queued' });
  await scan.save();

  // Fire-and-forget async scan
  (async () => {
    try {
      scan.status = 'running';
      scan.startedAt = new Date();
      scan.currentStep = 'Starting...';
      await scan.save();
      emit(scanId, { event: 'progress', status: 'running', progress: 0, currentStep: 'Starting...', phase: '' });

      const result = await runScan(scan, async (progress, currentStep, currentPhase) => {
        scan.progress = progress;
        scan.currentStep = currentStep;
        scan.currentPhase = currentPhase || '';
        await scan.save();
        emit(scanId, { event: 'progress', status: 'running', progress, currentStep, phase: currentPhase || '' });
      });

      scan.status = 'completed';
      scan.completedAt = new Date();
      scan.findings     = result.findings;
      scan.openPorts    = result.openPorts;
      scan.technologies = result.technologies;
      scan.headers      = result.headers;
      scan.summary      = result.summary;
      scan.progress     = 100;
      scan.currentStep  = 'Scan complete';
      await scan.save();
      emit(scanId, { event: 'complete', status: 'completed', progress: 100 });
    } catch (err) {
      scan.status = 'failed';
      scan.error  = err.message;
      await scan.save();
      emit(scanId, { event: 'error', status: 'failed', error: err.message });
    } finally {
      setTimeout(() => {
        const clients = sseRegistry.get(scanId);
        if (clients) { clients.forEach(r => { try { r.end(); } catch {} }); sseRegistry.delete(scanId); }
      }, 3000);
    }
  })();

  res.status(201).json({ scanId, status: 'queued' });
}));

// GET /api/scans/:id/stream — SSE progress stream
router.get('/:id/stream', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': connected\n\n');

  if (!sseRegistry.has(req.params.id)) sseRegistry.set(req.params.id, new Set());
  sseRegistry.get(req.params.id).add(res);

  const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 20000);
  req.on('close', () => {
    clearInterval(ping);
    const clients = sseRegistry.get(req.params.id);
    if (clients) clients.delete(res);
  });
});

// GET /api/scans/:id — fetch scan by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const scan = await Scan.findOne({ scanId: req.params.id }).lean();
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  res.json(scan);
}));

// GET /api/scans — recent scans list
router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const scans = await Scan.find({}, {
    scanId: 1, url: 1, status: 1, progress: 1, createdAt: 1,
    completedAt: 1, durationMs: 1, 'summary.grade': 1, 'summary.riskScore': 1,
    'summary.riskLevel': 1, 'summary.high': 1, 'summary.medium': 1,
    'summary.low': 1, 'summary.critical': 1, 'summary.total': 1,
    technologies: 1, error: 1
  }).sort({ createdAt: -1 }).limit(limit).lean();
  res.json(scans);
}));

// DELETE /api/scans/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await Scan.deleteOne({ scanId: req.params.id });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
}));

// GET /api/scans/:id/report — JSON report export
router.get('/:id/report', asyncHandler(async (req, res) => {
  const scan = await Scan.findOne({ scanId: req.params.id }).lean();
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  res.setHeader('Content-Disposition', `attachment; filename="scantinel-${scan.scanId}.json"`);
  res.json({ reportVersion: '2.0', generatedAt: new Date(), scan });
}));

module.exports = router;
