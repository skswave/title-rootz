/**
 * AI_CONTEXT: Farm Chat page HTML template.
 * The /farm UI — chat interface for real estate farming agents.
 * No business logic here — just the HTML/CSS/JS template.
 *
 * Exports:
 *   - renderFarmChatPage() — returns full HTML string
 */

export function renderFarmChatPage() {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rootz Farming Assistant</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#1e293b;height:100vh;display:flex;flex-direction:column}
.hdr{background:linear-gradient(135deg,#1e3a5f 0%,#0f766e 100%);color:#fff;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.hdr h1{font-size:18px;font-weight:700}
.hdr .sub{font-size:11px;opacity:.7}
.chat{flex:1;overflow-y:auto;padding:16px;max-width:900px;margin:0 auto;width:100%}
.msg{margin:8px 0;padding:12px 16px;border-radius:12px;max-width:85%;line-height:1.5;font-size:14px}
.msg-user{background:#1e3a5f;color:#fff;margin-left:auto;border-bottom-right-radius:4px}
.msg-ai{background:#fff;color:#1e293b;border:1px solid #e2e8f0;border-bottom-left-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.msg-ai a{color:#0f766e}
.msg-ai pre{background:#f1f5f9;padding:8px;border-radius:6px;overflow-x:auto;font-size:12px;margin:8px 0}
.msg-ai ul,.msg-ai ol{padding-left:18px;margin:6px 0}
.msg-ai li{margin:3px 0}
.msg-thinking{background:#f1f5f9;color:#94a3b8;font-style:italic;border:1px dashed #cbd5e1}
.starters{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:20px}
.starter{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 16px;font-size:13px;cursor:pointer;color:#1e3a5f;transition:all .2s;max-width:280px;text-align:left}
.starter:hover{border-color:#0f766e;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.input-bar{flex-shrink:0;padding:12px 16px;background:#fff;border-top:1px solid #e2e8f0}
.input-row{max-width:900px;margin:0 auto;display:flex;gap:8px}
.input-row input{flex:1;padding:10px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none}
.input-row input:focus{border-color:#0f766e}
.input-row button{background:#0f766e;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer}
.input-row button:hover{background:#0d6b63}
.input-row button:disabled{background:#94a3b8;cursor:not-allowed}
.ft{text-align:center;padding:6px;font-size:10px;color:#94a3b8;flex-shrink:0}
.ft a{color:#0f766e;text-decoration:none}
</style>
</head><body>

<div class="hdr">
  <div>
    <h1>Rootz Farming Assistant</h1>
    <div class="sub">10.8M FL properties &bull; Courthouse records &bull; Government data with provenance</div>
  </div>
  <div style="font-size:11px;opacity:.6">Powered by Claude</div>
</div>

<div id="sessions-panel" style="display:none;background:#fff;border-bottom:1px solid #e2e8f0;padding:8px 16px;flex-shrink:0">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <span style="font-size:13px;font-weight:600;color:#1e3a5f">Past Sessions</span>
    <div>
      <button onclick="newSession()" style="font-size:11px;padding:4px 10px;background:#0f766e;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:4px">New Chat</button>
      <button onclick="toggleSessions()" style="font-size:11px;padding:4px 8px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:4px;cursor:pointer" id="toggle-btn">Hide</button>
    </div>
  </div>
  <div id="sessions-list" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;max-height:80px;overflow-y:auto"></div>
  <div id="sessions-upgrade" style="display:none;font-size:12px;color:#64748b;margin-top:6px"></div>
</div>

<div class="chat" id="chat">
  <div class="starters" id="starters">
    <div class="starter" onclick="send(this.textContent)">"I want to farm in Coral Springs. Show me what's out there."</div>
    <div class="starter" onclick="send(this.textContent)">"Find me probate properties in Fort Lauderdale — I help families."</div>
    <div class="starter" onclick="send(this.textContent)">"Show me absentee owners in Hollywood FL who might sell."</div>
    <div class="starter" onclick="send(this.textContent)">"I work with investors. Find corporate-owned properties with liens in Pembroke Pines."</div>
    <div class="starter" onclick="send(this.textContent)">"What's the story on 1725 SW 14 ST in Fort Lauderdale?"</div>
  </div>
</div>

<div class="input-bar">
  <div class="input-row">
    <input type="text" id="input" placeholder="Ask about any Florida property or neighborhood..." onkeydown="if(event.key==='Enter')send()">
    <button id="btn" onclick="send()">Send</button>
  </div>
</div>

<div class="ft">
  <a href="https://title.rootz.global">title.rootz.global</a> &bull; Government data with cryptographic proof
</div>

<script>
const chatEl = document.getElementById('chat');
const inputEl = document.getElementById('input');
const btnEl = document.getElementById('btn');
const startersEl = document.getElementById('starters');
let history = [];
let conversationId = null;

function addMsg(text, role) {
  const div = document.createElement('div');
  div.className = 'msg msg-' + role;
  div.innerHTML = text
    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
    .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^- (.+)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\\/li>)/s, '<ul>$1</ul>')
    .replace(/\\n/g, '<br>');
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
  return div;
}

function showUpgrade(data) {
  const msg = data.message || 'Limit reached.';
  const div = document.createElement('div');
  div.className = 'msg msg-ai';
  div.innerHTML = '<div style="text-align:center;padding:8px">'
    + '<div style="font-size:14px;color:#dc2626;font-weight:600;margin-bottom:8px">' + msg + '</div>'
    + '<a href="/pricing" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg,#1e3a5f,#0f766e);color:#fff;border-radius:8px;text-decoration:none;font-weight:600">View Plans</a>'
    + '</div>';
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function updateStatus(data) {
  let statusEl = document.getElementById('status-bar');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'status-bar';
    statusEl.style.cssText = 'text-align:center;padding:4px;font-size:11px;color:#94a3b8;flex-shrink:0;border-top:1px solid #f1f5f9';
    document.querySelector('.ft').before(statusEl);
  }
  const parts = [];
  if (data.rate_limit && data.rate_limit.limit > 0) parts.push(data.rate_limit.remaining + '/' + data.rate_limit.limit + ' searches left today');
  if (data.token_budget && data.token_budget.budget > 0) parts.push(Math.round(data.token_budget.used/1000) + 'K/' + Math.round(data.token_budget.budget/1000) + 'K tokens (' + data.token_budget.pct + '%)');
  if (data.model) parts.push(data.model.includes('sonnet') ? 'Sonnet' : 'Haiku');
  if (parts.length) statusEl.textContent = parts.join(' \\u2022 ');
}

async function send(text) {
  const msg = text || inputEl.value.trim();
  if (!msg) return;
  inputEl.value = '';
  startersEl.style.display = 'none';
  addMsg(msg, 'user');
  const thinking = addMsg('Searching properties...', 'thinking');
  btnEl.disabled = true;

  try {
    history.push({ role: 'user', content: msg });
    const resp = await fetch('/farm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, conversation_id: conversationId })
    });
    const data = await resp.json();
    thinking.remove();

    if (resp.status === 429) {
      showUpgrade(data);
      history.pop();
    } else if (data.error) {
      addMsg('Error: ' + data.error, 'ai');
      history.pop();
    } else {
      addMsg(data.text, 'ai');
      history.push({ role: 'assistant', content: data.text });
      if (data.conversation_id) conversationId = data.conversation_id;
      updateStatus(data);
    }
  } catch(e) {
    thinking.remove();
    addMsg('Connection error. Please try again.', 'ai');
    history.pop();
  }
  btnEl.disabled = false;
  inputEl.focus();
}

const params = new URLSearchParams(location.search);
if (params.get('conversation')) {
  (async () => {
    try {
      const resp = await fetch('/api/conversations/' + params.get('conversation'));
      if (resp.ok) {
        const data = await resp.json();
        conversationId = data.id;
        startersEl.style.display = 'none';
        for (const m of (data.messages || [])) {
          if (typeof m.content === 'string') addMsg(m.content, m.role === 'user' ? 'user' : 'ai');
        }
        history = data.messages || [];
      }
    } catch(e) {}
  })();
}

if (params.get('property')) {
  setTimeout(() => send('Tell me about ' + params.get('property')), 300);
}

(async () => {
  try {
    const resp = await fetch('/api/conversations');
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.conversations?.length) return;
    document.getElementById('sessions-panel').style.display = 'block';
    const list = document.getElementById('sessions-list');
    data.conversations.forEach(c => {
      const btn = document.createElement('button');
      btn.style.cssText = 'font-size:11px;padding:4px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;color:#475569;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      btn.textContent = (c.title || 'Session').substring(0, 40);
      btn.onclick = () => loadSession(c.id);
      list.appendChild(btn);
    });
    if (!data.can_resume) {
      const ug = document.getElementById('sessions-upgrade');
      ug.style.display = 'block';
      ug.innerHTML = (data.upgrade_message || '') + ' <a href="/pricing" style="color:#0f766e;font-weight:600">Upgrade</a>';
    }
  } catch(e) {}
})();

async function loadSession(id) {
  const resp = await fetch('/api/conversations/' + id);
  if (resp.status === 403) { const d = await resp.json(); alert(d.error); return; }
  if (!resp.ok) return;
  const data = await resp.json();
  conversationId = data.id;
  history = data.messages || [];
  chatEl.innerHTML = '';
  for (const m of history) {
    if (typeof m.content === 'string') addMsg(m.content, m.role === 'user' ? 'user' : 'ai');
  }
}

function newSession() { location.href = '/farm'; }
function toggleSessions() {
  const list = document.getElementById('sessions-list');
  const btn = document.getElementById('toggle-btn');
  if (list.style.display === 'none') { list.style.display = 'flex'; btn.textContent = 'Hide'; }
  else { list.style.display = 'none'; btn.textContent = 'Show'; }
}
</script>
</body></html>`;
}
