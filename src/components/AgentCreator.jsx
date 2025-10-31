import React, { useEffect, useState, useMemo } from "react";
import { loadAgents as storeLoad, addAgent as storeAdd } from "../store/agents.js";
import { ChevronRight } from "lucide-react";

const STEPS = ["clone", "details", "tools", "trigger", "review"];

export default function AgentCreator({ open, onClose }) {
  const agents = useMemo(() => storeLoad(), []);
  const [step, setStep] = useState("clone");
  const [cloneId, setCloneId] = useState(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tools, setTools] = useState([]);

  useEffect(() => {
    if (!open) {
      setStep("clone");
      setCloneId(null);
      setName("");
      setDesc("");
      setTools([]);
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
    const newAgent = {
      ...base,
      id: Math.random().toString(36).slice(2),
      name,
      desc,
      tools,
      status: "DRAFT",
      updated: new Date().toLocaleString(),
    };
    storeAdd(newAgent);
    onClose?.();
  };

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
              <div className="text-xs text-slate-500 mb-2">Select agents this agent can call (basic chaining)</div>
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

          {step === "trigger" && (
            <div className="space-y-3 text-sm text-slate-600">
              <div className="font-medium">Trigger config (placeholder)</div>
              <div className="text-xs">Manual, schedule, or event-based — TBD in next build</div>
              <div className="border rounded p-3 bg-slate-50 text-xs">Coming soon…</div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-2 text-sm">
              <div className="font-medium text-slate-700">Review</div>
              <div><span className="font-medium">Clone:</span> {base?.name}</div>
              <div><span className="font-medium">Name:</span> {name}</div>
              <div><span className="font-medium">Description:</span> {desc}</div>
              <div><span className="font-medium">Tools:</span> {tools.length ? tools.join(", ") : "None"}</div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t bg-slate-50 flex justify-between items-center text-xs">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={back} disabled={step === "clone"}>Back</button>
            {step !== "review" && (
              <button className="btn btn-primary" onClick={next} disabled={step === "clone" && !cloneId}>Next</button>
            )}
            {step === "review" && (
              <button className="btn btn-primary" onClick={save} disabled={!name.trim()}>Save Agent</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
