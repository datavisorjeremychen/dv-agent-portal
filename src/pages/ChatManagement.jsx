import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Clock, User2, CheckCircle2,
  Circle, Loader2, Play, FileText, ExternalLink,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, X
} from "lucide-react";

/**
 * Chat Management System (CMS) — v2 (updated)
 * - Artifacts section removed
 * - Chat History panel: cleaner rows + search box
 * - Preview panel still collapsible via Close button
 * - ChatDetail keeps simplified agent statuses + expand thinking + per-agent input
 */

const DB_KEY = "dv.cms.chats.v2";
const DB_PROJ = "dv.cms.projects.v1";
const CURRENT_USER = "jeremy.chen@datavisor.com";

/* -------------------------- Seed data -------------------------- */
function seedChats() {
  const now = new Date().toISOString();
  return [
    {
      id: "c1",
      title: "FN Analysis — derive new ATO rules",
      createdAt: now,
      updatedAt: now,
      userId: CURRENT_USER,
      isStarred: true,
      isShared: false,
      project: "Alert Review Automation Q&A",
      agents: ["PatternDiscoveryAgent", "RuleTestingAgent"],
      transcript: [
        { who: "user", text: "Evaluate recent uncaught ATO cases and propose new rules.", ts: now },
        { who: "bot", text: "Starting FN retrieval and analysis pipeline…", ts: now },
      ],
      default_model: "gpt-5o",
      artifacts: [],
      finalStatus: "in-progress",
      tasks: [
        {
          id: "t1",
          label: "Fraud Pattern Analysis",
          status: "running",
          sub: [
            { id: "s1", name: "Fetch FN Events (last 14d)", concurrent: true, pct: 0, done: false, approvalNeeded: true, approvalType: "approve", approved: null },
            { id: "s2", name: "Derive Fraud Pattern (embedding + clustering)", concurrent: true, pct: 0, done: false, approvalNeeded: false },
            { id: "s3", name: "Draft Hypothesis Rules", concurrent: false, pct: 0, done: false, approvalNeeded: true, approvalType: "accept", approved: null, previewId: "preview_rules_s3" },
            { id: "s4", name: "Backtest Rules", concurrent: false, pct: 0, done: false, approvalNeeded: false, result: { lift: "+42%", precision: "0.71", recall: "0.63" } },
            { id: "s5", name: "Generate Features (if threshold met)", concurrent: false, pct: 0, done: false, approvalNeeded: true, approvalType: "accept", approved: null, previewId: "preview_feats_s5" },
            { id: "s6", name: "Create Rules (if threshold met)", concurrent: false, pct: 0, done: false, approvalNeeded: true, approvalType: "accept", approved: null, previewId: "preview_rules_s6" },
          ],
        },
      ],
    },
    {
      id: "c2",
      title: "ATO Queue Triage Q&A",
      createdAt: now,
      updatedAt: now,
      userId: "analyst.alex@datavisor.com",
      isStarred: false,
      isShared: true,
      project: "Q3 Velocity Feature Development",
      agents: ["ATO Review Decision Agent"],
      transcript: [
        { who: "user", text: "Summarize main risk signals for entity 6972…", ts: now },
        { who: "bot", text: "Password+2FA change minutes before alert; Socure R217/R572/R633; iOS login 73.136.129.131", ts: now },
      ],
      default_model: "gpt-5o-mini",
      artifacts: [],
      finalStatus: "done",
      tasks: [],
    },
    {
      id: "c3",
      title: "Elder Abuse Pattern Review — BillPay anomalies",
      createdAt: now,
      updatedAt: now,
      userId: CURRENT_USER,
      isStarred: false,
      isShared: false,
      project: "Alert Review Automation Q&A",
      agents: ["Unauthorized Transaction Review Decision Agent"],
      transcript: [
        { who: "user", text: "Check last 30d payments for large anomalies for elderly cohort.", ts: now },
        { who: "bot", text: "Retrieved cohort baseline. Two anomalies found. Proposing inquiries.", ts: now },
      ],
      default_model: "gpt-5o",
      artifacts: [],
      finalStatus: "in-progress",
      tasks: [
        {
          id: "t2",
          label: "Elder Abuse Anomaly Workflow",
          status: "awaiting-approval",
          sub: [
            { id: "s1", name: "Retrieve Customer Data (HIPAA-safe)", concurrent: true, pct: 100, done: true, approvalNeeded: true, approvalType: "approve", approved: null },
            { id: "s2", name: "Propose Contact to Trusted Person", concurrent: false, pct: 0, done: false, approvalNeeded: true, approvalType: "accept", approved: null, previewId: "preview_contact_s2" },
          ],
        },
      ],
    },
    {
      id: "c4",
      title: "Velocity Feature Tuning — Backtest variants",
      createdAt: now,
      updatedAt: now,
      userId: "fraud.ops@datavisor.com",
      isStarred: true,
      isShared: true,
      project: "Q3 Velocity Feature Development",
      agents: ["FeaturePlatformAgent", "RulesEngineAgent"],
      transcript: [
        { who: "user", text: "Try 3 velocity bins for account_age < 30d and test against FN.", ts: now },
        { who: "bot", text: "Built 3 variants. Running A/B/C backtest.", ts: now },
      ],
      default_model: "gpt-5o",
      artifacts: [],
      finalStatus: "in-progress",
      tasks: [
        {
          id: "t3",
          label: "Velocity Tuning",
          status: "running",
          sub: [
            { id: "s1", name: "Assemble cohorts", concurrent: true, pct: 30, done: false, approvalNeeded: false },
            { id: "s2", name: "Compute deltas", concurrent: true, pct: 20, done: false, approvalNeeded: false },
            { id: "s3", name: "Select winning variant", concurrent: false, pct: 0, done: false, approvalNeeded: true, approvalType: "accept", approved: null, previewId: "preview_variant_s3" },
          ],
        },
      ],
    },
  ];
}
function loadChats() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : seedChats();
  } catch {
    return seedChats();
  }
}
function saveChats(list) {
  localStorage.setItem(DB_KEY, JSON.stringify(list));
}
function loadProjects() {
  try {
    const raw = localStorage.getItem(DB_PROJ);
    return raw ? JSON.parse(raw) : ["Alert Review Automation Q&A", "Q3 Velocity Feature Development"];
  } catch {
    return ["Alert Review Automation Q&A"];
  }
}
function saveProjects(list) {
  localStorage.setItem(DB_PROJ, JSON.stringify(list));
}

/* ============================= Page ============================= */

export default function ChatManagement() {
  const [adminMode, setAdminMode] = useState(true);
  const [leftOpen, setLeftOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [chats, setChats] = useState(loadChats);
  const [projects, setProjects] = useState(loadProjects);

  // Search state (now visible in Chat History header)
  const [query, setQuery] = useState("");

  // Removed filters/sections UI; keep minimal defaults
  const [filters] = useState({ userId: "", agent: "", dateFrom: "", dateTo: "", resultStatus: "" });
  const [section] = useState("my");
  const [activeProject] = useState("all");
  const [selectedId, setSelectedId] = useState((loadChats()[0] || {}).id || null);

  // Preview panel open/closed
  const [previewOpen, setPreviewOpen] = useState(true);
  const [preview, setPreview] = useState(null); // { chatId, taskId, subId, kind, title, content, deepLink }

  // background task simulation (unchanged)
  useEffect(() => {
    const intv = setInterval(() => {
      setChats((prev) => {
        let changed = false;
        const list = prev.map((c) => {
          const copy = structuredClone(c);
          copy.tasks?.forEach((task) => {
            if (task.status === "done") return;

            // progress concurrent subs anytime status is running
            task.sub.forEach((s) => {
              if (task.status !== "running") return;
              if (s.done) return;
              const step = s.concurrent ? 10 + Math.random() * 12 : 0;
              if (step > 0) {
                s.pct = Math.min(100, s.pct + step);
                if (s.pct >= 100) {
                  s.pct = 100;
                  s.done = true;
                  if (s.approvalNeeded && s.approved == null) task.status = "awaiting-approval";
                }
              }
            });

            // chain serial subs after concurrent ones complete
            const firstSerialIdx = task.sub.findIndex((x) => !x.concurrent);
            if (firstSerialIdx >= 0) {
              for (let i = firstSerialIdx; i < task.sub.length; i++) {
                const s = task.sub[i];
                const prevDone = i === firstSerialIdx ? task.sub.slice(0, firstSerialIdx).every(x => x.done) : task.sub[i - 1].done;
                if (!prevDone) break;
                if (!s.done && task.status === "running") {
                  s.pct = Math.min(100, s.pct + (6 + Math.random() * 10));
                  if (s.pct >= 100) {
                    s.pct = 100;
                    s.done = true;
                    if (s.approvalNeeded && s.approved == null) {
                      task.status = "awaiting-approval";
                    }
                  }
                  break; // only one serial step increments at a time
                }
              }
            }

            // done if all complete & no pending approvals
            const pendingApproval = task.sub.some(
              (x) => x.approvalNeeded && x.done && x.approved == null
            );
            if (task.sub.every((x) => x.done) && !pendingApproval) {
              task.status = 'done';
              copy.finalStatus = 'done';
            }
          });
          if (JSON.stringify(copy) !== JSON.stringify(c)) {
            copy.updatedAt = new Date().toISOString();
            changed = true;
          }
          return copy;
        });
        if (changed) saveChats(list);
        return list;
      });
    }, 700);
    return () => clearInterval(intv);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
    const to = filters.dateTo ? new Date(filters.dateTo) : null;
    return chats
      .filter((c) => {
        if (!adminMode && c.userId !== CURRENT_USER) return false;
        if (section === "my" && c.userId !== CURRENT_USER) return false;
        if (activeProject !== "all" && c.project !== activeProject) return false;
        if (from && new Date(c.updatedAt) < from) return false;
        if (to && new Date(c.updatedAt) > to) return false;

        if (!q) return true;
        // Search title + transcript text
        const hay = [
          c.title,
          ...(c.transcript || []).map((t) => t.text),
        ].join(" ").toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [chats, query, filters, section, activeProject, adminMode]);

  const selected = filtered.find((c) => c.id === selectedId) || filtered[0] || null;

  const updateChat = (id, patch) => {
    setChats((prev) => {
      const list = prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
      saveChats(list);
      return list;
    });
  };

  // Create a brand-new chat (New Chat button)
  const createNewChat = () => {
    const now = new Date().toISOString();
    const id = `c_${Math.random().toString(36).slice(2, 8)}`;
    const newChat = {
      id,
      title: "New Chat",
      createdAt: now,
      updatedAt: now,
      userId: CURRENT_USER,
      isStarred: false,
      isShared: false,
      project: "Alert Review Automation Q&A",
      agents: [],
      transcript: [{ who: "bot", text: "How can I help? Ask me to retrieve data, draft rules, generate features, or run a backtest.", ts: now }],
      default_model: "gpt-5o",
      artifacts: [],
      finalStatus: "in-progress",
      tasks: [],
    };
    const list = [newChat, ...chats];
    setChats(list);
    saveChats(list);
    setSelectedId(id);
  };

  const handleOpenPreview = (p) => {
    setPreviewOpen(true);
    setPreview(p);
  };

  // Grid columns change when preview is collapsed
  const gridCols = previewOpen
    ? "grid grid-cols-[auto_auto_minmax(420px,1fr)_minmax(420px,1.1fr)]"
    : "grid grid-cols-[auto_auto_minmax(420px,1.1fr)]";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Header */}
      <header className="h-12 border-b bg-white flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-indigo-600">DataVisor</span>
          <span className="text-slate-400">/</span>
          <span>Chat Management</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <User2 className="w-4 h-4" />
            <span>{CURRENT_USER}</span>
          </label>
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" checked={adminMode} onChange={(e) => setAdminMode(e.target.checked)} />
            Admin mode
          </label>
        </div>
      </header>

      {/* Body */}
      <div className={`flex-1 ${gridCols}`}>
        {/* Left Rail: Platform tabs (static) */}
        <aside className={`${leftOpen ? "w-64" : "w-8"} transition-all border-r bg-white overflow-hidden`}>
          <div className="h-10 border-b flex items-center justify-between px-2 text-sm">
            <span className="font-medium">{leftOpen ? "Platform" : ""}</span>
            <button className="text-slate-500" onClick={() => setLeftOpen((s) => !s)}>
              {leftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {leftOpen && (
            <div className="p-2 space-y-1">
              <div className="px-2 py-1.5 rounded border bg-white text-sm">Insights Center</div>
              <div className="px-2 py-1.5 rounded border bg-white text-sm">Data Studio</div>
              <div className="px-2 py-1.5 rounded border bg-white text-sm">Feature Platform</div>
              <div className="px-2 py-1.5 rounded border bg-white text-sm">Rules Engine</div>
              <div className="px-2 py-1.5 rounded border bg-indigo-600 text-white text-sm">Chats</div>
            </div>
          )}
        </aside>

        {/* Chat History (with search; cleaner rows) */}
        <section className={`${historyOpen ? "w-[360px]" : "w-8"} transition-all border-r bg-white overflow-hidden`}>
          <div className="h-10 border-b flex items-center justify-between px-2 text-sm">
            <span className="font-medium">{historyOpen ? `Chats (${filtered.length})` : ""}</span>
            <div className="flex items-center gap-2">
              {historyOpen && (
                <button
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border bg-indigo-600 text-white hover:brightness-95"
                  onClick={createNewChat}
                  title="Create a new chat"
                >
                  <Plus className="w-3 h-3" /> New Chat
                </button>
              )}
              <button className="text-slate-500" onClick={() => setHistoryOpen((s) => !s)}>
                {historyOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {historyOpen && (
            <div>
              {/* Search box */}
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" />
                  <input
                    className="w-full border rounded pl-8 pr-2 py-1.5 text-sm"
                    placeholder="Search chats…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Updated label */}
              <div className="px-3 py-2 text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated
              </div>

              {/* Cleaner list rows */}
              {filtered.map((c) => {
                const active = c.id === selectedId;
                const lastLine = (c.transcript?.[c.transcript.length - 1]?.text || "").replace(/\s+/g, " ");
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-3 py-2 border-b hover:bg-slate-50 ${active ? "bg-indigo-50" : "bg-white"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-slate-800 text-sm truncate">{c.title}</div>
                      <div className="text-xs text-slate-500 ml-2 shrink-0">{new Date(c.updatedAt).toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {lastLine}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && <div className="p-4 text-sm text-slate-500">No chats.</div>}
            </div>
          )}
        </section>

        {/* Middle: Review / Preview window */}
        {previewOpen && (
          <section className="bg-white border-r flex flex-col">
            <div className="h-10 border-b px-3 flex items-center justify-between">
              <div className="font-medium text-sm">Review / Preview</div>
              <div className="flex items-center gap-2">
                {preview && (
                  <a href={preview.deepLink || "#"} className="text-xs text-indigo-600 inline-flex items-center gap-1" target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4" /> View in Platform
                  </a>
                )}
                <button
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50"
                  onClick={() => { setPreview(null); setPreviewOpen(false); }}
                  title="Close preview panel"
                >
                  <X className="w-3 h-3" /> Close
                </button>
              </div>
            </div>

            {preview ? (
              <div className="p-3 space-y-3">
                <div className="text-sm text-slate-500">Previewing: <span className="font-medium text-slate-700">{preview.title}</span></div>
                <div className="border rounded p-3 bg-slate-50 text-sm min-h-[200px]">
                  <pre className="whitespace-pre-wrap text-slate-800">{preview.content}</pre>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const kind = preview.kind; // "rule" | "feature" | "contact"
                      const id = `${kind}-${Math.random().toString(36).slice(2, 8)}`;
                      const url = kind === "feature" ? `#/feature/${id}` : kind === "contact" ? `#/contact/${id}` : `#/rule/${id}`;
                      const copy = structuredClone(chats);
                      const chatIdx = copy.findIndex((c) => c.id === preview.chatId);
                      if (chatIdx >= 0) {
                        copy[chatIdx].artifacts = [
                          ...(copy[chatIdx].artifacts || []),
                          { id, kind, name: `${kind.toUpperCase()} ${id}`, url, ts: new Date().toISOString() },
                        ];
                        saveChats(copy);
                        setChats(copy);
                      }
                      alert(`Saved to platform as ${kind.toUpperCase()} ${id}`);
                      setPreview({ ...preview, deepLink: url }); // show link
                    }}
                  >
                    Save
                  </button>
                  <button className="btn btn-ghost" onClick={() => setPreview(null)}>Close Preview</button>
                </div>
              </div>
            ) : (
              <div className="m-auto text-slate-500 text-sm">Select a sub-agent result to preview (from the right panel).</div>
            )}
          </section>
        )}

        {/* Right: Chat Detail + Orchestration */}
        <section className="bg-white flex flex-col">
          {selected ? (
            <ChatDetail
              chat={selected}
              onUpdate={(patch) => updateChat(selected.id, patch)}
              onOpenPreview={handleOpenPreview}
            />
          ) : (
            <div className="m-auto text-slate-500">Select a chat to view details</div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ========================= Chat Detail ========================= */

function ChatDetail({ chat, onUpdate, onOpenPreview }) {
  const [input, setInput] = useState("");
  const scroller = useRef(null);

  // UI state: expanded flags per sub-agent and per-agent input values
  const [expandedSubs, setExpandedSubs] = useState(() => ({}));   // { [subId]: boolean }
  const [agentInputs, setAgentInputs] = useState(() => ({}));     // { [subId]: string }

  // Gather all approved sub-tasks that have previewId (rules/features)
  const readyPreviewSubs = [];
  (chat.tasks || []).forEach((task) => {
    task.sub.forEach((sub) => {
      if (sub.approved === true && sub.previewId) {
        readyPreviewSubs.push({ taskId: task.id, sub });
      }
    });
  });

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [chat]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const ts = new Date().toISOString();
    const transcript = [...(chat.transcript || []), { who: "user", text, ts }];
    onUpdate({ transcript, updatedAt: ts });
    setInput("");

    setTimeout(() => {
      const transcript2 = [...transcript, { who: "bot", text: "Acknowledged. Sub-agents queued as needed.", ts: new Date().toISOString() }];
      onUpdate({ transcript: transcript2 });
    }, 500);
  };

  // Helper: basic "thinking process" text for demo
  const getThinking = (sub) => {
    if (sub.name.startsWith("Fetch FN")) {
      return [
        "- Querying FN table for last 14 days",
        "- Joining device + IP + auth signals",
        "- Sampling 1k cases for vectorization summary"
      ].join("\n");
    }
    if (sub.name.startsWith("Derive Fraud Pattern")) {
      return [
        "- Embedding event text + rules into vector space",
        "- HDBSCAN clusters → 7 candidate groups",
        "- Notable signal: burst from /24 with device rotation"
      ].join("\n");
    }
    if (sub.name.startsWith("Draft Hypothesis Rules")) {
      return [
        "- Compose rule predicates from top SHAP contributors",
        "- Constraint: recall ≥ 0.6, precision ≥ 0.6 on FN",
        "- Draft 3 variants for backtest"
      ].join("\n");
    }
    if (sub.name.startsWith("Backtest Rules")) {
      return [
        "- Running replay against 30d holdout",
        "- Comparing lift vs baseline",
        "- Recording precision/recall/F1"
      ].join("\n");
    }
    if (sub.name.startsWith("Generate Features")) {
      return [
        "- Mining high-gain aggregates",
        "- Validating null/latency budgets",
        "- Emitting feature specs for approval"
      ].join("\n");
    }
    if (sub.name.startsWith("Create Rules")) {
      return [
        "- Converting approved predicates to DSL",
        "- Assigning severities/actions",
        "- Preparing rollout plan"
      ].join("\n");
    }
    return "- Analyzing inputs…\n- Generating outputs…";
  };

  // Handle sub-agent approval
  const setApproval = (taskId, subId, decision) => {
    const copy = structuredClone(chat);
    const t = copy.tasks.find((x) => x.id === taskId);
    const s = t?.sub.find((x) => x.id === subId);
    if (!s) return;
    s.approved = decision;

    const pending = t.sub.some(
      (x) => x.approvalNeeded && x.done && x.approved == null
    );

    if (!pending) {
      t.status = t.sub.every((x) => x.done) ? 'done' : 'running';
    }

    onUpdate({ tasks: copy.tasks });
  };

  const openPreview = (taskId, sub) => {
    let content = "";
    if (sub.name.startsWith("Draft Hypothesis Rules")) {
      content = `// Example fraud rule draft
{
  "pattern": "Multiple transactions from same IP",
  "rule": "If >3 transactions from same IP within 10 minutes, flag account",
  "notes": "Combines burst frequency and IP concentration"
}`;
    } else if (sub.name.startsWith("Generate Features")) {
      content = `// Example feature definitions
{
  "features": [
    { "name": "tx_count_last_hour", "description": "Transactions in past hour" },
    { "name": "avg_tx_amount_24h", "description": "Average transaction amount in 24h" },
    { "name": "unique_ip_count_24h", "description": "Distinct IPs used in 24h" }
  ]
}`;
    } else if (sub.name.startsWith("Create Rules")) {
      content = `// Example finalized rule
{
  "rule_id": "rule_${sub.id}_1",
  "condition": "tx_count_last_hour > 3 && unique_ip_count_24h > 1",
  "action": "Flag for manual review"
}`;
    } else {
      content = `// Preview — ${sub.name}\n${JSON.stringify({ note: 'No specific example defined' }, null, 2)}`;
    }

    onOpenPreview({
      chatId: chat.id,
      taskId,
      subId: sub.id,
      kind:
        sub.name.startsWith("Generate Features") ? "feature" :
        sub.name.startsWith("Create Rules") ? "rule" :
        sub.name.toLowerCase().includes("contact") ? "contact" :
        "rule",
      title: sub.name,
      content,
      deepLink: null,
    });
  };

  // Per-agent input sender
  const sendAgentInput = (taskId, sub) => {
    const note = (agentInputs[sub.id] || "").trim();
    if (!note) return;
    const ts = new Date().toISOString();
    const transcript = [
      ...(chat.transcript || []),
      { who: "user", text: `(To ${sub.name}) ${note}`, ts }
    ];
    onUpdate({ transcript, updatedAt: ts });
    setAgentInputs((m) => ({ ...m, [sub.id]: "" }));
  };

  return (
    <>
      {/* Conversation header */}
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-800">{chat.title}</div>
          <div className="text-xs text-slate-500">
            {chat.userId} • Updated {new Date(chat.updatedAt).toLocaleString()} • Model: {chat.default_model}
          </div>
        </div>
      </div>

      {/* Orchestration + approvals (simplified status, expandable agents) */}
      <div className="px-3 py-2 border-b bg-slate-50">
        <div className="text-xs text-slate-600 mb-2">Agent Orchestration</div>
        <div className="space-y-3">
          {(chat.tasks || []).map((t) => (
            <div key={t.id} className="border rounded p-2 bg-white">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-xs">
                  {t.status === "running" && (
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Loader2 className="w-3 h-3 animate-spin" /> Running
                    </span>
                  )}
                  {t.status === "awaiting-approval" && <span className="text-amber-700">Awaiting Approval</span>}
                  {t.status === "done" && (
                    <span className="text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Finished
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {t.sub.map((s) => {
                  const [expanded, setExpanded] = [
                    !!expandedSubs[s.id],
                    (val) => setExpandedSubs((m) => ({ ...m, [s.id]: typeof val === "boolean" ? val : !m[s.id] }))
                  ];
                  const statusLabel = s.done ? "Finished" : "Running";
                  return (
                    <div key={s.id} className="border rounded">
                      {/* Row header */}
                      <div className="p-2 flex items-center justify-between">
                        <div className="text-xs text-slate-700 inline-flex items-center gap-2">
                          <button
                            className="inline-flex items-center justify-center w-5 h-5 border rounded hover:bg-slate-50"
                            onClick={() => setExpanded()}
                            title={expanded ? "Collapse" : "Expand"}
                          >
                            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {s.done ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Circle className="w-3 h-3 text-slate-400" />}
                          <span className="font-medium">{s.name}</span>
                          {s.concurrent && <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 border">concurrent</span>}
                        </div>
                        <div className="text-[11px] text-slate-500">{statusLabel}</div>
                      </div>

                      {/* Expanded details */}
                      {expanded && (
                        <div className="p-2 border-t bg-slate-50">
                          <div className="text-[11px] text-slate-600 mb-1 font-medium">Thinking process</div>
                          <pre className="text-xs text-slate-800 whitespace-pre-wrap bg-white border rounded p-2">
                            {getThinking(s)}
                          </pre>

                          <div className="mt-2">
                            <div className="text-[11px] text-slate-600 mb-1 font-medium">Additional input (optional)</div>
                            <div className="flex items-center gap-2">
                              <input
                                className="flex-1 border rounded px-2 py-1 text-xs"
                                placeholder={`Add guidance for "${s.name}"…`}
                                value={agentInputs[s.id] || ""}
                                onChange={(e) => setAgentInputs((m) => ({ ...m, [s.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && sendAgentInput(t.id, s)}
                              />
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => sendAgentInput(t.id, s)}
                              >
                                Send
                              </button>
                            </div>
                          </div>

                          {/* Approval actions & Preview */}
                          {s.approvalNeeded && s.done && (
                            <div className="mt-2 p-2 bg-white border rounded text-xs">
                              <div className="font-medium text-slate-700 mb-1">
                                {s.approvalType === "approve" ? "Approval required" : "Accept required"}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {s.approvalType === "approve" ? (
                                  <>
                                    <button className={`btn ${s.approved === true ? "btn-primary" : "btn-ghost"}`} onClick={() => setApproval(t.id, s.id, true)}>
                                      Approve
                                    </button>
                                    <button className={`btn ${s.approved === false ? "btn-primary" : "btn-ghost"}`} onClick={() => setApproval(t.id, s.id, false)}>
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button className={`btn ${s.approved === true ? "btn-primary" : "btn-ghost"}`} onClick={() => setApproval(t.id, s.id, true)}>
                                      Accept
                                    </button>
                                    <button className={`btn ${s.approved === false ? "btn-primary" : "btn-ghost"}`} onClick={() => setApproval(t.id, s.id, false)}>
                                      Decline
                                    </button>
                                  </>
                                )}
                                {s.approved === true && s.previewId && (
                                  <button className="btn btn-ghost inline-flex items-center gap-1" onClick={() => openPreview(t.id, s)}>
                                    <FileText className="w-4 h-4" /> Preview
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick access: Ready previews */}
      {readyPreviewSubs.length > 0 && (
        <div className="px-3 py-2 border-b bg-white">
          <span className="text-xs font-medium text-slate-600">Ready to Preview:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {readyPreviewSubs.map(({ taskId, sub }) => (
              <button
                key={sub.id}
                className="btn btn-ghost btn-xs inline-flex items-center gap-1"
                onClick={() => openPreview(taskId, sub)}
              >
                <FileText className="w-3 h-3" />
                Preview {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 overflow-auto" ref={scroller}>
        <div className="p-3 space-y-2">
          {(chat.transcript || []).map((m, i) => (
            <Bubble key={i} who={m.who} text={m.text} ts={m.ts} />
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t p-2">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="Ask: retrieve FN cases, propose pattern, test rules, generate features…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="btn btn-primary inline-flex items-center gap-1" onClick={send}>
            <Play className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </>
  );
}

/* ======================== UI helpers ========================= */

function Bubble({ who, text, ts }) {
  const mine = who === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] text-sm px-3 py-2 rounded-lg border shadow-sm ${mine ? "bg-indigo-600 text-white border-indigo-600" : "bg-white"}`}>
        <div>{text}</div>
        <div className={`mt-1 text-[10px] ${mine ? "text-indigo-100" : "text-slate-500"}`}>{new Date(ts).toLocaleString()}</div>
      </div>
    </div>
  );
}
