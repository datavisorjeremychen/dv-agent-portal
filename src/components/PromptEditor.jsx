import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { updateAgent as storeUpdate, loadAgents as storeLoad } from "../store/agents.js";

export default function PromptEditor({ open, onClose, agentId }) {
  const agent = useMemo(() => storeLoad().find((a) => a.id === agentId), [agentId]);
  const [tab, setTab] = useState("system");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [guardrails, setGuardrails] = useState([]);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (!open || !agent) return;
    setTab("system");
    setSystemPrompt(agent.systemPrompt || "");
    setPrompts(agent.customPrompts || []);
    setGuardrails(agent.guardrails || []);
    setChanged(false);
  }, [open, agentId]);

  if (!open || !agent) return null;

  const save = () => {
    storeUpdate(agent.id, {
      systemPrompt: systemPrompt.trim(),
      customPrompts: prompts.filter(Boolean),
      guardrails: guardrails.filter(Boolean),
      updated: new Date().toLocaleString(),
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/20">
      <div className="bg-white w-full max-w-2xl rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Edit Prompts & Guardrails — {agent.name}</div>
          <button className="text-slate-500" onClick={onClose}>×</button>
        </div>

        <div className="px-4 pt-3 flex gap-2">
          {[
            { id: "system", label: "System Prompt" },
            { id: "prompts", label: "Helper Prompts" },
            { id: "guardrails", label: "Guardrails" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-sm rounded border ${tab === t.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
          {tab === "system" && (
            <div className="space-y-2">
              <div className="text-sm text-slate-600">System Prompt (guides overall agent behavior)</div>
              <textarea
                className="w-full border rounded p-2 min-h-[160px]"
                value={systemPrompt}
                onChange={(e) => { setSystemPrompt(e.target.value); setChanged(true); }}
                placeholder="e.g., Act as an AML analyst; be factual; cite fields; no speculation."
              />
            </div>
          )}

          {tab === "prompts" && (
            <ListEditor
              label="Helper Prompts"
              rows={prompts}
              onChange={(rows) => { setPrompts(rows); setChanged(true); }}
            />
          )}

          {tab === "guardrails" && (
            <ListEditor
              label="Guardrails"
              rows={guardrails}
              onChange={(rows) => { setGuardrails(rows); setChanged(true); }}
            />
          )}
        </div>

        <div className="px-4 py-3 border-t bg-slate-50 flex justify-between items-center text-xs text-slate-600">
          <span>{changed ? "Unsaved changes" : ""}</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={!changed}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListEditor({ label, rows, onChange }) {
  const [items, setItems] = useState(rows);
  React.useEffect(() => setItems(rows), [rows]);

  const add = () => setItems((xs) => [...xs, ""]);
  const setAt = (i, v) => setItems((xs) => xs.map((x, idx) => (idx === i ? v : x)));
  const delAt = (i) => setItems((xs) => xs.filter((_, idx) => idx !== i));

  React.useEffect(() => onChange(items), [items]);

  return (
    <div className="space-y-2">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="flex-1 border rounded px-2 py-1"
              value={v}
              onChange={(e) => setAt(i, e.target.value)}
              placeholder={`${label.slice(0, -1)} ${i + 1}`}
            />
            <button className="p-1 border rounded hover:bg-red-50" onClick={() => delAt(i)} title="Remove">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        ))}
      </div>
      <button className="btn btn-ghost" onClick={add}><Plus className="w-4 h-4" /> Add</button>
    </div>
  );
}
