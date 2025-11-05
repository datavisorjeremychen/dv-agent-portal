{preview ? (
  <div className="p-3 space-y-3">
    <div className="text-sm text-slate-500">
      Previewing: <span className="font-medium text-slate-700">{preview.title}</span>
    </div>

    <div className="border rounded p-3 bg-slate-50 text-sm min-h-[200px]">
      {/* Type-aware rendering */}
      {preview.kind === "feature" && preview.payload ? (
        <FeaturePreview data={preview.payload} />
      ) : preview.kind === "rule" && preview.payload ? (
        <RulePreview data={preview.payload} />
      ) : (
        <pre className="whitespace-pre-wrap text-slate-800">{preview.content}</pre>
      )}
    </div>

    <div className="flex items-center gap-2">
      <button
        className="btn btn-primary"
        onClick={() => {
          const kind = preview.kind || "artifact";
          const id = `${kind}-${Math.random().toString(36).slice(2, 8)}`;
          const url =
            kind === "feature" ? `#/feature/${id}` :
            kind === "contact" ? `#/contact/${id}` :
            `#/rule/${id}`;

          // persist as artifact on the chat
          const copy = structuredClone(chats);
          const chatIdx = copy.findIndex((c) => c.id === preview.chatId);
          if (chatIdx >= 0) {
            copy[chatIdx].artifacts = [
              ...(copy[chatIdx].artifacts || []),
              { id, kind, name: `${(preview.title || kind).toUpperCase()}`, url, ts: new Date().toISOString() },
            ];
            saveChats(copy);
            setChats(copy);
          }
          alert(`Accepted as ${kind.toUpperCase()} (${id})`);
          setPreview({ ...preview, deepLink: url }); // show deep link
        }}
      >
        Accept
      </button>
      <button className="btn btn-ghost" onClick={() => setPreview(null)}>Close Preview</button>
    </div>
  </div>
) : (
  <div className="m-auto text-slate-500 text-sm">Select a sub-agent result to preview (from the right panel).</div>
)}
