import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Star, StarOff, Share2, FolderPlus, Clock, User2, Filter, CheckCircle2,
  Circle, Loader2, Play, FileText, FlaskConical, Wand2, ShieldCheck, ExternalLink
} from "lucide-react";

/**
 * Chat Management System (CMS)
 * - Persistent chat history (localStorage mock DB)
 * - Full-text search & filters (user, agent, date range, status)
 * - Projects/Folders & "Shared with me"
 * - Admin mode: see all users; user mode: own chats only
 * - Conversation detail: transcript + concurrent sub-agents with approvals
 * - Entity Preview buttons & platform deep links after "Save"
 *
 * Fraud Pattern Analysis scenario included as a sample chat with multiple
 * concurrent/serial sub-agents: retrieve FN events, derive pattern, test rules, create artifacts.
 */

const DB_KEY = "dv.cms.chats.v1";
const DB_PROJ = "dv.cms.projects.v1";
const CURRENT_USER = "jeremy.chen@datavisor.com"; // mock current user

// --- seed data (one fraud-pattern analysis chat) ---
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
      tasks: [
        {
          id: "t1",
          label: "Fraud Pattern Analysis",
          status: "running", // running | awaiting-approval | done
          // sub-agents may run serially or concurrently
          sub: [
            { id: "s1", name: "Fetch FN Events (last 14d)", concurrent: true, pct: 0, done: false, approvalNeeded: false },
            { id: "s2", name: "Derive Fraud Pattern (embedding + clustering)", concurrent: true, pct: 0, done: false, approvalNeeded: false },
            { id: "s3", name: "Hypothesis Rules (draft)", concurrent: false, pct: 0, done: false, approvalNeeded: true, approved: null, previewUrl: null, savedUrl: null },
            { id: "s4", name: "Backtest Rules", concurrent: false, pct: 0, done: false, approvalNeeded: false, result: { lift: "+42%", precision: "0.71", recall: "0.63" } },
            { id: "s5", name: "Generate Features (if threshold met)", concurrent: false, pct: 0, done: false, approvalNeeded: true, approved: null, previewUrl: null, savedUrl: null },
            { id: "s6", name: "Create Rules (if threshold met)", concurrent: false, pct: 0, done: false, approvalNeeded: true, approved: null, previewUrl: null, savedUrl: null },
          ],
          approvalsOpen: true,
        },
      ],
      default_model: "gpt-5o",
      artifacts: [], // links we add when entities are saved
      finalStatus: "in-progress",
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
      tasks: [],
      default_model: "gpt-5o-mini",
      artifacts: [],
      finalStatus: "done",
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
  const [adminMode, setAdminMode] = useState(true); // admin can see all users
  const [chats, setChats] = useState(loadChats);
  const [projects, setProjects] = useState(loadProjects);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ userId: "", agent: "", dateFrom: "", dateTo: "", resultStatus: "" });
  const [section, setSection] = useState("my"); // my | shared | starred | all
  const [activeProject, setActiveProject] = useState("all");
  const [selectedId, setSelectedId] = useState(chats[0]?.id || null);

  // simulate sub-agent progress for running tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setChats((prev) => {
        let changed = false;
        const list = prev.map((c) => {
          const copy = structuredClone(c);
          copy.tasks?.forEach((task) => {
            if (task.status !== "running") return;
            task.sub.forEach((s) => {
              // concurrent subs (s1, s2) progress together
              if (s.done) return;
              const step = Math.random() < 0.7 ? 8 + Math.random() * 12 : 0; // jitter
              s.pct = Math.min(100, s.pct + step);
              if (s.pct >= 100) {
                s.pct = 100;
                s.done = true;
                // move to next serial sub-step only when previous is done
              }
            });

            // if s1 & s2 done, start s3; then s4; then s5; then s6
            const idx3 = task.sub.findIndex((x) => x.id === "s3");
            const s1Done = task.sub.find((x) => x.id === "s1")?.done;
            const s2Done = task.sub.find((x) => x.id === "s2")?.done;
            if (s1Done && s2Done) {
              // ensure serial steps progress sequentially
              for (let i = idx3; i < task.sub.length; i++) {
                const s = task.sub[i];
                const prevDone = i === idx3 ? true : task.sub[i - 1].done;
                if (!prevDone) break;
                if (!s.done) {
                  s.pct = Math.min(100, s.pct + (6 + Math.random() * 10));
                  if (s.pct >= 100) {
                    s.pct = 100;
                    s.done = true;
                    // when a draft entity is done and needs approval, open approvals
                    if (s.approvalNeeded && s.approved == null) {
                      task.status = "awaiting-approval";
                    }
                  }
                  break; // only one active serial step at a time
                }
              }
            }

            // if all sub done and approvals handled, mark task done
            if (task.sub.every((x) => x.done) && !task.sub.some((x) => x.approvalNeeded && x.approved == null)) {
              task.status = "done";
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
    }, 650);
    return () => clearInterval(interval);
  }, []);

  const allAgents = useMemo(() => [...new Set(chats.flatMap((c) => c.agents || []))], [chats]);
  const allUsers = useMemo(() => [...new Set(chats.map((c) => c.userId))], [chats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
    const to = filters.dateTo ? new Date(filters.dateTo) : null;

    return chats
      .filter((c) => {
        if (!adminMode && c.userId !== CURRENT_USER) return false;
        if (section === "my" && c.userId !== CURRENT_USER) return false;
        if (section === "shared" && !c.isShared) return false;
        if (section === "starred" && !c.isStarred) return false;
        if (activeProject !== "all" && c.project !== activeProject) return false;

        if (filters.userId && c.userId !== filters.userId) return false;
        if (filters.agent && !(c.agents || []).includes(filters.agent)) return false;
        if (filters.resultStatus) {
          const map = { "In Progress": "in-progress", "Done": "done" };
          if (c.finalStatus !== map[filters.resultStatus]) return false;
        }
        if (from && new Date(c.updatedAt) < from) return false;
        if (to && new Date(c.updatedAt) > to) return false;

        if (!q) return true;
        const hay = [
          c.title,
          c.userId,
          ...(c.transcript || []).map((t) => t.text),
          ...(c.agents || []),
          ...(c.artifacts || []).map((a) => a.name),
        ]
          .join(" ")
          .toLowerCase();
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

  const toggleStar = (c) => updateChat(c.id, { isStarred: !c.isStarred });
  const toggleShare = (c) => updateChat(c.id, { isShared: !c.isShared });

  const addProject = () => {
    const name = prompt("New project/folder name");
    if (!name) return;
    const list = [...new Set([...projects, name])];
    setProjects(list);
    saveProjects(list);
  };

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

      {/* Body 3-col */}
      <div className="flex-1 grid grid-cols-[260px_minmax(360px,1fr)_minmax(420px,1.2fr)]">
        {/* Left: filters/projects/sections */}
        <aside className="border-r bg-white p-3 space-y-3">
          <div className="text-xs font-medium text-slate-500">Search</div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" />
            <input
              className="w-full border rounded pl-8 pr-2 py-1.5 text-sm"
              placeholder="Find chats, agents, artifacts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="text-xs font-medium text-slate-500 mt-4 flex items-center justify-between">
            <span>Filters</span>
            <Filter className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-2">
            <select
              className="w-full border rounded px-2 py-1.5 text-sm"
              value={filters.userId}
              onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
            >
              <option value="">User (any)</option>
              {allUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <select
              className="w-full border rounded px-2 py-1.5 text-sm"
              value={filters.agent}
              onChange={(e) => setFilters((f) => ({ ...f, agent: e.target.value }))}
            >
              <option value="">Agent (any)</option>
              {allAgents.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="border rounded px-2 py-1.5 text-sm"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              />
              <input
                type="date"
                className="border rounded px-2 py-1.5 text-sm"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              />
            </div>
            <select
              className="w-full border rounded px-2 py-1.5 text-sm"
              value={filters.resultStatus}
              onChange={(e) => setFilters((f) => ({ ...f, resultStatus: e.target.value }))}
            >
              <option value="">Status (any)</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
          </div>

          <div className="text-xs font-medium text-slate-500 mt-4 flex items-center justify-between">
            <span>Projects</span>
            <button className="text-xs text-indigo-600 inline-flex items-center gap-1" onClick={addProject}>
              <FolderPlus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="space-y-1">
            <button
              className={`w-full text-left px-2 py-1.5 rounded text-sm border ${activeProject === "all" ? "bg-indigo-50 border-indigo-200" : "border-slate-200"}`}
              onClick={() => setActiveProject("all")}
            >
              All
            </button>
            {projects.map((p) => (
              <button
                key={p}
                className={`w-full text-left px-2 py-1.5 rounded text-sm border ${activeProject === p ? "bg-indigo-50 border-indigo-200" : "border-slate-200"}`}
                onClick={() => setActiveProject(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="text-xs font-medium text-slate-500 mt-4">Sections</div>
          <div className="space-y-1">
            <button
              className={`w-full text-left px-2 py-1.5 rounded text-sm border ${section === "my" ? "bg-indigo-50 border-indigo-200" : "border-slate-200"}`}
              onClick={() => setSection("my")}
            >
              My Chats
            </button>
            <button
              className={`w-full text-left px-2 py-1.5 rounded text-sm border ${section === "shared" ? "bg-indigo-50 border-indigo-200" : "border-slate-200"}`}
              onClick={() => setSection("shared")}
            >
              Shared with Me
            </button>
            <button
              className={`w-full text-left px-2 py-1.5 rounded text-sm border ${section === "starred" ? "bg-indigo-50 border-indigo-200" : "border-slate-200"}`}
              onClick={() => setSection("starred")}
            >
              Starred
            </button>
            {adminMode && (
              <button
                className={`w-full text-left px-2 py-1.5 rounded text-sm border ${section === "all" ? "bg-indigo-50 border-indigo-200" : "border-slate-200"}`}
                onClick={() => setSection("all")}
              >
                All (Admin)
              </button>
            )}
          </div>
        </aside>

        {/* Middle: chat list */}
        <section className="border-r bg-white overflow-auto">
          <div className="px-3 py-2 border-b text-sm text-slate-600 flex items-center justify-between">
            <span>Chats ({filtered.length})</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Clock className="w-3 h-3" /> Updated</span>
          </div>

          <div>
            {filtered.map((c) => {
              const active = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left px-3 py-2 border-b hover:bg-slate-50 ${active ? "bg-indigo-50" : "bg-white"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-800 text-sm line-clamp-1">{c.title}</div>
                    <div className="text-xs text-slate-500">{new Date(c.updatedAt).toLocaleString()}</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {(c.transcript?.[c.transcript.length - 1]?.text || "").slice(0, 140)}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 border text-slate-700">{c.userId}</span>
                    {(c.agents || []).slice(0, 3).map((a) => (
                      <span key={a} className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700">{a}</span>
                    ))}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && <div className="p-4 text-sm text-slate-500">No chats match filters.</div>}
          </div>
        </section>

        {/* Right: chat detail */}
        <section className="bg-white flex flex-col">
          {selected ? (
            <ChatDetail
              chat={selected}
              onUpdate={(patch) => updateChat(selected.id, patch)}
              onToggleStar={() => toggleStar(selected)}
              onToggleShare={() => toggleShare(selected)}
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

function ChatDetail({ chat, onUpdate, onToggleStar, onToggleShare }) {
  const [input, setInput] = useState("");
  const scroller = useRef(null);

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

    // echo bot (mock)
    setTimeout(() => {
      const transcript2 = [...transcript, { who: "bot", text: "Acknowledged. Sub-agents queued as needed.", ts: new Date().toISOString() }];
      onUpdate({ transcript: transcript2 });
    }, 500);
  };

  // Approve individual sub-agent output
  const approveOne = (taskId, subId, approve) => {
    const copy = structuredClone(chat);
    const t = copy.tasks.find((x) => x.id === taskId);
    if (!t) return;
    const s = t.sub.find((x) => x.id === subId);
    if (!s) return;
    s.approved = approve;
    // if approved AND it's an entity creation step, enable preview, then allow save
    if (approve && (s.name.startsWith("Generate Features") || s.name.startsWith("Create Rules"))) {
      s.previewUrl = `#/preview/${subId}`;
    }
    // if no more pending approvals, resume task
    if (!t.sub.some((x) => x.approvalNeeded && x.approved == null)) {
      t.status = t.sub.every((x) => x.done) ? "done" : "running";
    }
    onUpdate({ tasks: copy.tasks });
  };

  const approveAll = () => {
    const copy = structuredClone(chat);
    copy.tasks.forEach((t) => {
      t.sub.forEach((s) => {
        if (s.approvalNeeded && s.approved == null) {
          s.approved = true;
          s.previewUrl = s.previewUrl || `#/preview/${s.id}`;
        }
      });
      t.status = t.sub.every((x) => x.done) ? "done" : "running";
    });
    onUpdate({ tasks: copy.tasks });
  };

  const saveEntity = (taskId, subId, kind) => {
    const copy = structuredClone(chat);
    const t = copy.tasks.find((x) => x.id === taskId);
    const s = t?.sub.find((x) => x.id === subId);
    if (!s) return;
    const id = `${kind}-${Math.random().toString(36).slice(2, 8)}`;
    // simulate platform URL
    const savedUrl = kind === "feature" ? `#/feature/${id}` : `#/rule/${id}`;
    s.savedUrl = savedUrl;
    copy.artifacts = [
      ...(copy.artifacts || []),
      { id, kind, name: `${kind.toUpperCase()} ${id}`, url: savedUrl, ts: new Date().toISOString() },
    ];
    onUpdate({ tasks: copy.tasks, artifacts: copy.artifacts });
  };

  return (
    <>
      {/* Title bar */}
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-800">{chat.title}</div>
          <div className="text-xs text-slate-500">
            {chat.userId} • Updated {new Date(chat.updatedAt).toLocaleString()} • Model: {chat.default_model}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost text-xs" onClick={onToggleShare}>
            <Share2 className="w-4 h-4" /> {chat.isShared ? "Unshare" : "Share"}
          </button>
          <button className="btn btn-ghost text-xs" onClick={onToggleStar}>
            {chat.isStarred ? <Star className="w-4 h-4 text-amber-500" /> : <StarOff className="w-4 h-4" />}
            {chat.isStarred ? " Starred" : " Star"}
          </button>
        </div>
      </div>

      {/* Agent run status + approvals */}
      <div className="px-3 py-2 border-b bg-slate-50">
        <div className="text-xs text-slate-600 mb-2">Agent Orchestration</div>
        <div className="space-y-3">
          {(chat.tasks || []).map((t) => (
            <div key={t.id} className="border rounded p-2 bg-white">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-xs">
                  {t.status === "running" && (
                    <span className="inline-flex items-center gap-1 text-slate-600"><Loader2 className="w-3 h-3 animate-spin" /> Running</span>
                  )}
                  {t.status === "awaiting-approval" && <span className="text-amber-700">Awaiting Approval</span>}
                  {t.status === "done" && <span className="text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Done</span>}
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {t.sub.map((s) => (
                  <div key={s.id} className="border rounded p-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-700 inline-flex items-center gap-2">
                        {s.done ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Circle className="w-3 h-3 text-slate-400" />}
                        {s.name} {s.concurrent && <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 border">concurrent</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">{Math.round(s.pct)}%</div>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded mt-1">
                      <div className={`h-1.5 rounded ${s.done ? "bg-emerald-600" : "bg-indigo-600"}`} style={{ width: `${s.pct}%` }} />
                    </div>

                    {/* Approval panel if needed */}
                    {s.approvalNeeded && s.done && (
                      <div className="mt-2 p-2 bg-amber-50 border rounded text-xs">
                        <div className="font-medium text-amber-800 mb-1">Approval required</div>
                        <div className="flex items-center gap-2">
                          <button className={`btn ${s.approved === true ? "btn-primary" : "btn-ghost"}`} onClick={() => approveOne(t.id, s.id, true)}>
                            Approve
                          </button>
                          <button className={`btn ${s.approved === false ? "btn-primary" : "btn-ghost"}`} onClick={() => approveOne(t.id, s.id, false)}>
                            Reject
                          </button>
                          {/* Preview and Save */}
                          {s.approved === true && (
                            <>
                              <button className="btn btn-ghost inline-flex items-center gap-1" onClick={() => window.alert("Open Preview window")}>
                                <FileText className="w-4 h-4" /> Preview
                              </button>
                              <button
                                className="btn btn-primary inline-flex items-center gap-1"
                                onClick={() =>
                                  saveEntity(t.id, s.id, s.name.startsWith("Generate Features") ? "feature" : "rule")
                                }
                              >
                                <ShieldCheck className="w-4 h-4" /> Save
                              </button>
                            </>
                          )}
                          {s.savedUrl && (
                            <a
                              href={s.savedUrl}
                              className="text-indigo-600 inline-flex items-center gap-1 ml-auto"
                              title="Open in DataVisor platform"
                            >
                              <ExternalLink className="w-4 h-4" /> View in Platform
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Approve all (if any pending) */}
              {t.sub.some((x) => x.approvalNeeded && x.approved == null) && (
                <div className="mt-2 flex justify-end">
                  <button className="btn btn-primary inline-flex items-center gap-1" onClick={approveAll}>
                    <CheckCircle2 className="w-4 h-4" /> Approve All
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
