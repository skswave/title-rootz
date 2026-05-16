/**
 * Origin Title Wallet — API Server
 * Port 3036
 *
 * Endpoints:
 *   POST /api/wallet/create         — Upload closing package, create wallet
 *   GET  /api/wallet/:id            — Get wallet public data
 *   GET  /api/wallet/:id/verify     — Verify wallet integrity
 *   GET  /api/wallet/:id/party?key= — Get party-specific decrypted view
 *   GET  /api/wallet/:id/links      — Get share links (title company only)
 *   POST /api/wallet/:id/event      — Add an event (refinance, filing, etc.)
 *   GET  /api/wallets               — List all wallets
 *   GET  /api/health                — Health check
 *   GET  /                          — Web frontend
 *
 * MCP endpoint:
 *   POST /mcp                       — Model Context Protocol handler
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL, fileURLToPath } from 'node:url';

import {
  createWallet, getWallet, getPartyViewSync, addEvent,
  verifyWallet, listWallets, walletExists, propertyId,
  getShareLinks
} from './wallet.mjs';

const PORT = 3036;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');

// ─── HTTP helpers ───────────────────────────────────────────────

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

function error(res, message, status = 400) {
  json(res, { error: message }, status);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

// ─── MCP Tool Definitions ──────────────────────────────────────

const MCP_TOOLS = [
  {
    name: 'create_title_wallet',
    description: 'Create a new Title Wallet from a closing package. Requires property info, transaction details, party names, and documents.',
    inputSchema: {
      type: 'object',
      properties: {
        property: {
          type: 'object',
          description: 'Property address info',
          properties: {
            address: { type: 'string', description: 'Street address (e.g., "111 Swamp Rd")' },
            town: { type: 'string', description: 'Town/city name' },
            state: { type: 'string', description: 'State abbreviation (default: MA)' },
            county: { type: 'string' },
            zip: { type: 'string' }
          },
          required: ['address', 'town']
        },
        transaction: {
          type: 'object',
          description: 'Transaction details',
          properties: {
            type: { type: 'string', enum: ['sale', 'refinance', 'transfer', 'estate'] },
            date: { type: 'string', description: 'Closing date (YYYY-MM-DD)' },
            price: { type: 'number' },
            deedNumber: { type: 'string' },
            bookPage: { type: 'string', description: 'Book/page (e.g., "01760/119")' },
            registry: { type: 'string' }
          },
          required: ['date']
        },
        parties: {
          type: 'object',
          description: 'Transaction parties',
          properties: {
            buyer: { type: 'object', properties: { name: { type: 'string' } } },
            seller: { type: 'object', properties: { name: { type: 'string' } } },
            titleCompany: { type: 'object', properties: { name: { type: 'string' }, licenseNumber: { type: 'string' } } },
            attorney: { type: 'object', properties: { name: { type: 'string' }, barNumber: { type: 'string' } } },
            lender: { type: 'object', properties: { name: { type: 'string' } } }
          }
        },
        documents: {
          type: 'object',
          description: 'Closing documents (each is an object with relevant fields)',
          properties: {
            deed: { type: 'object' },
            chainOfTitle: { type: 'array' },
            titleSearch: { type: 'object' },
            settlementBuyer: { type: 'object' },
            settlementSeller: { type: 'object' },
            wireBuyer: { type: 'object' },
            wireSeller: { type: 'object' },
            identityBuyer: { type: 'object' },
            identitySeller: { type: 'object' },
            attestation: { type: 'object' },
            internalNotes: { type: 'object' }
          }
        },
        liens: { type: 'object' },
        confidenceScore: { type: 'number', description: '0.0-1.0 confidence from cross-source verification' }
      },
      required: ['property', 'transaction', 'parties', 'documents']
    }
  },
  {
    name: 'get_title_wallet',
    description: 'Get the public data for a Title Wallet by property ID or address',
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string', description: 'Wallet property ID (e.g., MA-RICHMOND-111-SWAMP-RD)' },
        address: { type: 'string', description: 'Street address (alternative to propertyId)' },
        town: { type: 'string', description: 'Town (required if using address)' }
      }
    }
  },
  {
    name: 'verify_title_wallet',
    description: 'Verify the integrity and trust level of a Title Wallet',
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string' },
        address: { type: 'string' },
        town: { type: 'string' }
      }
    }
  },
  {
    name: 'list_title_wallets',
    description: 'List all Title Wallets in the system',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'add_wallet_event',
    description: 'Add an event to an existing Title Wallet (new filing, refinance, transfer, status update)',
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string' },
        type: { type: 'string', enum: ['FILING', 'REFINANCE', 'TRANSFER', 'LIEN', 'DISCHARGE', 'STATUS_UPDATE'] },
        description: { type: 'string' },
        source: { type: 'string' },
        newOwner: { type: 'string', description: 'Set if ownership changed' },
        confidence: { type: 'number', description: 'Updated confidence score' }
      },
      required: ['propertyId', 'type', 'description']
    }
  },
  {
    name: 'get_wallet_share_links',
    description: 'Get the share links for each party in a Title Wallet. Each link allows that party to decrypt their view of the closing.',
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string' }
      },
      required: ['propertyId']
    }
  }
];

// ─── MCP Tool Execution ────────────────────────────────────────

function executeMcpTool(name, args) {
  switch (name) {
    case 'create_title_wallet':
      return createWallet(args);

    case 'get_title_wallet': {
      const id = args.propertyId || propertyId(args.address, args.town);
      const wallet = getWallet(id);
      if (!wallet) return { error: `No wallet found for ${id}` };
      return wallet;
    }

    case 'verify_title_wallet': {
      const id = args.propertyId || propertyId(args.address, args.town);
      const result = verifyWallet(id);
      if (!result) return { error: `No wallet found for ${id}` };
      return result;
    }

    case 'list_title_wallets':
      return { wallets: listWallets(), count: listWallets().length };

    case 'add_wallet_event':
      return addEvent(args.propertyId, args);

    case 'get_wallet_share_links': {
      const links = getShareLinks(args.propertyId);
      if (!links) return { error: `No wallet found for ${args.propertyId}` };
      return {
        propertyId: args.propertyId,
        links,
        usage: 'Append ?key={shareKey} to the wallet viewer URL for party-specific access'
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── MCP Protocol Handler ──────────────────────────────────────

function handleMcp(body) {
  const { method, id, params } = body;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'origin-title-wallet', version: '1.0.0' }
        }
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0', id,
        result: { tools: MCP_TOOLS }
      };

    case 'tools/call': {
      const { name, arguments: args } = params;
      try {
        const result = executeMcpTool(name, args || {});
        return {
          jsonrpc: '2.0', id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          }
        };
      } catch (err) {
        return {
          jsonrpc: '2.0', id,
          result: {
            content: [{ type: 'text', text: `Error: ${err.message}` }],
            isError: true
          }
        };
      }
    }

    default:
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

// ─── Request Router ────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  try {
    // ─── MCP endpoint ───
    if (pathname === '/mcp' && req.method === 'POST') {
      const body = await readBody(req);
      const response = handleMcp(body);
      return json(res, response);
    }

    // ─── REST API ───

    // Health
    if (pathname === '/api/health') {
      return json(res, {
        status: 'ok',
        service: 'origin-title-wallet',
        version: '1.0.0',
        walletCount: listWallets().length,
        uptime: process.uptime()
      });
    }

    // List wallets
    if (pathname === '/api/wallets' && req.method === 'GET') {
      const wallets = listWallets();
      return json(res, { wallets, count: wallets.length });
    }

    // Create wallet
    if (pathname === '/api/wallet/create' && req.method === 'POST') {
      const body = await readBody(req);
      const result = createWallet(body);
      return json(res, result, 201);
    }

    // Wallet routes: /api/wallet/:id/...
    const walletMatch = pathname.match(/^\/api\/wallet\/([^\/]+)(\/.*)?$/);
    if (walletMatch) {
      const propId = decodeURIComponent(walletMatch[1]);
      const subpath = walletMatch[2] || '';

      // GET /api/wallet/:id
      if (subpath === '' && req.method === 'GET') {
        const wallet = getWallet(propId);
        if (!wallet) return error(res, `No wallet found for ${propId}`, 404);
        return json(res, wallet);
      }

      // GET /api/wallet/:id/verify
      if (subpath === '/verify' && req.method === 'GET') {
        const result = verifyWallet(propId);
        if (!result) return error(res, `No wallet found for ${propId}`, 404);
        return json(res, result);
      }

      // GET /api/wallet/:id/party?key=...
      if (subpath === '/party' && req.method === 'GET') {
        const shareKey = url.searchParams.get('key');
        if (!shareKey) return error(res, 'Missing ?key= parameter');
        const view = getPartyViewSync(propId, shareKey);
        if (!view) return error(res, 'Invalid key or wallet not found', 403);
        return json(res, view);
      }

      // GET /api/wallet/:id/links
      if (subpath === '/links' && req.method === 'GET') {
        const links = getShareLinks(propId);
        if (!links) return error(res, `No wallet found for ${propId}`, 404);
        return json(res, { propertyId: propId, links });
      }

      // POST /api/wallet/:id/event
      if (subpath === '/event' && req.method === 'POST') {
        const body = await readBody(req);
        const event = addEvent(propId, body);
        return json(res, event, 201);
      }
    }

    // ─── Static files ───
    if (pathname === '/' || pathname === '/index.html') {
      return serveStatic(res, path.join(PUBLIC_DIR, 'index.html'));
    }
    if (pathname === '/upload' || pathname === '/upload.html') {
      return serveStatic(res, path.join(PUBLIC_DIR, 'upload.html'));
    }
    if (pathname === '/viewer' || pathname === '/viewer.html') {
      return serveStatic(res, path.join(PUBLIC_DIR, 'viewer.html'));
    }

    // Other static files
    const staticPath = path.join(PUBLIC_DIR, pathname);
    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
      return serveStatic(res, staticPath);
    }

    error(res, 'Not found', 404);

  } catch (err) {
    console.error('Error:', err.message);
    error(res, err.message, 500);
  }
});

server.listen(PORT, () => {
  const wallets = listWallets();
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Origin Title Wallet — API Server v1.0            ║
╠═══════════════════════════════════════════════════════════╣
║  Port:    ${PORT}                                           ║
║  Wallets: ${String(wallets.length).padEnd(3)}                                          ║
║                                                           ║
║  Web:     http://localhost:${PORT}/                         ║
║  Upload:  http://localhost:${PORT}/upload                   ║
║  API:     http://localhost:${PORT}/api/health               ║
║  MCP:     http://localhost:${PORT}/mcp                      ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
