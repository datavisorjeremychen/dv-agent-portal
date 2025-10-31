import React, { useEffect, useState } from "react";

const seedUsage = () => ({
  totalTasks: 42,
  inputTokens: 82000,
  outputTokens: 31000,
  spendUSD: 126.4,
  capUSD: 1200,
  retentionDays: 30,
});

export default function Usage() {
  const [usage, setUsage] = useState(seedUsage());

  useEffect(() => {
    const saved = localStorage.getItem("dv.usage");
    if (saved) setUsage(JSON.parse(saved));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-slate-700">Usage & Admin</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { k: "Total Tasks", v: usage.totalTasks },
          { k: "Input Tokens", v: usage.inputTokens.toLocaleString() },
          { k: "Output Tokens", v: usage.outputTokens.toLocaleString() },
          { k: "Spend ($)", v: `$${usage.spendUSD.toFixed(2)}` },
        ].map((m) => (
          <div key={m.k} className="border rounded-lg bg-white p-4">
            <div className="text-xs text-slate-500">{m.k}</div>
            <div className="text-xl font-semibold text-slate-800">{m.v}</div>
          </div>
        ))}
      </div>

      <div className="border rounded-lg bg-white p-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Monthly Spend</span>
          <span>${usage.spendUSD.toFixed(2)} / ${usage.capUSD}</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded">
          <div
            className="bg-indigo-600 h-2 rounded"
            style={{ width: `${Math.min((usage.spendUSD / usage.capUSD) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-white p-4 text-sm">
        <div className="font-medium text-slate-700 mb-1">Data Retention</div>
        <p className="text-slate-600 mb-1">Task logs retained for {usage.retentionDays} days.</p>
        <p className="text-xs text-slate-500">(Admin editable in future build)</p>
      </div>
    </div>
  );
}
