import React, { useEffect, useState, useMemo } from "react";
import { loadAgents as storeLoad, addAgent as storeAdd } from "../store/agents.js";
import { ChevronRight, Plus, Trash2 } from "lucide-react";

// New step order: add "system" and "helpers" after "tools"
const STEPS = ["clone", "details", "tools", "system", "helpers", "trigger", "review"];

export default function AgentCreator({ open, onClose }) {
  const agents = useMemo(() => storeLoad(), []);
  const [step, setStep] = useState("clone");
  const [cloneId, setCloneId] = useState(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tools, setTools] = useState([]);

  // NEW: system prompt + helper prompts
  const [systemPrompt, setSystemPrompt] = useState("");
  const [helperPrompts, setHelperPrompts] = useState([""]);

  useEffect(() => {
    if (!open) {
      setStep("clone");
      setCloneId(null);
      setName("");
      setDesc("");
      setTools([]);
      setSystemPrompt("");
      setHelperPrompts([""]);
    }
  }, [open]);

  if (!open) return null;

  const base = agents.find((a) => a.id === cloneId);

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const back = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const save = () => {
    const cleanedHelpers = helperPrompts.map(h => (h ?? "").trim()).filter(Boolean);
    const newAgent = {
      ...base,
      id: Math.random().toString(36).slice(2),
      name,
      desc,
      tools,
      // include prompts in saved payload
      systemPrompt: systemPrompt.trim(),
      helperPrompts: cleanedHelpers,
      status: "DRAFT",
      updated: new Date().toLocaleString(),
    };
    storeAdd(newAgent);
    onClose?.();
  };

  // convenience for showing selected tool names in Review
  const toolNames = tools
    .map(id => agents.find(a => a.id === id)?.name || id)
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/20">
      <div className="bg-white w-full max-w-2xl rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold">Create Agent</div>

        <div className="p-4 space-y-6">
          {step === "clone" && (
            <div className="space-y-3">
              <div className="text-sm text-slate-600">Choose an existing agent to clone</div>
              <div className="space-y-2 max-h-64 overflow-auto border rounded p-2">
                {agents.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setCloneId(a.id)}
                    className={`w-full text-left px-2 py-1 rounded flex items-center justify-between ${cloneId === a.id ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                  >
                    <div>
                      <div className="font-medium text-slate-800">{a.name}</div>
                      <div className="text-xs text-slate-500">{a.desc}</div>
                    </div>
                    {cloneId === a.id && <ChevronRight className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-3">
              <div className="text-sm text-slate-600">Name & Description</div>
              <input
                className="w-full border rounded px-2 py-1"
                placeholder="Agent name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <textarea
                className="w-full border rounded px-2 py-1 min-h-[80px]"
                placeholder="Description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          )}

          {step === "tools" && (
            <div className="space-y-3 text-sm text-slate-600">
              <div className="font-medium">Tools / Other Agents</div>
              <div className="text-xs text-slate-500 mb-2">
                Select agents this agent can call (basic chaining)
              </div>
              <div className="space-y-2 max-h-48 overflow-auto border rounded p-2 bg-slate-50">
                {agents.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-slate-700">
                    <input
                      type="checkbox"
                      disabled={a.id === cloneId}
                      checked={tools.includes(a.id)}
                      onChange={(e) => {
                        setTools((prev) =>
                          e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                        );
                      }}
                    />
                    <span>{a.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* NEW: System Prompt step */}
          {step === "system" && (
            <div className="space-y-3">
              <div className="text-sm text-slate-600">System Prompt</div>
              <div className="text-xs text-slate-500">
                Define the agent’s core behavior, role, constraints, and tone. This
                prompt is prepended to all conversations.
              </div>
              <textarea
                className="w-full border rounded px-2 py-2 min-h-[140px] font-mono text-sm"
                placeholder={`e.g., "You are a fraud-risk rule assistant. Always propose safe, explainable rules..."`}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>
          )}

          {/* NEW: Helper Prompts step */}
          {step === "helpers" && (
            <div className="space-y-3">
              <div className="text-sm text-slate-600">Helper Prompts</div>
              <div className="text-xs text-slate-500">
                Add reusable helper prompts the agent can use (e.g., “Summarize alerts”, “Draft rule from pattern”).
              </div>
              <div className="space-y-2">
                {helperPrompts.map((hp, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <textarea
                      className="flex-1 border rounded px-2 py-2 min-h-[72px] font-mono text-sm"
                      placeholder={`Helper prompt #${idx + 1}`}
                      value={hp}
                      onChange={(e) => {
                        const next = [...helperPrompts];
                        next[idx] = e.target.value;
                        setHelperPrompts(next);
                      }}
                    />
                    <button
                      type="button"
                      className="px-2 py-2 border rounded hover:bg-slate-50"
                      onClick={() => {
                        setHelperPrompts(prev => prev.length === 1
                          ? [""]
                          : prev.filter((_, i) => i !== idx));
                      }}
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-1.5 border rounded text-sm hover:bg-slate-50"
                  onClick={() => setHelperPrompts(prev => [...prev, ""])}
                >
                  <Plus className="w-4 h-4" /> Add helper prompt
                </button>
              </div>
            </div>
          )}

          {step === "trigger" && (
            <div className="space-y-3 text-sm text-slate-600">
              <div className="font-medium">Trigger config (placeholder)</div>
              <div className="text-xs">Manual, schedule, or event-based — TBD in next build</div>
              <div className="border rounded p-3 bg-slate-50 text-xs">Coming soon…</div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-3 text-sm">
              <div className="font-medium text-slate-700">Review</div>
              <div>
                <span className="font-medium">Clone:</span> {base?.name || "—"}
              </div>
              <div>
                <span className="font-medium">Name:</span> {name || "—"}
              </div>
              <div>
                <span className="font-medium">Description:</span> {desc || "—"}
              </div>
              <div>
                <span className="font-medium">Tools:</span>{" "}
                {toolNames.length ? toolNames.join(", ") : "None"}
              </div>
              <div>
                <span className="font-medium">System Prompt:</span>
                <pre className="mt-1 whitespace-pre-wrap bg-slate-50 border rounded p-2 text-xs">
                  {systemPrompt || "—"}
                </pre>
              </div>
              <div>
                <span className="font-medium">Helper Prompts:</span>
                {helperPrompts.some(h => (h ?? "").trim()) ? (
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {helperPrompts
                      .map(h => (h ?? "").trim())
                      .filter(Boolean)
                      .map((h, i) => (
                        <li key={i} className="text-slate-700 text-xs">
                          {h}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-500 mt-1">None</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t bg-slate-50 flex justify-between items-center text-xs">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={back} disabled={step === "clone"}>Back</button>
            {step !== "review" && (
              <button
                className="btn btn-primary"
                onClick={next}
                disabled={(step === "clone" && !cloneId)}
              >
                Next
              </button>
            )}
            {step === "review" && (
              <button
                className="btn btn-primary"
                onClick={save}
                disabled={!name.trim()}
              >
                Save Agent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
