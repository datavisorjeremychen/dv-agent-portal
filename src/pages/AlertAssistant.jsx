import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Circle, Play, Send, Loader2 } from "lucide-react";

/**
 * Standalone "AI Assistant (Alert Context)" page
 * - Left: Alert & customer context (DataVisor style cards)
 * - Right: Chat (≈40% width) with live agent orchestration
 * - Primary agent: ATO Review Decision Agent (auto-start)
 * - Secondary agent: Unauthorized Transaction Review Decision Agent (auto-start)
 */

function ChatWithAgents() {
  const [messages, setMessages] = useState(() => [
    sysMsg(
      "ATO risk detected by triggered rules. Primary agent **ATO Review Decision Agent** activated. Secondary agent **Unauthorized Transaction Review Decision Agent** also started due to related fraud type signals."
    ),
  ]);
  const [running, setRunning] = useState(true);
  const [agents, setAgents] = useState(() =>
    [ATO_AGENT, UNAUTH_AGENT].map((a) => ({
      ...a,
      status: "running",
      agree: null,
      result: null, // NEW: holds { conclusion, postedAt }
      sub: a.subAgents.map((s) => ({ name: s, pct: 0, done: false })),
    }))
  );
  const [input, setInput] = useState("");
  const scroller = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Simulate concurrent sub-agent progress and finish with grouped conclusions
  useEffect(() => {
    if (!running) return;
    const timers = [];

    setAgents((prev) =>
      prev.map((ag, idx) => {
        ag.sub.forEach((_, i) => {
          const t = setInterval(() => {
            setAgents((A) => {
              const copy = structuredClone(A);
              const agent = copy[idx];
              const sub = agent.sub[i];

              if (!sub.done) {
                sub.pct = Math.min(100, sub.pct + randStep());
                if (sub.pct >= 100) {
                  sub.pct = 100;
                  sub.done = true;
                }
              }

              // When all sub-agents are done, mark done and attach grouped result once
              const allDone = agent.sub.every((x) => x.done);
              if (allDone && agent.status === "running") {
                agent.status = "done";
                agent.result = {
                  conclusion: agent.conclusion,
                  postedAt: new Date().toLocaleString(),
                };

                // Optional: also echo to chat for audit trail
                setMessages((m) => [
                  ...m,
                  botMsg(
                    `**${agent.name}** finished.\n\n**Conclusion:** ${agent.conclusion}\n\nYou may **Agree** or **Disagree** in the agent panel.`
                  ),
                ]);
              }
              return copy;
            });
          }, 450 + Math.random() * 350);
          timers.push(t);
        });
        return ag;
      })
    );

    return () => timers.forEach(clearInterval);
  }, [running]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, userMsg(text)]);
    setInput("");

    // Very simple command router
    const lower = text.toLowerCase();
    setTimeout(() => {
      if (lower.includes("summarize") || lower.includes("summary")) {
        setMessages((m) => [
          ...m,
          botMsg(
            "Triggered Rules Analysis Agent: Primary trigger `fraud_referral_ATO (129, 0.6)`. Socure codes R217/R572/R633. iOS login 73.136.129.131. Password + 2FA changes minutes before alert — classic ATO profile."
          ),
        ]);
      } else if (lower.includes("contact") || lower.includes("trusted contact")) {
        setMessages((m) => [
          ...m,
          botMsg(
            "Customer Contact Agent: Prepared SMS + email templates. Awaiting analyst confirmation to send to Trusted Contact Person on file."
          ),
        ]);
      } else if (lower.includes("mcp") || lower.includes("history")) {
        setMessages((m) => [
          ...m,
          botMsg(
            "Transaction History Analysis Agent: Pulled 180-day MCP history. Baseline velocity low/consistent; this $800 BillPay is above usual amount and on an unusual vendor."
          ),
        ]);
      } else {
        setMessages((m) => [
          ...m,
          botMsg("Acknowledged. This action will be queued to the appropriate sub-agent (mock)."),
        ]);
      }
    }, 450);
  };

  const setAgree = (id, agree) => {
    setAgents((A) => A.map((ag) => (ag.id === id ? { ...ag, agree } : ag)));
  };

  const allFinished = useMemo(() => agents.every((a) => a.status === "done"), [agents]);
  const accepted = useMemo(() => agents.some((a) => a.agree === true), [agents]);
  const canAccept = allFinished; // agree/disagree optional

  const accept = () => {
    setMessages((m) => [
      ...m,
      sysMsg(
        "✅ Finalized: **Accept Recommended Decision**. Results saved. Notes indicate the decision was recommended by AI and accepted by the analyst."
      ),
    ]);
  };

  return (
    <>
      <div className="px-4 py-2 border-b text-sm font-medium flex items-center gap-2">
        <span>AI Assistant (Alert Context)</span>
        <span className="text-xs text-slate-500">• chat panel</span>
      </div>

      {/* Agents status header + grouped conclusions */}
      <div className="px-4 py-2 border-b bg-slate-50">
        <div className="text-xs text-slate-600 mb-2">Running Agents</div>
        <div className="space-y-2">
          {agents.map((ag) => (
            <div key={ag.id} className="border rounded p-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {ag.name} {ag.primary && <span className="text-amber-600">(Primary)</span>}
                </div>
                <div className="text-xs">
                  {ag.status === "running" ? (
                    <span className="text-slate-600 inline-flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Running
                    </span>
                  ) : (
                    <span className="text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Finished
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {ag.sub.map((s, i) => (
                  <div key={i}>
                    <div className="text-xs text-slate-600 mb-1 flex items-center gap-2">
                      {s.done ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Circle className="w-3 h-3 text-slate-400" />
                      )}
                      {s.name}
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded">
                      <div
                        className={`h-1.5 rounded ${s.done ? "bg-emerald-600" : "bg-indigo-600"}`}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Grouped Conclusion under progress */}
              {ag.result && (
                <div className="mt-3 border rounded bg-white">
                  <div className="px-2 py-1 border-b text-xs font-medium text-slate-700">
                    Conclusion
                  </div>
                  <div className="p-2 text-sm text-slate-800">
                    {ag.result.conclusion}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        className={`btn ${ag.agree === true ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setAgree(ag.id, true)}
                      >
                        Agree
                      </button>
                      <button
                        className={`btn ${ag.agree === false ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setAgree(ag.id, false)}
                      >
                        Disagree
                      </button>
                      <div className="ml-auto text-[11px] text-slate-500">
                        Posted {ag.result.postedAt}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat stream */}
      <div ref={scroller} className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <ChatBubble key={i} {...m} />
        ))}
      </div>

      {/* Composer */}
      <div className="border-t p-2">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="Ask the agent to summarize risk signals, contact trusted person, pull MCP history…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="btn btn-primary inline-flex items-center gap-1" onClick={send}>
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>

      {/* Bottom sticky actions */}
      <div className="border-t bg-white px-3 py-2 flex items-center justify-between text-sm">
        <div className="text-slate-600">
          {canAccept ? "Both agents finished." : "Agents still running…"}
          {accepted ? " • You agreed with at least one conclusion." : ""}
        </div>
        <button
          className="btn btn-primary inline-flex items-center gap-1 disabled:opacity-50"
          disabled={!canAccept}
          onClick={accept}
        >
          <Play className="w-4 h-4" />
          Accept Recommended Decision
        </button>
      </div>
    </>
  );
}
