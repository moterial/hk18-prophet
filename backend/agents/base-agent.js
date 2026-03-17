// backend/agents/base-agent.js — Base class for all agents
import OpenAI from 'openai';
import { config } from '../config.js';
import { acquireLLMSlot, releaseLLMSlot } from '../simulation/engine.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Attempt to repair truncated JSON by closing open strings, arrays, and objects.
 */
function repairJSON(str) {
  // Remove trailing incomplete key-value (e.g. `,"key": "unterminated`)
  let s = str;

  // If inside an unterminated string, close it
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (c === '"') inString = !inString;
  }
  if (inString) s += '"';

  // Remove trailing comma if present
  s = s.replace(/,\s*$/, '');

  // Count open braces/brackets and close them
  let openBraces = 0, openBrackets = 0;
  inString = false;
  escaped = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') openBraces++;
    else if (c === '}') openBraces--;
    else if (c === '[') openBrackets++;
    else if (c === ']') openBrackets--;
  }

  // Remove trailing comma again after string repair
  s = s.replace(/,\s*$/, '');

  while (openBrackets > 0) { s += ']'; openBrackets--; }
  while (openBraces > 0) { s += '}'; openBraces--; }
  return s;
}

export class BaseAgent {
  constructor({ name, role, systemPrompt, temperature, maxTokens }) {
    this.name = name;
    this.role = role;
    this.systemPrompt = systemPrompt;
    this.temperature = temperature ?? config.llm.agentTemperature;
    this.maxTokens = maxTokens ?? config.llm.agentMaxTokens;
    this.memory = [];
    this.client = new OpenAI({
      apiKey: config.llm.apiKey,
      baseURL: config.llm.baseUrl,
      timeout: 120000, // 120s global timeout
    });
  }

  addMemory(entry) {
    this.memory.push(entry);
  }

  getMemoryContext() {
    if (this.memory.length === 0) return '';
    return '\n\n--- Your Previous Analysis (for continuity) ---\n' +
      this.memory.map((m, i) => `Round ${i + 1}: ${JSON.stringify(m)}`).join('\n');
  }

  async callLLM(messages, retries = 2) {
    const isReasoning = /reasoner|r1/i.test(config.llm.modelName);
    // Scale timeout with maxTokens: moderators (8000 tokens) get ~180s, regular agents (2000) get ~120s
    const baseTimeout = isReasoning ? 180000 : 120000;
    const perCallTimeout = Math.max(baseTimeout, this.maxTokens * 22); // ~22ms per token budget

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const params = {
          model: config.llm.modelName,
          messages,
          max_tokens: this.maxTokens,
        };
        // Reasoning models don't support temperature
        if (!isReasoning) {
          params.temperature = this.temperature;
        }
        await acquireLLMSlot();
        // AbortController starts AFTER acquiring slot — queue wait doesn't eat into timeout
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), perCallTimeout);
        let response;
        try {
          response = await this.client.chat.completions.create(params, { signal: controller.signal });
        } finally {
          clearTimeout(timer);
          releaseLLMSlot();
        }
        return response;
      } catch (error) {
        const isRateLimit = error.status === 429 || error.message?.includes('429');
        const isTimeout = error.name === 'AbortError' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout');
        if ((isRateLimit || isTimeout) && attempt < retries) {
          const delay = Math.min(10000 * (attempt + 1), 30000);
          console.log(`⏳ [${this.name}] ${isTimeout ? 'Timeout' : 'Rate limited'}, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${retries})...`);
          await sleep(delay);
          continue;
        }
        throw error;
      }
    }
  }

  async analyze(prompt, context = '') {
    const memoryCtx = this.getMemoryContext();
    // Trim inputs to avoid overwhelming small local models
    const trimmedPrompt = prompt.slice(0, 1500);
    const trimmedContext = context.slice(0, 1000);
    const trimmedMemory = memoryCtx.slice(0, 500);
    const messages = [
      { role: 'system', content: this.systemPrompt + '\n\nYou MUST respond with valid JSON only, no markdown, no code fences. Keep your response concise. All text values in JSON MUST be in Traditional Chinese (繁體中文). JSON keys stay in English.' },
      {
        role: 'user',
        content: `${trimmedPrompt}\n\n${trimmedContext}${trimmedMemory}\n\n請用繁體中文回覆。Respond with valid JSON only (keys in English, values in 繁體中文). Use this structure:\n{"analysis":"簡要分析","districtImpacts":[{"districtCode":"XX","impact":"影響描述","direction":"up|down|stable","magnitude":5,"reasoning":"原因"}],"keyFactors":["因素1"],"risksAndUncertainties":["風險1"],"confidence":0.7}`
      }
    ];

    try {
      const response = await this.callLLM(messages);
      if (!response?.choices?.length) {
        console.error(`⚠️ [${this.name}] Unexpected API response structure:`, JSON.stringify(response, null, 2).slice(0, 500));
      }
      let content = response?.choices?.[0]?.message?.content || '{}';
      
      // Strip markdown code fences if the model wrapped the JSON
      content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      
      // Attempt to repair truncated JSON (closing open braces/brackets)
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseErr) {
        console.warn(`⚠️ [${this.name}] JSON parse failed, attempting repair...`);
        parsed = JSON.parse(repairJSON(content));
      }
      this.addMemory(parsed);
      return {
        agent: this.name,
        role: this.role,
        result: parsed,
        tokensUsed: response.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error(`❌ Agent [${this.name}] error:`, error.message);
      const fallback = {
        analysis: `Agent ${this.name} encountered an error: ${error.message}`,
        districtImpacts: [],
        keyFactors: [],
        risksAndUncertainties: ['Agent error — analysis unavailable'],
        confidence: 0,
      };
      return {
        agent: this.name,
        role: this.role,
        result: fallback,
        tokensUsed: 0,
        error: error.message,
      };
    }
  }
}

export default BaseAgent;
