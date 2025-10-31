const KEY_AGENTS = "dv.agents";
const KEY_TASKS = "dv.tasks";

const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  for (const fn of [...listeners]) {
    try { fn(getState()); } catch (e) { console.warn("agents store listener error", e); }
  }
}

function seedAgents() {
  const now = new Date().toLocaleString();
  return [
    { id: "a1", name: "TMInvestigationAgent", desc: "Investigate TM alerts", status: "DRAFT", updated: now },
    { id: "a2", name: "CaseSummaryAgent", desc: "Generate case summaries", status: "PUBLISHED", updated: now },
  ];
}
function seedTasks() {
  const now = new Date().toLocaleString();
  return [
    { id: "t1", time: now, agent: "CaseSummaryAgent", prompt: "Summarize alert 100234", status: "SUCCESS", tokens: 1450, details:[{t:"Fetched case details",ts:"T+0s"}] },
    { id: "t2", time: now, agent: "TMInvestigationAgent", prompt: "Checklist run for alert 99871", status: "SUCCESS", tokens: 890, details:[{t:"Queried entity data",ts:"T+0s"}] },
  ];
}

export function loadAgents() {
  try {
    const raw = localStorage.getItem(KEY_AGENTS);
    return raw ? JSON.parse(raw) : seedAgents();
  } catch { return seedAgents(); }
}
export function saveAgents(list) {
  localStorage.setItem(KEY_AGENTS, JSON.stringify(list));
  emit();
}
export function loadTasks() {
  try {
    const raw = localStorage.getItem(KEY_TASKS);
    return raw ? JSON.parse(raw) : seedTasks();
  } catch { return seedTasks(); }
}
export function saveTasks(list) {
  localStorage.setItem(KEY_TASKS, JSON.stringify(list));
  emit();
}

export function getState() {
  return { agents: loadAgents(), tasks: loadTasks() };
}

export function addAgent(agent) {
  const list = [agent, ...loadAgents()];
  saveAgents(list);
  return agent;
}
export function updateAgent(id, patch) {
  const list = loadAgents().map((a) => (a.id === id ? { ...a, ...patch } : a));
  saveAgents(list);
  return list.find((a) => a.id === id);
}
export function deleteAgent(id) {
  const list = loadAgents().filter((a) => a.id !== id);
  saveAgents(list);
}
export function publishAgent(id) {
  const now = new Date().toLocaleString();
  return updateAgent(id, { status: "PUBLISHED", updated: now });
}
export function cloneAgent(agent) {
  const now = new Date().toLocaleString();
  const copy = { ...agent, id: Math.random().toString(36).slice(2), name: agent.name + " Copy", status: "DRAFT", updated: now };
  return addAgent(copy);
}
