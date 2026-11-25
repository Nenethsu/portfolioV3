import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ModelInfo,
  WorkerRequest,
  WorkerResponse,
} from "../lib/tinygpt/worker";

export type ModelStatus = "idle" | "loading" | "ready" | "missing" | "error";
type GenerateOptions = Omit<
  Extract<WorkerRequest, { type: "generate" }>,
  "type" | "id"
>;
export type RunStats = { chars: number; ms: number; reason: string };
export type RunResult = { text: string; stats: RunStats };

/**
 * Talks to the Tiny GPT worker. The model (a few MB) downloads on the first `generate`,
 * not when the page opens, so visitors who only read the page don't pay for it.
 * `generate` resolves with the finished text; a run replaced by a newer one never resolves.
 */
export const useTinyGpt = (baseUrl: string) => {
  const worker = useRef<Worker | null>(null);
  const pending = useRef<WorkerRequest | null>(null);
  const current = useRef(0);
  const run = useRef<{ text: string; resolve: (r: RunResult) => void } | null>(
    null,
  );
  const [status, setStatus] = useState<ModelStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState<RunStats | null>(null);

  useEffect(() => () => worker.current?.terminate(), []);

  const getWorker = useCallback(() => {
    if (worker.current) return worker.current;
    const w = new Worker(new URL("../lib/tinygpt/worker.ts", import.meta.url), {
      type: "module",
    });
    w.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const m = event.data;
      if (m.type === "progress") setProgress(m.loaded / m.total);
      else if (m.type === "ready") {
        setInfo({ params: m.params, bytes: m.bytes, config: m.config });
        setStatus("ready");
        if (pending.current) w.postMessage(pending.current);
        pending.current = null;
      } else if (m.type === "missing") {
        setStatus("missing");
        setGenerating(false);
      } else if (m.type === "error") {
        setError(m.message);
        setStatus("error");
        setGenerating(false);
      } else if (m.id !== current.current) return;
      else if (m.type === "text") {
        if (run.current) run.current.text += m.text;
        setOutput((text) => text + m.text);
      } else if (m.type === "done") {
        const stats = { chars: m.chars, ms: m.ms, reason: m.reason };
        setStats(stats);
        setGenerating(false);
        run.current?.resolve({ text: run.current.text, stats });
        run.current = null;
      }
    };
    worker.current = w;
    return w;
  }, []);

  const generate = useCallback(
    (options: GenerateOptions) =>
      new Promise<RunResult>((resolve) => {
        const request: WorkerRequest = {
          type: "generate",
          id: ++current.current,
          ...options,
        };
        run.current = { text: "", resolve };
        setOutput("");
        setStats(null);
        setGenerating(true);
        const w = getWorker();
        if (status === "ready") return w.postMessage(request);
        pending.current = request;
        if (status === "idle" || status === "error") {
          setStatus("loading");
          setError("");
          w.postMessage({ type: "load", baseUrl } satisfies WorkerRequest);
        }
      }),
    [baseUrl, getWorker, status],
  );

  const stop = useCallback(() => {
    worker.current?.postMessage({ type: "stop" } satisfies WorkerRequest);
  }, []);

  return {
    status,
    progress,
    error,
    info,
    output,
    generating,
    stats,
    generate,
    stop,
  };
};
