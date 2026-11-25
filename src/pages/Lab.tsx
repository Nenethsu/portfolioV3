import { useEffect, useRef, useState } from "react";
import {
  FiCpu,
  FiDatabase,
  FiDownloadCloud,
  FiGithub,
  FiPlay,
  FiSquare,
  FiZap,
} from "react-icons/fi";
import LossChart, { type LossPoint } from "../components/Lab/LossChart";
import { useGsap } from "../hooks/useGsap";
import { useTinyGpt } from "../hooks/useTinyGpt";
import { gsap, introHeader } from "../lib/motion";

const MODEL_URL = "/models/tiny-gpt/";
const CODE_URL = "https://github.com/Nenethsu/tiny-gpt";
const PROMPTS = [
  "Once upon a time",
  "Lily found a box",
  "The little dog was sad because",
  "One day, Tom and his mom",
];

interface TrainingLog {
  dataset: string;
  characters: number;
  params: number;
  config: { n_layer: number; n_head: number; n_embd: number; block_size: number };
  device: string;
  train_seconds: number;
  steps_done: number;
  loss: LossPoint[];
  samples: { step: number; text: string }[];
}

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** A missing file comes back as index.html (the site's catch-all redirect), so parse defensively. */
const fetchJson = async <T,>(url: string): Promise<T | null> => {
  try {
    const res = await fetch(url);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
};

const STEPS = [
  {
    icon: FiDatabase,
    title: "Data",
    text: "Thousands of short children's stories (TinyStories). Every character becomes a number, about 100 different ones in total.",
  },
  {
    icon: FiZap,
    title: "Training",
    text: "A 6-layer transformer written in PyTorch learns to guess the next letter, on a free Google Colab GPU.",
  },
  {
    icon: FiDownloadCloud,
    title: "Export",
    text: "The weights are squeezed from 32-bit to 8-bit numbers, which makes the download 4 times smaller.",
  },
  {
    icon: FiCpu,
    title: "Your browser",
    text: "My own TypeScript code runs the model in a Web Worker: attention, layer norm and sampling, with no ML library.",
  },
];

const Lab = () => {
  const root = useRef<HTMLDivElement>(null);
  const output = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [temperature, setTemperature] = useState(0.8);
  const [length, setLength] = useState(500);
  const [log, setLog] = useState<TrainingLog | null>(null);
  const [downloadBytes, setDownloadBytes] = useState<number | null>(null);
  const [shownPrompt, setShownPrompt] = useState("");
  const gpt = useTinyGpt(MODEL_URL);

  useEffect(() => {
    fetchJson<TrainingLog>(`${MODEL_URL}training.json`).then(
      (data) => data?.loss?.length && setLog(data),
    );
    fetchJson<{ bytes: number }>(`${MODEL_URL}model.json`).then(
      (data) => data?.bytes && setDownloadBytes(data.bytes),
    );
  }, []);

  // Keep the newest text in view while it streams.
  useEffect(() => {
    const el = output.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [gpt.output]);

  useGsap(root, (el) => {
    const q = gsap.utils.selector(el);
    introHeader(q("[data-anim=header]")[0]).from(
      q("[data-anim=panel]"),
      { y: 40, autoAlpha: 0, stagger: 0.12 },
      "-=0.5",
    );
  });

  const run = () => {
    if (gpt.status === "loading" || gpt.status === "missing") return;
    if (gpt.generating) return gpt.stop();
    setShownPrompt(prompt);
    gpt.generate({ prompt, length, temperature, topK: 40 });
  };

  const missing = gpt.status === "missing";
  const statusLine = (() => {
    if (gpt.status === "loading")
      return `Downloading the model to your device… ${Math.round(gpt.progress * 100)}%`;
    if (missing) return "The model hasn't been trained yet.";
    if (gpt.status === "error") return `Something went wrong: ${gpt.error}`;
    if (gpt.generating) return "Writing, one letter at a time…";
    if (gpt.stats) {
      const seconds = gpt.stats.ms / 1000;
      const speed = Math.round(gpt.stats.chars / seconds);
      const ending =
        gpt.stats.reason === "end"
          ? " The model decided the story was over."
          : gpt.stats.reason === "stopped"
            ? " Stopped."
            : "";
      return `${gpt.stats.chars} characters in ${seconds.toFixed(1)} s (${speed} per second) on your device.${ending}`;
    }
    return downloadBytes
      ? `The model is ${(downloadBytes / 1e6).toFixed(1)} MB and downloads when you press Generate.`
      : "The model downloads when you press Generate.";
  })();

  const tiles = log
    ? [
        { label: "Parameters", value: compact.format(log.params), note: "GPT-3 has 175B" },
        {
          label: "Architecture",
          value: `${log.config.n_layer} layers`,
          note: `${log.config.n_head} attention heads, ${log.config.n_embd} wide`,
        },
        {
          label: "Memory",
          value: `${log.config.block_size} chars`,
          note: "How far back it can look",
        },
        {
          label: "Training",
          value: `${Math.round(log.train_seconds / 60)} min`,
          note: `${compact.format(log.characters)} characters, ${log.device}`,
        },
      ]
    : [];

  return (
    <div ref={root} className="space-y-6">
      <div data-anim="header">
        <p className="section-eyebrow">AI Lab</p>
        <h2 className="section-title">Tiny GPT</h2>
        <p className="section-copy">
          A small language model I built and trained from scratch. It learned
          English one letter at a time from children&apos;s stories, and it
          runs right here in your browser, with no server and no API.
        </p>
      </div>

      <section data-anim="panel" className="dashboard-panel p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Start a story
              </span>
              <input
                value={prompt}
                maxLength={120}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && run()}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none transition focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-600 sm:text-sm"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className={`min-h-10 rounded-lg px-3 text-xs font-medium transition ${prompt === p ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-blue-700"}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                Creativity (temperature)
                <span className="tabular-nums text-slate-500 dark:text-slate-400">
                  {temperature.toFixed(1)}
                </span>
              </span>
              <input
                type="range"
                min={0.2}
                max={1.5}
                step={0.1}
                value={temperature}
                onChange={(event) => setTemperature(+event.target.value)}
                className="mt-2 w-full accent-blue-600"
              />
              <span className="mt-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Safe and repetitive</span>
                <span>Wild</span>
              </span>
            </label>
            <label className="block">
              <span className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                Length
                <span className="tabular-nums text-slate-500 dark:text-slate-400">
                  {length} characters
                </span>
              </span>
              <input
                type="range"
                min={100}
                max={1000}
                step={50}
                value={length}
                onChange={(event) => setLength(+event.target.value)}
                className="mt-2 w-full accent-blue-600"
              />
            </label>
            <button
              onClick={run}
              disabled={missing || gpt.status === "loading"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {gpt.status === "loading" ? (
                <>
                  <FiDownloadCloud /> Loading the model…
                </>
              ) : gpt.generating ? (
                <>
                  <FiSquare /> Stop
                </>
              ) : (
                <>
                  <FiPlay /> Generate
                </>
              )}
            </button>
          </div>

          <div className="flex min-h-72 flex-col rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <div
              ref={output}
              data-lenis-prevent
              aria-live="polite"
              className="max-h-96 flex-1 overflow-y-auto whitespace-pre-wrap p-4 font-mono text-sm leading-7 text-slate-700 dark:text-slate-300"
            >
              {gpt.output || gpt.generating ? (
                <>
                  <strong className="font-semibold text-slate-950 dark:text-white">
                    {shownPrompt}
                  </strong>
                  {gpt.output}
                  {gpt.generating && (
                    <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-blue-600 dark:bg-blue-400" />
                  )}
                </>
              ) : missing ? (
                <span className="font-sans text-slate-500 dark:text-slate-400">
                  Train it with the tiny-gpt Colab notebook, then copy the
                  files from out/web/ to public/models/tiny-gpt/.
                </span>
              ) : (
                <span className="font-sans text-slate-500 dark:text-slate-400">
                  Pick a beginning and press Generate. The story is written
                  live by the model on your device.
                </span>
              )}
            </div>
            <div className="border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {gpt.status === "loading" && (
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-500/10">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-[width] dark:bg-blue-400"
                    style={{ width: `${gpt.progress * 100}%` }}
                  />
                </div>
              )}
              {statusLine}
            </div>
          </div>
        </div>
        <p className="mt-5 text-xs leading-5 text-slate-500 dark:text-slate-400">
          It&apos;s tiny, so its sentences sound right but don&apos;t always
          make sense. It has never seen anything but simple stories, so it
          can&apos;t answer questions.
        </p>
      </section>

      {log && (
        <div data-anim="panel" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="dashboard-panel p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {tile.label}
              </p>
              <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white sm:mt-2 sm:text-2xl">
                {tile.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {tile.note}
              </p>
            </div>
          ))}
        </div>
      )}

      {log && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section data-anim="panel" className="dashboard-panel min-w-0 p-5 sm:p-6">
            <p className="section-eyebrow">Training</p>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              How the loss fell
            </h3>
            <div className="mt-4">
              <LossChart points={log.loss} />
            </div>
          </section>
          <section data-anim="panel" className="dashboard-panel p-5 sm:p-6">
            <p className="section-eyebrow">Progress</p>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              What it wrote while learning
            </h3>
            <ol className="mt-4 space-y-4">
              {log.samples.map((s) => (
                <li key={s.step} className="border-l-2 border-blue-200 pl-4 dark:border-blue-500/30">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Step {s.step.toLocaleString("en-US")}
                    {s.step === 0 && " (untrained)"}
                  </p>
                  <p className="mt-1 line-clamp-4 font-mono text-xs leading-6 text-slate-700 dark:text-slate-300">
                    {s.text}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      <section data-anim="panel" className="dashboard-panel p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="section-eyebrow">How it works</p>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              From stories to your browser
            </h3>
          </div>
          <a
            href={CODE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-700 sm:self-auto"
          >
            <FiGithub /> Training code
          </a>
        </div>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
              <span className="flex items-center gap-3">
                <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Icon />
                </span>
                <span className="text-sm font-bold text-slate-950 dark:text-white">
                  {i + 1}. {title}
                </span>
              </span>
              <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {text}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default Lab;
