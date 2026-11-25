export interface MathLog {
  ops: string[];
  max_digits: number;
  train_problems: number;
  test_problems: number;
  accuracy: { step: number; acc: number }[];
  final?: { overall: number; add: number; sub: number; count: number };
  examples?: { q: string; expected: string; got: string }[];
}

const number = new Intl.NumberFormat("en-US");

/** "half right by step 1,250": the first logged step that reached `target` percent. */
const firstStep = (accuracy: MathLog["accuracy"], target: number) =>
  accuracy.find((point) => point.acc >= target)?.step;

const Meter = ({ label, value }: { label: string; value: number }) => (
  <div>
    <p className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
      {label}
      <span className="tabular-nums">{value}%</span>
    </p>
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-500/15">
      <div
        className="h-full rounded-full bg-blue-600 dark:bg-blue-400"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const MathExam = ({ math }: { math: MathLog & { final: NonNullable<MathLog["final"]> } }) => {
  const { final } = math;
  const half = firstStep(math.accuracy, 50);
  const ninety = firstStep(math.accuracy, 90);
  const mistakes = (math.examples ?? []).filter((e) => e.got !== e.expected);

  return (
    <section data-anim="panel" className="dashboard-panel p-5 sm:p-6">
      <p className="section-eyebrow">Math exam</p>
      <h3 className="text-lg font-bold text-slate-950 dark:text-white">
        Tested on problems it never saw
      </h3>
      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div>
          <p className="text-4xl font-bold tabular-nums text-slate-950 dark:text-white">
            {final.overall}%
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            correct on {number.format(final.count)} addition and subtraction
            problems that were kept out of its{" "}
            {number.format(math.train_problems)} practice problems.
          </p>
          {half !== undefined && (
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              It got none right before training, half right by step{" "}
              {number.format(half)}
              {ninety !== undefined && (
                <> and 90% by step {number.format(ninety)}</>
              )}
              .
            </p>
          )}
        </div>
        <div className="space-y-4">
          <Meter label="Addition" value={final.add} />
          <Meter label="Subtraction" value={final.sub} />
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            Numbers from 0 to 999. Answers can be negative, like
            28-347=-319. It always picks its most likely digit.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {mistakes.length ? "Some of its mistakes" : "Mistakes"}
          </p>
          {mistakes.length ? (
            <ul className="mt-2 space-y-1.5 font-mono text-xs text-slate-600 dark:text-slate-300">
              {mistakes.map((m) => (
                <li key={m.q} className="tabular-nums">
                  {m.q}
                  {m.got || "?"}{" "}
                  <span className="font-sans text-slate-500 dark:text-slate-400">
                    (should be {m.expected})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              None in the exam.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default MathExam;
