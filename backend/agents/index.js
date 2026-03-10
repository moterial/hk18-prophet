// backend/agents/index.js — Agent registry and team factory
import { GovernmentPolicyAgent } from './government-policy-agent.js';
import { EconomicAgent } from './economic-agent.js';
import { SentimentAgent } from './sentiment-agent.js';
import { TransactionAgent } from './transaction-agent.js';
import { InfrastructureAgent } from './infrastructure-agent.js';
import { ChinaPolicyAgent } from './china-policy-agent.js';
import { DistrictAgent, createDistrictAgents } from './district-agent.js';
import { ModeratorAgent } from './moderator-agent.js';
import { DistrictModeratorAgent } from './district-moderator-agent.js';
import { config } from '../config.js';

const THEMATIC_AGENTS = [
  { id: 'government-policy', name: 'Government Policy Analyst', Class: GovernmentPolicyAgent, icon: '🏛️' },
  { id: 'economic', name: 'Economic Environment Analyst', Class: EconomicAgent, icon: '📊' },
  { id: 'sentiment', name: 'Public Sentiment Analyst', Class: SentimentAgent, icon: '😊' },
  { id: 'transaction', name: 'Transaction Analysis Agent', Class: TransactionAgent, icon: '💰' },
  { id: 'infrastructure', name: 'Infrastructure Development Agent', Class: InfrastructureAgent, icon: '🚇' },
  { id: 'china-policy', name: 'China Policy Analyst', Class: ChinaPolicyAgent, icon: '🇨🇳' },
];

export function createAgentTeam() {
  const thematicAgents = THEMATIC_AGENTS.map(a => new a.Class());
  const districtAgents = createDistrictAgents(config.districts);
  const moderator = new ModeratorAgent();

  return { thematicAgents, districtAgents, moderator };
}

export function createSingleDistrictTeam(district) {
  const thematicAgents = THEMATIC_AGENTS.map(a => new a.Class());
  const districtAgent = new DistrictAgent(district);
  const moderator = new DistrictModeratorAgent(district);

  return { thematicAgents, districtAgent, moderator };
}

export function getAgentManifest() {
  return {
    thematic: THEMATIC_AGENTS.map(a => ({ id: a.id, name: a.name, icon: a.icon })),
    districts: config.districts.map(d => ({
      id: `district-${d.code}`,
      name: `District Specialist — ${d.name}`,
      code: d.code,
      icon: '🏘️',
    })),
    moderator: { id: 'moderator', name: 'Moderator & Synthesizer', icon: '🎯' },
    totalAgents: THEMATIC_AGENTS.length + config.districts.length + 1,
  };
}

export { THEMATIC_AGENTS };
