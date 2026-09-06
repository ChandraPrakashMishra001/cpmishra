// ============================================================
// Amanai Voice Navigator — popup logic
// ============================================================

const CHAT_URL = 'https://kkiqgaxtfeswzfmqixfm.supabase.co/functions/v1/chat';

const STORE_KEYS = {
  skills: 'amanai_skills',
  settings: 'amanai_settings',
};

const DEFAULT_SETTINGS = {
  model: 'google/gemini-3.5-flash',
  voiceEnabled: true,
  voiceRate: 1.0,
  companionName: 'Amanai',
  autoNavigate: true,
  autoSend: true,
  pushToTalk: false,
};

const DEFAULT_SKILLS = [
  {
    id: 'default-navigator',
    name: 'Internet Navigator',
    instructions:
      'You help the user navigate the web by voice. When the user expresses intent to visit a site or search, reply with one short confirmation sentence and nothing else. Keep answers under 25 words.',
    enabled: true,
  },
  {
    id: 'default-page-analyst',
    name: 'Page Analyst',
    instructions:
      'When given page content, extract the key claims, data points and action items. Use short bullet lines. Never invent content that is not in the page text.',
    enabled: false,
  },
  {
    id: 'default-summarizer',
    name: 'Quick Summarizer',
    instructions:
      'Answer with the tightest possible summary: max 3 bullet points, each under 15 words. No preamble, no closing remarks.',
    enabled: false,
  },
];

// ── Storage helpers ──────────────────────────────────────────
const storage = {
  async get(key, fallback) {
    try {
      const res = await chrome.storage.local.get(key);
      return res[key] === undefined ? fallback : res[key];
    } catch {
      return fallback;
    }
  },
  async set(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (e) {
      console.error('storage.set failed', e);
      return false;
    }
  },
};

const uid = () => `skill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ── App state ────────────────────────────────────────────────
let settings = { ...DEFAULT_SETTINGS };
let skills = [];
let editingSkillId = null;
let history = [];
let busy = false;

// ── DOM ──────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const el = {
  headerName: $('header-name'),
  statusDot: $('status-dot'),
  statusLabel: $('status-label'),
  modelBadge: $('model-badge'),
  conversation: $('conversation'),
  textInput: $('text-input'),
  sendBtn: $('send-btn'),
  micBtn: $('mic-btn'),
  micLabel: $('mic-label'),
  readPageBtn: $('read-page-btn'),
  clearBtn: $('clear-btn'),
  stopVoiceBtn: $('stop-voice-btn'),
  skillsList: $('skills-list'),
  addSkillBtn: $('add-skill-btn'),
  skillEditor: $('skill-editor'),
  skillNameInput: $('skill-name-input'),
  skillInstructionsInput: $('skill-instructions-input'),
  saveSkillBtn: $('save-skill-btn'),
  cancelSkillBtn: $('cancel-skill-btn'),
  modelSelect: $('model-select'),
  voiceEnabled: $('voice-enabled'),
  voiceRate: $('voice-rate'),
  rateValue: $('rate-value'),
  companionName: $('companion-name'),
  autoNavigate: $('auto-navigate'),
  autoSend: $('auto-send'),
  pushToTalk: $('push-to-talk'),
};

function setStatus(label, state) {
  el.statusLabel.textContent = label;
  el.statusDot.className = `status-dot${state ? ' ' + state : ''}`;
}

// ── Skills: load / save ──────────────────────────────────────
async function loadSkills() {
  const stored = await storage.get(STORE_KEYS.skills, null);
  if (!Array.isArray(stored)) {
    skills = DEFAULT_SKILLS.map((s) => ({ ...s }));
    await saveSkills();
  } else {
    skills = stored
      .filter((s) => s && typeof s.name === 'string')
      .map((s) => ({
        id: s.id || uid(),
        name: String(s.name).slice(0, 60),
        instructions: String(s.instructions || '').slice(0, 3000),
        enabled: !!s.enabled,
      }));
  }
  renderSkills();
}

async function saveSkills() {
  const ok = await storage.set(STORE_KEYS.skills, skills);
  if (!ok) setStatus('Save failed', 'error');
  return ok;
}

function activeInstructions() {
  return skills
    .filter((s) => s.enabled && s.instructions.trim())
    .map((s) => `### ${s.name}\n${s.instructions.trim()}`)
    .join('\n\n')
    .slice(0, 3000);
}

// ── Skills: render ───────────────────────────────────────────
function renderSkills() {
  el.skillsList.innerHTML = '';

  if (!skills.length) {
    const empty = document.createElement('p');
    empty.className = 'tab-hint';
    empty.style.padding = '20px 0';
    empty.textContent = 'No skills yet. Create one to start training Amanai.';
    el.skillsList.appendChild(empty);
    return;
  }

  skills.forEach((skill, index) => {
    const card = document.createElement('div');
    card.className = `skill-card${skill.enabled ? ' active' : ''}`;

    // top row: name + toggle
    const top = document.createElement('div');
    top.className = 'skill-card-top';

    const name = document.createElement('div');
    name.className = 'skill-card-name';
    name.textContent = skill.name;

    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'toggle skill-toggle';
    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.checked = skill.enabled;
    toggleInput.addEventListener('change', async () => {
      skill.enabled = toggleInput.checked;
      await saveSkills();
      renderSkills();
    });
    const toggleSpan = document.createElement('span');
    toggleSpan.className = 'toggle-slider';
    toggleLabel.append(toggleInput, toggleSpan);

    top.append(name, toggleLabel);

    // description
    const desc = document.createElement('div');
    desc.className = 'skill-card-desc';
    desc.textContent = skill.instructions
      ? skill.instructions.slice(0, 130) + (skill.instructions.length > 130 ? '…' : '')
      : 'No instructions set.';

    // actions
    const actions = document.createElement('div');
    actions.className = 'skill-card-actions';

    const upBtn = document.createElement('button');
    upBtn.className = 'skill-card-btn icon';
    upBtn.textContent = '↑';
    upBtn.title = 'Move up';
    upBtn.disabled = index === 0;
    upBtn.addEventListener('click', () => moveSkill(index, -1));

    const downBtn = document.createElement('button');
    downBtn.className = 'skill-card-btn icon';
    downBtn.textContent = '↓';
    downBtn.title = 'Move down';
    downBtn.disabled = index === skills.length - 1;
    downBtn.addEventListener('click', () => moveSkill(index, 1));

    const editBtn = document.createElement('button');
    editBtn.className = 'skill-card-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openEditor(skill.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'skill-card-btn delete';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteSkill(skill.id));

    const order = document.createElement('span');
    order.className = 'skill-order';
    order.textContent = `#${index + 1}`;

    actions.append(order, upBtn, downBtn, editBtn, delBtn);
    card.append(top, desc, actions);
    el.skillsList.appendChild(card);
  });
}

async function moveSkill(index, delta) {
  const target = index + delta;
  if (target < 0 || target >= skills.length) return;
  const [item] = skills.splice(index, 1);
  skills.splice(target, 0, item);
  await saveSkills();
  renderSkills();
}

async function deleteSkill(id) {
  skills = skills.filter((s) => s.id !== id);
  if (editingSkillId === id) closeEditor();
  await saveSkills();
  renderSkills();
}

function openEditor(id) {
  editingSkillId = id || null;
  const skill = skills.find((s) => s.id === id);
  el.skillNameInput.value = skill ? skill.name : '';
  el.skillInstructionsInput.value = skill ? skill.instructions : '';
  el.saveSkillBtn.textContent = skill ? 'Update Skill' : 'Save Skill';
  el.skillEditor.classList.remove('hidden');
  el.skillNameInput.focus();
}

function closeEditor() {
  editingSkillId = null;
  el.skillNameInput.value = '';
  el.skillInstructionsInput.value = '';
  el.skillEditor.classList.add('hidden');
}

async function saveSkillFromEditor() {
  const name = el.skillNameInput.value.trim();
  const instructions = el.skillInstructionsInput.value.trim();
  if (!name) {
    el.skillNameInput.focus();
    el.skillNameInput.style.borderColor = 'var(--danger)';
    setTimeout(() => (el.skillNameInput.style.borderColor = ''), 1200);
    return;
  }
  if (editingSkillId) {
    const skill = skills.find((s) => s.id === editingSkillId);
    if (skill) {
      skill.name = name.slice(0, 60);
      skill.instructions = instructions.slice(0, 3000);
    }
  } else {
    skills.push({ id: uid(), name: name.slice(0, 60), instructions: instructions.slice(0, 3000), enabled: true });
  }
  await saveSkills();
  closeEditor();
  renderSkills();
}

// ── Settings ─────────────────────────────────────────────────
async function loadSettings() {
  const stored = await storage.get(STORE_KEYS.settings, {});
  settings = { ...DEFAULT_SETTINGS, ...(stored && typeof stored === 'object' ? stored : {}) };
  el.modelSelect.value = settings.model;
  el.voiceEnabled.checked = settings.voiceEnabled;
  el.voiceRate.value = settings.voiceRate;
  el.rateValue.textContent = Number(settings.voiceRate).toFixed(1);
  el.companionName.value = settings.companionName;
  el.autoNavigate.checked = settings.autoNavigate;
  el.autoSend.checked = settings.autoSend;
  el.pushToTalk.checked = settings.pushToTalk;
  el.headerName.textContent = settings.companionName;
  el.modelBadge.textContent = settings.model.includes('pro') ? 'Pro' : 'Flash';
  if (!listening) el.micLabel.textContent = micIdleLabel();
}

async function saveSettings() {
  await storage.set(STORE_KEYS.settings, settings);
}

function wireSettings() {
  el.modelSelect.addEventListener('change', () => {
    settings.model = el.modelSelect.value;
    el.modelBadge.textContent = settings.model.includes('pro') ? 'Pro' : 'Flash';
    saveSettings();
  });
  el.voiceEnabled.addEventListener('change', () => {
    settings.voiceEnabled = el.voiceEnabled.checked;
    if (!settings.voiceEnabled) speechSynthesis.cancel();
    saveSettings();
  });
  el.voiceRate.addEventListener('input', () => {
    settings.voiceRate = parseFloat(el.voiceRate.value);
    el.rateValue.textContent = settings.voiceRate.toFixed(1);
    saveSettings();
  });
  el.companionName.addEventListener('input', () => {
    settings.companionName = el.companionName.value.slice(0, 30) || 'Amanai';
    el.headerName.textContent = settings.companionName;
    saveSettings();
  });
  el.autoNavigate.addEventListener('change', () => {
    settings.autoNavigate = el.autoNavigate.checked;
    saveSettings();
  });
  el.autoSend.addEventListener('change', () => {
    settings.autoSend = el.autoSend.checked;
    saveSettings();
  });
  el.pushToTalk.addEventListener('change', () => {
    settings.pushToTalk = el.pushToTalk.checked;
    if (!settings.pushToTalk) pttHeld = false;
    if (!listening) el.micLabel.textContent = micIdleLabel();
    saveSettings();
  });
}

// ── Conversation UI ──────────────────────────────────────────
function addMessage(role, text) {
  const welcome = el.conversation.querySelector('.welcome-msg');
  if (welcome) welcome.remove();
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  el.conversation.appendChild(div);
  el.conversation.scrollTop = el.conversation.scrollHeight;
  return div;
}

function addTyping() {
  const div = document.createElement('div');
  div.className = 'msg assistant';
  div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  el.conversation.appendChild(div);
  el.conversation.scrollTop = el.conversation.scrollHeight;
  return div;
}

function speak(text) {
  if (!settings.voiceEnabled || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[#*`_>]/g, '').slice(0, 600));
    u.rate = settings.voiceRate;
    speechSynthesis.speak(u);
  } catch {
    /* no-op */
  }
}

// ── Navigation intents ───────────────────────────────────────
function detectNavIntent(text) {
  const t = text.trim().toLowerCase();
  let m;
  if ((m = t.match(/^(?:search|google|look up|find)\s+(?:for\s+)?(.+)$/)))
    return { type: 'search', query: m[1] };
  if ((m = t.match(/^(?:open|go to|visit|navigate to)\s+(.+)$/))) {
    const target = m[1].replace(/\s+/g, '');
    if (/\.[a-z]{2,}$/.test(target) || /^(youtube|google|gmail|github|twitter|x|reddit|wikipedia)$/.test(target)) {
      const url = /\.[a-z]{2,}/.test(target) ? target : `${target}.com`;
      return { type: 'navigate-url', url };
    }
    return { type: 'search', query: m[1] };
  }
  if (/^(go\s+)?back$/.test(t)) return { type: 'back' };
  if (/^(go\s+)?forward$/.test(t)) return { type: 'forward' };
  if (/^(reload|refresh)( page)?$/.test(t)) return { type: 'reload' };
  if (/^(new tab|open new tab)$/.test(t)) return { type: 'newtab' };
  if (/^(close tab|close this tab)$/.test(t)) return { type: 'closetab' };
  return null;
}

async function runNavIntent(intent) {
  const res = await chrome.runtime.sendMessage(intent).catch(() => null);
  const label =
    intent.type === 'search'
      ? `Searching for “${intent.query}”`
      : intent.type === 'navigate-url'
        ? `Opening ${intent.url}`
        : `Command: ${intent.type}`;
  addMessage('nav', res && res.ok ? label : `Could not run: ${intent.type}`);
  if (res && res.ok) speak(label);
}

// ── Chat ─────────────────────────────────────────────────────
async function sendMessage(text) {
  if (!text.trim() || busy) return;
  busy = true;
  el.sendBtn.disabled = true;
  addMessage('user', text);
  history.push({ role: 'user', content: text });

  if (settings.autoNavigate) {
    const intent = detectNavIntent(text);
    if (intent) {
      await runNavIntent(intent);
      busy = false;
      el.sendBtn.disabled = false;
      return;
    }
  }

  setStatus('Thinking', 'thinking');
  const bubble = addTyping();
  let acc = '';

  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history.slice(-12),
        companionName: settings.companionName,
        userModel: settings.model,
        customInstructions: activeInstructions(),
      }),
    });

    if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            acc += delta;
            bubble.textContent = acc;
            el.conversation.scrollTop = el.conversation.scrollHeight;
          }
        } catch {
          /* partial chunk */
        }
      }
    }

    if (!acc) throw new Error('Empty response');
    history.push({ role: 'assistant', content: acc });
    setStatus('Ready', '');
    speak(acc);
  } catch (e) {
    bubble.remove();
    addMessage('error', e.message || 'Something went wrong');
    setStatus('Error', 'error');
  } finally {
    busy = false;
    el.sendBtn.disabled = false;
  }
}

// ── Voice input ──────────────────────────────────────────────
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;
let pttHeld = false;
let lastTranscript = '';

function micIdleLabel() {
  return settings.pushToTalk ? 'Hold to talk (Space)' : 'Tap to speak';
}

function initRecognition() {
  if (!SR) {
    el.micLabel.textContent = 'Voice unsupported';
    el.micBtn.disabled = true;
    return;
  }
  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    listening = true;
    lastTranscript = '';
    el.micBtn.classList.add('recording');
    el.micLabel.textContent = settings.pushToTalk ? 'Release to send' : 'Listening…';
    setStatus('Listening', 'listening');
  };
  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
    lastTranscript = transcript;
    el.textInput.value = transcript;
    const isFinal = event.results[event.results.length - 1].isFinal;
    if (isFinal && !settings.pushToTalk && settings.autoSend) {
      const final = transcript.trim();
      lastTranscript = '';
      el.textInput.value = '';
      sendMessage(final);
    }
  };
  recognition.onerror = () => {
    el.micLabel.textContent = 'Mic error';
    setStatus('Error', 'error');
  };
  recognition.onend = () => {
    listening = false;
    el.micBtn.classList.remove('recording');
    el.micLabel.textContent = micIdleLabel();
    if (el.statusLabel.textContent === 'Listening') setStatus('Ready', '');
    // Push-to-talk: send whatever was captured when the key/button was released
    if (settings.pushToTalk && settings.autoSend && lastTranscript.trim()) {
      const final = lastTranscript.trim();
      lastTranscript = '';
      el.textInput.value = '';
      sendMessage(final);
    }
  };
}

function startListening() {
  if (!recognition || listening) return;
  recognition.continuous = !!settings.pushToTalk;
  try {
    recognition.start();
  } catch {
    /* already started */
  }
}

function stopListening() {
  if (!recognition || !listening) return;
  try {
    recognition.stop();
  } catch {
    /* not running */
  }
}

function toggleListening() {
  if (listening) stopListening();
  else startListening();
}

function isTypingTarget(target) {
  const tag = target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;
}

function wireHotkeys() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + Space: toggle listening from anywhere in the popup
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'Space') {
      e.preventDefault();
      toggleListening();
      return;
    }
    // Escape: stop mic + speech
    if (e.key === 'Escape') {
      stopListening();
      speechSynthesis.cancel();
      return;
    }
    // Space held: push-to-talk (only when not typing)
    if (e.code === 'Space' && settings.pushToTalk && !isTypingTarget(e.target)) {
      e.preventDefault();
      if (!e.repeat && !pttHeld) {
        pttHeld = true;
        startListening();
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && pttHeld) {
      pttHeld = false;
      stopListening();
    }
  });

  window.addEventListener('blur', () => {
    if (pttHeld) {
      pttHeld = false;
      stopListening();
    }
  });
}

async function consumeAutoListenFlag() {
  const ts = await storage.get('amanai_autolisten', 0);
  if (!ts) return;
  await chrome.storage.local.remove('amanai_autolisten');
  // Only honour a very recent hotkey trigger
  if (Date.now() - ts < 5000 && !settings.pushToTalk) startListening();
}


// ── Page reading ─────────────────────────────────────────────
async function readCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({ title: document.title, text: document.body?.innerText?.slice(0, 6000) || '' }),
    });
    if (!result?.text) throw new Error('Could not read page');
    addMessage('nav', `Reading: ${result.title}`);
    await sendMessage(`Analyze this page.\nTitle: ${result.title}\n\nContent:\n${result.text}`);
  } catch (e) {
    addMessage('error', e.message || 'Page read failed');
  }
}

// ── Tabs ─────────────────────────────────────────────────────
function wireTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      $(`${tab.dataset.tab}-tab`).classList.add('active');
    });
  });
}

// ── Init ─────────────────────────────────────────────────────
function wireEvents() {
  el.sendBtn.addEventListener('click', () => {
    const v = el.textInput.value.trim();
    el.textInput.value = '';
    sendMessage(v);
  });
  el.textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const v = el.textInput.value.trim();
      el.textInput.value = '';
      sendMessage(v);
    }
  });
  el.micBtn.addEventListener('click', () => {
    if (settings.pushToTalk) return; // handled by press-and-hold below
    toggleListening();
  });
  el.micBtn.addEventListener('mousedown', (e) => {
    if (!settings.pushToTalk || e.button !== 0) return;
    e.preventDefault();
    pttHeld = true;
    startListening();
  });
  const releasePtt = () => {
    if (!pttHeld) return;
    pttHeld = false;
    stopListening();
  };
  el.micBtn.addEventListener('mouseup', releasePtt);
  el.micBtn.addEventListener('mouseleave', releasePtt);
  el.readPageBtn.addEventListener('click', readCurrentPage);
  el.clearBtn.addEventListener('click', () => {
    history = [];
    el.conversation.innerHTML =
      '<div class="welcome-msg"><p class="welcome-title">Voice Navigator</p><p>Tap the mic and speak, or type below.</p><p class="hint">Try: "search for rice varieties" · "open youtube" · "read this page"</p></div>';
  });
  el.stopVoiceBtn.addEventListener('click', () => speechSynthesis.cancel());

  el.addSkillBtn.addEventListener('click', () => openEditor(null));
  el.saveSkillBtn.addEventListener('click', saveSkillFromEditor);
  el.cancelSkillBtn.addEventListener('click', closeEditor);
}

(async function init() {
  wireTabs();
  wireEvents();
  wireSettings();
  wireHotkeys();
  initRecognition();
  await loadSettings();
  await loadSkills();
  setStatus('Ready', '');
  await consumeAutoListenFlag();
})();
