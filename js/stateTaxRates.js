/**
 * stateTaxRates.js
 * State income tax rates for 2025
 *
 * DISCLAIMER: These are simplified estimates for educational purposes only.
 * Many states have progressive brackets - we use effective rates for typical incomes.
 * State tax laws change frequently. Consult your state's tax authority or a tax professional.
 *
 * Sources: Tax Foundation, state revenue departments (as of 2025)
 */

// State tax data: top marginal rate and notes
// For progressive states, rate shown is typically the top marginal rate
// Users with income in Financial GPS's target range ($50k-$500k) will often be in these brackets
const STATE_TAX_DATA = {
  // No income tax states
  'AK': { rate: 0, name: 'Alaska', type: 'none', note: 'No state income tax' },
  'FL': { rate: 0, name: 'Florida', type: 'none', note: 'No state income tax' },
  'NV': { rate: 0, name: 'Nevada', type: 'none', note: 'No state income tax' },
  'SD': { rate: 0, name: 'South Dakota', type: 'none', note: 'No state income tax' },
  'TX': { rate: 0, name: 'Texas', type: 'none', note: 'No state income tax' },
  'WA': { rate: 0, name: 'Washington', type: 'none', note: 'No state income tax (has capital gains tax on high earners)' },
  'WY': { rate: 0, name: 'Wyoming', type: 'none', note: 'No state income tax' },
  'TN': { rate: 0, name: 'Tennessee', type: 'none', note: 'No state income tax (Hall Tax fully repealed 2021)' },
  'NH': { rate: 0, name: 'New Hampshire', type: 'limited', note: 'No tax on wages (interest/dividends tax repealed 2025)' },

  // Flat tax states (single rate for all income levels)
  'CO': { rate: 4.4, name: 'Colorado', type: 'flat', note: 'Flat rate on federal taxable income' },
  'IL': { rate: 4.95, name: 'Illinois', type: 'flat', note: 'Flat rate' },
  'IN': { rate: 3.05, name: 'Indiana', type: 'flat', note: 'Flat rate (plus local income taxes in many areas)' },
  'KY': { rate: 4.0, name: 'Kentucky', type: 'flat', note: 'Flat rate' },
  'MA': { rate: 5.0, name: 'Massachusetts', type: 'flat', note: 'Flat rate (4% surtax on income over $1M)' },
  'MI': { rate: 4.25, name: 'Michigan', type: 'flat', note: 'Flat rate (some cities have additional tax)' },
  'NC': { rate: 4.5, name: 'North Carolina', type: 'flat', note: 'Flat rate (reduced from 4.75% in 2025)' },
  'PA': { rate: 3.07, name: 'Pennsylvania', type: 'flat', note: 'Flat rate (plus local income taxes)' },
  'UT': { rate: 4.65, name: 'Utah', type: 'flat', note: 'Flat rate' },
  'AZ': { rate: 2.5, name: 'Arizona', type: 'flat', note: 'Flat rate (reduced in 2023)' },

  // Progressive tax states (rates shown are top marginal rates for typical high earners)
  'AL': { rate: 5.0, name: 'Alabama', type: 'progressive', note: 'Top rate applies above $3,000', brackets: '2-5%' },
  'AR': { rate: 3.9, name: 'Arkansas', type: 'progressive', note: 'Top rate applies above $87,000', brackets: '0-3.9%' },
  'CA': { rate: 9.3, name: 'California', type: 'progressive', note: 'Rate for $68k-$349k (top rate 13.3%)', brackets: '1-13.3%' },
  'CT': { rate: 6.99, name: 'Connecticut', type: 'progressive', note: 'Top rate applies above $500k', brackets: '2-6.99%' },
  'DE': { rate: 6.6, name: 'Delaware', type: 'progressive', note: 'Top rate applies above $60k', brackets: '0-6.6%' },
  'GA': { rate: 5.39, name: 'Georgia', type: 'progressive', note: 'Top rate applies above $10k', brackets: '1-5.39%' },
  'HI': { rate: 9.0, name: 'Hawaii', type: 'progressive', note: 'Rate for $48k-$150k (top rate 11%)', brackets: '1.4-11%' },
  'ID': { rate: 5.695, name: 'Idaho', type: 'flat', note: 'Flat rate (converted from progressive in 2023)' },
  'IA': { rate: 5.7, name: 'Iowa', type: 'progressive', note: 'Top rate (being phased to 3.9% by 2026)', brackets: '4.4-5.7%' },
  'KS': { rate: 5.7, name: 'Kansas', type: 'progressive', note: 'Top rate applies above $30k', brackets: '3.1-5.7%' },
  'LA': { rate: 4.25, name: 'Louisiana', type: 'progressive', note: 'Top rate applies above $50k', brackets: '1.85-4.25%' },
  'ME': { rate: 7.15, name: 'Maine', type: 'progressive', note: 'Top rate applies above $58k', brackets: '5.8-7.15%' },
  'MD': { rate: 5.75, name: 'Maryland', type: 'progressive', note: 'Top rate (plus local tax 2.25-3.2%)', brackets: '2-5.75%' },
  'MN': { rate: 7.85, name: 'Minnesota', type: 'progressive', note: 'Rate for $98k-$183k (top rate 9.85%)', brackets: '5.35-9.85%' },
  'MS': { rate: 4.7, name: 'Mississippi', type: 'progressive', note: 'Top rate (being phased to 4% by 2026)', brackets: '0-4.7%' },
  'MO': { rate: 4.8, name: 'Missouri', type: 'progressive', note: 'Top rate applies above $9k', brackets: '0-4.8%' },
  'MT': { rate: 5.9, name: 'Montana', type: 'progressive', note: 'Top rate applies above $20k', brackets: '1-5.9%' },
  'NE': { rate: 5.84, name: 'Nebraska', type: 'progressive', note: 'Top rate (being reduced annually)', brackets: '2.46-5.84%' },
  'NJ': { rate: 6.37, name: 'New Jersey', type: 'progressive', note: 'Rate for $75k-$500k (top rate 10.75%)', brackets: '1.4-10.75%' },
  'NM': { rate: 5.9, name: 'New Mexico', type: 'progressive', note: 'Top rate applies above $210k', brackets: '1.7-5.9%' },
  'NY': { rate: 6.85, name: 'New York', type: 'progressive', note: 'Rate for $80k-$215k (top rate 10.9%, plus NYC tax)', brackets: '4-10.9%' },
  'ND': { rate: 1.95, name: 'North Dakota', type: 'progressive', note: 'Top rate (one of lowest in nation)', brackets: '0-1.95%' },
  'OH': { rate: 3.5, name: 'Ohio', type: 'progressive', note: 'Top rate applies above $115k', brackets: '0-3.5%' },
  'OK': { rate: 4.75, name: 'Oklahoma', type: 'progressive', note: 'Top rate applies above $15k', brackets: '0.25-4.75%' },
  'OR': { rate: 9.0, name: 'Oregon', type: 'progressive', note: 'Rate for $10k-$125k (top rate 9.9%)', brackets: '4.75-9.9%' },
  'RI': { rate: 5.99, name: 'Rhode Island', type: 'progressive', note: 'Top rate applies above $166k', brackets: '3.75-5.99%' },
  'SC': { rate: 6.2, name: 'South Carolina', type: 'progressive', note: 'Top rate (being phased to 6% by 2027)', brackets: '0-6.2%' },
  'VT': { rate: 7.6, name: 'Vermont', type: 'progressive', note: 'Rate for $106k-$229k (top rate 8.75%)', brackets: '3.35-8.75%' },
  'VA': { rate: 5.75, name: 'Virginia', type: 'progressive', note: 'Top rate applies above $17k', brackets: '2-5.75%' },
  'WV': { rate: 5.12, name: 'West Virginia', type: 'progressive', note: 'Top rate (being reduced annually)', brackets: '2.36-5.12%' },
  'WI': { rate: 6.27, name: 'Wisconsin', type: 'progressive', note: 'Rate for $37k-$405k (top rate 7.65%)', brackets: '3.5-7.65%' },
  'DC': { rate: 8.5, name: 'District of Columbia', type: 'progressive', note: 'Rate for $60k-$250k (top rate 10.75%)', brackets: '4-10.75%' }
};

// Map common city names to their states for MSA parsing
const CITY_STATE_MAP = {
  // Major metros that might be entered without state
  'new york': 'NY',
  'nyc': 'NY',
  'los angeles': 'CA',
  'la': 'CA',
  'chicago': 'IL',
  'houston': 'TX',
  'phoenix': 'AZ',
  'philadelphia': 'PA',
  'philly': 'PA',
  'san antonio': 'TX',
  'san diego': 'CA',
  'dallas': 'TX',
  'san jose': 'CA',
  'austin': 'TX',
  'jacksonville': 'FL',
  'fort worth': 'TX',
  'columbus': 'OH',
  'charlotte': 'NC',
  'san francisco': 'CA',
  'sf': 'CA',
  'indianapolis': 'IN',
  'seattle': 'WA',
  'denver': 'CO',
  'washington': 'DC',
  'dc': 'DC',
  'boston': 'MA',
  'el paso': 'TX',
  'detroit': 'MI',
  'nashville': 'TN',
  'portland': 'OR',
  'memphis': 'TN',
  'oklahoma city': 'OK',
  'las vegas': 'NV',
  'louisville': 'KY',
  'baltimore': 'MD',
  'milwaukee': 'WI',
  'albuquerque': 'NM',
  'tucson': 'AZ',
  'fresno': 'CA',
  'mesa': 'AZ',
  'sacramento': 'CA',
  'atlanta': 'GA',
  'kansas city': 'MO',
  'colorado springs': 'CO',
  'miami': 'FL',
  'raleigh': 'NC',
  'omaha': 'NE',
  'long beach': 'CA',
  'virginia beach': 'VA',
  'oakland': 'CA',
  'minneapolis': 'MN',
  'tulsa': 'OK',
  'tampa': 'FL',
  'arlington': 'TX',
  'new orleans': 'LA',
  'wichita': 'KS',
  'cleveland': 'OH',
  'bakersfield': 'CA',
  'aurora': 'CO',
  'anaheim': 'CA',
  'honolulu': 'HI',
  'santa ana': 'CA',
  'riverside': 'CA',
  'corpus christi': 'TX',
  'lexington': 'KY',
  'st louis': 'MO',
  'saint louis': 'MO',
  'stockton': 'CA',
  'pittsburgh': 'PA',
  'anchorage': 'AK',
  'cincinnati': 'OH',
  'st paul': 'MN',
  'saint paul': 'MN',
  'orlando': 'FL',
  'newark': 'NJ',
  'boise': 'ID',
  'salt lake city': 'UT',
  'birmingham': 'AL',
  'rochester': 'NY',
  'buffalo': 'NY',
  'providence': 'RI',
  'richmond': 'VA',
  'hartford': 'CT',
  'des moines': 'IA',
  'little rock': 'AR',
  'jackson': 'MS',
  'charleston': 'SC',
  'columbia': 'SC',
  'sioux falls': 'SD',
  'fargo': 'ND',
  'billings': 'MT',
  'cheyenne': 'WY',
  'burlington': 'VT',
  'charleston': 'WV',
  'wilmington': 'DE',
  'manchester': 'NH',
  'portland': 'ME',
  'bangor': 'ME'
};

/**
 * Extract state abbreviation from MSA string
 * Supports formats: "City, ST", "City ST", "City, State", "City"
 * @param {string} msa - MSA/city string from user input
 * @returns {string|null} Two-letter state abbreviation or null
 */
function extractStateFromMsa(msa) {
  if (!msa || typeof msa !== 'string') {
    return null;
  }

  const cleaned = msa.trim();
  if (!cleaned) {
    return null;
  }

  // Try to find state abbreviation after comma or space
  // Pattern: "City, ST" or "City,ST" or "City ST"
  const patterns = [
    /,\s*([A-Za-z]{2})$/,      // "Denver, CO"
    /\s+([A-Za-z]{2})$/,        // "Denver CO"
    /,\s*([A-Za-z]{2})\s*$/,    // "Denver, CO " (with trailing space)
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const stateAbbr = match[1].toUpperCase();
      // Verify it's a valid state
      if (STATE_TAX_DATA[stateAbbr]) {
        return stateAbbr;
      }
    }
  }

  // Try full state name match
  const fullStateNames = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC', 'washington dc': 'DC'
  };

  // Check if ends with full state name
  const lowerCleaned = cleaned.toLowerCase();
  for (const [name, abbr] of Object.entries(fullStateNames)) {
    if (lowerCleaned.endsWith(name) || lowerCleaned.endsWith(', ' + name)) {
      return abbr;
    }
  }

  // Try city lookup as last resort
  const cityOnly = cleaned.split(',')[0].toLowerCase().trim();
  if (CITY_STATE_MAP[cityOnly]) {
    return CITY_STATE_MAP[cityOnly];
  }

  return null;
}

/**
 * Get state tax information by state abbreviation
 * @param {string} stateAbbr - Two-letter state abbreviation
 * @returns {Object|null} State tax data or null
 */
function getStateTaxInfo(stateAbbr) {
  if (!stateAbbr || typeof stateAbbr !== 'string') {
    return null;
  }
  return STATE_TAX_DATA[stateAbbr.toUpperCase()] || null;
}

/**
 * Calculate state tax based on MSA
 * @param {number} taxableIncome - Taxable income
 * @param {string} msa - MSA/city string
 * @returns {Object} { tax, rate, state, stateName, note, isEstimate }
 */
function calculateStateTaxFromMsa(taxableIncome, msa) {
  const stateAbbr = extractStateFromMsa(msa);

  if (!stateAbbr) {
    // Fall back to average estimate if we can't determine state
    const averageRate = 0.05;
    return {
      tax: taxableIncome > 0 ? Math.round(taxableIncome * averageRate * 100) / 100 : 0,
      rate: averageRate,
      state: null,
      stateName: null,
      note: 'State could not be determined from MSA. Using 5% national average estimate.',
      isEstimate: true
    };
  }

  const stateInfo = getStateTaxInfo(stateAbbr);

  if (!stateInfo) {
    // Shouldn't happen if stateAbbr is valid, but handle gracefully
    const averageRate = 0.05;
    return {
      tax: taxableIncome > 0 ? Math.round(taxableIncome * averageRate * 100) / 100 : 0,
      rate: averageRate,
      state: stateAbbr,
      stateName: stateAbbr,
      note: 'Tax rate data unavailable. Using 5% estimate.',
      isEstimate: true
    };
  }

  const rate = stateInfo.rate / 100; // Convert percentage to decimal
  const tax = taxableIncome > 0 ? Math.round(taxableIncome * rate * 100) / 100 : 0;

  return {
    tax: tax,
    rate: rate,
    state: stateAbbr,
    stateName: stateInfo.name,
    type: stateInfo.type,
    note: stateInfo.note,
    brackets: stateInfo.brackets || null,
    isEstimate: stateInfo.type === 'progressive' // Progressive states are estimated
  };
}

// Expose functions globally
window.STATE_TAX_DATA = STATE_TAX_DATA;
window.extractStateFromMsa = extractStateFromMsa;
window.getStateTaxInfo = getStateTaxInfo;
window.calculateStateTaxFromMsa = calculateStateTaxFromMsa;
