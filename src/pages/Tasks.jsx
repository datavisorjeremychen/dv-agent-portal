import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Activity, RotateCcw } from "lucide-react";
import {
  subscribe,
  loadTasks as storeLoad,
  saveTasks as storeSaveTasks,
  loadAgents as storeLoadAgents,
} from "../store/agents.js";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState({});
  const agents = storeLoadAgents();

  useEffect(() => {
    setTasks(storeLoad());
    const unsub = subscribe((s) => setTasks(s.tasks));
    return () => unsub();
  }, []);

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const rerunTask = (t) => {
    const now = new Date().toLocaleString();
    const newTask = {
      id: Math.random().toString(36).slice(2),
      time: now,
      agent: t.agent,
      prompt: t.prompt + " (rerun)",
      status: "SUCCESS",
      tokens: Math.round((t.tokens || 900) * 1.1),
      details: [{ t: "Re-executed agent logic", ts: "T+0s" }],
    };
    const updated = [newTask, ...tasks];
    storeSaveTasks(updated);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-slate-700">Agent Tasks</h2>

      <div className="border rounded-lg bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 border-b">
            <tr>
              <th className="text-left p-2">Time</th>
              <th className="text-left p-2">Agent</th>
              <th className="text-left p-2">Prompt</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Tokens</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <React.Fragment key={t.id}>
                <tr className="border-b hover:bg-slate-50">
                  <td className="p-2">{t.time}</td>
                  <td className="p-2">{t.agent}</td>
                  <td className="p-2 text-slate-600 line-clamp-1">{t.prompt}</td>
                  <td className="p-2">
                    <span className="px-2 py-0.5 rounded-full text-xs border bg-emerald-50 text-emerald-700 border-emerald-300">
                      {t.status}
                    </span>
                  </td>
                  <td className="p-2">{t.tokens}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      className="text-indigo-600 text-xs flex items-center gap-1"
                      onClick={() => toggle(t.id)}
                    >
                      {open[t.id] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      View
                    </button>
                    <button
                      className="text-slate-600 text-xs flex items-center gap-1 hover:text-indigo-600"
                      onClick={() => rerunTask(t)}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Rerun
                    </button>
                  </td>
                </tr>

                {open[t.id] && (
                  <tr className="bg-slate-50">
                    <td colSpan="6" className="p-3">
                      <div className="space-y-2">
                        <div className="font-medium text-slate-700 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-600" /> Execution Timeline
                        </div>
                        <div className="border-l-2 border-slate-300 pl-3 space-y-1">
                          {t.details?.map((d, i) => (
                            <div key={i} className="text-xs text-slate-700">
                              <span className="font-medium">{d.ts}:</span> {d.t}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
