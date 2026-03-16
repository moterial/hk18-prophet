// backend/agents/estate-agent.js — Generates a detailed prediction report for a single estate/building
import { BaseAgent } from './base-agent.js';
import { config } from '../config.js';

export class EstateAgent extends BaseAgent {
  constructor(estate, district) {
    const profileBlock = district
      ? `Estate Profile:
- Name: ${estate.name} (${estate.nameCn})
- Area: ${estate.area}
- District: ${district.name} (${district.nameCn}), Code: ${district.code}
- Region: ${district.region}
- District Character: ${district.character}
- District Price Range: HK$${district.priceRange[0].toLocaleString()} – $${district.priceRange[1].toLocaleString()} per sq ft
- District Key Drivers: ${district.keyDrivers.join(', ')}`
      : `Estate Query:
- Search Term: ${estate.name}
- You must identify which district and area this property belongs to based on your knowledge of Hong Kong real estate.
- If the name is ambiguous, pick the most well-known match and state your reasoning.`;

    const jsonTemplate = district
      ? `{
  "estateName": "${estate.name}",
  "estateNameCn": "${estate.nameCn}",
  "area": "${estate.area}",
  "districtCode": "${district.code}",
  "districtName": "${district.name}",
  "districtNameCn": "${district.nameCn}",`
      : `{
  "estateName": "English name you identified",
  "estateNameCn": "中文名稱",
  "area": "Area in Hong Kong",
  "districtCode": "Two-letter district code",
  "districtName": "District English name",
  "districtNameCn": "區域中文名",`;

    super({
      name: `Estate Analyst — ${estate.name}`,
      role: 'estate-analyst',
      systemPrompt: `You are a specialist property analyst for the HK18 Prophet prediction engine, producing a DETAILED report for a single housing estate (屋苑).

${profileBlock}

Your output MUST be valid JSON with this structure:
${jsonTemplate}
  "direction": "up|down|stable",
  "summary": "Detailed executive summary of the outlook for this estate",
  "currentPricePerSqft": 12000,
  "predictions": {
    "1year": { "change": "+X.X%", "estimatedPrice": 12500, "narrative": "..." },
    "5year": { "change": "+X.X%", "estimatedPrice": 14000, "narrative": "..." },
    "10year": { "change": "+X.X%", "estimatedPrice": 16000, "narrative": "..." }
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "keyFactors": ["factor1", "factor2", "factor3"],
  "recommendation": "buy|hold|wait",
  "recommendationReasoning": "Detailed reasoning for the recommendation",
  "comparableEstates": [
    { "name": "Estate Name", "nameCn": "中文名", "priceComparison": "higher|lower|similar", "note": "比較說明" }
  ],
  "newsCauses": [
    {
      "headline": "News headline or policy event",
      "source": "Source name",
      "impact": "How this affects the estate",
      "direction": "positive|negative|neutral",
      "timeframe": "short-term|medium-term|long-term"
    }
  ],
  "confidence": 0.0-1.0,
  "risks": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"]
}

IMPORTANT:
- ALL prices MUST be in HKD (Hong Kong Dollars) per sq ft (saleable area).
- ALL text values MUST be in Traditional Chinese (繁體中文). JSON keys remain in English.
- Cite at least 3 real news events, policies, or market developments with sources.
- Include at least 2 comparable estates from the same district for context.
- Be specific about price estimates — use realistic HKD figures.
- Focus on factors unique to THIS estate (location, age, facilities, nearby developments, transport).`,
      temperature: config.llm.moderatorTemperature,
      maxTokens: config.llm.moderatorMaxTokens,
    });
  }
}

export default EstateAgent;
