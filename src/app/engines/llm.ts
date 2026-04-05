// src/app/engines/llm.ts
// LLM Routing Engine with Timeouts & Console Logging

export interface LLMResponse {
  output: string;
  model: string;
  timestamp: string;
}

// Custom logger for the Browser Console
const Logger = {
  info: (msg: string, data?: any) => console.log(`%c[PromptShield] ${msg}`, 'color: #3b82f6; font-weight: bold', data || ''),
  success: (msg: string, data?: any) => console.log(`%c[Router] ${msg}`, 'color: #22c55e; font-weight: bold', data || ''),
  warn: (msg: string, data?: any) => console.warn(`%c[Fallback] ${msg}`, 'color: #eab308; font-weight: bold', data || ''),
  error: (msg: string, data?: any) => console.error(`%c[Error] ${msg}`, 'color: #ef4444; font-weight: bold', data || ''),
};

// Helper: Fetch with Timeout
async function fetchWithTimeout(resource: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// ------------------------------------------------------------------
// 1. OLLAMA INTEGRATION (Local)
// ------------------------------------------------------------------
async function callOllama(prompt: string, modelName: string): Promise<string> {
  const startTime = performance.now();
  Logger.info(`Executing local model: ${modelName}...`);

  try {
    // 30 second timeout for local models to prevent 193s hangs
    const response = await fetchWithTimeout('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelName, prompt: prompt, stream: false }),
    }, 120000);

    if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);

    const data = await response.json();
    const timeTaken = ((performance.now() - startTime) / 1000).toFixed(2);
    Logger.success(`Successfully executed ${modelName} in ${timeTaken}s`);
    
    return data.response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      Logger.error(`Ollama (${modelName}) timed out after 30 seconds.`);
    } else {
      Logger.error(`Ollama (${modelName}) Failed:`, error.message);
    }
    throw error;
  }
}

// ------------------------------------------------------------------
// 2. HUGGING FACE INTEGRATION (Cloud - Gemma 4 31B)
// ------------------------------------------------------------------
async function callHuggingFaceAPI(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_HF_API_KEY; 
  const startTime = performance.now();
  Logger.info(`Executing Cloud API (Hugging Face: Gemma-4-31B-it)...`);
  
  if (!apiKey) {
    Logger.warn("No Hugging Face API Key found. Skipping cloud model.");
    throw new Error("Missing HF API Key");
  }

  try {
    // 15-second timeout for cloud API
    const response = await fetchWithTimeout(
      `https://router.huggingface.co/hf-inference/models/google/gemma-4-31B-it`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ 
          inputs: prompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.2, // Low temperature for security/accuracy
            return_full_text: false
          }
        }),
      }, 15000);

    if (!response.ok) throw new Error(`Hugging Face API error: ${response.statusText}`);

    const data = await response.json();
    const timeTaken = ((performance.now() - startTime) / 1000).toFixed(2);
    Logger.success(`Successfully executed Hugging Face API in ${timeTaken}s`);

    // HF returns an array containing the generated text
    return data[0].generated_text.trim();
  } catch (error: any) {
    Logger.error('Hugging Face API Failed:', error.message);
    throw error;
  }
}
// ------------------------------------------------------------------
// 3. MODEL ROUTER (Orchestrator)
// ------------------------------------------------------------------
export async function routeModel(
  input: string,
  riskScore: number,
  action: 'ALLOW' | 'SANITIZE' | 'BLOCK'
): Promise<LLMResponse> {
  
  const timestamp = new Date().toISOString();
  console.groupCollapsed(`🛡️ PromptShield Execution: ${timestamp}`);
  Logger.info(`Risk Score: ${riskScore} | Action: ${action}`);

  // Rule 1: Immediate Block
  if (action === 'BLOCK') {
    Logger.error("Policy Action: BLOCK. LLM execution skipped.");
    console.groupEnd();
    return {
      output: "🔒 Request blocked due to strict security policies. No LLM was invoked.",
      model: "PromptShield Gateway",
      timestamp,
    };
  }

  try {
    // Rule 2: High Risk -> Cloud API (Smartest) -> Fallback to gemma4:latest
    if (riskScore > 60) {
      try {
        const output = await callHuggingFaceAPI(input);
        console.groupEnd();
        return { output, model: 'Hugging Face API (Cloud)', timestamp };
      } catch (e) {
        Logger.warn("Cascading to local High-Tier fallback (gemma4:latest)...");
        const output = await callOllama(input, 'gemma4:latest'); 
        console.groupEnd();
        return { output, model: 'Ollama (gemma4:latest) - Fallback', timestamp };
      }
    }

    // Rule 3: Medium Risk -> Strong Local (gemma4:latest) -> Fallback to lightweight
    if (riskScore > 30) {
      try {
        const output = await callOllama(input, 'gemma4:latest');
        console.groupEnd();
        return { output, model: 'Ollama (gemma4:latest)', timestamp };
      } catch (e) {
        Logger.warn("Cascading to lightweight fallback (gemma:2b)...");
        const output = await callOllama(input, 'gemma:2b');
        console.groupEnd();
        return { output, model: 'Ollama (gemma:2b) - Fallback', timestamp };
      }
    }

    // Rule 4: Low Risk -> Fastest Local (gemma:2b)
    const output = await callOllama(input, 'gemma:2b');
    console.groupEnd();
    return { output, model: 'Ollama (gemma:2b)', timestamp };

  } catch (criticalError) {
    Logger.error("FATAL: All models offline or timed out.");
    console.groupEnd();
    return {
      output: "⚠️ System error: All language models timed out or are offline.",
      model: "System Offline",
      timestamp,
    };
  }
}