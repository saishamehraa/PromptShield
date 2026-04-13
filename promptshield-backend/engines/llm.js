// promptshield-backend/engines/llm.js
// LLM Routing Engine with Timeouts & Console Logging

// Custom logger for the Node.js Terminal
const Logger = {
  info: (msg, data) => console.log(`[PromptShield] ${msg}`, data || ''),
  success: (msg, data) => console.log(`[Router] ✅ ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[Fallback] ⚠️ ${msg}`, data || ''),
  error: (msg, data) => console.error(`[Error] ❌ ${msg}`, data || ''),
};

// ------------------------------------------------------------------
// 1. OLLAMA INTEGRATION (Local / Tunnel)
// ------------------------------------------------------------------
async function callOllama(prompt, modelName) {
  const startTime = performance.now();
  Logger.info(`Executing local model: ${modelName}...`);

  const controller = new AbortController();
  // 120-second timeout for local CPU inference
  const timeoutId = setTimeout(() => controller.abort(), 300000); 

  // Grab the ngrok URL from Render, or fallback to localhost if testing locally
  const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' // Crucial for free ngrok accounts!
      },
      body: JSON.stringify({ model: modelName, prompt: prompt, stream: false }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);

    const data = await response.json();
    const timeTaken = ((performance.now() - startTime) / 1000).toFixed(2);
    Logger.success(`Successfully executed ${modelName} in ${timeTaken}s`);
    
    return data.response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      Logger.error(`Ollama (${modelName}) timed out after 300 seconds.`);
    } else {
      Logger.error(`Ollama (${modelName}) Failed:`, error.message);
    }
    throw error;
  }
}

// ------------------------------------------------------------------
// 2. HUGGING FACE INTEGRATION (Cloud)
// ------------------------------------------------------------------

async function callHuggingFaceAPI(prompt) {
  const apiKey = process.env.HF_API_KEY; 
  const startTime = performance.now();
  
  // 1. New 2026 Standard: OpenAI-compatible Router URL
  const URL = `https://router.huggingface.co/v1/chat/completions`;
  const MODEL_ID = "google/gemma-4-31B-it";
  
  Logger.info(`Executing Cloud API (HF Router v1: ${MODEL_ID})...`);
  
  if (!apiKey) {
    Logger.warn("No Hugging Face API Key found. Skipping cloud model.");
    throw new Error("Missing HF API Key");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); 

  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-wait-for-model': 'true',
      },
      body: JSON.stringify({ 
        model: MODEL_ID,
        messages: [
          { role: "system", content: "You are a secure AI assistant. Output only the safe, sanitized response." },
          { role: "user", content: prompt }
        ],
        max_tokens: 512,
        temperature: 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Router Error ${response.status}: ${errorData.error?.message || 'Unknown Error'}`);
    }

    const data = await response.json();
    const timeTaken = ((performance.now() - startTime) / 1000).toFixed(2);
    
    Logger.success(`Successfully executed via HF Router in ${timeTaken}s`);

    // OpenAI format returns choices[0].message.content
    return data.choices[0].message.content.trim();
  } catch (error) {
    clearTimeout(timeoutId);
    Logger.error('Hugging Face Router Failed:', error.message);
    throw error;
  }
}

// ------------------------------------------------------------------
// 3. MODEL ROUTER (Orchestrator)
// ------------------------------------------------------------------
async function routeModel(input, riskScore, action) {
  const timestamp = new Date().toISOString();
  Logger.info(`--- New Request | Risk Score: ${riskScore} | Action: ${action} ---`);

  if (action === 'BLOCK') {
    Logger.error("Policy Action: BLOCK. LLM execution skipped.");
    return {
      output: "🔒 Request blocked due to strict security policies. No LLM was invoked.",
      model: "PromptShield Gateway",
      timestamp,
    };
  }

  try {
    // Rule 2: High Risk -> Cloud API (Gemma 4 31B) -> Fallback to gemma4:latest
    if (riskScore > 60) {
      try {
        const output = await callHuggingFaceAPI(input);
        return { output, model: 'HF API (Gemma-4-31B)', timestamp };
      } catch (e) {
        Logger.warn("Cascading to local High-Tier fallback (gemma4:latest)...");
        const output = await callOllama(input, 'gemma4:latest'); 
        return { output, model: 'Ollama (gemma4:latest) - Fallback', timestamp };
      }
    }

    // Rule 3: Medium Risk -> Strong Local -> Fallback to lightweight
    if (riskScore > 30) {
      try {
        const output = await callOllama(input, 'gemma4:latest');
        return { output, model: 'Ollama (gemma4:latest)', timestamp };
      } catch (e) {
        Logger.warn("Cascading to lightweight fallback (gemma:2b)...");
        const output = await callOllama(input, 'gemma:2b');
        return { output, model: 'Ollama (gemma:2b) - Fallback', timestamp };
      }
    }

    // Rule 4: Low Risk -> Fastest Local (gemma:2b)
    const output = await callOllama(input, 'gemma:2b');
    return { output, model: 'Ollama (gemma:2b)', timestamp };

  } catch (criticalError) {
    Logger.error("FATAL: All models offline or timed out.");
    return {
      output: "⚠️ System error: All language models timed out or are offline.",
      model: "System Offline",
      timestamp,
    };
  }
}

module.exports = { routeModel };