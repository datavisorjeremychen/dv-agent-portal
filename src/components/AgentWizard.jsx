import React, { useMemo, useState, useEffect } from "react";

/**
 * AgentWizard — Clone → Details → Advanced → System Prompt → Helper Prompts
 * Advanced includes:
 *  - Tools (external connectors like SQL, Rules, Features, Case APIs)
 *  - Sub Agents (existing agents that this agent can call)
 */
export default function AgentWizard({ open, onClose, onSave, agents = [] }) {
  // Steps:
  // 0: clone
  // 1: details
  // 2: advanced (tools + subAgents)
  // 3: system prompt
  // 4: helper prompts
  const [step, setStep] = useState(0);

  const [cloneId, setCloneId] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tools, setTools] = useState([]); // external tools
  const [subAgents, setSubAgents] = useState([]); // other agents this one can call

  const [systemPrompt, setSystemPrompt] = useState("");
  const [helperPrompts, setHelperPrompts] = useState([]); // array of strings

  const base = useMemo(() => agents.find((a) => a.id === cloneId), [agents, cloneId]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setCloneId("");
      setName("");
      setDesc("");
      setTools([]);
      setSubAgents([]);
      setSystemPrompt("");
      setHelperPrompts([]);
    }
  }, [open]);

  useEffect(() => {
    if (base) {
      setName((base.name || "Agent") + " Copy");
      setDesc(base.desc || `Cloned from ${base.name || "agent"}`);
      // Prefill prompts if present on the base agent
      setSystemPrompt(base.systemPrompt || "");
      setHelperPrompts(
        Array.isArray(base.helperPrompts)
          ? base.helperPrompts.map((p) => String(p))
          : []
      );
    }
  }, [base]);

  if (!open) return null;

  const save = () => {
    const now = new Date().toLocaleString();
    const payload = {
      id: Math.random().toString(36).slice(2),
      name: name || (base ? base.name + " Copy" : "New Agent"),
      desc: desc || base?.desc || "",
      status: "DRAFT",
      updated: now,
      tools,            // e.g., ["sql","rules"]
      subAgents,        // array of agent ids
      systemPrompt,     // string
      helperPrompts,    // array of strings
      clonedFromId: cloneId,
    };
    onSave?.(payload);
    onClose?.();
  };

  const TOOL_OPTIONS = [
    { id: "sql", label: "SQL Runner" },
    { id: "rules", label: "Rules Engine API" },
    { id: "features", label: "Feature Platform API" },
    { id: "cases", label: "Case Management API" },
  ];

  const toggleIn = (list, setList, id) => {
    setList((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addHelperPrompt = () => {
    setHelperPrompts((prev) => [...prev, ""]);
  };

  const updateHelperPrompt = (idx, value) => {
    setHelperPrompts((prev) => prev.map((p, i) => (i === idx ? value : p)));
  };

  const removeHelperPrompt = (idx) => {
    setHelperPrompts((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/20">
      <div className="bg-white w-full max-w-2xl rounded-xl border shadow-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Create Agent</div>
          <button className="text-slate-500" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Stepper */}
        <div className="px-4 pt-3 flex items-center gap-2 flex-wrap text-xs">
          <StepDot active={step >= 0}>Clone</StepDot>
          <span className="text-slate-300">›</span>
          <StepDot active={step >= 1}>Details</StepDot>
          <span className="text-slate-300">›</span>
          <StepDot active={step >= 2}>Advanced</StepDot>
          <span className="text-slate-300">›</span>
          <StepDot active={step >= 3}>System Prompt</StepDot>
          <span className="text-slate-300">›</span>
          <StepDot active={step >= 4}>Helper Prompts</StepDot>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
          {step === 0 && (
            <div className="space-y-2">
              <label className="text-sm">Choose an existing agent to clone</label>
              <select
                className="border rounded px-2 py-1.5 w-full"
                value={cloneId}
                onChange={(e) => setCloneId(e.target.value)}
              >
                <option value="">Select…</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {cloneId && (
                <div className="text-xs text-slate-500">
                  Cloning from: <span className="font-medium text-slate-700">{base?.name}</span>
                </div>
              )}
              <div className="flex justify-end">
                <button className="btn btn-primary" onClick={() => setStep(1)} disabled={!cloneId}>
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <div className="text-sm mb-1">Agent Name</div>
                <input
                  className="border rounded px-2 py-1.5 w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <div className="text-sm mb-1">Description</div>
                <textarea
                  className="border rounded px-2 py-1.5 w-full min-h-[80px]"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!name.trim()}>
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Tools */}
              <div className="border rounded-lg">
                <div className="px-3 py-2 border-b text-sm font-medium">Tools</div>
                <div className="p-3 space-y-2 text-sm">
                  {TOOL_OPTIONS.map((t) => (
                    <label key={t.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tools.includes(t.id)}
                        onChange={() => toggleIn(tools, setTools, t.id)}
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Sub Agents */}
              <div className="border rounded-lg">
                <div className="px-3 py-2 border-b text-sm font-medium">Sub Agents</div>
                <div className="p-3 space-y-2 text-sm max-h-56 overflow-auto">
                  {agents.map((a) => (
                    <label key={a.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={a.id === cloneId}
                        checked={subAgents.includes(a.id)}
                        onChange={() => toggleIn(subAgents, setSubAgents, a.id)}
                      />
                      <span className={a.id === cloneId ? "text-slate-400" : ""}>{a.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Summary (pre-prompts) */}
              <div className="md:col-span-2 border rounded-lg">
                <div className="px-3 py-2 border-b text-sm font-medium">Summary</div>
                <div className="p-3 text-sm space-y-1">
                  <div><span className="font-medium">Clone:</span> {base?.name || "—"}</div>
                  <div><span className="font-medium">Name:</span> {name || "—"}</div>
                  <div><span className="font-medium">Description:</span> {desc || "—"}</div>
                  <div><span className="font-medium">Tools:</span> {tools.length ? tools.join(", ") : "None"}</div>
                  <div>
                    <span className="font-medium">Sub Agents:</span>{" "}
                    {subAgents.length
                      ? subAgents.map((id) => agents.find((a) => a.id === id)?.name || id).join(", ")
                      : "None"}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button className="btn btn-primary" onClick={() => setStep(3)}>
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">System Prompt</div>
              <p className="text-xs text-slate-500">
                Define the core instructions and persona for this agent. This will be sent as the
                <span className="font-medium"> system </span>message at the start of each run.
              </p>
              <textarea
                className="border rounded px-2 py-2 w-full min-h-[160px]"
                placeholder="e.g., You are a Fraud Detection Agent specializing in card-not-present transactions..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
              <div className="flex justify-end">
                <button className="btn btn-primary" onClick={() => setStep(4)}>
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Helper Prompts</div>
              <p className="text-xs text-slate-500">
                Add optional helper prompts the agent can reference (e.g., “Generate candidate rules,” “Summarize case context,” “Compute SQL preview”).
              </p>

              <div className="space-y-2">
                {helperPrompts.length === 0 && (
                  <div className="text-xs text-slate-500 border rounded px-3 py-2">
                    No helper prompts yet. Click “Add prompt” to create one.
                  </div>
                )}
                {helperPrompts.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <textarea
                      className="border rounded px-2 py-2 w-full min-h-[80px]"
                      value={p}
                      onChange={(e) => updateHelperPrompt(idx, e.target.value)}
                      placeholder={`Helper Prompt #${idx + 1}`}
                    />
                    <button
                      className="btn btn-ghost text-red-600 shrink-0"
                      onClick={() => removeHelperPrompt(idx)}
                      aria-label={`Remove helper prompt ${idx + 1}`}
                      title="Remove"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button className="btn btn-ghost" onClick={addHelperPrompt}>
                  + Add prompt
                </button>
                <div className="flex gap-2">
                  <button className="btn btn-ghost" onClick={() => setStep(3)}>Back</button>
                  <button
                    className="btn btn-primary"
                    onClick={save}
                    disabled={!name.trim() || !cloneId}
                  >
                    Save Draft
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>Draft on save • Clone-based</span>
          <div className="flex gap-2">
            {step > 0 && (
              <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>
            )}
            {step < 4 && (
              <button
                className="btn btn-primary"
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 0 && !cloneId) ||
                  (step === 1 && !name.trim())
                }
              >
                Next
              </button>
            )}
            {step === 4 && (
              <button
                className="btn btn-primary"
                onClick={save}
                disabled={!name.trim() || !cloneId}
              >
                Save Draft
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDot({ active, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-slate-600 border-slate-200"
      }`}
    >
      {children}
    </span>
  );
}
