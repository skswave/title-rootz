// Test mcp-echarts — generate a Miami-Dade price trend chart
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const binPath = path.join(__dirname, 'node_modules', '.bin', 'mcp-echarts');
const proc = spawn(binPath, [], { stdio: ['pipe', 'pipe', 'pipe'], shell: true });

let buffer = '';
proc.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop(); // keep incomplete line

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);

      if (msg.id === 1) {
        console.log('Initialized, sending chart request...');
        // Send chart generation request
        const chartReq = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'generate_line_chart',
            arguments: {
              title: 'Miami-Dade County — Median Listing Price Trend',
              x_data: ['Jan 23','Apr 23','Jul 23','Oct 23','Jan 24','Apr 24','Jul 24','Oct 24','Jan 25','Apr 25','Jul 25','Oct 25','Jan 26','Mar 26'],
              y_data: [520000,525000,530000,545000,549000,559000,575000,585000,589000,595000,599000,599900,599900,599000],
              x_label: 'Month',
              y_label: 'Median Price ($)',
              width: 800,
              height: 400
            }
          }
        };
        proc.stdin.write(JSON.stringify(chartReq) + '\n');
      }

      if (msg.id === 2 && msg.result) {
        console.log('Chart generated!');
        const content = msg.result.content || [];
        for (const c of content) {
          if (c.type === 'image' && c.data) {
            const outPath = path.join(__dirname, '..', 'data', 'florida', 'chart-median-price.png');
            fs.writeFileSync(outPath, Buffer.from(c.data, 'base64'));
            console.log(`Saved: ${outPath}`);
            console.log(`Size: ${fs.statSync(outPath).size} bytes`);
          } else if (c.type === 'text') {
            console.log(`Text: ${c.text.substring(0, 200)}`);
          }
        }
        proc.kill();
      }
    } catch (e) {
      // Not JSON, skip
    }
  }
});

proc.stderr.on('data', (data) => {
  // Suppress stderr noise
});

proc.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});

// Send initialize
const initMsg = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'origin-test', version: '0.1' },
    capabilities: {}
  }
};
proc.stdin.write(JSON.stringify(initMsg) + '\n');

// Timeout after 15 seconds
setTimeout(() => {
  console.log('Timeout — killing process');
  proc.kill();
}, 15000);
