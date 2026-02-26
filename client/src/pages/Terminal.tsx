import React, { useEffect, useMemo, useRef, useState } from "react";
import { Terminal as TerminalIcon, Activity } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/lib/store";
import { GlitchText } from "@/components/effects/GlitchText";

type LineLevel = "info" | "success" | "warning" | "error" | "muted";

type TerminalLine = {
  id: number;
  level: LineLevel;
  text: string;
};

const TERMINAL_LINES_KEY = "boty_terminal_lines_v1";
const TERMINAL_HISTORY_KEY = "boty_terminal_history_v1";

const COMMANDS = [
  "help",
  "clear",
  "history",
  "tokens",
  "whoami",
  "stats",
  "token switch",
  "token use",
  "status",
  "broadcast status",
  "echo",
  "date",
  "ping",
  "templates",
  "run",
  "schedule",
  "batch",
  "stream demo",
  "panel views",
  "panel show",
  "events",
  "events clear",
];

const ALIASES: Record<string, string> = {
  h: "help",
  cls: "clear",
  ls: "tokens",
  me: "whoami",
  st: "stats",
};

const TEMPLATES: Record<string, string[]> = {
  startup: ["whoami", "stats", "tokens"],
  heartbeat: ["ping", "date", "stats"],
  ops: ["tokens", "broadcast status online", "stats"],
};

function lineClass(level: LineLevel) {
  switch (level) {
    case "success":
      return "text-primary";
    case "warning":
      return "text-yellow-400";
    case "error":
      return "text-destructive";
    case "muted":
      return "text-primary/50";
    default:
      return "text-secondary";
  }
}

export default function TerminalPage() {
  const tokens = useAppStore((s) => s.tokens);
  const setActiveToken = useAppStore((s) => s.setActiveToken);
  const updateToken = useAppStore((s) => s.updateToken);
  const getActiveToken = useAppStore((s) => s.getActiveToken);
  const activeToken = getActiveToken();

  const [lines, setLines] = useState<TerminalLine[]>(() => {
    try {
      const raw = localStorage.getItem(TERMINAL_LINES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as TerminalLine[];
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(-600);
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(TERMINAL_HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed.slice(0, 100) : [];
    } catch {
      return [];
    }
  });
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const lineIdRef = useRef(lines.length > 0 ? Math.max(...lines.map((l) => l.id)) + 1 : 1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const autoCompletePool = useMemo(
    () => [...COMMANDS, ...Object.keys(ALIASES), ...Object.keys(TEMPLATES)],
    [],
  );

  const appendLine = (text: string, level: LineLevel = "info") => {
    const nextId = lineIdRef.current;
    lineIdRef.current += 1;
    setLines((prev) => [...prev, { id: nextId, text, level }].slice(-600));
  };

  const runSingleCommand = async (rawCmd: string, fromScheduler = false) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    appendLine(`BOTY:~$ ${trimmed}`, "muted");
    if (!fromScheduler) {
      setHistory((prev) => [trimmed, ...prev.slice(0, 99)]);
      setHistoryIndex(-1);
    }

    const [first, ...rest] = trimmed.split(" ");
    const normalized = ALIASES[first] ? `${ALIASES[first]} ${rest.join(" ")}`.trim() : trimmed;
    const [cmd, ...args] = normalized.split(" ");

    if (cmd === "help") {
      appendLine("AVAILABLE COMMANDS:", "success");
      COMMANDS.forEach((c) => appendLine(`  ${c}`, "muted"));
      appendLine("ALIASES:", "success");
      Object.entries(ALIASES).forEach(([k, v]) => appendLine(`  ${k} -> ${v}`, "muted"));
      return;
    }

    if (cmd === "clear") {
      setLines([]);
      localStorage.removeItem(TERMINAL_LINES_KEY);
      return;
    }

    if (cmd === "history") {
      if (history.length === 0) {
        appendLine("No command history yet.", "warning");
        return;
      }
      history.slice(0, 20).forEach((h, i) => appendLine(`${i + 1}. ${h}`, "muted"));
      return;
    }

    if (cmd === "echo") {
      appendLine(args.join(" "), "info");
      return;
    }

    if (cmd === "date") {
      appendLine(new Date().toUTCString(), "info");
      return;
    }

    if (cmd === "whoami") {
      if (!activeToken) {
        appendLine("No active token selected.", "warning");
        return;
      }
      appendLine(
        `USER: ${activeToken.profile?.username || activeToken.label} | ID: ${activeToken.id} | STATUS: ${activeToken.status.toUpperCase()}`,
        "success",
      );
      return;
    }

    if (cmd === "tokens") {
      if (tokens.length === 0) {
        appendLine("No tokens loaded.", "warning");
        return;
      }
      appendLine(`TOKENS LOADED: ${tokens.length}`, "success");
      tokens.forEach((t) => {
        const marker = activeToken?.id === t.id ? "*" : " ";
        appendLine(
          `${marker} ${t.id} | ${t.profile?.username || t.label} | ${t.status.toUpperCase()}`,
          "muted",
        );
      });
      return;
    }

    if (cmd === "stats") {
      const online = tokens.filter((t) => t.status === "online").length;
      const idle = tokens.filter((t) => t.status === "idle").length;
      const dnd = tokens.filter((t) => t.status === "dnd").length;
      const invisible = tokens.filter((t) => t.status === "invisible").length;
      const offline = tokens.filter((t) => t.status === "offline").length;
      appendLine(
        `TOTAL=${tokens.length} ONLINE=${online} IDLE=${idle} DND=${dnd} INVISIBLE=${invisible} OFFLINE=${offline}`,
        "success",
      );
      return;
    }

    if (cmd === "token" && args[0] === "switch") {
      const id = args[1];
      if (!id) {
        appendLine("Usage: token switch <id>", "warning");
        return;
      }
      const found = tokens.find((t) => t.id === id);
      if (!found) {
        appendLine(`Token '${id}' not found.`, "error");
        return;
      }
      setActiveToken(id);
      appendLine(`Active token switched to ${id}.`, "success");
      return;
    }

    if (cmd === "token" && args[0] === "use") {
      if (tokens.length === 0) {
        appendLine("No tokens available.", "warning");
        return;
      }
      const direction = args[1];
      const currentIndex = Math.max(
        0,
        tokens.findIndex((t) => t.id === activeToken?.id),
      );
      const nextIndex =
        direction === "prev"
          ? (currentIndex - 1 + tokens.length) % tokens.length
          : (currentIndex + 1) % tokens.length;
      setActiveToken(tokens[nextIndex].id);
      appendLine(`Active token switched to ${tokens[nextIndex].id}.`, "success");
      return;
    }

    if (cmd === "status") {
      const next = args[0] as "online" | "idle" | "dnd" | "invisible" | "offline" | undefined;
      if (!next || !["online", "idle", "dnd", "invisible", "offline"].includes(next)) {
        appendLine("Usage: status <online|idle|dnd|invisible|offline>", "warning");
        return;
      }
      if (!activeToken) {
        appendLine("No active token selected.", "warning");
        return;
      }
      updateToken(activeToken.id, { status: next });
      appendLine(`Status for ${activeToken.id} updated to ${next.toUpperCase()}.`, "success");
      return;
    }

    if (cmd === "broadcast" && args[0] === "status") {
      const next = args[1] as "online" | "idle" | "dnd" | "invisible" | "offline" | undefined;
      if (!next || !["online", "idle", "dnd", "invisible", "offline"].includes(next)) {
        appendLine("Usage: broadcast status <online|idle|dnd|invisible|offline>", "warning");
        return;
      }
      tokens.forEach((t) => updateToken(t.id, { status: next }));
      appendLine(`Broadcast applied to ${tokens.length} token(s): ${next.toUpperCase()}.`, "success");
      return;
    }

    if (cmd === "ping") {
      const t0 = Date.now();
      appendLine("Pinging BOTY control bus...", "info");
      await new Promise((r) => setTimeout(r, 280 + Math.floor(Math.random() * 200)));
      appendLine(`Latency: ${Date.now() - t0}ms`, "success");
      return;
    }

    if (cmd === "panel" && args[0] === "views") {
      appendLine("CONTROL PANEL VIEWS:", "success");
      appendLine("  presence   -> profile status + activity + presets", "muted");
      appendLine("  reactions  -> message reaction + room plan + keyword rules", "muted");
      appendLine("  dmqueue    -> direct message queue with >=30s cooldown", "muted");
      appendLine("  autoreply  -> keyword reply rules and simulator", "muted");
      appendLine("  tasks      -> delayed task queue controls", "muted");
      appendLine("  safety     -> dry-run, safety lock, logs, notifications", "muted");
      return;
    }

    if (cmd === "panel" && args[0] === "show") {
      const view = (args[1] || "").toLowerCase();
      if (!["presence", "reactions", "dmqueue", "autoreply", "tasks", "safety"].includes(view)) {
        appendLine("Usage: panel show <presence|reactions|dmqueue|autoreply|tasks|safety>", "warning");
        return;
      }
      appendLine(`Panel view selected: ${view.toUpperCase()}`, "success");
      appendLine("Open Control Panel and locate the matching window title.", "muted");
      return;
    }

    if (cmd === "events" && args[0] === "clear") {
      appendLine("Event stream is disabled in this terminal mode.", "warning");
      return;
    }

    if (cmd === "events") {
      appendLine("Event stream is disabled in this terminal mode.", "warning");
      return;
    }

    if (cmd === "templates") {
      appendLine("COMMAND TEMPLATES:", "success");
      Object.entries(TEMPLATES).forEach(([name, list]) =>
        appendLine(`  ${name}: ${list.join(" ; ")}`, "muted"),
      );
      appendLine("Run with: run <templateName>", "muted");
      return;
    }

    if (cmd === "run") {
      const name = args[0];
      if (!name || !TEMPLATES[name]) {
        appendLine("Usage: run <templateName>", "warning");
        return;
      }
      for (const c of TEMPLATES[name]) {
        // eslint-disable-next-line no-await-in-loop
        await runSingleCommand(c, true);
      }
      return;
    }

    if (cmd === "schedule") {
      const seconds = Number.parseInt(args[0] || "", 10);
      const scheduled = args.slice(1).join(" ").trim();
      if (!Number.isFinite(seconds) || seconds < 1 || !scheduled) {
        appendLine("Usage: schedule <seconds> <command>", "warning");
        return;
      }
      appendLine(`Scheduled in ${seconds}s: ${scheduled}`, "info");
      setTimeout(() => {
        void runSingleCommand(scheduled, true);
      }, seconds * 1000);
      return;
    }

    if (cmd === "batch") {
      const payload = args.join(" ");
      const commands = payload
        .split(";")
        .map((x) => x.trim())
        .filter(Boolean);
      if (commands.length === 0) {
        appendLine("Usage: batch <cmd1 ; cmd2 ; cmd3>", "warning");
        return;
      }
      appendLine(`Executing batch (${commands.length} command(s))...`, "info");
      for (const c of commands) {
        // eslint-disable-next-line no-await-in-loop
        await runSingleCommand(c, true);
      }
      appendLine("Batch complete.", "success");
      return;
    }

    if (cmd === "stream" && args[0] === "demo") {
      appendLine("Starting stream demo...", "info");
      let tick = 0;
      const handle = setInterval(() => {
        tick += 1;
        appendLine(`stream[${tick}] event=heartbeat status=ok`, "muted");
        if (tick >= 8) {
          clearInterval(handle);
          appendLine("Stream demo finished.", "success");
        }
      }, 220);
      return;
    }

    appendLine("Unknown command. Type 'help'.", "error");
  };

  useEffect(() => {
    if (lines.length > 0) return;
    appendLine("Welcome to BOTY Terminal v3.7.2", "success");
    appendLine("Type 'help' for commands.", "info");
    appendLine(
      "Safe mode enabled: destructive/self-bot commands are intentionally unavailable.",
      "warning",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.length]);

  useEffect(() => {
    localStorage.setItem(TERMINAL_LINES_KEY, JSON.stringify(lines.slice(-600)));
  }, [lines]);

  useEffect(() => {
    localStorage.setItem(TERMINAL_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  }, [history]);

  useEffect(() => {
    outputRef.current?.scrollTo({
      top: outputRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input;
    setInput("");
    await runSingleCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex < 0) {
        setHistoryIndex(-1);
        setInput("");
        return;
      }
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const q = input.trim().toLowerCase();
      if (!q) return;
      const hit = autoCompletePool.find((c) => c.toLowerCase().startsWith(q));
      if (hit) setInput(hit);
    }
  };

  return (
    <AppLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <GlitchText text="BOTY_TERMINAL" className="text-3xl font-bold mb-2" />
          <p className="font-mono text-primary/60 text-sm">
            {activeToken
              ? `TOKEN: ${activeToken.profile?.username || activeToken.label} [${activeToken.status.toUpperCase()}]`
              : "No active token selected"}
          </p>
        </div>
        <div className="px-4 py-2 border border-primary/50 bg-primary/10 font-mono text-primary animate-pulse flex items-center gap-2">
          <Activity className="w-4 h-4" />
          CONNECTED
        </div>
      </div>

      <div className="glass-panel neon-border p-4 md:p-6">
        <div className="border border-primary/30 bg-black/70 min-h-[520px] flex flex-col">
          <div className="px-4 py-3 border-b border-primary/20 font-mono text-sm flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-primary" />
            <span className="text-primary">BOTY:~$</span>
            <span className="text-primary/60">terminal session</span>
          </div>

          <div ref={outputRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 scrollbar-cyber">
            {lines.map((line) => (
              <div key={line.id} className={lineClass(line.level)}>
                {line.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-primary/20 p-4 flex items-center gap-3">
            <span className="font-mono text-primary whitespace-nowrap">[INPUT] &gt;</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="type command..."
              className="w-full bg-black border border-border px-3 py-2 font-mono text-sm text-primary focus:outline-none focus:border-primary focus:shadow-[0_0_10px_rgba(0,255,65,0.2)]"
              autoFocus
            />
          </form>
        </div>

      </div>
    </AppLayout>
  );
}
