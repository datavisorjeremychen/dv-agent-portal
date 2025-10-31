import React, { useState, useEffect, useMemo } from "react";
import { Plus, Copy, Pencil, Rocket, Trash2, Search } from "lucide-react";
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

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [query, setQuery] = useState("");
  const [openWizard, setOpenWizard] = useState(false);
  const [openGateFor, setOpenGateFor] = useState(null);
  const [openEditorFor, setOpenEditorFor] = useState(null);

  useEffect(() => {
    setAgents(storeLoad());
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

  return (
    <div className="space-y-4">
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

      <div className="border rounded-lg bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 border-b">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Status</th>
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
                <td className="p-2 text-slate-600">{a.updated}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <button className="p-1 border rounded hover:bg-slate-100" title="Clone" onClick={() => clone(a)}>
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 border rounded hover:bg-slate-100"
                      title="Edit"
                      onClick={() => setOpenEditorFor(a.id)}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 border rounded hover:bg-slate-100"
                      title="Publish"
                      onClick={() => publish(a)}
                      disabled={a.status === "PUBLISHED"}
                    >
                      <Rocket className="w-4 h-4" />
                    </button>
                    <button className="p-1 border rounded hover:bg-red-50 text-red-600" title="Delete" onClick={() => remove(a)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
