// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const AuditLog = require('./models/AuditLog');
const { analyzeAndMask } = require('./engines/security');
const { routeModel } = require('./engines/llm');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.post('/api/secure-chat', async (req, res) => {
  const startTime = Date.now();
  const { message } = req.body;

  try {
    // 1. Run Security Engines
    const securityCheck = analyzeAndMask(message);
    
    // 2. Determine which prompt to send to the LLM
    const promptForLLM = securityCheck.action === 'SANITIZE' ? securityCheck.maskedInput : securityCheck.originalInput;
    
    // 3. Route to LLM
    const llmResult = await routeModel(promptForLLM, securityCheck.riskScore, securityCheck.action);
    const processingTimeMs = Date.now() - startTime;

    // 4. Save to MongoDB Database securely
    const logEntry = new AuditLog({
      originalInput: securityCheck.originalInput,
      maskedInput: securityCheck.maskedInput,
      riskScore: securityCheck.riskScore,
      action: securityCheck.action,
      severity: securityCheck.severity,
      modelExecuted: llmResult.model,
      processingTimeMs
    });
    await logEntry.save();
    console.log(`[Database] Logged Request | Action: ${securityCheck.action} | Model: ${llmResult.model}`);

    // 5. Send structured response back to React
    res.json({
      action: securityCheck.action,
      riskScore: securityCheck.riskScore,
      severity: securityCheck.severity,
      maskedInput: securityCheck.maskedInput,
      detection: {
        isInjectionDetected: securityCheck.detectionDetails.injectionDetected,
        isSensitiveDataDetected: securityCheck.detectionDetails.sensitiveTypes.length > 0,
        injectionPatterns: securityCheck.detectionDetails.matchedPatterns,
        sensitiveDataTypes: securityCheck.detectionDetails.sensitiveTypes
      },
      matchedRules: securityCheck.matchedRules,
      safeOutput: llmResult.output,
      processingTimeMs
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 PromptShield Backend on port ${PORT}`));