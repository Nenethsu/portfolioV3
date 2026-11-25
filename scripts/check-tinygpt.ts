/**
 * Checks the browser engine against the logits in check.json (written by the tiny-gpt repo's
 * export.py or reference.py). Run after copying a newly trained model:
 *
 *   npm run check:model                 # public/models/tiny-gpt
 *   npm run check:model -- <folder>     # any other export folder
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TinyGpt, sample, type Manifest } from "../src/lib/tinygpt/engine.ts";

const dir = process.argv[2] ?? "public/models/tiny-gpt";
const manifest = JSON.parse(
  readFileSync(join(dir, "model.json"), "utf8"),
) as Manifest;
const bin = readFileSync(join(dir, "model.bin"));
const buffer = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
const check = JSON.parse(readFileSync(join(dir, "check.json"), "utf8")) as {
  ids: number[];
  logits: number[][];
};

const model = new TinyGpt(manifest, buffer);
let worst = 0;
check.ids.forEach((id, pos) => {
  const logits = model.step(id);
  check.logits[pos].forEach((expected, i) => {
    worst = Math.max(worst, Math.abs(logits[i] - expected));
  });
});
// float32 here vs float32/float64 in the reference: tiny differences are expected, wrong math is not.
const TOLERANCE = 1e-3;
console.log(
  `${check.ids.length} positions, largest logit difference ${worst.toExponential(2)}`,
);

// Run well past the context window to exercise the cache rebuild, and time it.
model.reset();
const start = performance.now();
let token = check.ids[0];
const steps = manifest.config.block_size * 3;
let text = "";
for (let i = 0; i < steps; i++) {
  token = sample(model.step(token), 0.8, 40);
  text += model.decode(token);
}
const ms = performance.now() - start;
console.log(
  `generated ${steps} characters at ${Math.round((steps / ms) * 1000)} per second`,
);
console.log(`sample: ${JSON.stringify(text.slice(0, 200))}`);

if (worst > TOLERANCE) {
  console.error(`FAILED: engine differs from the reference by more than ${TOLERANCE}`);
  process.exit(1);
}
console.log("OK: the browser engine matches the reference");
