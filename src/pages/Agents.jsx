
import React, { useState, useEffect, useMemo } from "react";
import { Plus, Copy, Pencil, Rocket, Trash2, Search, Eye, X, Send } from "lucide-react";
import AgentWizard from "../components/AgentWizard.jsx";
import PublishGate from "../components/PublishGate.jsx";
import PromptEditor from "../components/PromptEditor.jsx";
import {
  subscribe,
  loadAgents as storeLoad,
  addAgent as storeAdd,
  cloneAgent as storeClone,
  publishAgent as storePublish,
  deleteAgent as storeDelete,
} from "../store/agents.js";

// ---- Right-side Preview Chat ------------------------------------------------
function PreviewChat({ agent, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: "m0",
      role: "agent",
      text: `Hi! You're previewing **${agent.name}**. Ask me anything this agent is designed to help with.`,
      ts: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const now = new Date().toLocaleTimeString();
    const userMsg = { id: crypto.randomUUID(), role: "user", text: trimmed, ts: now };
    const agentMsg = {
      id: crypto.randomUUID(),
      role: "agent",
      text:
        "Thanks for the prompt. (Preview mode) Here's how I would proceed:\n" +
        "1) Parse intent and key entities\n" +
        "2) Call tool(s) if configured (mock)\n" +
        "3) Return draft answer or action plan\n\n" +
        "_Hook this to your real runtime for live results._",
      ts: now,
    };
    setMessages((m) => [...m, userMsg, agentMsg]);
    setInput("");
  };

  return (
    <div className="w-full h-full flex flex-col border-l bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50">
        <div className="font-semibold text-slate-800">
          Preview – {agent.name}
        </div>
        <button
          className="p-1 rounded hover:bg-slate-200"
          onClick={onClose}
          title="Close preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.text}
              <div
                className={`mt-1 text-[10px] ${
                  m.role === "user" ? "text-indigo-100" : "text-slate-500"
                }`}
              >
                {m.role === "user" ? "You" : agent.name} • {m.ts}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder={`Ask ${agent.name}... (preview)`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            onClick={send}
            className="inline-flex items-center gap-1 bg-indigo-600 text-white text-sm px-3 py-2 rounded disabled:opacity-50"
            disabled={!input.trim()}
            title="Send"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Preview mode uses a mock response. Connect to your agent runtime for live results.
        </div>
      </div>
    </div>
  );
}

// ---- Page -------------------------------------------------------------------
export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [query, setQuery] = useState("");
  const [openWizard, setOpenWizard] = useState(false);
  const [openGateFor, setOpenGateFor] = useState(null);
  const [openEditorFor, setOpenEditorFor] = useState(null);
  const [previewAgentId, setPreviewAgentId] = useState(null);

  useEffect(() => {
    let list = storeLoad();

    // Seed example agent if missing
    if (!list.some((a) => a.name === "Create Strategy Agent")) {
      list = [
        {
          id: "example-create-strategy-agent",
          name: "Create Strategy Agent",
          desc: "Helps generate fraud strategy ideas across segments.",
          status: "PUBLISHED",
          updated: new Date().toLocaleDateString(),
          createdBy: "System",
          runs: 12, // example usage count
        },
        ...list,
      ];
    }

    setAgents(list);
    const unsub = subscribe((s) => setAgents(s.agents));
    return () => unsub();
  }, []);

  const filtered = useMemo(
    () => agents.filter((a) => a.name.toLowerCase().includes(query.toLowerCase())),
    [agents, query]
  );

  const publish = (a) => {
    if (a.status === "DRAFT") {
      setOpenGateFor(a);
    } else {
      storePublish(a.id);
    }
  };
  const remove = (a) => storeDelete(a.id);
  const clone = (a) => storeClone(a);

  const openPreview = (a) => setPreviewAgentId(a.id);
  const closePreview = () => setPreviewAgentId(null);

  const previewAgent = useMemo(
    () => agents.find((a) => a.id === previewAgentId) || null,
    [agents, previewAgentId]
  );

  // Helper to show runs only if published
  const renderRuns = (a) => {
    if (a.status !== "PUBLISHED") return "—";
    const value = typeof a.runs === "number" ? a.runs : 0;
    return value.toLocaleString();
    };

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex gap-2 items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" />
          <input
            className="pl-8 pr-2 py-1 border rounded text-sm"
            placeholder="Search agents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded flex items-center gap-1"
          onClick={() => setOpenWizard(true)}
        >
          <Plus className="w-4 h-4" /> New Agent
        </button>
      </div>

      {/* Main content split: left table + right preview */}
      <div className="flex gap-4">
        {/* Left: Agents table. Width adapts if preview is open */}
        <div className={`${previewAgent ? "w-full md:w-1/2" : "w-full"} transition-all`}>
          <div className="border rounded-lg bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 border-b">
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Created By</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-right p-2"># Runs</th>
                  <th className="text-left p-2">Updated</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b hover:bg-slate-50">
                    <td className="p-2">
                      <div className="font-medium text-slate-800">{a.name}</div>
                      <div className="text-xs text-slate-500">{a.desc}</div>
                    </td>

                    {/* Created By */}
                    <td className="p-2 text-slate-600">
                      {a.createdBy || "—"}
                    </td>

                    {/* Status */}
                    <td className="p-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs border ${
                          a.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-amber-50 text-amber-700 border-amber-300"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>

                    {/* # Runs (only for published) */}
                    <td className="p-2 text-right text-slate-700">
                      {renderRuns(a)}
                    </td>

                    {/* Updated */}
                    <td className="p-2 text-slate-600">{a.updated}</td>

                    {/* Actions */}
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        <button className="p-1 border rounded hover:bg-slate-100" title="Clone" onClick={() => clone(a)}>
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 border rounded hover:bg-slate-100"
                          title="Edit Prompts"
                          onClick={() => setOpenEditorFor(a.id)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 border rounded hover:bg-slate-100 disabled:opacity-50"
                          title="Publish"
                          onClick={() => publish(a)}
                          disabled={a.status === "PUBLISHED"}
                        >
                          <Rocket className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 border rounded hover:bg-slate-100"
                          title="Preview"
                          onClick={() => openPreview(a)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 border rounded hover:bg-red-50 text-red-600"
                          title="Delete"
                          onClick={() => remove(a)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No agents match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Preview panel */}
        {previewAgent && (
          <div className="hidden md:flex md:w-1/2 h-[70vh] rounded-lg overflow-hidden">
            <PreviewChat agent={previewAgent} onClose={closePreview} />
          </div>
        )}
      </div>

      {/* Modals */}
      <AgentWizard
        open={openWizard}
        onClose={() => setOpenWizard(false)}
        agents={agents}
        onSave={(agent) => storeAdd(agent)}
      />

      <PublishGate
        open={!!openGateFor}
        onClose={() => setOpenGateFor(null)}
        onConfirm={() => {
          if (openGateFor) {
            storePublish(openGateFor.id);
          }
          setOpenGateFor(null);
        }}
      />

      <PromptEditor
        open={!!openEditorFor}
        onClose={() => setOpenEditorFor(null)}
        agentId={openEditorFor}
      />
    </div>
  );
}
