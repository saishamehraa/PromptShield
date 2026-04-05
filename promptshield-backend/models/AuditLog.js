// models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  originalInput: { type: String, required: true },
  maskedInput: { type: String },
  riskScore: { type: Number, required: true },
  action: { type: String, enum: ['ALLOW', 'SANITIZE', 'BLOCK'], required: true },
  severity: { type: String, required: true },
  matchedRules: [{ type: String }],
  modelExecuted: { type: String },
  processingTimeMs: { type: Number }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);