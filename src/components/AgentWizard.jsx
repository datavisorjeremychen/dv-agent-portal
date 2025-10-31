import React, { useMemo, useState, useEffect } from "react";

export default function AgentWizard({ open, onClose, onSave, agents = [] }) {
  const [step, setStep] = useState(0);
  const [cloneId, setCloneId] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const base = useMemo(() => agents.find((a) => a.id === cloneId), [agents, cloneId]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setCloneId("");
      setName("");
      setDesc("");
    }
  }, [open]);

  useEffect(() => {
    if (base) {
      setName(base.name + " Copy");
      setDesc(base.desc || "Cloned from " + base.name);
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
    };
    onSave?.(payload);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/20">
      <div className="bg-white w-full max-w-lg rounded-xl border shadow-sm">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Create Agent</div>
          <button className="text-slate-500" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <StepDot active={step >= 0}>Clone</StepDot>
            <span className="text-slate-300">›</span>
            <StepDot active={step >= 1}>Details</StepDot>
          </div>

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
              <div className="flex justify-end">
                <button
                  className="btn btn-primary"
                  onClick={() => setStep(1)}
                  disabled={!cloneId}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <div className="text-sm mb-1">Agent Name</div>
                <input className="border rounded px-2 py-1.5 w-full" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <div className="text-sm mb-1">Description</div>
                <textarea className="border rounded px-2 py-1.5 w-full min-h-[80px]" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>Draft on save • Clone-based</span>
          <div className="flex gap-2">
            {step === 1 ? (
              <button className="btn btn-primary" onClick={save}>Save Draft</button>
            ) : (
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDot({ active, children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200"}`}>
      {children}
    </span>
  );
}
