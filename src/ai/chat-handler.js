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

async function executeTool(name, input) {
  switch (name) {
    case 'search_farming_prospects': {
      const signals = input.signals ? input.signals.split(',').map(s => s.trim()) : [];
      return farmingSearch({
        city: input.city,
        signals,
        limit: input.limit || 20,
        minScore: input.minScore || 0
      });
    }
    case 'get_property_intelligence': {
      return await assemblePropertyIntelligence(input.address, input.city);
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
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result).slice(0, 50000)
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
