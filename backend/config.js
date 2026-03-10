// backend/config.js — Central configuration for HK18 Prophet
import 'dotenv/config';

export const config = {
  // LLM Settings
  llm: {
    apiKey: process.env.LLM_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    modelName: process.env.LLM_MODEL_NAME || 'gpt-4o-mini',
    agentTemperature: 0.7,
    moderatorTemperature: 0.3,
    agentMaxTokens: 800,
    moderatorMaxTokens: 3000,
  },

  // Server
  server: {
    port: parseInt(process.env.PORT || '5001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Simulation
  simulation: {
    rounds: parseInt(process.env.SIMULATION_ROUNDS || '3', 10),
    maxConcurrentAgents: parseInt(process.env.MAX_CONCURRENT_AGENTS || '10', 10),
    districtBatchSize: 6,
  },

  // Database
  db: {
    path: process.env.DB_PATH || './data/hk18prophet.db',
  },

  // News API
  newsApi: {
    key: process.env.NEWS_API_KEY || '',
    baseUrl: 'https://newsapi.org/v2',
  },

  // Hong Kong 18 Districts
  districts: [
    { code: 'CW', name: 'Central & Western', nameCn: '中西區', region: 'HK Island', keyAreas: ['Central', 'Sheung Wan', 'Sai Ying Pun', 'Mid-Levels', 'The Peak'], character: 'Premium CBD, luxury residential, expat hub', priceRange: [15000, 35000], keyDrivers: ['CBD proximity', 'luxury demand', 'expat flow', 'MTR connectivity'] },
    { code: 'WC', name: 'Wan Chai', nameCn: '灣仔', region: 'HK Island', keyAreas: ['Wan Chai', 'Causeway Bay', 'Happy Valley', 'Tai Hang'], character: 'Mixed commercial-residential, vibrant nightlife, conventions', priceRange: [14000, 30000], keyDrivers: ['commercial activity', 'convention centre', 'Happy Valley premium', 'MTR access'] },
    { code: 'EA', name: 'Eastern', nameCn: '東區', region: 'HK Island', keyAreas: ['North Point', 'Quarry Bay', 'Taikoo', 'Shau Kei Wan', 'Chai Wan'], character: 'Mature residential, good transport, mixed-income', priceRange: [10000, 22000], keyDrivers: ['Island East office corridor', 'MTR coverage', 'school networks', 'redevelopment'] },
    { code: 'SO', name: 'Southern', nameCn: '南區', region: 'HK Island', keyAreas: ['Aberdeen', 'Ap Lei Chau', 'Repulse Bay', 'Stanley', 'Pok Fu Lam'], character: 'Diverse — luxury coastal + public housing, Ocean Park', priceRange: [8000, 35000], keyDrivers: ['South Island Line', 'luxury coastal demand', 'Ocean Park', 'tech hub Wong Chuk Hang'] },
    { code: 'YTM', name: 'Yau Tsim Mong', nameCn: '油尖旺', region: 'Kowloon', keyAreas: ['Tsim Sha Tsui', 'Jordan', 'Yau Ma Tei', 'Mong Kok', 'Olympic'], character: 'Tourist/shopping hub, dense urban, high rental yield', priceRange: [11000, 25000], keyDrivers: ['tourism recovery', 'retail activity', 'MTR hub', 'urban density'] },
    { code: 'SSP', name: 'Sham Shui Po', nameCn: '深水埗', region: 'Kowloon', keyAreas: ['Sham Shui Po', 'Cheung Sha Wan', 'Lai Chi Kok', 'Mei Foo'], character: 'Working-class heritage, gentrifying rapidly, tech startups', priceRange: [8000, 16000], keyDrivers: ['gentrification', 'affordability gap', 'Mei Foo premium', 'young professional influx'] },
    { code: 'KC', name: 'Kowloon City', nameCn: '九龍城', region: 'Kowloon', keyAreas: ['Kowloon City', 'Kowloon Tong', 'Ho Man Tin', 'To Kwa Wan', 'Kai Tak'], character: 'School belt premium, Kai Tak new development area', priceRange: [10000, 25000], keyDrivers: ['Kai Tak development', 'school belt (Kowloon Tong)', 'Shatin-Central Link', 'cruise terminal'] },
    { code: 'WTS', name: 'Wong Tai Sin', nameCn: '黃大仙', region: 'Kowloon', keyAreas: ['Wong Tai Sin', 'Diamond Hill', 'Tsz Wan Shan', 'San Po Kong'], character: 'Traditional public housing, temple tourism, improving transport', priceRange: [8000, 15000], keyDrivers: ['MTR extensions', 'Diamond Hill development', 'affordability', 'estate renewal'] },
    { code: 'KT', name: 'Kwun Tong', nameCn: '觀塘', region: 'Kowloon', keyAreas: ['Kwun Tong', 'Lam Tin', 'Yau Tong', 'Kowloon Bay', 'Ngau Tau Kok'], character: 'Former industrial, rapid commercial conversion, CBD2 vision', priceRange: [8000, 16000], keyDrivers: ['industrial conversion', 'CBD2 office supply', 'MTR connectivity', 'affordable entry'] },
    { code: 'KI', name: 'Kwai Tsing', nameCn: '葵青', region: 'New Territories', keyAreas: ['Kwai Fong', 'Kwai Chung', 'Tsing Yi'], character: 'Container port area, affordable, good transport links', priceRange: [7000, 13000], keyDrivers: ['affordability', 'Tsing Yi bridge links', 'container port activity', 'MTR access'] },
    { code: 'TW', name: 'Tsuen Wan', nameCn: '荃灣', region: 'New Territories', keyAreas: ['Tsuen Wan', 'Tsuen King Garden', 'Belvedere Garden', 'Discovery Park'], character: 'Mature NT town, good shopping, gateway to Lantau', priceRange: [8000, 16000], keyDrivers: ['transport hub', 'established community', 'proximity to airport', 'hiking/nature access'] },
    { code: 'TM', name: 'Tuen Mun', nameCn: '屯門', region: 'New Territories', keyAreas: ['Tuen Mun', 'Gold Coast', 'So Kwun Wat', 'Hung Shui Kiu'], character: 'Suburban, large estates, light rail, Shenzhen proximity', priceRange: [5000, 12000], keyDrivers: ['Hung Shui Kiu development', 'Tuen Ma Line', 'affordability', 'GBA connectivity'] },
    { code: 'YL', name: 'Yuen Long', nameCn: '元朗', region: 'New Territories', keyAreas: ['Yuen Long', 'Tin Shui Wai', 'Hung Shui Kiu', 'Fairview Park'], character: 'Fastest growing NT area, massive new supply, Shenzhen border', priceRange: [5000, 13000], keyDrivers: ['Northern Metropolis', 'new town development', 'Shenzhen border proximity', 'massive new supply'] },
    { code: 'NO', name: 'North', nameCn: '北區', region: 'New Territories', keyAreas: ['Sheung Shui', 'Fanling', 'Kwu Tung', 'Ping Che'], character: 'Border district, Northern Metropolis centerpiece, rural + urban', priceRange: [5000, 12000], keyDrivers: ['Northern Metropolis Strategy', 'innovation & tech zone', 'Shenzhen integration', 'new railway links'] },
    { code: 'TP', name: 'Tai Po', nameCn: '大埔', region: 'New Territories', keyAreas: ['Tai Po', 'Tai Po Market', 'Science Park', 'CUHK area'], character: 'University town, science park, cycling paradise, nature', priceRange: [6000, 14000], keyDrivers: ['Science Park expansion', 'CUHK/education hub', 'quality of life', 'limited new supply'] },
    { code: 'ST', name: 'Sha Tin', nameCn: '沙田', region: 'New Territories', keyAreas: ['Sha Tin', 'Ma On Shan', 'Fo Tan', 'City One', 'Sha Tin Wai'], character: 'Largest NT town, excellent facilities, racecourse', priceRange: [8000, 18000], keyDrivers: ['Sha Tin-Central Link completed', 'Ma On Shan premium', 'university proximity', 'mature infrastructure'] },
    { code: 'SK', name: 'Sai Kung', nameCn: '西貢', region: 'New Territories', keyAreas: ['Tseung Kwan O', 'Sai Kung Town', 'Clear Water Bay', 'LOHAS Park'], character: 'TKO new town + Sai Kung countryside, growing rapidly', priceRange: [7000, 16000], keyDrivers: ['TKO expansion', 'LOHAS Park development', 'Cross Bay Link', 'nature/lifestyle appeal'] },
    { code: 'IS', name: 'Islands', nameCn: '離島', region: 'New Territories', keyAreas: ['Tung Chung', 'Discovery Bay', 'Mui Wo', 'Cheung Chau', 'Peng Chau'], character: 'Airport + Disneyland + rural islands, Tung Chung expanding massively', priceRange: [5000, 14000], keyDrivers: ['Tung Chung New Town expansion', 'airport/SkyCity commercial', '3rd runway effects', 'Lantau Tomorrow Vision'] },
  ],
};

export default config;
