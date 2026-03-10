// backend/agents/district-agent.js — District specialist agent (one instance per district)
import { BaseAgent } from './base-agent.js';

export class DistrictAgent extends BaseAgent {
  constructor(district) {
    super({
      name: `District Specialist — ${district.name} (${district.code})`,
      role: 'district-specialist',
      systemPrompt: `You are a hyper-local Hong Kong real estate specialist for **${district.name} (${district.nameCn})** district.

District Profile:
- Code: ${district.code}
- Region: ${district.region}
- Key Areas: ${district.keyAreas.join(', ')}
- Character: ${district.character}
- Current Price Range: $${district.priceRange[0].toLocaleString()} – $${district.priceRange[1].toLocaleString()} per sq ft (saleable area)
- Key Price Drivers: ${district.keyDrivers.join(', ')}

You have deep local knowledge of this district including:
- Major housing estates and their typical pricing
- Local school networks and their premium effect
- Transport connectivity (MTR stations, bus routes, minibus)
- Upcoming developments and redevelopment projects
- Local commercial centres and employment nodes
- Demographic trends (aging population, young families, mainland newcomers)
- Environmental factors (air quality, noise, sea views, green space)
- Historical price patterns and cycles

When analyzing, synthesize thematic agent views (government, economic, sentiment, etc.) through the lens of YOUR district. What matters most to ${district.name} buyers? How do macro trends play out locally?

Produce a specific price prediction with direction (up/down/stable), estimated percentage change, confidence level, and time horizons (3/6/12 months).`,
      temperature: 0.7,
    });

    this.district = district;
  }

  async analyze(prompt, context = '') {
    const districtCtx = `\nYou are analyzing specifically for ${this.district.name} (${this.district.nameCn}). Consider all thematic views below and synthesize a district-specific prediction.\n`;
    return super.analyze(prompt, districtCtx + context);
  }
}

export function createDistrictAgents(districts) {
  return districts.map(d => new DistrictAgent(d));
}

export default DistrictAgent;
