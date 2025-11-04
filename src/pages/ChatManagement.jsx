import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Star, StarOff, Share2, FolderPlus, Clock, User2, Filter, CheckCircle2,
  Circle, Loader2, Play, FileText, ExternalLink, ChevronLeft, ChevronRight, ChevronDown, ChevronUp
} from "lucide-react";

/**
 * Chat Management System (CMS) — v2
 * - Left-most panel (collapsible): Platform tabs + expandable search/filters (visible when Chats is active)
 * - Chat history panel (collapsible) with more seeded chats
 * - Middle "Review" panel: Preview window; ONLY place where "Save" exists
 * - Right panel: Chat transcript + agent orchestration
 * - Sub-agent approval types:
 *   - "approve": Approve / Reject (e.g., data retrieval confirmation)
 *   - "accept": Accept / Decline (e.g., adopt proposed pattern/rule/feature)
 * - Persistence via localStorage (swap for API later)
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
  const [filtersOpen, setFiltersOpen] = useState(true); // filters under Chats tab
  const [chats, setChats] = useState(loadChats);
  const [projects, setProjects] = useState(loadProjects);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ userId: "", agent: "", dateFrom: "", dateTo: "", resultStatus: "" });
  const [section, setSection] = useState("my"); // my | shared | starred | all
  const [activeProject, setActiveProject] = useState("all");
  const [selectedId, setSelectedId] = useState((loadChats()[0] || {}).id || null);
  const [showArtifacts, setShowArtifacts] = useState(true);


  // preview modal content lives in middle panel; but we manage selection here
  const [preview, setPreview] = useState(null); // { chatId, taskId, subId, kind, title, content }

  // background progress for running tasks
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
            const pendingApproval = task.sub.some((x) => x.approvalNeeded && x.approved == null);
            if (task.sub.every((x) => x.done) && !pendingApproval) {
              task.status = "done";
              copy.finalStatus = "done";
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
        if (section === "all" && !adminMode) return false;
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

  const toggleStar = (c) => updateChat(c.id, { isStarred: !c.isStarred });
  const toggleShare = (c) => updateChat(c.id, { isShared: !c.isShared });

  const addProject = () => {
    const name = prompt("New project/folder name");
    if (!name) return;
    const list = [...new Set([...projects, name])];
    setProjects(list);
    saveProjects(list);
  };

  /* ---------------------------- Layout ---------------------------- */

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

      {/* Body: 4 logical areas (left rail, history, review, detail). Left & history are collapsible */}
      <div className="flex-1 grid grid-cols-[auto_auto_minmax(420px,1fr)_minmax(420px,1.1fr)]">
        {/* Left Rail: Platform tabs + expandable filters (visible in Chats) */}
        <aside className={`${leftOpen ? "w-64" : "w-8"} transition-all border-r bg-white overflow-hidden`}>
          <div className="h-10 border-b flex items-center justify-between px-2 text-sm">
            <span className="font-medium">{leftOpen ? "Platform" : ""}</span>
            <button className="text-slate-500" onClick={() => setLeftOpen((s) => !s)}>
              {leftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {leftOpen && (
            <div className="p-2 space-y-2">
              {/* 4 tabs (static labels for demo) */}
              <div className="space-y-1">
                <div className="px-2 py-1.5 rounded border bg-white text-sm">Insights Center</div>
                <div className="px-2 py-1.5 rounded border bg-white text-sm">Data Studio</div>
                <div className="px-2 py-1.5 rounded border bg-white text-sm">Feature Platform</div>
                <div className="px-2 py-1.5 rounded border bg-white text-sm">Rules Engine</div>
                <div className="px-2 py-1.5 rounded border bg-indigo-600 text-white text-sm">Chats</div>
              </div>

              {/* Expandable Search & Filters for Chats */}
              <div className="mt-2 border rounded">
                <button
                  className="w-full px-2 py-1.5 flex items-center justify-between text-sm border-b bg-slate-50"
                  onClick={() => setFiltersOpen((s) => !s)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Search & Filters
                  </span>
                  {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {filtersOpen && (
                  <div className="p-2 space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" />
                      <input
                        className="w-full border rounded pl-8 pr-2 py-1.5 text-sm"
                        placeholder="Find chats, agents, artifacts…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>

                    <select
                      className="w-full border rounded px-2 py-1.5 text-sm"
                      value={filters.userId}
                      onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
                    >
                      <option value="">User (any)</option>
                      {[...new Set(chats.map((c) => c.userId))].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>

                    <select
                      className="w-full border rounded px-2 py-1.5 text-sm"
                      value={filters.agent}
                      onChange={(e) => setFilters((f) => ({ ...f, agent: e.target.value }))}
                    >
                      <option value="">Agent (any)</option>
                      {[...new Set(chats.flatMap((c) => c.agents || []))].map((a) => (
                        <option key={a} value={a}>{a}</option>
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

                    <div className="pt-2 border-t">
                      <div className="text-xs font-medium text-slate-500 mb-1">Projects</div>
                      <button
                        className={`w-full text-left px-2 py-1.5 rounded text-sm border ${activeProject === "all" ? "bg-indigo-50 border-indigo-200" : "border-slate-200"}`}
                        onClick={() => setActiveProject("all")}
                      >
                        All
                      </button>
                      {loadProjects().map((p) => (
                        <button
                          key={p}
                          className={`mt-1 w-full text-left px-2 py-1.5 rounded text-sm border ${activeProject === p ? "bg-indigo-50 border-indigo-200" : "border-slate-200"}`}
                          onClick={() => setActiveProject(p)}
                        >
                          {p}
                        </button>
                      ))}
                      <button className="mt-2 w-full text-left text-xs text-indigo-600" onClick={() => {
                        const name = prompt("New project/folder name");
                        if (!name) return;
                        const list = [...new Set([...projects, name])];
                        setProjects(list);
                        saveProjects(list);
                      }}>
                        <FolderPlus className="w-4 h-4 inline mr-1" /> Add Project
                      </button>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-xs font-medium text-slate-500 mb-1">Sections</div>
                      {["my","shared","starred"].map(sec => (
                        <button
                          key={sec}
                          className={`mr-1 mb-1 inline-flex items-center px-2 py-1 rounded text-xs border ${section === sec ? "bg-indigo-50 border-indigo-200" : "border-slate-200"}`}
                          onClick={() => setSection(sec)}
                        >
                          {sec === "my" ? "My Chats" : sec === "shared" ? "Shared with Me" : "Starred"}
                        </button>
                      ))}
                      {adminMode && (
                        <button
                          className={`inline-flex items-center px-2 py-1 rounded text-xs border ${section === "all" ? "bg-indigo-50 border-indigo-200" : "border-slate-200"}`}
                          onClick={() => setSection("all")}
                        >
                          All (Admin)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Chat History (collapsible) */}
        <section className={`${historyOpen ? "w-[360px]" : "w-8"} transition-all border-r bg-white overflow-hidden`}>
          <div className="h-10 border-b flex items-center justify-between px-2 text-sm">
            <span className="font-medium">{historyOpen ? `Chats (${filtered.length})` : ""}</span>
            <button className="text-slate-500" onClick={() => setHistoryOpen((s) => !s)}>
              {historyOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {historyOpen && (
            <div>
              <div className="px-3 py-2 text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated
              </div>
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
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleShare(c); }}
                        className="ml-auto text-xs text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" /> {c.isShared ? "Unshare" : "Share"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(c); }}
                        className="text-xs text-slate-500 hover:text-amber-600 inline-flex items-center gap-1"
                      >
                        {c.isStarred ? <Star className="w-3 h-3 text-amber-500" /> : <StarOff className="w-3 h-3" />} Star
                      </button>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && <div className="p-4 text-sm text-slate-500">No chats match filters.</div>}
              {/* Artifacts List */}
<div className="mt-4 border-t">
  <button
    className="w-full px-3 py-2 flex items-center justify-between text-sm bg-slate-50"
    onClick={() => setShowArtifacts?.((s) => !s)}
  >
    <span className="font-medium">Artifacts</span>
    {showArtifacts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
  </button>

  {showArtifacts && (
    <div className="p-2 space-y-2 max-h-[240px] overflow-auto">
      {filtered.flatMap((c) =>
        (c.artifacts || []).map((a) => (
          <div key={a.id} className="border rounded px-2 py-1 text-xs flex items-center gap-2 bg-white">
            <span className="font-medium text-indigo-700">
              {a.kind === "rule" ? "Rule" : a.kind === "feature" ? "Feature" : "Contact"}
            </span>
            <span className="text-slate-700 truncate flex-1">{a.name}</span>
            <span className="text-slate-400">{new Date(a.ts).toLocaleDateString()}</span>

            {/* Preview */}
            <button
              className="text-indigo-600 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                const chat = chats.find((cc) => cc.id === c.id);
                const task = chat.tasks?.find((t) =>
                  t.sub.some((s) => a.name?.includes(s.id))
                );
                const sub = task?.sub?.find((s) => a.name?.includes(s.id));
                if (task && sub) {
                  onOpenPreview({
                    chatId: c.id,
                    taskId: task.id,
                    subId: sub.id,
                    kind: a.kind,
                    title: a.name,
                    content: `Recovered artifact: ${a.name}`,
                    deepLink: a.url || null,
                  });
                }
              }}
            >
              Preview
            </button>

            {/* Platform link if saved */}
            {a.url && (
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))
      )}

      {filtered.every((c) => (c.artifacts || []).length === 0) && (
        <div className="text-slate-500 text-xs px-2 py-3">No artifacts created yet.</div>
      )}
    </div>
  )}
</div>

            </div>
          )}
        </section>

        {/* Middle: Review / Preview window (only place with Save) */}
        <section className="bg-white border-r flex flex-col">
          <div className="h-10 border-b px-3 flex items-center justify-between">
            <div className="font-medium text-sm">Review / Preview</div>
            {preview && (
              <a href={preview.deepLink} className="text-xs text-indigo-600 inline-flex items-center gap-1" target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4" /> View in Platform
              </a>
            )}
          </div>

          {preview ? (
            <div className="p-3 space-y-3">
              <div className="text-sm text-slate-500">Previewing: <span className="font-medium text-slate-700">{preview.title}</span></div>
              <div className="border rounded p-3 bg-slate-50 text-sm min-h-[200px]">
                {/* mock preview content */}
                <pre className="whitespace-pre-wrap text-slate-800">{preview.content}</pre>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    // create a fake platform URL and persist artifact into chat
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
                <button className="btn btn-ghost" onClick={() => setPreview(null)}>Close</button>
              </div>
            </div>
          ) : (
            <div className="m-auto text-slate-500 text-sm">Select a sub-agent result to preview (from the right panel).</div>
          )}
        </section>

        {/* Right: Chat Detail + Orchestration */}
        <section className="bg-white flex flex-col">
          {selected ? (
            <ChatDetail
              chat={selected}
              onUpdate={(patch) => updateChat(selected.id, patch)}
              onOpenPreview={setPreview}
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

  // Handle sub-agent approval
  const setApproval = (taskId, subId, decision) => {
    const copy = structuredClone(chat);
    const t = copy.tasks.find((x) => x.id === taskId);
    const s = t?.sub.find((x) => x.id === subId);
    if (!s) return;
    s.approved = decision; // true/false
    // if approved and has previewId, enable preview button (saving only through Review panel)
    if (decision === true && s.previewId) {
      // nothing else here; the Preview button will call onOpenPreview
    }
    // if no more approvals pending, resume
    if (!t.sub.some((x) => x.approvalNeeded && x.approved == null)) {
      t.status = t.sub.every((x) => x.done) ? "done" : "running";
    }
    onUpdate({ tasks: copy.tasks });
  };

  const openPreview = (taskId, sub) => {
    const kind =
      sub.name.startsWith("Generate Features") ? "feature" :
      sub.name.startsWith("Create Rules") ? "rule" :
      sub.name.toLowerCase().includes("contact") ? "contact" : "rule";
    onOpenPreview({
      chatId: chat.id,
      taskId,
      subId: sub.id,
      kind,
      title: sub.name,
      content:
`// Preview — ${sub.name}
{
  "pattern": "ATO credential compromise",
  "signals": ["recent 2FA change", "password change", "Socure R217/R572/R633", "iOS login 73.136.129.131"],
  "hypothesis": "Increase scrutiny on BillPay > $500 within 24h of security changes",
  "proposed_rules": ["rule_${sub.id}_1", "rule_${sub.id}_2"]
}`,
      deepLink: null,
    });
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

      {/* Orchestration + approvals */}
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
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  )}
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

                    {/* Approval actions */}
                    {s.approvalNeeded && s.done && (
                      <div className="mt-2 p-2 bg-slate-50 border rounded text-xs">
                        <div className="font-medium text-slate-700 mb-1">
                          {s.approvalType === "approve" ? "Approval required" : "Accept required"}
                        </div>
                        <div className="flex items-center gap-2">
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

                          {/* Preview only (Save happens in the middle Review panel) */}
                          {s.approved === true && s.previewId && (
                            <button className="btn btn-ghost inline-flex items-center gap-1" onClick={() => openPreview(t.id, s)}>
                              <FileText className="w-4 h-4" /> Preview
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
