import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";

export interface LossPoint {
  step: number;
  train: number;
  val: number;
}

// Categorical slots 1 and 2, checked for color-blind separation and contrast on the
// panel surfaces (white and slate-900).
const SERIES = [
  {
    key: "train",
    label: "Training",
    line: "stroke-[#2a78d6] dark:stroke-[#3987e5]",
    dot: "fill-[#2a78d6] dark:fill-[#3987e5]",
    swatch: "bg-[#2a78d6] dark:bg-[#3987e5]",
  },
  {
    key: "val",
    label: "Validation",
    line: "stroke-[#eb6834] dark:stroke-[#d95926]",
    dot: "fill-[#eb6834] dark:fill-[#d95926]",
    swatch: "bg-[#eb6834] dark:bg-[#d95926]",
  },
] as const;

const HEIGHT = 260;
const PAD = { top: 16, right: 112, bottom: 32, left: 40 };
const number = new Intl.NumberFormat("en-US");

/** Clean tick values (steps of 1, 2 or 5 × 10^n) covering [min, max]. */
const ticks = (min: number, max: number, count: number) => {
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step)
    out.push(+v.toFixed(6));
  return out;
};

const LossChart = ({ points }: { points: LossPoint[] }) => {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(280, entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const lastStep = points[points.length - 1].step;
  const values = points.flatMap((p) => [p.train, p.val]);
  const yMax = Math.ceil(Math.max(...values));
  const yMin = Math.max(0, Math.floor(Math.min(...values) * 2) / 2);
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (step: number) => PAD.left + (step / lastStep) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;
  const path = (key: "train" | "val") =>
    points
      .map((p, i) => `${i ? "L" : "M"}${x(p.step).toFixed(1)},${y(p[key]).toFixed(1)}`)
      .join("");

  const last = points[points.length - 1];
  // Keep the two end labels apart when the lines finish close together.
  const ends = SERIES.map((s) => ({ ...s, value: last[s.key], ly: y(last[s.key]) }));
  if (Math.abs(ends[0].ly - ends[1].ly) < 16) {
    const mid = (ends[0].ly + ends[1].ly) / 2;
    const [upper, lower] = ends[0].ly <= ends[1].ly ? [0, 1] : [1, 0];
    ends[upper].ly = mid - 8;
    ends[lower].ly = mid + 8;
  }

  const onMove = (event: PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const step = ((event.clientX - rect.left) / rect.width) * lastStep;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(p.step - step) < Math.abs(points[best].step - step)) best = i;
    });
    setHover(best);
  };
  const h = hover === null ? null : points[hover];
  // Tooltip sits beside the crosshair (right of it on the left half, left of it on the right half),
  // at the top: loss falls, so the space above the curve is the empty part of the plot.
  const tipRight = h ? x(h.step) < width / 2 : true;
  const tipStyle = h
    ? {
        left: x(h.step) + (tipRight ? 12 : -12),
        top: PAD.top,
        transform: tipRight ? undefined : "translateX(-100%)",
      }
    : undefined;

  return (
    <figure className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-2">
            <span className={`h-0.5 w-4 rounded-full ${s.swatch}`} />
            {s.label} loss
          </span>
        ))}
      </div>
      <div ref={box} className="relative">
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Loss fell from ${points[0].val.toFixed(2)} to ${last.val.toFixed(2)} over ${number.format(lastStep)} training steps`}
          className="block overflow-visible"
        >
          {ticks(yMin, yMax, 4).map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={PAD.left + plotW}
                y1={y(t)}
                y2={y(t)}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-slate-400 text-[11px] tabular-nums"
              >
                {t}
              </text>
            </g>
          ))}
          {ticks(0, lastStep, width < 480 ? 2 : 4).map((t) => (
            <text
              key={t}
              x={x(t)}
              y={HEIGHT - 10}
              textAnchor="middle"
              className="fill-slate-400 text-[11px] tabular-nums"
            >
              {number.format(t)}
            </text>
          ))}
          {SERIES.map((s) => (
            <path
              key={s.key}
              d={path(s.key)}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className={s.line}
            />
          ))}
          {ends.map((s) => (
            <g key={s.key}>
              <circle
                cx={x(last.step)}
                cy={y(s.value)}
                r={4}
                strokeWidth={2}
                className={`${s.dot} stroke-white dark:stroke-slate-900`}
              />
              <text
                x={x(last.step) + 10}
                y={s.ly}
                dy="0.32em"
                className="fill-slate-700 text-[11px] font-semibold tabular-nums dark:fill-slate-200"
              >
                {s.label} {s.value.toFixed(2)}
              </text>
            </g>
          ))}
          {h && (
            <g pointerEvents="none">
              <line
                x1={x(h.step)}
                x2={x(h.step)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                className="stroke-slate-300 dark:stroke-slate-600"
                strokeWidth={1}
              />
              {SERIES.map((s) => (
                <circle
                  key={s.key}
                  cx={x(h.step)}
                  cy={y(h[s.key])}
                  r={4}
                  strokeWidth={2}
                  className={`${s.dot} stroke-white dark:stroke-slate-900`}
                />
              ))}
            </g>
          )}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {h && (
          <div
            className="pointer-events-none absolute whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800"
            style={tipStyle}
          >
            <p className="font-semibold text-slate-900 dark:text-white">
              Step {number.format(h.step)}
            </p>
            {SERIES.map((s) => (
              <p
                key={s.key}
                className="mt-1 flex items-center gap-2 tabular-nums text-slate-600 dark:text-slate-300"
              >
                <span className={`h-2 w-2 rounded-full ${s.swatch}`} />
                {s.label} {h[s.key].toFixed(3)}
              </p>
            ))}
          </div>
        )}
      </div>
      <figcaption className="text-xs leading-5 text-slate-500 dark:text-slate-400">
        Loss is how surprised the model is by the real next letter (lower is
        better). Validation uses stories it never trained on, so the two lines
        staying close means it learned English rather than memorizing.
      </figcaption>
      <details className="text-xs text-slate-500 dark:text-slate-400">
        <summary className="cursor-pointer font-semibold text-slate-600 dark:text-slate-300">
          Show as a table
        </summary>
        <div data-lenis-prevent className="mt-2 max-h-56 overflow-y-auto">
          <table className="w-full text-left tabular-nums">
            <thead>
              <tr className="text-slate-600 dark:text-slate-300">
                <th className="py-1 font-semibold">Step</th>
                <th className="py-1 font-semibold">Training</th>
                <th className="py-1 font-semibold">Validation</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.step} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1">{number.format(p.step)}</td>
                  <td className="py-1">{p.train.toFixed(3)}</td>
                  <td className="py-1">{p.val.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
};

export default LossChart;
