const mongoose = require('mongoose');

const FindingSchema = new mongoose.Schema({
  id:             { type: String, required: true },
  severity:       { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], required: true },
  category:       { type: String, required: true },
  title:          { type: String, required: true },
  description:    { type: String, required: true },
  impact:         { type: String },
  recommendation: { type: String, required: true },
  evidence:       { type: String },
  cvss:           { type: Number },
  port:           { type: Number },
  service:        { type: String },
  cwe:            { type: String }
}, { _id: false });

const PortSchema = new mongoose.Schema({
  port:     { type: Number, required: true },
  service:  { type: String },
  state:    { type: String, default: 'open' },
  protocol: { type: String, default: 'tcp' },
  risk:     { type: String, enum: ['critical', 'high', 'medium', 'low', 'safe', 'unknown'], default: 'unknown' },
  version:  { type: String }
}, { _id: false });

const ScanSchema = new mongoose.Schema({
  scanId:        { type: String, required: true, unique: true, index: true },
  url:           { type: String, required: true },
  hostname:      { type: String },
  ip:            { type: String },
  status:        { type: String, enum: ['queued', 'running', 'completed', 'failed'], default: 'queued', index: true },
  progress:      { type: Number, default: 0, min: 0, max: 100 },
  currentStep:   { type: String, default: 'Queued' },
  currentPhase:  { type: String, default: '' },
  startedAt:     { type: Date },
  completedAt:   { type: Date },
  durationMs:    { type: Number },
  findings:      { type: [FindingSchema], default: [] },
  openPorts:     { type: [PortSchema], default: [] },
  technologies:  { type: [String], default: [] },
  headers:       { type: mongoose.Schema.Types.Mixed, default: {} },
  summary: {
    critical:   { type: Number, default: 0 },
    high:       { type: Number, default: 0 },
    medium:     { type: Number, default: 0 },
    low:        { type: Number, default: 0 },
    info:       { type: Number, default: 0 },
    total:      { type: Number, default: 0 },
    riskScore:  { type: Number, default: 100 },
    grade:      { type: String, default: 'N/A' },
    riskLevel:  { type: String, default: 'Unknown' }
  },
  error: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

ScanSchema.virtual('isComplete').get(function () {
  return this.status === 'completed' || this.status === 'failed';
});

ScanSchema.pre('save', function (next) {
  if (this.status === 'completed' && this.startedAt) {
    this.durationMs = Date.now() - this.startedAt.getTime();
  }
  next();
});

module.exports = mongoose.model('Scan', ScanSchema);
