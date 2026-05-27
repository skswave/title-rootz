/**
 * AI_CONTEXT: Farm Chat — Claude-powered farming assistant with tool_use.
 * Handles the AI conversation loop. No HTTP knowledge — pure function.
 *
 * Dependencies:
 *   - @anthropic-ai/sdk
 *   - src/query/fl-farming.js (farmingSearch)
 *   - src/query/fl-property.js (assemblePropertyIntelligence)
 *
 * Exports:
 *   - handleFarmChat(messages, model, agentContext) — returns { text, model, usage, messages }
 */
import Anthropic from '@anthropic-ai/sdk';
import { farmingSearch } from '../query/fl-farming.js';
import { assemblePropertyIntelligence } from '../query/fl-property.js';

const anthropic = new Anthropic();

const FARMING_TOOLS = [
  {
    name: "search_farming_prospects",
    description: "Search for farming prospects in a Florida city. Returns scored properties with owner info, court records, and bridge page URLs.",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string", description: "Florida city name" },
        signals: { type: "string", description: "Comma-separated signal filters: probate, lis_pendens, lien, judgment, death, absentee, out_of_state, corporate, free_clear, no_homestead" },
        limit: { type: "number", description: "Max results (default 20)" },
        minScore: { type: "number", description: "Minimum farming score 0-100 (default 0)" }
      },
      required: ["city"]
    }
  },
  {
    name: "get_property_intelligence",
    description: "Get full intelligence on a specific Florida property. Returns owner, value, court records, farming score, flood zone, schools, permits, demographics.",
    input_schema: {
      type: "object",
      properties: {
        address: { type: "string", description: "Street address" },
        city: { type: "string", description: "City name" }
      },
      required: ["address", "city"]
    }
  }
];

// Pre-summarize farming results into token-efficient text for Claude.
// Raw JSON: ~500 tokens/property. Compact text: ~50 tokens/property = 10x savings.
function summarizeFarmingResults(results) {
  if (results.error) return results;

  const lines = [
    `Found ${results.total} prospects in ${results.query.city}. HIGH: ${results.summary.high}, MEDIUM: ${results.summary.medium}, LOW: ${results.summary.low}.`,
    `Showing top ${results.returned} by farming score.`,
    ''
  ];

  for (const p of results.prospects) {
    const signals = p.reasons.join(', ');
    const court = p.courtRecords.map(c => `${c.signal} ${c.date || ''}`).join('; ');
    const ownerSince = p.salesHistory?.[0]?.year ? `since ${p.salesHistory[0].year}` : '';
    const mail = p.absentee ? ` | Mail: ${p.ownerMailingAddress.address}, ${p.ownerMailingAddress.city} ${p.ownerMailingAddress.state} ${p.ownerMailingAddress.zip}` : '';
    lines.push(
      `[Score:${p.score}] ${p.address}, ${p.city} ${p.zip} | $${(p.value || 0).toLocaleString()} | ${p.property.type || '?'} ${p.property.yearBuilt || '?'}yr | ${p.property.livingArea || '?'}sqft | ${p.owner} ${ownerSince}${mail} | ${signals}${court ? ' | Court: ' + court : ''} | ${p.bridgePageUrl}`
    );
  }

  lines.push('', `Source: ${results.source.courtRecords}. Coverage: ${results.source.coverage}.`);
  return lines.join('\n');
}

// Pre-summarize a property intelligence result into token-efficient text.
function summarizePropertyIntelligence(data) {
  if (data.error) return data;

  const p = data;
  const lines = [];

  // Core identity
  lines.push(`# ${p.address || '?'}, ${p.city || '?'} ${p.state || 'FL'} ${p.zip || ''}`);
  lines.push(`Owner: ${p.owner || '?'} | Folio: ${p.folio || '?'}`);

  // Value
  if (p.assessedValue || p.justValue) {
    lines.push(`Value: $${(p.justValue || p.assessedValue || 0).toLocaleString()} | Land: $${(p.landValue || 0).toLocaleString()}`);
  }

  // Property details
  const prop = p.property || {};
  lines.push(`Type: ${prop.type || '?'} | Built: ${prop.yearBuilt || '?'} | ${prop.livingArea || '?'}sqft | Lot: ${prop.lotSize || '?'}sqft`);

  // Homestead + equity
  lines.push(`Homestead: ${p.homestead ? 'Yes' : 'No'} | Absentee: ${p.absentee ? 'Yes' : 'No'}`);

  // Mailing address
  if (p.ownerMailingAddress) {
    const m = p.ownerMailingAddress;
    lines.push(`Mail to: ${m.address || '?'}, ${m.city || ''} ${m.state || ''} ${m.zip || ''}`);
  }

  // Sales
  if (p.salesHistory?.length) {
    lines.push('Sales: ' + p.salesHistory.map(s => `${s.date} $${(s.price || 0).toLocaleString()}`).join(' → '));
  }

  // Court records (the gold)
  if (p.courtRecords?.length) {
    lines.push('Court records:');
    for (const c of p.courtRecords.slice(0, 8)) {
      lines.push(`  ${c.signal} ${c.date || ''} ${c.caseNum || ''}`);
    }
  }

  // Farming score
  if (p.farmingScore !== undefined) {
    lines.push(`Farming score: ${p.farmingScore}/100 (${p.farmingRating || '?'}) — ${(p.farmingReasons || []).join(', ')}`);
  }

  // Flood
  if (p.floodZone) lines.push(`Flood: ${p.floodZone.zone || '?'} (${p.floodZone.description || '?'})`);

  // Schools
  if (p.nearestSchools?.length) {
    lines.push('Schools: ' + p.nearestSchools.slice(0, 3).map(s => `${s.name} ${s.distance || '?'}mi`).join(', '));
  }

  // Census
  if (p.census) {
    lines.push(`Census: Median income $${(p.census.medianHouseholdIncome || 0).toLocaleString()} | Median home $${(p.census.medianHomeValue || 0).toLocaleString()}`);
  }

  lines.push(`Bridge: ${p.bridgePageUrl || 'https://title.rootz.global/p/farm?address=' + encodeURIComponent(p.address || '') + '&city=' + encodeURIComponent(p.city || '')}`);

  return lines.join('\n');
}

async function executeTool(name, input) {
  switch (name) {
    case 'search_farming_prospects': {
      const signals = input.signals ? input.signals.split(',').map(s => s.trim()) : [];
      const results = farmingSearch({
        city: input.city,
        signals,
        limit: input.limit || 20,
        minScore: input.minScore || 0
      });
      return summarizeFarmingResults(results);
    }
    case 'get_property_intelligence': {
      const data = await assemblePropertyIntelligence(input.address, input.city);
      return summarizePropertyIntelligence(data);
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

const SYSTEM_PROMPT = `You are a real estate farming assistant powered by Rootz Property Intelligence. You help Florida real estate agents identify properties likely to come on the market.

Your role: Support the agent's intuition. Don't tell them how to farm — provide the intelligence they need.

Your data covers:
- 10.8 million Florida property records (all 67 counties)
- Courthouse records: Broward County (litigation pending, probate, liens, mortgages, deeds, deaths)
- FEMA flood zones, schools, census demographics, building permits

When the agent asks to find prospects, use search_farming_prospects with the right city and signals.
When they ask about a specific property, use get_property_intelligence.

Present results conversationally — lead with the story, not the data.
Always include the bridge page URL so the agent can see the full intelligence page.
Use plain English: "litigation pending" not "lis pendens".
Be honest about what you don't know. Court records are currently Broward County only.`;

export async function handleFarmChat(messages, model = 'claude-haiku-4-5-20251001', agentContext = '') {
  const systemPrompt = agentContext
    ? SYSTEM_PROMPT + '\n\n--- Agent Context ---\n' + agentContext
    : SYSTEM_PROMPT;

  let response = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    tools: FARMING_TOOLS,
    messages
  });

  let loops = 0;
  while (response.stop_reason === 'tool_use' && loops < 5) {
    loops++;
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const toolResults = [];

    for (const toolUse of toolUseBlocks) {
      const result = await executeTool(toolUse.name, toolUse.input);
      // Results are already token-efficient text (not raw JSON)
      const content = typeof result === 'string' ? result : JSON.stringify(result);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: content.slice(0, 20000)
      });
    }

    messages = [
      ...messages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults }
    ];

    response = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      tools: FARMING_TOOLS,
      messages
    });
  }

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  return { text, model: response.model, usage: response.usage, messages };
}
