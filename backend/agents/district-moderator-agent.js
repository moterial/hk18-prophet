// backend/agents/district-moderator-agent.js — Synthesises agent views into a detailed single-district report
import { BaseAgent } from './base-agent.js';
import { config } from '../config.js';

export class DistrictModeratorAgent extends BaseAgent {
  constructor(district) {
    super({
      name: `District Moderator — ${district.name}`,
      role: 'district-moderator',
      systemPrompt: `You are the analyst for the HK18 Prophet prediction engine, producing a DETAILED report for **${district.name} (${district.nameCn})**.

District Profile:
- Code: ${district.code}
- Region: ${district.region}
- Key Areas: ${district.keyAreas.join(', ')}
- Character: ${district.character}
- Current Price Range: HK$${district.priceRange[0].toLocaleString()} – $${district.priceRange[1].toLocaleString()} per sq ft
- Key Drivers: ${district.keyDrivers.join(', ')}

Your output MUST be valid JSON with this structure:
{
  "districtCode": "${district.code}",
  "districtName": "${district.name}",
  "districtNameCn": "${district.nameCn}",
  "direction": "up|down|stable",
  "summary": "Executive summary of the outlook for this district",
  "predictions": {
    "1year": { "change": "+X.X%", "priceRange": [low, high], "narrative": "..." },
    "5year": { "change": "+X.X%", "priceRange": [low, high], "narrative": "..." },
    "10year": { "change": "+X.X%", "priceRange": [low, high], "narrative": "..." }
  },
  NOTE: ALL price values MUST be in HKD (Hong Kong Dollars). priceRange values are HK$ per sq ft.
  "estates": [
    {
      "name": "Estate Name",
      "nameCn": "屋苑中文名",
      "area": "Sub-area within district",
      "currentPricePerSqft": 12000,
      "predictions": {
        "1year": "+X.X%",
        "5year": "+X.X%",
        "10year": "+X.X%"
      },
      "keyFactors": ["factor1", "factor2"],
      "recommendation": "buy|hold|wait"
    }
  ],
  "newsCauses": [
    {
      "headline": "News headline or policy event",
      "source": "Source name (e.g. SCMP, HKEJ, Gov Press Release)",
      "impact": "How this affects the district",
      "direction": "positive|negative|neutral",
      "timeframe": "short-term|medium-term|long-term"
    }
  ],
  "confidence": 0.0-1.0,
  "risks": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"]
}

IMPORTANT:
- List at least 5 major housing estates (屋苑) in this district with specific predictions.
- Cite at least 4 real news events, policies, or market developments with sources that drive your predictions.
- ALL prices MUST be in HKD (Hong Kong Dollars). Price ranges are HK$ per sq ft (saleable area). For example: HK$12,000/sqft, HK$15,000/sqft.
- Be specific about real estate names — use actual well-known estates in this district.`,
      temperature: config.llm.moderatorTemperature,
      maxTokens: config.llm.moderatorMaxTokens,
    });
  }
}

export default DistrictModeratorAgent;
