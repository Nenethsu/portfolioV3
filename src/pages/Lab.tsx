import { useEffect, useRef, useState } from "react";
import {
  FiCheckCircle,
  FiCpu,
  FiDatabase,
  FiDownloadCloud,
  FiGithub,
  FiPlay,
  FiShuffle,
  FiSquare,
  FiXCircle,
  FiZap,
} from "react-icons/fi";
import LossChart, { type LossPoint } from "../components/Lab/LossChart";
import MathExam, { type MathLog } from "../components/Lab/MathExam";
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
const MATH_EXAMPLES = ["7+5", "48-73", "365+478", "900-1"];

interface TrainingLog {
  dataset: string;
  characters: number;
  params: number;
  config: {
    vocab_size: number;
    n_layer: number;
    n_head: number;
    n_embd: number;
    block_size: number;
  };
  device: string;
  train_seconds: number;
  steps_done: number;
  loss: LossPoint[];
  samples: { step: number; text: string }[];
  math?: MathLog;
}

type Problem = { question: string; answer: string };
type Attempt = Problem & { got: string };

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

/** "347 + 28", "347+28=" or "48 − 73" → the training format "347+28=" and its answer. */
const parseProblem = (text: string): Problem | null => {
  const m = text
    .replace(/[−–]/g, "-")
    .replace(/\s+/g, "")
    .replace(/=$/, "")
    .match(/^(\d{1,3})([+-])(\d{1,3})$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[3]);
  return {
    question: `${a}${m[2]}${b}=`, // leading zeros dropped, as in training
    answer: String(m[2] === "+" ? a + b : a - b),
  };
};

/** Same mix as training: 1-, 2- and 3-digit numbers equally likely. */
const randomProblem = () => {
  const operand = () => {
    const digits = 1 + Math.floor(Math.random() * 3);
    const low = digits === 1 ? 0 : 10 ** (digits - 1);
    return low + Math.floor(Math.random() * (10 ** digits - low));
  };
  return `${operand()}${Math.random() < 0.5 ? "+" : "-"}${operand()}`;
};

const steps = (log: TrainingLog | null) => [
  {
    icon: FiDatabase,
    title: "Data",
    text: log?.math
      ? `Children's stories (TinyStories) mixed with ${compact.format(log.math.train_problems)} addition and subtraction problems I generated. Every character becomes a number: ${log.config.vocab_size} different ones.`
      : `Thousands of short children's stories (TinyStories). Every character becomes a number: ${log?.config.vocab_size ?? 86} different ones in total.`,
  },
  {
    icon: FiZap,
    title: "Training",
    text: "A 6-layer transformer written in PyTorch learns to guess the next character, on a free Google Colab GPU.",
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

const tabClass = (active: boolean) =>
  `min-h-10 flex-1 rounded-lg px-4 text-xs font-semibold transition sm:flex-none ${active ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`;

const chipClass = (active: boolean) =>
  `min-h-10 rounded-lg px-3 text-xs font-medium transition ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-blue-700"}`;

const Lab = () => {
  const root = useRef<HTMLDivElement>(null);
  const output = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"story" | "math">("story");
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [temperature, setTemperature] = useState(0.8);
  const [length, setLength] = useState(500);
  const [mathInput, setMathInput] = useState("347+28");
  const [mathError, setMathError] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
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

  const math = log?.math?.final ? { ...log.math, final: log.math.final } : null;
  const isMath = mode === "math" && math !== null;
  const busy = gpt.status === "loading" || gpt.status === "missing";

  const writeStory = () => {
    if (busy) return;
    if (gpt.generating) return gpt.stop();
    setProblem(null);
    setShownPrompt(prompt);
    gpt.generate({ prompt, length, temperature, topK: 40 });
  };

  const solve = (text = mathInput) => {
    if (busy || gpt.generating) return;
    const next = parseProblem(text);
    if (!next) {
      setMathError("Try something like 347+28 or 48-73, with numbers from 0 to 999.");
      return;
    }
    setMathError("");
    setMathInput(text);
    setProblem(next);
    setShownPrompt(next.question);
    // Greedy (temperature 0): always the most likely next character, as in the exam.
    gpt
      .generate({ prompt: next.question, length: 6, temperature: 0, topK: 1 })
      .then(({ text: got }) =>
        setAttempts((list) => [{ ...next, got: got.trim() }, ...list].slice(0, 20)),
      );
  };

  const switchMode = (next: "story" | "math") => {
    if (gpt.generating) gpt.stop();
    setMode(next);
  };

  const missing = gpt.status === "missing";
  const answer = gpt.output.trim();
  const finishedProblem =
    isMath && problem && gpt.stats && !gpt.generating ? problem : null;
  const right = attempts.filter((a) => a.got === a.answer).length;

  const statusLine = (() => {
    if (gpt.status === "loading")
      return `Downloading the model to your device… ${Math.round(gpt.progress * 100)}%`;
    if (missing) return "The model hasn't been trained yet.";
    if (gpt.status === "error") return `Something went wrong: ${gpt.error}`;
    if (gpt.generating)
      return isMath ? "Working it out, one digit at a time…" : "Writing, one letter at a time…";
    if (gpt.stats && isMath)
      return `Answered in ${Math.max(1, Math.round(gpt.stats.ms))} ms on your device.`;
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
    const action = isMath ? "Solve" : "Generate";
    return downloadBytes
      ? `The model is ${(downloadBytes / 1e6).toFixed(1)} MB and downloads when you press ${action}.`
      : `The model downloads when you press ${action}.`;
  })();

  const tiles = log
    ? [
        { label: "Parameters", value: compact.format(log.params), note: "GPT-3 has 175B" },
        {
          label: "Architecture",
          value: `${log.config.n_layer} layers`,
          note: math
            ? `${log.config.n_head} heads, ${log.config.n_embd} wide, ${log.config.block_size}-character memory`
            : `${log.config.n_head} attention heads, ${log.config.n_embd} wide`,
        },
        math
          ? {
              label: "Math",
              value: `${math.final.overall}%`,
              note: `on ${math.final.count.toLocaleString("en-US")} problems it never saw`,
            }
          : {
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

  const loadingLabel = (
    <>
      <FiDownloadCloud /> Loading the model…
    </>
  );

  return (
    <div ref={root} className="space-y-6">
      <div data-anim="header">
        <p className="section-eyebrow">AI Lab</p>
        <h2 className="section-title">Tiny GPT</h2>
        <p className="section-copy">
          {math
            ? "A small language model I built and trained from scratch. It learned to write children's stories and to add and subtract, one character at a time, and it runs right here in your browser, with no server and no API."
            : "A small language model I built and trained from scratch. It learned English one letter at a time from children's stories, and it runs right here in your browser, with no server and no API."}
        </p>
      </div>

      <section data-anim="panel" className="dashboard-panel p-5 sm:p-6">
        {math && (
          <div
            role="tablist"
            aria-label="What Tiny GPT should do"
            className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-950 sm:inline-flex"
          >
            {(["story", "math"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={tabClass(mode === m)}
              >
                {m === "story" ? "Write a story" : "Do math"}
              </button>
            ))}
          </div>
        )}
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          {isMath ? (
            <div className="space-y-5">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Ask a math problem
                </span>
                <input
                  value={mathInput}
                  maxLength={12}
                  inputMode="text"
                  placeholder="347+28"
                  onChange={(event) => setMathInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && solve()}
                  aria-invalid={mathError !== ""}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-base outline-none transition focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-600"
                />
              </label>
              <p
                className={`text-xs leading-5 ${mathError ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}
              >
                {mathError || "Addition or subtraction, numbers from 0 to 999."}
              </p>
              <div className="flex flex-wrap gap-2">
                {MATH_EXAMPLES.map((p) => (
                  <button key={p} onClick={() => solve(p)} className={chipClass(false)}>
                    <span className="font-mono">{p}</span>
                  </button>
                ))}
                <button
                  onClick={() => solve(randomProblem())}
                  className={`${chipClass(false)} inline-flex items-center gap-1.5`}
                >
                  <FiShuffle /> Random
                </button>
              </div>
              <button
                onClick={() => solve()}
                disabled={busy || gpt.generating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {gpt.status === "loading" ? (
                  loadingLabel
                ) : (
                  <>
                    <FiPlay /> Solve
                  </>
                )}
              </button>
              {attempts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Your problems: {right} of {attempts.length} right
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {attempts.map((a, i) => {
                      const ok = a.got === a.answer;
                      return (
                        <li
                          key={`${a.question}-${attempts.length - i}`}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {ok ? (
                            <FiCheckCircle className="text-emerald-600 dark:text-emerald-400" aria-label="right" />
                          ) : (
                            <FiXCircle className="text-red-600 dark:text-red-400" aria-label="wrong" />
                          )}
                          {a.question}
                          {a.got || "?"}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Start a story
                </span>
                <input
                  value={prompt}
                  maxLength={120}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && writeStory()}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none transition focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-600 sm:text-sm"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {PROMPTS.map((p) => (
                  <button key={p} onClick={() => setPrompt(p)} className={chipClass(prompt === p)}>
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
                onClick={writeStory}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {gpt.status === "loading" ? (
                  loadingLabel
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
          )}

          <div className="flex min-h-72 flex-col rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <div
              ref={output}
              data-lenis-prevent
              aria-live="polite"
              className={`max-h-96 flex-1 overflow-y-auto whitespace-pre-wrap p-4 font-mono text-slate-700 dark:text-slate-300 ${isMath ? "flex flex-col items-center justify-center text-3xl sm:text-4xl" : "text-sm leading-7"}`}
            >
              {(gpt.output || gpt.generating) && (isMath ? problem : !problem) ? (
                <>
                  <span className={isMath ? "tabular-nums" : undefined}>
                    <strong className="font-semibold text-slate-950 dark:text-white">
                      {shownPrompt}
                    </strong>
                    {gpt.output}
                    {gpt.generating && (
                      <span
                        className={`ml-0.5 inline-block animate-pulse bg-blue-600 dark:bg-blue-400 ${isMath ? "h-8 w-3 translate-y-1" : "h-4 w-2 translate-y-0.5"}`}
                      />
                    )}
                  </span>
                  {finishedProblem && (
                    <p
                      className={`mt-4 inline-flex items-center gap-2 font-sans text-sm font-semibold ${answer === finishedProblem.answer ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {answer === finishedProblem.answer ? (
                        <>
                          <FiCheckCircle /> Correct
                        </>
                      ) : (
                        <>
                          <FiXCircle /> Not quite. The answer is{" "}
                          {finishedProblem.answer}.
                        </>
                      )}
                    </p>
                  )}
                </>
              ) : missing ? (
                <span className="font-sans text-sm text-slate-500 dark:text-slate-400">
                  Train it with the tiny-gpt Colab notebook, then copy the
                  files from out/web/ to public/models/tiny-gpt/.
                </span>
              ) : (
                <span className="text-center font-sans text-sm text-slate-500 dark:text-slate-400">
                  {isMath
                    ? "Type a problem and press Solve. The model writes the answer one digit at a time; nothing is calculated for it."
                    : "Pick a beginning and press Generate. The story is written live by the model on your device."}
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
          {math
            ? "It's tiny, so its stories sound right but don't always make sense, and it sometimes gets a sum wrong. It only knows simple stories and addition and subtraction, so it can't answer questions."
            : "It's tiny, so its sentences sound right but don't always make sense. It has never seen anything but simple stories, so it can't answer questions."}
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

      {math && <MathExam math={math} />}

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
              From training data to your browser
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
          {steps(log).map(({ icon: Icon, title, text }, i) => (
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
