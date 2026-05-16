/**
 * Origin Title Wallet — MCP Server
 * Port 3037
 *
 * AI-driven closing management for title companies.
 * Uses @rootz/title-wallet for templates, access matrix, and scoring.
 * Connects to the land-records MCP server (port 3035) for property data.
 *
 * Tools:
 *   get_closing_template    — What documents does this transaction need?
 *   validate_closing        — Check completeness + confidence before creating wallet
 *   plan_wallet             — Dry-run: what will be created, estimated cost
 *   classify_document       — AI classification hints for a document
 *   check_completeness      — Compare present docs vs template
 *   compute_confidence      — Calculate confidence score from components
 *   get_access_matrix       — Who sees what for this transaction?
 *   get_document_info       — Metadata for a document type
 *   list_templates          — All available closing templates
 *   get_classifier_prompt   — Full AI classification guide
 */

import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Import from the built title-wallet package
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const titleWalletPath = path.resolve(__dirname, '..', '..', 'claud project', 'rootz-v6', 'packages', 'title-wallet', 'dist', 'index.js');
const titleWalletUrl = new URL(`file:///${titleWalletPath.replace(/\\/g, '/')}`).href;

let tw;
try {
  tw = await import(titleWalletUrl);
} catch (err) {
  console.error('Failed to import @rootz/title-wallet. Run: cd rootz-v6/packages/title-wallet && npx tsc');
  console.error(err.message);
  process.exit(1);
}

const {
  getClosingTemplate,
  listClosingTemplates,
  getRequiredKeyVaultGroups,
  buildAccessMatrix,
  getAuthorizedGroups,
  getTeamRole,
  canAccess,
  checkCompleteness,
  computeConfidence,
  getConfidenceTier,
  TitleWalletBuilder,
  CLASSIFIER_HINTS,
  getClassifierHint,
  getClassifierPrompt,
  DOCUMENT_TYPE_INFO,
  KEYVAULT_GROUPS,
} = tw;

const PORT = 3037;

// ─── MCP Tool Definitions ──────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_closing_template',
    description: 'Get the complete closing template for a transaction type. Returns required documents, conditional documents, lender-required documents, optional documents, and which KeyVault groups to create. Transaction types: residential_sale, condo_sale, commercial_sale, refinance, estate_transfer.',
    inputSchema: {
      type: 'object',
      properties: {
        transactionType: {
          type: 'string',
          enum: ['residential_sale', 'condo_sale', 'commercial_sale', 'refinance', 'estate_transfer'],
          description: 'Type of real estate transaction',
        },
      },
      required: ['transactionType'],
    },
  },
  {
    name: 'validate_closing',
    description: 'Pre-validate a closing package before creating a wallet. Checks completeness, identifies missing documents, computes preliminary confidence score, and returns warnings. Use this before plan_wallet or creating a wallet.',
    inputSchema: {
      type: 'object',
      properties: {
        transactionType: { type: 'string', enum: ['residential_sale', 'condo_sale', 'commercial_sale', 'refinance', 'estate_transfer'] },
        presentDocuments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Document types that are present (e.g., ["deed", "title_exam", "attestation"])',
        },
        isFinanced: { type: 'boolean', description: 'Whether the transaction involves lender financing', default: false },
        hasAttestation: { type: 'boolean', description: 'Whether professional attestation is included', default: false },
        crossSourceAgreement: { type: 'number', description: 'Cross-source confidence 0-1 (Registry + MassGIS + Assessor)', default: 0 },
        notaryVerification: { type: 'number', description: 'Notary verification score 0-1', default: 0 },
      },
      required: ['transactionType', 'presentDocuments'],
    },
  },
  {
    name: 'plan_wallet',
    description: 'Plan a wallet creation without executing it. Returns the number of KeyVaults, documents by group, party access matrix, estimated credits, and estimated cost in POL. Use this to show the user what will happen before creating.',
    inputSchema: {
      type: 'object',
      properties: {
        transactionType: { type: 'string', enum: ['residential_sale', 'condo_sale', 'commercial_sale', 'refinance', 'estate_transfer'] },
        documentTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Document types being included',
        },
        parties: {
          type: 'array',
          items: { type: 'string', enum: ['titleCompany', 'attorney', 'buyer', 'seller', 'lender', 'futureTitleCo'] },
          description: 'Party roles present in this closing',
        },
        isFinanced: { type: 'boolean', default: false },
      },
      required: ['transactionType', 'documentTypes', 'parties'],
    },
  },
  {
    name: 'classify_document',
    description: 'Get AI classification hints for identifying a document type from its content. Returns keywords, filename patterns, page count ranges, and a description. Use this when an AI needs to identify what type of closing document a PDF is.',
    inputSchema: {
      type: 'object',
      properties: {
        documentType: { type: 'string', description: 'Document type to get hints for (e.g., "deed", "closing_disclosure")' },
      },
      required: ['documentType'],
    },
  },
  {
    name: 'check_completeness',
    description: 'Check how complete a wallet is against its closing template. Returns percent complete, present/missing documents, and conditional documents that might apply.',
    inputSchema: {
      type: 'object',
      properties: {
        transactionType: { type: 'string', enum: ['residential_sale', 'condo_sale', 'commercial_sale', 'refinance', 'estate_transfer'] },
        presentDocuments: { type: 'array', items: { type: 'string' } },
        isFinanced: { type: 'boolean', default: false },
      },
      required: ['transactionType', 'presentDocuments'],
    },
  },
  {
    name: 'compute_confidence',
    description: 'Calculate a confidence score for a property wallet. Returns overall score (0-1), component breakdown, and confidence tier (GREEN/YELLOW/ORANGE/RED) with recommended action.',
    inputSchema: {
      type: 'object',
      properties: {
        templateCompleteness: { type: 'number', description: 'Percent of required docs present (0-1)' },
        crossSourceAgreement: { type: 'number', description: 'Registry + MassGIS + Assessor agreement (0-1)' },
        notaryVerification: { type: 'number', description: 'Notary checked against SoS database (0-1)' },
        networkCorroboration: { type: 'number', description: 'Other wallets confirm related data (0-1)' },
        documentIntegrity: { type: 'number', description: 'All hashes verify (0-1)', default: 1.0 },
        professionalAttestation: { type: 'number', description: 'Licensed attorney/title co attested (0-1)' },
      },
      required: ['templateCompleteness'],
    },
  },
  {
    name: 'get_access_matrix',
    description: 'Get the access matrix showing which parties can see which document groups. Returns the party role, team role level (ADMIN/MEMBER/VIEWER), and authorized KeyVault groups.',
    inputSchema: {
      type: 'object',
      properties: {
        parties: {
          type: 'array',
          items: { type: 'string', enum: ['titleCompany', 'attorney', 'buyer', 'seller', 'lender', 'futureTitleCo'] },
        },
        transactionType: { type: 'string', enum: ['residential_sale', 'condo_sale', 'commercial_sale', 'refinance', 'estate_transfer'] },
      },
      required: ['parties', 'transactionType'],
    },
  },
  {
    name: 'get_document_info',
    description: 'Get metadata for a document type — label, category, legal requirement, and which KeyVault group it belongs to.',
    inputSchema: {
      type: 'object',
      properties: {
        documentType: { type: 'string', description: 'Document type (e.g., "deed", "lead_paint", "closing_disclosure")' },
      },
      required: ['documentType'],
    },
  },
  {
    name: 'list_templates',
    description: 'List all available closing templates with their transaction types, required document counts, and KeyVault groups.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_classifier_prompt',
    description: 'Get the full AI document classification guide as markdown. Include this in an AI prompt when the AI needs to identify document types from PDFs.',
    inputSchema: { type: 'object', properties: {} },
  },
];

// ─── Tool Handlers ──────────────────────────────────────────────────

function handleTool(name, args) {
  switch (name) {
    case 'get_closing_template': {
      const template = getClosingTemplate(args.transactionType);
      return {
        ...template,
        summary: {
          requiredCount: template.required.length,
          conditionalCount: template.requiredIf.length,
          lenderRequiredCount: template.lenderRequired.length,
          optionalCount: template.optional.length,
          keyVaultGroupCount: template.keyVaultGroups.length,
        },
      };
    }

    case 'validate_closing': {
      const completenessResult = checkCompleteness(
        args.transactionType,
        args.presentDocuments,
        args.isFinanced ?? false,
      );

      const confidence = computeConfidence({
        templateCompleteness: completenessResult.percentComplete,
        crossSourceAgreement: args.crossSourceAgreement ?? 0,
        notaryVerification: args.notaryVerification ?? 0,
        networkCorroboration: 0,
        documentIntegrity: 1.0,
        professionalAttestation: args.hasAttestation ? 1.0 : 0,
      });

      const tier = getConfidenceTier(confidence.overall);

      const warnings = [];
      if (completenessResult.missing.length > 0) {
        warnings.push(`Missing ${completenessResult.missing.length} required documents: ${completenessResult.missing.join(', ')}`);
      }
      if (!args.presentDocuments.includes('deed') && args.transactionType !== 'refinance') {
        warnings.push('No deed — wallet has no recorded instrument');
      }
      if (!args.hasAttestation && !args.presentDocuments.includes('attestation')) {
        warnings.push('No professional attestation — confidence score will be lower');
      }

      return {
        valid: completenessResult.percentComplete > 0,
        completeness: completenessResult,
        confidence: { ...confidence, tier },
        warnings,
      };
    }

    case 'plan_wallet': {
      const template = getClosingTemplate(args.transactionType);
      const groups = [...new Set([
        ...template.keyVaultGroups,
        ...args.documentTypes.map(d => DOCUMENT_TYPE_INFO[d]?.group).filter(Boolean),
      ])];

      const docsByGroup = {};
      for (const docType of args.documentTypes) {
        const info = DOCUMENT_TYPE_INFO[docType];
        if (!info) continue;
        if (!docsByGroup[info.group]) docsByGroup[info.group] = [];
        docsByGroup[info.group].push({ type: docType, label: info.label });
      }

      const matrix = {};
      for (const role of args.parties) {
        const authorized = getAuthorizedGroups(role, groups);
        matrix[role] = {
          teamRole: getTeamRole(role),
          authorizedGroups: authorized,
          groupCount: authorized.length,
        };
      }

      const BASE_COST = 500;
      const PER_BYTE = 10;
      const AVG_NOTE = 500;
      const credits = BASE_COST + groups.length * BASE_COST + args.documentTypes.length * (BASE_COST + AVG_NOTE * PER_BYTE) + args.parties.length * BASE_COST;

      return {
        keyVaultGroups: groups,
        keyVaultCount: groups.length,
        documentCount: args.documentTypes.length,
        documentsByGroup: docsByGroup,
        partyCount: args.parties.length,
        accessMatrix: matrix,
        estimatedCredits: credits,
        estimatedCostPOL: (credits / 1_000_000).toFixed(6),
        estimatedCostUSD: `~$${(credits / 1_000_000 * 0.50).toFixed(4)}`,
      };
    }

    case 'classify_document': {
      const hint = getClassifierHint(args.documentType);
      if (!hint) {
        const info = DOCUMENT_TYPE_INFO[args.documentType];
        if (info) {
          return {
            type: args.documentType,
            label: info.label,
            category: info.category,
            group: info.group,
            note: 'No classifier hints available for this document type. Use the label and category for identification.',
          };
        }
        return { error: `Unknown document type: ${args.documentType}` };
      }
      return hint;
    }

    case 'check_completeness':
      return checkCompleteness(args.transactionType, args.presentDocuments, args.isFinanced ?? false);

    case 'compute_confidence': {
      const score = computeConfidence({
        templateCompleteness: args.templateCompleteness ?? 0,
        crossSourceAgreement: args.crossSourceAgreement ?? 0,
        notaryVerification: args.notaryVerification ?? 0,
        networkCorroboration: args.networkCorroboration ?? 0,
        documentIntegrity: args.documentIntegrity ?? 1.0,
        professionalAttestation: args.professionalAttestation ?? 0,
      });
      const tier = getConfidenceTier(score.overall);
      return { ...score, tier };
    }

    case 'get_access_matrix': {
      const template = getClosingTemplate(args.transactionType);
      const groups = template.keyVaultGroups;
      const matrix = {};
      for (const role of args.parties) {
        const authorized = getAuthorizedGroups(role, groups);
        matrix[role] = {
          teamRole: getTeamRole(role),
          authorizedGroups: authorized,
          cannotAccess: groups.filter(g => !authorized.includes(g)),
        };
      }
      return { transactionType: args.transactionType, keyVaultGroups: groups, matrix };
    }

    case 'get_document_info': {
      const info = DOCUMENT_TYPE_INFO[args.documentType];
      if (!info) return { error: `Unknown document type: ${args.documentType}` };
      return { type: args.documentType, ...info };
    }

    case 'list_templates': {
      const templates = listClosingTemplates();
      return templates.map(t => ({
        name: t.name,
        transactionType: t.transactionType,
        state: t.state,
        requiredCount: t.required.length,
        conditionalCount: t.requiredIf.length,
        lenderRequiredCount: t.lenderRequired.length,
        optionalCount: t.optional.length,
        keyVaultGroups: t.keyVaultGroups,
      }));
    }

    case 'get_classifier_prompt':
      return { prompt: getClassifierPrompt() };

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── MCP Protocol Handler ──────────────────────────────────────────

function handleMcp(body) {
  const { method, id, params } = body;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'origin-title-wallet-mcp', version: '0.1.0' },
        },
      };

    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools: TOOLS } };

    case 'tools/call': {
      const { name, arguments: toolArgs } = params;
      try {
        const result = handleTool(name, toolArgs || {});
        return {
          jsonrpc: '2.0', id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          },
        };
      } catch (err) {
        return {
          jsonrpc: '2.0', id,
          result: {
            content: [{ type: 'text', text: `Error: ${err.message}` }],
            isError: true,
          },
        };
      }
    }

    default:
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown method: ${method}` } };
  }
}

// ─── HTTP Server ────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // Health
  if (pathname === '/api/health' || pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ok',
      service: 'origin-title-wallet-mcp',
      version: '0.1.0',
      tools: TOOLS.length,
      templates: listClosingTemplates().length,
      documentTypes: Object.keys(DOCUMENT_TYPE_INFO).length,
    }));
  }

  // MCP endpoint
  if (pathname === '/mcp' && req.method === 'POST') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const response = handleMcp(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // REST shortcuts
  if (pathname === '/api/template' && req.method === 'GET') {
    const type = url.searchParams.get('type') || 'residential_sale';
    const result = handleTool('get_closing_template', { transactionType: type });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result, null, 2));
  }

  if (pathname === '/api/templates' && req.method === 'GET') {
    const result = handleTool('list_templates', {});
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result, null, 2));
  }

  if (pathname === '/api/document' && req.method === 'GET') {
    const type = url.searchParams.get('type');
    if (!type) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'type parameter required' }));
    }
    const result = handleTool('get_document_info', { documentType: type });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result, null, 2));
  }

  if (pathname === '/api/classify' && req.method === 'GET') {
    const type = url.searchParams.get('type');
    if (type) {
      const result = handleTool('classify_document', { documentType: type });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result, null, 2));
    }
    // No type — return the full classifier prompt
    const result = handleTool('get_classifier_prompt', {});
    res.writeHead(200, { 'Content-Type': 'text/markdown' });
    return res.end(result.prompt);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║      Origin Title Wallet — MCP Server v0.1.0             ║
╠═══════════════════════════════════════════════════════════╣
║  Port:      ${PORT}                                          ║
║  Tools:     ${TOOLS.length}                                           ║
║  Templates: ${listClosingTemplates().length}                                            ║
║  Doc Types: ${Object.keys(DOCUMENT_TYPE_INFO).length}                                           ║
║                                                           ║
║  MCP:       http://localhost:${PORT}/mcp                      ║
║  Health:    http://localhost:${PORT}/api/health                ║
║  Templates: http://localhost:${PORT}/api/templates             ║
║  Classify:  http://localhost:${PORT}/api/classify              ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
