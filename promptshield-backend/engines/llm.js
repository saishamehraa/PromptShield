// promptshield-backend/engines/llm.js
// 3-Tier Cascading LLM Router (HF -> Ollama -> OpenRouter Round-Robin)

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
  const timeoutId = setTimeout(() => controller.abort(), 300000); 

  let OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  if (OLLAMA_BASE_URL.endsWith('/')) {
    OLLAMA_BASE_URL = OLLAMA_BASE_URL.slice(0, -1);
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' 
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
// 2. HUGGING FACE INTEGRATION (Cloud Primary)
// ------------------------------------------------------------------
async function callHuggingFaceAPI(prompt) {
  const apiKey = (process.env.HF_API_KEY || "").trim(); 
  const startTime = performance.now();
  const URL = `https://router.huggingface.co/v1/chat/completions`;
  const MODEL_ID = "google/gemma-4-31B-it";
  
  Logger.info(`Executing Cloud API (HF Router v1: ${MODEL_ID})...`);
  
  if (!apiKey) throw new Error("Missing HF API Key");

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

    if (!response.ok) throw new Error(`Router Error ${response.status}`);

    const data = await response.json();
    const timeTaken = ((performance.now() - startTime) / 1000).toFixed(2);
    Logger.success(`Successfully executed via HF Router in ${timeTaken}s`);

    return data.choices[0].message.content.trim();
  } catch (error) {
    clearTimeout(timeoutId);
    Logger.error('Hugging Face Router Failed:', error.message);
    throw error;
  }
}

// ------------------------------------------------------------------
// 3. OPENROUTER INTEGRATION (Round-Robin Fallback)
// ------------------------------------------------------------------
async function callOpenRouterAPI(prompt) {
  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim(); 
  const startTime = performance.now();
  
  // 🔥 FIX: The Round-Robin Fallback Array
  const FALLBACK_MODELS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free"
  ];
  
  if (!apiKey) throw new Error("Missing OpenRouter API Key");

  let lastError = null;

  // Try each model in the array sequentially
  for (const modelId of FALLBACK_MODELS) {
    Logger.info(`Attempting Ultimate Fallback (OpenRouter: ${modelId})...`);
    
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://promptshield-vkdv.onrender.com",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: "system", content: "You are a secure AI assistant. Output only the safe, sanitized response." },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Rejected: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const timeTaken = ((performance.now() - startTime) / 1000).toFixed(2);
      Logger.success(`Successfully executed via OpenRouter (${modelId}) in ${timeTaken}s`);

      // Return both the output AND the specific model that succeeded
      return {
        output: data.choices[0].message.content.trim(),
        modelUsed: `OpenRouter (${modelId}) - Fallback`
      };
      
    } catch (error) {
      Logger.warn(`OpenRouter model [${modelId}] failed: ${error.message}. Trying next model...`);
      lastError = error;
      // The loop will automatically continue to the next model in FALLBACK_MODELS
    }
  }

  // If the code reaches here, it means EVERY model in the array failed
  Logger.error('All OpenRouter fallback models have been exhausted and failed.');
  throw lastError;
}

// ------------------------------------------------------------------
// 4. MODEL ROUTER (Orchestrator)
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

  let output;
  let modelUsed;

  try {
    // TIER 1 & 2: Try Primary Cloud (HF) or Local Edge (Ollama)
    if (riskScore > 60) {
      try {
        output = await callHuggingFaceAPI(input);
        modelUsed = 'HF API (Gemma-4-31B)';
      } catch (e) {
        Logger.warn("HF API down. Cascading to local High-Tier (gemma4:latest)...");
        output = await callOllama(input, 'gemma4:latest'); 
        modelUsed = 'Ollama (gemma4:latest) - Fallback';
      }
    } else if (riskScore > 30) {
      try {
        output = await callOllama(input, 'gemma4:latest');
        modelUsed = 'Ollama (gemma4:latest)';
      } catch (e) {
        Logger.warn("Strong local down. Cascading to lightweight (gemma:2b)...");
        output = await callOllama(input, 'gemma:2b');
        modelUsed = 'Ollama (gemma:2b) - Fallback';
      }
    } else {
      output = await callOllama(input, 'gemma:2b');
      modelUsed = 'Ollama (gemma:2b)';
    }

    return { output, model: modelUsed, timestamp };

  } catch (primaryError) {
    // TIER 3: THE ULTIMATE SAFETY NET (OpenRouter Round-Robin)
    Logger.warn("Primary & Local routing failed. Triggering Ultimate Cloud Fallback...");
    
    try {
      const openRouterResult = await callOpenRouterAPI(input);
      // We extract the dynamic modelUsed from the new return object
      return { 
        output: openRouterResult.output, 
        model: openRouterResult.modelUsed, 
        timestamp 
      };
      
    } catch (criticalError) {
      Logger.error(`FATAL: All models offline. Reason: ${criticalError.message}`);
      return {
        output: "⚠️ System error: All language models timed out or are offline.",
        model: "System Offline",
        timestamp,
      };
    }
  }
}

module.exports = { routeModel };