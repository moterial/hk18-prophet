// backend/agents/base-agent.js — Base class for all agents
import OpenAI from 'openai';
import { config } from '../config.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

  async callLLM(messages, retries = 5) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: config.llm.modelName,
          messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
        });
        return response;
      } catch (error) {
        const isRateLimit = error.status === 429 || error.message?.includes('429');
        if (isRateLimit && attempt < retries) {
          const delay = Math.min(15000 * (attempt + 1), 60000);
          console.log(`⏳ [${this.name}] Rate limited, waiting ${delay / 1000}s (attempt ${attempt + 1}/${retries})...`);
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
      { role: 'system', content: this.systemPrompt + '\n\nYou MUST respond with valid JSON only, no markdown, no code fences. Keep your response concise.' },
      {
        role: 'user',
        content: `${trimmedPrompt}\n\n${trimmedContext}${trimmedMemory}\n\nRespond with valid JSON only. Use this structure:\n{"analysis":"brief analysis","districtImpacts":[{"districtCode":"XX","impact":"desc","direction":"up|down|stable","magnitude":5,"reasoning":"why"}],"keyFactors":["factor1"],"risksAndUncertainties":["risk1"],"confidence":0.7}`
      }
    ];

    try {
      const response = await this.callLLM(messages);
      let content = response.choices[0]?.message?.content || '{}';
      
      // Strip markdown code fences if the model wrapped the JSON
      content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      
      const parsed = JSON.parse(content);
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
