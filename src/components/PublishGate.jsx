import React, { useState } from "react";

export default function PublishGate({ open, onClose, onConfirm }) {
  const [checks, setChecks] = useState({ data: false, guardrails: false, tested: false });
  const [approver, setApprover] = useState("");

  const allChecked = Object.values(checks).every(Boolean) && approver.trim();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30">
      <div className="bg-white w-full max-w-md rounded-xl border shadow-sm">
        <div className="px-4 py-3 border-b font-semibold">Publish Agent</div>

        <div className="p-4 space-y-4 text-sm">
          <p className="text-slate-700 font-medium">Approval Checklist</p>

          <label className="flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={checks.data}
              onChange={(e) => setChecks({ ...checks, data: e.target.checked })}
            />
            Agent does not expose sensitive data
          </label>

          <label className="flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={checks.guardrails}
              onChange={(e) => setChecks({ ...checks, guardrails: e.target.checked })}
            />
            Guardrails reviewed and tested
          </label>

          <label className="flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={checks.tested}
              onChange={(e) => setChecks({ ...checks, tested: e.target.checked })}
            />
            Agent tested with sample cases
          </label>

          <div>
            <div className="mb-1 font-medium">Approver Name</div>
            <input
              className="border rounded px-2 py-1 w-full"
              value={approver}
              onChange={(e) => setApprover(e.target.value)}
              placeholder="Enter approver name"
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t bg-slate-50 flex justify-end gap-2 text-sm">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary disabled:opacity-50"
            disabled={!allChecked}
            onClick={() => { onConfirm?.(approver); onClose(); }}
          >
            Approve & Publish
          </button>
        </div>
      </div>
    </div>
  );
}
